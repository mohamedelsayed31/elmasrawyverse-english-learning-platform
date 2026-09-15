<?php

namespace App\Http\Controllers;

use App\Models\AssessmentAnswer;
use App\Models\AssessmentAttempt;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Services\CourseCompletionService;

class AssessmentResultController extends Controller
{
    // =====================================
    // List Student Attempts
    // =====================================

    public function index(Request $request)
    {
        $query = AssessmentAttempt::with([
            'assessment.course',
            'assessment.section',
            'student',
        ])
            ->withCount([
                'answers as pending_manual_count' => function ($query) {
                    $query->where(
                        'requires_manual_grading',
                        true
                    );
                }
            ]);


        if ($request->filled('assessment_id')) {
            $query->where(
                'assessment_id',
                $request->assessment_id
            );
        }


        if ($request->filled('student_id')) {
            $query->where(
                'student_id',
                $request->student_id
            );
        }


        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }


        if (
            $request->boolean(
                'pending_manual'
            )
        ) {
            $query->whereHas(
                'answers',
                function ($query) {
                    $query->where(
                        'requires_manual_grading',
                        true
                    );
                }
            );
        }


        $attempts = $query
            ->latest('id')
            ->get();


        return response()->json([
            'attempts' => $attempts
        ]);
    }


    // =====================================
    // Show Attempt
    // =====================================

    public function show($id)
    {
        $attempt = AssessmentAttempt::with([
            'student',

            'assessment.course',

            'assessment.section',

            'assessment.questions.options',

            'answers.question.options',

            'answers.selectedOption',
        ])->find($id);


        if (!$attempt) {
            return response()->json([
                'message' =>
                    'Attempt not found'
            ], 404);
        }


        $answers = $attempt
            ->answers
            ->keyBy('question_id');


        $review = $attempt
            ->assessment
            ->questions
            ->map(
                function ($question)
                use ($answers) {

                    $answer =
                        $answers->get(
                            $question->id
                        );


                    $possiblePoints =
                        (float) (
                            $question
                                ->pivot
                                ->points
                            ?? $question->points
                            ?? 0
                        );


                    return [
                        'question_id' =>
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

                        'possible_points' =>
                            $possiblePoints,

                        'answer' =>
                            $answer
                                ? [
                                    'id' =>
                                        $answer->id,

                                    'selected_option_id' =>
                                        $answer
                                            ->selected_option_id,

                                    'selected_option_text' =>
                                        $answer
                                            ->selectedOption
                                            ?->option_text,

                                    'answer_text' =>
                                        $answer
                                            ->answer_text,

                                    'is_correct' =>
                                        $answer
                                            ->is_correct,

                                    'awarded_points' =>
                                        $answer
                                            ->awarded_points,

                                    'requires_manual_grading' =>
                                        (bool)
                                        $answer
                                            ->requires_manual_grading,

                                    'teacher_feedback' =>
                                        $answer
                                            ->teacher_feedback,
                                ]
                                : null,

                        'correct_answer' => [
                            'text' =>
                                $question
                                    ->correct_answer,

                            'option' =>
                                $question
                                    ->options
                                    ->firstWhere(
                                        'is_correct',
                                        true
                                    )
                                    ?->option_text,
                        ],
                    ];
                }
            )
            ->values();


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

                'started_at' =>
                    $attempt->started_at,

                'submitted_at' =>
                    $attempt->submitted_at,

                'duration_seconds' =>
                    $attempt
                        ->duration_seconds,

                'student' =>
                    $attempt->student,

                'assessment' => [
                    'id' =>
                        $attempt
                            ->assessment
                            ->id,

                    'title' =>
                        $attempt
                            ->assessment
                            ->title,

                    'type' =>
                        $attempt
                            ->assessment
                            ->type,

                    'passing_score' =>
                        $attempt
                            ->assessment
                            ->passing_score,

                    'course' =>
                        $attempt
                            ->assessment
                            ->course,

                    'section' =>
                        $attempt
                            ->assessment
                            ->section,
                ],
            ],

            'review' => $review
        ]);
    }


    // =====================================
    // Grade Manual Answer
    // =====================================

    public function gradeAnswer(
        Request $request,
        $attemptId,
        $answerId
    ) {
        $attempt = AssessmentAttempt::with([
            'assessment.questions'
        ])->find($attemptId);


        if (!$attempt) {
            return response()->json([
                'message' =>
                    'Attempt not found'
            ], 404);
        }


        $answer = AssessmentAnswer::where(
            'assessment_attempt_id',
            $attempt->id
        )
            ->where(
                'id',
                $answerId
            )
            ->first();


        if (!$answer) {
            return response()->json([
                'message' =>
                    'Answer not found'
            ], 404);
        }


        $question =
            $attempt
                ->assessment
                ->questions
                ->firstWhere(
                    'id',
                    $answer->question_id
                );


        if (!$question) {
            return response()->json([
                'message' =>
                    'Question does not belong to this assessment.'
            ], 409);
        }


        $possiblePoints =
            (float) (
                $question
                    ->pivot
                    ->points
                ?? $question->points
                ?? 0
            );


        $validated =
            $request->validate([
                'awarded_points' => [
                    'required',
                    'numeric',
                    'min:0',
                ],

                'teacher_feedback' => [
                    'nullable',
                    'string',
                    'max:5000',
                ],
            ]);


        if (
            (float)
            $validated['awarded_points']
            > $possiblePoints
        ) {
            throw ValidationException::withMessages([
                'awarded_points' => [
                    "Maximum allowed score is {$possiblePoints}."
                ]
            ]);
        }


        $awardedPoints =
            (float)
            $validated['awarded_points'];


        /*
        |--------------------------------------------------------------------------
        | is_correct
        |--------------------------------------------------------------------------
        |
        | Full score    => true
        | Zero          => false
        | Partial score => null
        |
        */

        $isCorrect = null;


        if (
            $awardedPoints
            >= $possiblePoints
        ) {
            $isCorrect = true;
        } elseif (
            $awardedPoints <= 0
        ) {
            $isCorrect = false;
        }


        $answer->update([
            'awarded_points' =>
                $awardedPoints,

            'is_correct' =>
                $isCorrect,

            'requires_manual_grading' =>
                false,

            'teacher_feedback' =>
                $validated[
                    'teacher_feedback'
                ] ?? null,
        ]);


        $this->recalculateAttempt(
            $attempt
        );

        $attempt->refresh();

        $attempt->loadMissing(
            'assessment'
        );

        app(
            CourseCompletionService::class
        )->evaluate(
            $attempt->student_id,
            $attempt->assessment->course_id
        );


        return response()->json([
            'message' =>
                'Answer graded successfully',

            'answer' =>
                $answer->fresh(),

            'attempt' =>
                $attempt->fresh(),
        ]);
    }


    // =====================================
    // Recalculate Attempt
    // =====================================

    private function recalculateAttempt(
        AssessmentAttempt $attempt
    ): void {
        $attempt->load([
            'assessment.questions',
            'answers',
        ]);


        $assessment =
            $attempt->assessment;


        $score =
            (float)
            $attempt
                ->answers
                ->sum(
                    'awarded_points'
                );


        $maxScore =
            (float)
            $assessment
                ->questions
                ->sum(
                    function ($question) {

                        return (float) (
                            $question
                                ->pivot
                                ->points
                            ?? $question
                                ->points
                            ?? 0
                        );
                    }
                );


        $pendingManual =
            $attempt
                ->answers
                ->where(
                    'requires_manual_grading',
                    true
                )
                ->count();


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


        $passed = null;


        /*
        |--------------------------------------------------------------------------
        | Don't finalize Pass/Fail
        | until all manual answers are graded.
        |--------------------------------------------------------------------------
        */

        if (
            $pendingManual === 0
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


        $attempt->update([
            'score' =>
                $score,

            'max_score' =>
                $maxScore,

            'percentage' =>
                $percentage,

            'passed' =>
                $passed,
        ]);
    }
}