<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\CourseSection;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AssessmentController extends Controller
{
    // =====================================
    // List Assessments
    // =====================================

    public function index(Request $request)
    {
        $query = Assessment::with([
            'course.grade.academicStage',
            'section',
        ])
            ->withCount('questions');


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


        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }


        if ($request->has('is_required')) {
            $query->where(
                'is_required',
                $request->boolean('is_required')
            );
        }


        $assessments = $query
            ->latest()
            ->get();


        return response()->json([
            'assessments' => $assessments
        ]);
    }


    // =====================================
    // Create Assessment
    // =====================================

    public function store(Request $request)
    {
        
        $validated = $this->validateAssessment(
            $request
        );


        $this->validateSectionBelongsToCourse(
            $validated
        );

        $this->validateRequiredAssessment(
            $validated
        );


        $assessment = Assessment::create([
            'course_id' =>
                $validated['course_id'],

            'course_section_id' =>
                $validated['course_section_id']
                ?? null,

            'title' =>
                $validated['title'],

            'description' =>
                $validated['description']
                ?? null,

            'type' =>
                $validated['type'],

            'duration_minutes' =>
                $validated['duration_minutes']
                ?? null,

            'passing_score' =>
                $validated['passing_score']
                ?? null,

            'max_attempts' =>
                $validated['max_attempts']
                ?? null,

            'shuffle_questions' =>
                (bool) (
                    $validated['shuffle_questions']
                    ?? false
                ),

            'show_answers_after_submit' =>
                (bool) (
                    $validated['show_answers_after_submit']
                    ?? true
                ),

            'is_required' =>
                (bool) (
                    $validated['is_required']
                    ?? false
                ),

            'status' =>
                $validated['status'],

            'published_at' =>
                $validated['status'] === 'Published'
                    ? now()
                    : null,
        ]);


        $assessment->load([
            'course.grade.academicStage',
            'section',
        ]);


        return response()->json([
            'message' =>
                'Assessment created successfully',

            'assessment' =>
                $assessment
        ], 201);
    }


    // =====================================
    // Show Assessment
    // =====================================

    public function show($id)
    {
        $assessment = Assessment::with([
            'course.grade.academicStage',
            'section',
            'questions.options',
        ])->find($id);


        if (!$assessment) {
            return response()->json([
                'message' =>
                    'Assessment not found'
            ], 404);
        }


        return response()->json([
            'assessment' =>
                $assessment
        ]);
    }


    // =====================================
    // Update Assessment
    // =====================================

    public function update(
        Request $request,
        $id
    ) {
        $assessment = Assessment::find($id);


        if (!$assessment) {
            return response()->json([
                'message' =>
                    'Assessment not found'
            ], 404);
        }


        $validated = $this->validateAssessment(
            $request
        );


        $this->validateSectionBelongsToCourse(
            $validated
        );

        $this->validateRequiredAssessment(
            $validated
        );


        $wasPublished =
            $assessment->status === 'Published';


        $assessment->update([
            'course_id' =>
                $validated['course_id'],

            'course_section_id' =>
                $validated['course_section_id']
                ?? null,

            'title' =>
                $validated['title'],

            'description' =>
                $validated['description']
                ?? null,

            'type' =>
                $validated['type'],

            'duration_minutes' =>
                $validated['duration_minutes']
                ?? null,

            'passing_score' =>
                $validated['passing_score']
                ?? null,

            'max_attempts' =>
                $validated['max_attempts']
                ?? null,

            'shuffle_questions' =>
                (bool) (
                    $validated['shuffle_questions']
                    ?? false
                ),

            'show_answers_after_submit' =>
                (bool) (
                    $validated['show_answers_after_submit']
                    ?? true
                ),

            'is_required' =>
                (bool) (
                    $validated['is_required']
                    ?? false
                ),

            'status' =>
                $validated['status'],

            'published_at' =>
                $validated['status'] === 'Published'
                    ? (
                        $wasPublished
                            ? $assessment->published_at
                            : now()
                    )
                    : null,
        ]);


        $assessment->load([
            'course.grade.academicStage',
            'section',
        ]);


        return response()->json([
            'message' =>
                'Assessment updated successfully',

            'assessment' =>
                $assessment
        ]);
    }


    // =====================================
    // Sync Questions
    // =====================================

    public function syncQuestions(
        Request $request,
        $id
    ) {
        $assessment = Assessment::with(
            'course'
        )->find($id);


        if (!$assessment) {
            return response()->json([
                'message' =>
                    'Assessment not found'
            ], 404);
        }


        $validated = $request->validate([
            'questions' => [
                'required',
                'array',
            ],

            'questions.*.question_id' => [
                'required',
                'integer',
                'distinct',
                'exists:questions,id',
            ],

            'questions.*.points' => [
                'nullable',
                'numeric',
                'min:0.01',
            ],

            'questions.*.sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],
        ]);


        $questionIds = collect(
            $validated['questions']
        )
            ->pluck('question_id')
            ->all();


        $questions = Question::whereIn(
            'id',
            $questionIds
        )->get();


        /*
        |--------------------------------------------------------------------------
        | Validate Academic Scope
        |--------------------------------------------------------------------------
        */

        foreach ($questions as $question) {

            // Question belongs to another course.

            if (
                $question->course_id
                && (int) $question->course_id
                    !== (int) $assessment->course_id
            ) {

                throw ValidationException::withMessages([
                    'questions' => [
                        "Question #{$question->id} belongs to another course."
                    ]
                ]);
            }


            // Question belongs to another grade.

            if (
                $question->grade_id
                && $assessment->course?->grade_id
                && (int) $question->grade_id
                    !== (int) $assessment->course->grade_id
            ) {

                throw ValidationException::withMessages([
                    'questions' => [
                        "Question #{$question->id} belongs to another grade."
                    ]
                ]);
            }


            /*
            |--------------------------------------------------------------------------
            | Section Assessment
            |--------------------------------------------------------------------------
            |
            | General questions are allowed.
            | Questions explicitly assigned to a section
            | must match the assessment section.
            |
            */

            if (
                $assessment->course_section_id
                && $question->course_section_id
                && (int) $question->course_section_id
                    !== (int) $assessment->course_section_id
            ) {

                throw ValidationException::withMessages([
                    'questions' => [
                        "Question #{$question->id} belongs to another section."
                    ]
                ]);
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Build Pivot Data
        |--------------------------------------------------------------------------
        */

        $syncData = [];


        foreach (
            $validated['questions']
            as $index => $questionData
        ) {

            $syncData[
                $questionData['question_id']
            ] = [
                'sort_order' =>
                    $questionData['sort_order']
                    ?? ($index + 1),

                'points' =>
                    $questionData['points']
                    ?? null,
            ];
        }


        $assessment
            ->questions()
            ->sync($syncData);


        $assessment->load([
            'questions.options'
        ]);


        return response()->json([
            'message' =>
                'Assessment questions updated successfully',

            'assessment' =>
                $assessment
        ]);
    }


    public function availableQuestions($id)
{
    $assessment = Assessment::with(
        'course'
    )->find($id);


    if (!$assessment) {
        return response()->json([
            'message' => 'Assessment not found'
        ], 404);
    }


    $query = Question::with([
        'options',
        'grade.academicStage',
        'course',
        'section',
    ])
        ->where('status', 'Published');


    /*
    |--------------------------------------------------------------------------
    | Grade Scope
    |--------------------------------------------------------------------------
    |
    | Include:
    | - Questions for this grade
    | - General questions with no grade
    |
    */

    if ($assessment->course?->grade_id) {

        $query->where(function ($q) use ($assessment) {

            $q->where(
                'grade_id',
                $assessment->course->grade_id
            )
            ->orWhereNull('grade_id');

        });
    }


    /*
    |--------------------------------------------------------------------------
    | Course Scope
    |--------------------------------------------------------------------------
    |
    | Include:
    | - Questions for this course
    | - General questions with no course
    |
    */

    $query->where(function ($q) use ($assessment) {

        $q->where(
            'course_id',
            $assessment->course_id
        )
        ->orWhereNull('course_id');

    });


    /*
    |--------------------------------------------------------------------------
    | Section Scope
    |--------------------------------------------------------------------------
    |
    | If assessment belongs to a section:
    | include section questions + general questions.
    |
    */

    if ($assessment->course_section_id) {

        $query->where(function ($q) use ($assessment) {

            $q->where(
                'course_section_id',
                $assessment->course_section_id
            )
            ->orWhereNull(
                'course_section_id'
            );

        });
    }


    $questions = $query
        ->latest()
        ->get();


    return response()->json([
        'questions' => $questions
    ]);
}

    // =====================================
    // Delete Assessment
    // =====================================

    public function destroy($id)
    {
        $assessment = Assessment::find($id);


        if (!$assessment) {
            return response()->json([
                'message' =>
                    'Assessment not found'
            ], 404);
        }


        $assessment->delete();


        return response()->json([
            'message' =>
                'Assessment deleted successfully'
        ]);
    }


    // =====================================
    // Validation
    // =====================================

    private function validateAssessment(
        Request $request
    ): array {

        return $request->validate([

            'course_id' => [
                'required',
                'exists:courses,id',
            ],

            'course_section_id' => [
                'nullable',
                'exists:course_sections,id',
            ],

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'type' => [
                'required',
                'in:practice,quiz,homework,exam',
            ],

            'duration_minutes' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'passing_score' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100',
            ],

            'max_attempts' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'shuffle_questions' => [
                'nullable',
                'boolean',
            ],

            'show_answers_after_submit' => [
                'nullable',
                'boolean',
            ],

            'is_required' => [
                'nullable',
                'boolean',
            ],

            'status' => [
                'required',
                'in:Draft,Published',
            ],

        ]);
    }


    // =====================================
    // Validate Required Assessment
    // =====================================

    private function validateRequiredAssessment(
        array $validated
    ): void {
        $isRequired =
            (bool) (
                $validated['is_required']
                ?? false
            );


        if (
            $isRequired
            && (
                !array_key_exists(
                    'passing_score',
                    $validated
                )
                || $validated['passing_score'] === null
            )
        ) {
            throw ValidationException::withMessages([
                'passing_score' => [
                    'A required assessment must have a passing score.'
                ]
            ]);
        }
    }


    // =====================================
    // Validate Section
    // =====================================

    private function validateSectionBelongsToCourse(
        array $validated
    ): void {

        if (
            empty(
                $validated[
                    'course_section_id'
                ]
            )
        ) {
            return;
        }


        $exists = CourseSection::where(
            'id',
            $validated[
                'course_section_id'
            ]
        )
            ->where(
                'course_id',
                $validated['course_id']
            )
            ->exists();


        if (!$exists) {

            throw ValidationException::withMessages([
                'course_section_id' => [
                    'The selected section does not belong to this course.'
                ]
            ]);
        }
    }
}