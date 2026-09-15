<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuestionController extends Controller
{
    // =====================================
    // List Questions
    // =====================================

    public function index(Request $request)
    {
        $query = Question::with([
            'grade.academicStage',
            'course',
            'section',
            'options',
        ]);

        if ($request->filled('grade_id')) {
            $query->where(
                'grade_id',
                $request->grade_id
            );
        }

        if ($request->filled('course_id')) {
            $query->where(
                'course_id',
                $request->course_id
            );
        }

        if ($request->filled('course_section_id')) {
            $query->where(
                'course_section_id',
                $request->course_section_id
            );
        }

        if ($request->filled('type')) {
            $query->where(
                'type',
                $request->type
            );
        }

        if ($request->filled('skill')) {
            $query->where(
                'skill',
                $request->skill
            );
        }

        if ($request->filled('difficulty')) {
            $query->where(
                'difficulty',
                $request->difficulty
            );
        }

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        if ($request->filled('search')) {
            $query->where(
                'question_text',
                'like',
                '%' . $request->search . '%'
            );
        }

        $questions = $query
            ->latest()
            ->get();

        return response()->json([
            'questions' => $questions
        ]);
    }


    // =====================================
    // Create Question
    // =====================================

    public function store(Request $request)
    {
        $validated = $this->validateQuestion(
            $request
        );

        $this->validateAcademicScope(
            $validated
        );

        $this->validateAnswerStructure(
            $validated
        );

        $question = DB::transaction(
            function () use ($validated) {

                $question = Question::create([
                    'grade_id' =>
                        $validated['grade_id'] ?? null,

                    'course_id' =>
                        $validated['course_id'] ?? null,

                    'course_section_id' =>
                        $validated['course_section_id'] ?? null,

                    'question_text' =>
                        $validated['question_text'],

                    'type' =>
                        $validated['type'],

                    'skill' =>
                        $validated['skill'] ?? null,

                    'topic' =>
                        $validated['topic'] ?? null,

                    'difficulty' =>
                        $validated['difficulty'],

                    'points' =>
                        $validated['points'],

                    'correct_answer' =>
                        $validated['type'] === 'mcq'
                            ? null
                            : ($validated['correct_answer'] ?? null),

                    'explanation' =>
                        $validated['explanation'] ?? null,

                    'status' =>
                        $validated['status'],
                ]);


                if ($validated['type'] === 'mcq') {

                    foreach (
                        $validated['options']
                        as $index => $option
                    ) {

                        $question->options()->create([
                            'option_text' =>
                                $option['option_text'],

                            'is_correct' =>
                                (bool) $option['is_correct'],

                            'sort_order' =>
                                $index + 1,
                        ]);
                    }
                }


                return $question;
            }
        );


        $question->load([
            'grade.academicStage',
            'course',
            'section',
            'options',
        ]);


        return response()->json([
            'message' =>
                'Question created successfully',

            'question' =>
                $question
        ], 201);
    }


    // =====================================
    // Show Question
    // =====================================

    public function show($id)
    {
        $question = Question::with([
            'grade.academicStage',
            'course',
            'section',
            'options',
        ])->find($id);


        if (!$question) {
            return response()->json([
                'message' =>
                    'Question not found'
            ], 404);
        }


        return response()->json([
            'question' => $question
        ]);
    }


    // =====================================
    // Update Question
    // =====================================

    public function update(
        Request $request,
        $id
    ) {
        $question = Question::find($id);


        if (!$question) {
            return response()->json([
                'message' =>
                    'Question not found'
            ], 404);
        }


        $validated = $this->validateQuestion(
            $request
        );


        $this->validateAcademicScope(
            $validated
        );


        $this->validateAnswerStructure(
            $validated
        );


        DB::transaction(
            function () use (
                $question,
                $validated
            ) {

                $question->update([
                    'grade_id' =>
                        $validated['grade_id'] ?? null,

                    'course_id' =>
                        $validated['course_id'] ?? null,

                    'course_section_id' =>
                        $validated['course_section_id'] ?? null,

                    'question_text' =>
                        $validated['question_text'],

                    'type' =>
                        $validated['type'],

                    'skill' =>
                        $validated['skill'] ?? null,

                    'topic' =>
                        $validated['topic'] ?? null,

                    'difficulty' =>
                        $validated['difficulty'],

                    'points' =>
                        $validated['points'],

                    'correct_answer' =>
                        $validated['type'] === 'mcq'
                            ? null
                            : ($validated['correct_answer'] ?? null),

                    'explanation' =>
                        $validated['explanation'] ?? null,

                    'status' =>
                        $validated['status'],
                ]);


                /*
                |--------------------------------------------------------------------------
                | Rebuild MCQ Options
                |--------------------------------------------------------------------------
                */

                $question->options()->delete();


                if ($validated['type'] === 'mcq') {

                    foreach (
                        $validated['options']
                        as $index => $option
                    ) {

                        $question->options()->create([
                            'option_text' =>
                                $option['option_text'],

                            'is_correct' =>
                                (bool) $option['is_correct'],

                            'sort_order' =>
                                $index + 1,
                        ]);
                    }
                }
            }
        );


        $question->load([
            'grade.academicStage',
            'course',
            'section',
            'options',
        ]);


        return response()->json([
            'message' =>
                'Question updated successfully',

            'question' =>
                $question
        ]);
    }


    // =====================================
    // Delete Question
    // =====================================

    public function destroy($id)
    {
        $question = Question::withCount(
            'assessments'
        )->find($id);


        if (!$question) {
            return response()->json([
                'message' =>
                    'Question not found'
            ], 404);
        }


        if (
            $question->assessments_count > 0
        ) {

            return response()->json([
                'message' =>
                    'Cannot delete this question because it is used in an assessment.'
            ], 409);
        }


        $question->delete();


        return response()->json([
            'message' =>
                'Question deleted successfully'
        ]);
    }


    // =====================================
    // Validation
    // =====================================

    private function validateQuestion(
        Request $request
    ): array {

        return $request->validate([

            'grade_id' => [
                'nullable',
                'exists:grades,id',
            ],

            'course_id' => [
                'nullable',
                'exists:courses,id',
            ],

            'course_section_id' => [
                'nullable',
                'exists:course_sections,id',
            ],

            'question_text' => [
                'required',
                'string',
            ],

            'type' => [
                'required',
                'in:mcq,true_false,fill_blank,short_answer',
            ],

            'skill' => [
                'nullable',
                'string',
                'max:100',
            ],

            'topic' => [
                'nullable',
                'string',
                'max:255',
            ],

            'difficulty' => [
                'required',
                'in:Easy,Medium,Hard',
            ],

            'points' => [
                'required',
                'numeric',
                'min:0.01',
            ],

            'correct_answer' => [
                'nullable',
                'string',
            ],

            'explanation' => [
                'nullable',
                'string',
            ],

            'status' => [
                'required',
                'in:Draft,Published',
            ],

            'options' => [
                'nullable',
                'array',
            ],

            'options.*.option_text' => [
                'required_with:options',
                'string',
            ],

            'options.*.is_correct' => [
                'required_with:options',
                'boolean',
            ],
        ]);
    }


    // =====================================
    // Academic Scope Validation
    // =====================================

    private function validateAcademicScope(
        array $validated
    ): void {

        /*
        |--------------------------------------------------------------------------
        | Section must belong to selected course
        |--------------------------------------------------------------------------
        */

        if (
            !empty(
                $validated['course_section_id']
            )
        ) {

            if (
                empty(
                    $validated['course_id']
                )
            ) {

                throw ValidationException::withMessages([
                    'course_id' => [
                        'A course is required when selecting a section.'
                    ]
                ]);
            }


            $belongs = CourseSection::where(
                'id',
                $validated['course_section_id']
            )
                ->where(
                    'course_id',
                    $validated['course_id']
                )
                ->exists();


            if (!$belongs) {

                throw ValidationException::withMessages([
                    'course_section_id' => [
                        'The selected section does not belong to this course.'
                    ]
                ]);
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Course must belong to selected grade
        |--------------------------------------------------------------------------
        */

        if (
            !empty($validated['course_id'])
            && !empty($validated['grade_id'])
        ) {

            $courseMatchesGrade =
                Course::where(
                    'id',
                    $validated['course_id']
                )
                    ->where(
                        'grade_id',
                        $validated['grade_id']
                    )
                    ->exists();


            if (!$courseMatchesGrade) {

                throw ValidationException::withMessages([
                    'course_id' => [
                        'The selected course does not belong to this grade.'
                    ]
                ]);
            }
        }
    }


    // =====================================
    // Answer Validation
    // =====================================

    private function validateAnswerStructure(
        array $validated
    ): void {

        $type =
            $validated['type'];


        // =================================
        // MCQ
        // =================================

        if ($type === 'mcq') {

            $options =
                $validated['options']
                ?? [];


            if (count($options) < 2) {

                throw ValidationException::withMessages([
                    'options' => [
                        'MCQ questions require at least two options.'
                    ]
                ]);
            }


            $correctCount = collect(
                $options
            )
                ->filter(
                    fn ($option) =>
                        (bool) $option['is_correct']
                )
                ->count();


            if ($correctCount !== 1) {

                throw ValidationException::withMessages([
                    'options' => [
                        'MCQ questions must have exactly one correct answer.'
                    ]
                ]);
            }


            return;
        }


        // =================================
        // True / False
        // =================================

        if ($type === 'true_false') {

            $answer = strtolower(
                trim(
                    $validated[
                        'correct_answer'
                    ] ?? ''
                )
            );


            if (
                !in_array(
                    $answer,
                    ['true', 'false']
                )
            ) {

                throw ValidationException::withMessages([
                    'correct_answer' => [
                        'True/False answer must be true or false.'
                    ]
                ]);
            }


            return;
        }


        // =================================
        // Fill Blank
        // =================================

        if (
            $type === 'fill_blank'
            && empty(
                trim(
                    $validated[
                        'correct_answer'
                    ] ?? ''
                )
            )
        ) {

            throw ValidationException::withMessages([
                'correct_answer' => [
                    'A correct answer is required for fill in the blank questions.'
                ]
            ]);
        }
    }
}