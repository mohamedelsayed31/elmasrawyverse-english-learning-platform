<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentAttempt;
use App\Models\Enrollment;
use App\Services\CourseCompletionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudentAssessmentController extends Controller
{
    // =====================================
    // My Available Assessments
    // =====================================

    public function index(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'message' => 'Student profile not found'
            ], 404);
        }


        $courseIds = Enrollment::where(
            'student_id',
            $student->id
        )
            ->whereIn('status', [
                'Enrolled',
                'Completed'
            ])
            ->pluck('course_id');


        $assessments = Assessment::with([
            'course.grade.academicStage',
            'section',
        ])
            ->withCount('questions')

            ->withCount([
                'attempts as my_attempts_count'
                => function ($query) use ($student) {
                    $query->where(
                        'student_id',
                        $student->id
                    );
                }
            ])

            ->whereIn(
                'course_id',
                $courseIds
            )

            ->where(
                'status',
                'Published'
            )

            ->latest()
            ->get();


        return response()->json([
            'assessments' => $assessments
        ]);
    }


    // =====================================
    // Start Attempt
    // =====================================

    public function start(
        Request $request,
        $assessmentId
    ) {
        $student =
            $request->user()->student;


        if (!$student) {
            return response()->json([
                'message' =>
                    'Student profile not found'
            ], 404);
        }


        $assessment = Assessment::with([
            'course',
            'questions.options',
        ])
            ->where(
                'status',
                'Published'
            )
            ->find($assessmentId);


        if (!$assessment) {
            return response()->json([
                'message' =>
                    'Assessment not found'
            ], 404);
        }


        $this->ensureEnrollment(
            $student->id,
            $assessment->course_id
        );


        if (
            $assessment->questions->isEmpty()
        ) {
            return response()->json([
                'message' =>
                    'This assessment has no questions.'
            ], 409);
        }


        /*
        |--------------------------------------------------------------------------
        | Existing Active Attempt
        |--------------------------------------------------------------------------
        */

        $existingAttempt =
            AssessmentAttempt::where(
                'assessment_id',
                $assessment->id
            )
                ->where(
                    'student_id',
                    $student->id
                )
                ->where(
                    'status',
                    'in_progress'
                )
                ->latest('id')
                ->first();


        if ($existingAttempt) {

            /*
            | Expire it if time is already over.
            */

            if (
                $existingAttempt->expires_at
                && now()->greaterThanOrEqualTo(
                    $existingAttempt->expires_at
                )
            ) {

                $this->finalizeAttempt(
                    $existingAttempt,
                    true
                );

            } else {

                return $this->attemptResponse(
                    $existingAttempt,
                    $assessment,
                    false
                );
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Attempt Limit
        |--------------------------------------------------------------------------
        */

        $usedAttempts =
            AssessmentAttempt::where(
                'assessment_id',
                $assessment->id
            )
                ->where(
                    'student_id',
                    $student->id
                )
                ->count();


        if (
            $assessment->max_attempts
            && $usedAttempts
                >= $assessment->max_attempts
        ) {

            return response()->json([
                'message' =>
                    'You have reached the maximum number of attempts.'
            ], 409);
        }


        /*
        |--------------------------------------------------------------------------
        | Attempt Number
        |--------------------------------------------------------------------------
        */

        $attemptNumber =
            (
                AssessmentAttempt::where(
                    'assessment_id',
                    $assessment->id
                )
                    ->where(
                        'student_id',
                        $student->id
                    )
                    ->max('attempt_number')
                ?? 0
            ) + 1;


        /*
        |--------------------------------------------------------------------------
        | Maximum Score
        |--------------------------------------------------------------------------
        */

        $maxScore =
            $assessment->questions
                ->sum(function ($question) {

                    return (float) (
                        $question->pivot->points
                        ?? $question->points
                        ?? 0
                    );
                });


        $startedAt = now();


        $expiresAt =
            $assessment->duration_minutes
                ? $startedAt->copy()->addMinutes(
                    $assessment->duration_minutes
                )
                : null;


        $attempt = AssessmentAttempt::create([
            'assessment_id' =>
                $assessment->id,

            'student_id' =>
                $student->id,

            'attempt_number' =>
                $attemptNumber,

            'status' =>
                'in_progress',

            'started_at' =>
                $startedAt,

            'expires_at' =>
                $expiresAt,

            'max_score' =>
                $maxScore,
        ]);


        return $this->attemptResponse(
            $attempt,
            $assessment,
            true
        );
    }


    // =====================================
    // Get Current Attempt
    // =====================================

    public function showAttempt(
        Request $request,
        $attemptId
    ) {
        $student =
            $request->user()->student;


        $attempt = AssessmentAttempt::with([
            'assessment.course',
            'assessment.questions.options',
            'answers',
        ])
            ->where(
                'student_id',
                $student->id
            )
            ->find($attemptId);


        if (!$attempt) {
            return response()->json([
                'message' =>
                    'Attempt not found'
            ], 404);
        }


        if (
            $attempt->status ===
            'in_progress'
            && $attempt->expires_at
            && now()->greaterThanOrEqualTo(
                $attempt->expires_at
            )
        ) {

            $this->finalizeAttempt(
                $attempt,
                true
            );


            return response()->json([
                'message' =>
                    'This attempt has expired.',

                'attempt_id' =>
                    $attempt->id,

                'status' =>
                    'expired'
            ], 409);
        }


        if (
            $attempt->status
            !== 'in_progress'
        ) {
            return response()->json([
                'message' =>
                    'This attempt is already finished.',

                'attempt_id' =>
                    $attempt->id,

                'status' =>
                    $attempt->status
            ], 409);
        }


        return $this->attemptResponse(
            $attempt,
            $attempt->assessment,
            false
        );
    }


    // =====================================
    // Save / Update Answer
    // =====================================

    public function saveAnswer(
        Request $request,
        $attemptId,
        $questionId
    ) {
        $student =
            $request->user()->student;


        $attempt = AssessmentAttempt::with([
            'assessment.questions.options'
        ])
            ->where(
                'student_id',
                $student->id
            )
            ->where(
                'status',
                'in_progress'
            )
            ->find($attemptId);


        if (!$attempt) {
            return response()->json([
                'message' =>
                    'Active attempt not found'
            ], 404);
        }


        /*
        |--------------------------------------------------------------------------
        | Time Check
        |--------------------------------------------------------------------------
        */

        if (
            $attempt->expires_at
            && now()->greaterThanOrEqualTo(
                $attempt->expires_at
            )
        ) {

            $this->finalizeAttempt(
                $attempt,
                true
            );


            return response()->json([
                'message' =>
                    'Time is over. The attempt has expired.'
            ], 409);
        }


        $question =
            $attempt
                ->assessment
                ->questions
                ->firstWhere(
                    'id',
                    (int) $questionId
                );


        if (!$question) {
            return response()->json([
                'message' =>
                    'Question does not belong to this assessment.'
            ], 404);
        }


        $selectedOptionId = null;
        $answerText = null;


        // =================================
        // MCQ
        // =================================

        if ($question->type === 'mcq') {

            $validated = $request->validate([
                'selected_option_id' => [
                    'required',
                    'integer',
                ]
            ]);


            $option =
                $question
                    ->options
                    ->firstWhere(
                        'id',
                        (int) $validated[
                            'selected_option_id'
                        ]
                    );


            if (!$option) {

                throw ValidationException::withMessages([
                    'selected_option_id' => [
                        'The selected option does not belong to this question.'
                    ]
                ]);
            }


            $selectedOptionId =
                $option->id;
        }


        // =================================
        // True / False
        // =================================

        elseif (
            $question->type ===
            'true_false'
        ) {

            $validated =
                $request->validate([
                    'answer_text' => [
                        'required',
                        'in:true,false'
                    ]
                ]);


            $answerText =
                strtolower(
                    $validated[
                        'answer_text'
                    ]
                );
        }


        // =================================
        // Fill Blank / Short Answer
        // =================================

        else {

            $validated =
                $request->validate([
                    'answer_text' => [
                        'required',
                        'string',
                        'max:5000'
                    ]
                ]);


            $answerText =
                $validated[
                    'answer_text'
                ];
        }


        $answer =
            AssessmentAnswer::updateOrCreate(
                [
                    'assessment_attempt_id' =>
                        $attempt->id,

                    'question_id' =>
                        $question->id,
                ],
                [
                    'selected_option_id' =>
                        $selectedOptionId,

                    'answer_text' =>
                        $answerText,

                    /*
                    | Final grading happens
                    | when the student submits.
                    */

                    'is_correct' =>
                        null,

                    'awarded_points' =>
                        null,

                    'requires_manual_grading' =>
                        false,

                    'teacher_feedback' =>
                        null,
                ]
            );


        return response()->json([
            'message' =>
                'Answer saved successfully',

            'answer' => [
                'question_id' =>
                    $answer->question_id,

                'selected_option_id' =>
                    $answer
                        ->selected_option_id,

                'answer_text' =>
                    $answer->answer_text,
            ]
        ]);
    }


    // =====================================
    // Submit Attempt
    // =====================================

    public function submit(
        Request $request,
        $attemptId
    ) {
        $student =
            $request->user()->student;


        $attempt = AssessmentAttempt::where(
            'student_id',
            $student->id
        )
            ->where(
                'status',
                'in_progress'
            )
            ->find($attemptId);


        if (!$attempt) {
            return response()->json([
                'message' =>
                    'Active attempt not found'
            ], 404);
        }


        $expired =
            $attempt->expires_at
            && now()->greaterThanOrEqualTo(
                $attempt->expires_at
            );


        $this->finalizeAttempt(
            $attempt,
            $expired
        );


        return $this->resultResponse(
            $attempt->fresh()
        );
    }


    // =====================================
    // Attempt Result
    // =====================================

    public function result(
        Request $request,
        $attemptId
    ) {
        $student =
            $request->user()->student;


        $attempt = AssessmentAttempt::where(
            'student_id',
            $student->id
        )->find($attemptId);


        if (!$attempt) {
            return response()->json([
                'message' =>
                    'Attempt not found'
            ], 404);
        }


        if (
            $attempt->status ===
            'in_progress'
        ) {

            return response()->json([
                'message' =>
                    'Submit the assessment first.'
            ], 409);
        }


        return $this->resultResponse(
            $attempt
        );
    }


    // =====================================
    // Assessment History
    // =====================================

    public function history(
        Request $request,
        $assessmentId
    ) {
        $student =
            $request->user()->student;


        $attempts =
            AssessmentAttempt::where(
                'assessment_id',
                $assessmentId
            )
                ->where(
                    'student_id',
                    $student->id
                )
                ->latest('attempt_number')
                ->get([
                    'id',
                    'attempt_number',
                    'status',
                    'started_at',
                    'submitted_at',
                    'score',
                    'max_score',
                    'percentage',
                    'passed',
                    'duration_seconds',
                ]);


        return response()->json([
            'attempts' => $attempts
        ]);
    }


    // =====================================
    // Finalize + Grade
    // =====================================

    private function finalizeAttempt(
        AssessmentAttempt $attempt,
        bool $expired = false
    ): void {

        DB::transaction(
            function () use (
                $attempt,
                $expired
            ) {

                $attempt->load([
                    'assessment.questions.options',
                    'answers',
                ]);


                $assessment =
                    $attempt->assessment;


                $answersByQuestion =
                    $attempt
                        ->answers
                        ->keyBy(
                            'question_id'
                        );


                $score = 0;
                $maxScore = 0;

                $hasManualGrading =
                    false;


                foreach (
                    $assessment->questions
                    as $question
                ) {

                    $possiblePoints =
                        (float) (
                            $question
                                ->pivot
                                ->points
                            ?? $question->points
                            ?? 0
                        );


                    $maxScore +=
                        $possiblePoints;


                    $answer =
                        $answersByQuestion
                            ->get(
                                $question->id
                            );


                    /*
                    |--------------------------------------------------------------------------
                    | Unanswered Question
                    |--------------------------------------------------------------------------
                    */

                    if (!$answer) {

                        AssessmentAnswer::create([
                            'assessment_attempt_id' =>
                                $attempt->id,

                            'question_id' =>
                                $question->id,

                            'selected_option_id' =>
                                null,

                            'answer_text' =>
                                null,

                            'is_correct' =>
                                false,

                            'awarded_points' =>
                                0,

                            'requires_manual_grading' =>
                                false,
                        ]);


                        continue;
                    }


                    // =============================
                    // MCQ
                    // =============================

                    if (
                        $question->type ===
                        'mcq'
                    ) {

                        $selected =
                            $question
                                ->options
                                ->firstWhere(
                                    'id',
                                    (int)
                                    $answer
                                        ->selected_option_id
                                );


                        $correct =
                            $selected
                            && $selected
                                ->is_correct;


                        $awarded =
                            $correct
                                ? $possiblePoints
                                : 0;


                        $answer->update([
                            'is_correct' =>
                                $correct,

                            'awarded_points' =>
                                $awarded,

                            'requires_manual_grading' =>
                                false,
                        ]);


                        $score +=
                            $awarded;


                        continue;
                    }


                    // =============================
                    // True / False
                    // =============================

                    if (
                        $question->type ===
                        'true_false'
                    ) {

                        $studentAnswer =
                            $this->normalizeAnswer(
                                $answer
                                    ->answer_text
                            );


                        $correctAnswer =
                            $this->normalizeAnswer(
                                $question
                                    ->correct_answer
                            );


                        $correct =
                            $studentAnswer
                            === $correctAnswer;


                        $awarded =
                            $correct
                                ? $possiblePoints
                                : 0;


                        $answer->update([
                            'is_correct' =>
                                $correct,

                            'awarded_points' =>
                                $awarded,

                            'requires_manual_grading' =>
                                false,
                        ]);


                        $score +=
                            $awarded;


                        continue;
                    }


                    // =============================
                    // Fill Blank
                    // =============================

                    if (
                        $question->type ===
                        'fill_blank'
                    ) {

                        $studentAnswer =
                            $this->normalizeAnswer(
                                $answer
                                    ->answer_text
                            );


                        $correctAnswer =
                            $this->normalizeAnswer(
                                $question
                                    ->correct_answer
                            );


                        $correct =
                            $studentAnswer
                            === $correctAnswer;


                        $awarded =
                            $correct
                                ? $possiblePoints
                                : 0;


                        $answer->update([
                            'is_correct' =>
                                $correct,

                            'awarded_points' =>
                                $awarded,

                            'requires_manual_grading' =>
                                false,
                        ]);


                        $score +=
                            $awarded;


                        continue;
                    }


                    // =============================
                    // Short Answer
                    // Manual grading
                    // =============================

                    $answer->update([
                        'is_correct' =>
                            null,

                        'awarded_points' =>
                            0,

                        'requires_manual_grading' =>
                            true,
                    ]);


                    $hasManualGrading =
                        true;
                }


                $percentage =
                    $maxScore > 0
                        ? round(
                            (
                                $score /
                                $maxScore
                            ) * 100,
                            2
                        )
                        : 0;


                /*
                |--------------------------------------------------------------------------
                | Pass / Fail
                |--------------------------------------------------------------------------
                |
                | null means:
                | - teacher grading still required
                | OR
                | - no passing score was configured
                |
                */

                $passed = null;


                if (
                    !$hasManualGrading
                    && $assessment
                        ->passing_score
                        !== null
                ) {

                    $passed =
                        $percentage
                        >= (float)
                        $assessment
                            ->passing_score;
                }


                $durationSeconds =
                    max(
                        0,
                        $attempt
                            ->started_at
                            ->diffInSeconds(
                                now()
                            )
                    );


                if (
                    $assessment
                        ->duration_minutes
                ) {

                    $durationSeconds =
                        min(
                            $durationSeconds,

                            $assessment
                                ->duration_minutes
                                * 60
                        );
                }


                $attempt->update([
                    'status' =>
                        $expired
                            ? 'expired'
                            : 'submitted',

                    'submitted_at' =>
                        now(),

                    'score' =>
                        $score,

                    'max_score' =>
                        $maxScore,

                    'percentage' =>
                        $percentage,

                    'passed' =>
                        $passed,

                    'duration_seconds' =>
                        $durationSeconds,
                ]);
            }
        );

        $attempt->refresh();
        $attempt->loadMissing('assessment');


        // A passed required assessment may be the final
        // requirement needed to complete the course.
        app(
            CourseCompletionService::class
        )->evaluate(
            $attempt->student_id,
            $attempt->assessment->course_id
        );
    }


    // =====================================
    // Attempt Response
    // =====================================

    private function attemptResponse(
        AssessmentAttempt $attempt,
        Assessment $assessment,
        bool $created
    ) {
        $attempt->load('answers');


        $answers =
            $attempt
                ->answers
                ->keyBy(
                    'question_id'
                );


        $questions =
            $assessment
                ->questions;


        /*
        |--------------------------------------------------------------------------
        | Stable Shuffle
        |--------------------------------------------------------------------------
        |
        | Same attempt always receives
        | the same pseudo-random order,
        | even after refreshing the page.
        |
        */

        if (
            $assessment
                ->shuffle_questions
        ) {

            $questions =
                $questions
                    ->sortBy(
                        function ($question)
                        use ($attempt) {

                            return crc32(
                                $attempt->id
                                . '-'
                                . $question->id
                            );
                        }
                    )
                    ->values();
        }


        $formattedQuestions =
            $questions->map(
                function ($question)
                use ($answers) {

                    $savedAnswer =
                        $answers->get(
                            $question->id
                        );


                    return [
                        'id' =>
                            $question->id,

                        'question_text' =>
                            $question
                                ->question_text,

                        'type' =>
                            $question->type,

                        'skill' =>
                            $question->skill,

                        'topic' =>
                            $question->topic,

                        'points' =>
                            (float) (
                                $question
                                    ->pivot
                                    ->points
                                ?? $question
                                    ->points
                                ?? 0
                            ),

                        /*
                        | No correct answers
                        | are exposed here.
                        */

                        'options' =>
                            $question
                                ->options
                                ->map(
                                    fn ($option) => [
                                        'id' =>
                                            $option->id,

                                        'option_text' =>
                                            $option
                                                ->option_text,
                                    ]
                                )
                                ->values(),

                        'saved_answer' =>
                            $savedAnswer
                                ? [
                                    'selected_option_id' =>
                                        $savedAnswer
                                            ->selected_option_id,

                                    'answer_text' =>
                                        $savedAnswer
                                            ->answer_text,
                                ]
                                : null,
                    ];
                }
            )
            ->values();


        return response()->json([
            'message' =>
                $created
                    ? 'Attempt started successfully'
                    : 'Active attempt loaded',

            'attempt' => [
                'id' =>
                    $attempt->id,

                'assessment_id' =>
                    $assessment->id,

                'attempt_number' =>
                    $attempt
                        ->attempt_number,

                'status' =>
                    $attempt->status,

                'started_at' =>
                    $attempt->started_at,

                'expires_at' =>
                    $attempt->expires_at,

                'remaining_seconds' =>
                    $this->remainingSeconds(
                        $attempt
                    ),

                'max_score' =>
                    $attempt->max_score,
            ],

            'assessment' => [
                'id' =>
                    $assessment->id,

                'title' =>
                    $assessment->title,

                'description' =>
                    $assessment
                        ->description,

                'type' =>
                    $assessment->type,

                'duration_minutes' =>
                    $assessment
                        ->duration_minutes,

                'passing_score' =>
                    $assessment
                        ->passing_score,

                'questions_count' =>
                    $formattedQuestions
                        ->count(),
            ],

            'questions' =>
                $formattedQuestions,
        ], $created ? 201 : 200);
    }


    // =====================================
    // Result Response
    // =====================================

    private function resultResponse(
        AssessmentAttempt $attempt
    ) {
        $attempt->load([
            'assessment.questions.options',
            'answers.selectedOption',
        ]);


        $assessment =
            $attempt->assessment;


        $answers =
            $attempt
                ->answers
                ->keyBy(
                    'question_id'
                );


        $manualPending =
            $attempt
                ->answers
                ->contains(
                    'requires_manual_grading',
                    true
                );


        $review =
            $assessment
                ->questions
                ->map(
                    function ($question)
                    use (
                        $answers,
                        $assessment
                    ) {

                        $answer =
                            $answers->get(
                                $question->id
                            );


                        $possiblePoints =
                            (float) (
                                $question
                                    ->pivot
                                    ->points
                                ?? $question
                                    ->points
                                ?? 0
                            );


                        $item = [
                            'question_id' =>
                                $question->id,

                            'question_text' =>
                                $question
                                    ->question_text,

                            'type' =>
                                $question->type,

                            'points' =>
                                $possiblePoints,

                            'awarded_points' =>
                                (float) (
                                    $answer
                                        ?->awarded_points
                                    ?? 0
                                ),

                            'is_correct' =>
                                $answer
                                    ?->is_correct,

                            'requires_manual_grading' =>
                                (bool) (
                                    $answer
                                        ?->requires_manual_grading
                                    ?? false
                                ),

                            'student_answer' => [
                                'selected_option_id' =>
                                    $answer
                                        ?->selected_option_id,

                                'selected_option_text' =>
                                    $answer
                                        ?->selectedOption
                                        ?->option_text,

                                'answer_text' =>
                                    $answer
                                        ?->answer_text,
                            ],
                        ];


                        /*
                        |--------------------------------------------------------------------------
                        | Correct answers are exposed
                        | only when teacher allows it.
                        |--------------------------------------------------------------------------
                        */

                        if (
                            $assessment
                                ->show_answers_after_submit
                        ) {

                            $correctOption =
                                $question
                                    ->options
                                    ->firstWhere(
                                        'is_correct',
                                        true
                                    );


                            $item[
                                'correct_answer'
                            ] = [
                                'option_id' =>
                                    $correctOption
                                        ?->id,

                                'option_text' =>
                                    $correctOption
                                        ?->option_text,

                                'answer_text' =>
                                    $question
                                        ->correct_answer,
                            ];


                            $item[
                                'explanation'
                            ] =
                                $question
                                    ->explanation;
                        }


                        return $item;
                    }
                );


        return response()->json([
            'attempt' => [
                'id' =>
                    $attempt->id,

                'attempt_number' =>
                    $attempt
                        ->attempt_number,

                'status' =>
                    $attempt->status,

                'score' =>
                    $attempt->score,

                'max_score' =>
                    $attempt->max_score,

                'percentage' =>
                    $attempt->percentage,

                'passed' =>
                    $attempt->passed,

                'duration_seconds' =>
                    $attempt
                        ->duration_seconds,

                'submitted_at' =>
                    $attempt
                        ->submitted_at,
            ],

            'grading_status' =>
                $manualPending
                    ? 'pending_manual'
                    : 'completed',

            'show_answers' =>
                (bool)
                $assessment
                    ->show_answers_after_submit,

            'review' =>
                $review,
        ]);
    }


    // =====================================
    // Enrollment Guard
    // =====================================

    private function ensureEnrollment(
        int $studentId,
        int $courseId
    ): void {

        $hasAccess =
            Enrollment::where(
                'student_id',
                $studentId
            )
                ->where(
                    'course_id',
                    $courseId
                )
                ->whereIn(
                    'status',
                    [
                        'Enrolled',
                        'Completed'
                    ]
                )
                ->exists();


        if (!$hasAccess) {

            abort(
                403,
                'You are not enrolled in this course.'
            );
        }
    }


    // =====================================
    // Remaining Time
    // =====================================

    private function remainingSeconds(
        AssessmentAttempt $attempt
    ): ?int {

        if (!$attempt->expires_at) {
            return null;
        }


        if (
            now()->greaterThanOrEqualTo(
                $attempt->expires_at
            )
        ) {
            return 0;
        }


        return (int)
            now()->diffInSeconds(
                $attempt->expires_at
            );
    }


    // =====================================
    // Normalize Text Answers
    // =====================================

    private function normalizeAnswer(
        ?string $value
    ): string {

        $value =
            trim(
                mb_strtolower(
                    $value ?? ''
                )
            );


        /*
        | Collapse multiple spaces.
        */

        return preg_replace(
            '/\s+/u',
            ' ',
            $value
        );
    }
}