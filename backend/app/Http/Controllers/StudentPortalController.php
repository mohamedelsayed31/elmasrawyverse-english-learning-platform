<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\SectionItemProgress;
use App\Models\Submission;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    // =====================================
    // My Courses
    // =====================================

    public function courses(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'message' => 'Student profile not found'
            ], 404);
        }


        $courses = $student->courses()
            ->with([
                'instructor',
                'grade.academicStage',
            ])
            ->get();


        return response()->json([
            'courses' => $courses
        ]);
    }


    // =====================================
    // My Assignments
    // =====================================

    public function assignments(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'message' => 'Student profile not found'
            ], 404);
        }


        $courseIds = $student->courses()
            ->pluck('courses.id');


        $assignments = Assignment::with([
            'course.instructor'
        ])
            ->whereIn(
                'course_id',
                $courseIds
            )
            ->latest()
            ->get();


        return response()->json([
            'assignments' => $assignments
        ]);
    }


    // =====================================
    // My Submissions
    // =====================================

    public function submissions(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'message' => 'Student profile not found'
            ], 404);
        }


        $submissions = Submission::with([
            'assignment.course'
        ])
            ->where(
                'student_id',
                $student->id
            )
            ->latest()
            ->get();


        return response()->json([
            'submissions' => $submissions
        ]);
    }


    // =====================================
    // Course Learning Content
    // =====================================

    public function courseContent(
        Request $request,
        $courseId
    ) {
        $student = $request->user()->student;


        if (!$student) {
            return response()->json([
                'message' =>
                    'Student profile not found'
            ], 404);
        }


        // =====================================
        // Enrollment Guard
        // =====================================

        $enrollment = Enrollment::where(
            'student_id',
            $student->id
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
            ->first();


        if (!$enrollment) {
            return response()->json([
                'message' =>
                    'You are not enrolled in this course.'
            ], 403);
        }


        // =====================================
        // Course + Published Content
        // =====================================

        $course = Course::with([
            'instructor',

            'grade.academicStage',

            // =================================
            // Published Sections
            // =================================

            'sections' => function ($query) {

                $query
                    ->where(
                        'status',
                        'Published'
                    )
                    ->orderBy(
                        'sort_order'
                    )
                    ->with([

                        // =========================
                        // Published Content Items
                        // =========================

                        'items' => function ($query) {

                            $query
                                ->where(
                                    'status',
                                    'Published'
                                )
                                ->orderBy(
                                    'sort_order'
                                );
                        },


                        // =========================
                        // Section Assessments
                        // =========================

                        'assessments' => function ($query) {

                            $query
                                ->where(
                                    'status',
                                    'Published'
                                )
                                ->withCount(
                                    'questions'
                                )
                                ->orderBy('id');
                        },

                    ]);
            },


            // =================================
            // Course-Level Assessments
            // =================================
            //
            // Examples:
            // Final Exam
            // Monthly Exam
            // Full Course Quiz
            //

            'assessments' => function ($query) {

                $query
                    ->whereNull(
                        'course_section_id'
                    )
                    ->where(
                        'status',
                        'Published'
                    )
                    ->withCount(
                        'questions'
                    )
                    ->orderBy('id');
            },

        ])
            ->where(
                'status',
                'Published'
            )
            ->find($courseId);


        // =====================================
        // Course Not Found
        // =====================================

        if (!$course) {
            return response()->json([
                'message' =>
                    'Course not found'
            ], 404);
        }


        // =====================================
        // Get All Loaded Item IDs
        // =====================================

        $itemIds = $course
            ->sections
            ->flatMap(
                function ($section) {
                    return $section
                        ->items
                        ->pluck('id');
                }
            )
            ->values();


        // =====================================
        // Student Progress Map
        // =====================================

        $progressMap =
            SectionItemProgress::where(
                'student_id',
                $student->id
            )
                ->whereIn(
                    'section_item_id',
                    $itemIds
                )
                ->get()
                ->keyBy(
                    'section_item_id'
                );


        // =====================================
        // Attach Progress To Every Lesson
        // =====================================

        foreach (
            $course->sections
            as $section
        ) {

            foreach (
                $section->items
                as $item
            ) {

                $itemProgress =
                    $progressMap->get(
                        $item->id
                    );


                $item->setAttribute(
                    'student_progress',
                    [
                        'status' =>
                            $itemProgress
                                ?->status,

                        'opened_at' =>
                            $itemProgress
                                ?->opened_at,

                        'completed_at' =>
                            $itemProgress
                                ?->completed_at,

                        'last_position_seconds' =>
                            $itemProgress
                                ?->last_position_seconds
                            ?? 0,

                        'completed' =>
                            $itemProgress
                                ?->status
                            === 'completed',
                    ]
                );
            }
        }


        // =====================================
        // Response
        // =====================================

        return response()->json([
            'course' =>
                $course,

            'enrollment' => [
                'id' =>
                    $enrollment->id,

                'status' =>
                    $enrollment->status,

                'progress' =>
                    $enrollment->progress
                    ?? 0,
            ]
        ]);
    }

    public function continueLearning(Request $request)
{
    $student = $request->user()->student;

    if (!$student) {
        return response()->json([
            'message' => 'Student profile not found'
        ], 404);
    }


    $progress = SectionItemProgress::with([
        'sectionItem.section.course.instructor',
        'sectionItem.section.course.grade.academicStage',
    ])
        ->where(
            'student_id',
            $student->id
        )

        // Published item only
        ->whereHas(
            'sectionItem',
            function ($query) {
                $query->where(
                    'status',
                    'Published'
                );
            }
        )

        // Published section only
        ->whereHas(
            'sectionItem.section',
            function ($query) {
                $query->where(
                    'status',
                    'Published'
                );
            }
        )

        // Published + enrolled course only
        ->whereHas(
            'sectionItem.section.course',
            function ($query) use ($student) {

                $query
                    ->where(
                        'status',
                        'Published'
                    )
                    ->whereHas(
                        'enrollments',
                        function ($enrollmentQuery)
                        use ($student) {

                            $enrollmentQuery
                                ->where(
                                    'student_id',
                                    $student->id
                                )
                                ->whereIn(
                                    'status',
                                    [
                                        'Enrolled',
                                        'Completed'
                                    ]
                                );
                        }
                    );
            }
        )

        // updated_at becomes our last activity
        ->latest('updated_at')
        ->first();


    if (!$progress) {
        return response()->json([
            'continue_learning' => null
        ]);
    }


    $item =
        $progress->sectionItem;

    $section =
        $item->section;

    $course =
        $section->course;


    $enrollment = Enrollment::where(
        'student_id',
        $student->id
    )
        ->where(
            'course_id',
            $course->id
        )
        ->first();


    return response()->json([
        'continue_learning' => [

            'course' => [
                'id' =>
                    $course->id,

                'title' =>
                    $course->title,

                'instructor' =>
                    $course->instructor,

                'grade' =>
                    $course->grade,
            ],

            'section' => [
                'id' =>
                    $section->id,

                'title' =>
                    $section->title,
            ],

            'item' => [
                'id' =>
                    $item->id,

                'title' =>
                    $item->title,

                'type' =>
                    $item->type,
            ],

            'progress' => [
                'status' =>
                    $progress->status,

                'completed' =>
                    $progress->status ===
                    'completed',

                'last_position_seconds' =>
                    $progress
                        ->last_position_seconds
                    ?? 0,
            ],

            'course_progress' =>
                $enrollment?->progress ?? 0,

        ]
    ]);
}
}