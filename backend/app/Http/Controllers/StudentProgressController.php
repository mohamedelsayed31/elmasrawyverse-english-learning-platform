<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\SectionItem;
use App\Models\SectionItemProgress;
use App\Services\CourseCompletionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentProgressController extends Controller
{
    // =====================================
    // Open Lesson
    // =====================================

    public function open(
        Request $request,
        $itemId
    ) {
        $student =
            $request->user()->student;


        if (!$student) {
            return response()->json([
                'message' =>
                    'Student profile not found'
            ], 404);
        }


        $item = SectionItem::with(
            'section'
        )
            ->where(
                'status',
                'Published'
            )
            ->find($itemId);


        if (!$item) {
            return response()->json([
                'message' =>
                    'Content item not found'
            ], 404);
        }


        $this->ensureEnrollment(
            $student->id,
            $item->section->course_id
        );


        $progress =
            SectionItemProgress::firstOrCreate(
                [
                    'student_id' =>
                        $student->id,

                    'section_item_id' =>
                        $item->id,
                ],
                [
                    'status' =>
                        'started',

                    'opened_at' =>
                        now(),

                    'last_position_seconds' =>
                        0,
                ]
            );


        /*
        | If record already existed
        | but never got opened_at.
        */

        if (!$progress->opened_at) {

            $progress->update([
                'opened_at' => now()
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | Make this the latest active lesson
        |--------------------------------------------------------------------------
        */

        $progress->touch();


        return response()->json([
            'message' =>
                'Lesson opened',

            'progress' =>
                $progress,
        ]);
    }


    // =====================================
    // Update Position
    // =====================================

    public function position(
        Request $request,
        $itemId
    ) {
        $student =
            $request->user()->student;


        if (!$student) {
            return response()->json([
                'message' =>
                    'Student profile not found'
            ], 404);
        }


        $validated =
            $request->validate([
                'position_seconds' => [
                    'required',
                    'integer',
                    'min:0'
                ]
            ]);


        $item = SectionItem::with(
            'section'
        )
            ->where(
                'status',
                'Published'
            )
            ->find($itemId);


        if (!$item) {
            return response()->json([
                'message' =>
                    'Content item not found'
            ], 404);
        }


        $this->ensureEnrollment(
            $student->id,
            $item->section->course_id
        );


        $progress =
            SectionItemProgress::updateOrCreate(
                [
                    'student_id' =>
                        $student->id,

                    'section_item_id' =>
                        $item->id,
                ],
                [
                    'opened_at' =>
                        now(),

                    'last_position_seconds' =>
                        $validated[
                            'position_seconds'
                        ],
                ]
            );


        return response()->json([
            'message' =>
                'Position saved',

            'progress' =>
                $progress,
        ]);
    }


    // =====================================
    // Complete Lesson
    // =====================================

    public function complete(
        Request $request,
        $itemId
    ) {
        $student =
            $request->user()->student;


        if (!$student) {
            return response()->json([
                'message' =>
                    'Student profile not found'
            ], 404);
        }

        $item = SectionItem::with(
            'section'
        )
            ->where(
                'status',
                'Published'
            )
            ->find($itemId);


        if (!$item) {
            return response()->json([
                'message' =>
                    'Content item not found'
            ], 404);
        }


        $courseId =
            $item->section->course_id;


        $this->ensureEnrollment(
            $student->id,
            $courseId
        );

        DB::transaction(
            function () use (
                $student,
                $item,
                $courseId
            ) {

                SectionItemProgress::updateOrCreate(
                    [
                        'student_id' =>
                            $student->id,

                        'section_item_id' =>
                            $item->id,
                    ],
                    [
                        'status' =>
                            'completed',

                        'opened_at' =>
                            now(),

                        'completed_at' =>
                            now(),
                    ]
                );


                $this->recalculateCourseProgress(
                    $student->id,
                    $courseId
                );
            }
        );


        // Evaluate course completion only after
        // this lesson has been marked completed.
        app(
            CourseCompletionService::class
        )->evaluate(
            $student->id,
            $courseId
        );


        $enrollment =
            Enrollment::where(
                'student_id',
                $student->id
            )
                ->where(
                    'course_id',
                    $courseId
                )
                ->first();

                $enrollment?->refresh();


        return response()->json([
            'message' =>
                'Lesson completed successfully',

            'course_progress' =>
                $enrollment?->progress ?? 0,

            'course_completed' =>
                $enrollment?->status ===
                'Completed',
        ]);
    }


    // =====================================
    // Reopen Lesson
    // =====================================

    public function uncomplete(
        Request $request,
        $itemId
    ) {
        $student =
            $request->user()->student;


        if (!$student) {
            return response()->json([
                'message' =>
                    'Student profile not found'
            ], 404);
        }


        $item = SectionItem::with(
            'section'
        )->find($itemId);


        if (!$item) {
            return response()->json([
                'message' =>
                    'Content item not found'
            ], 404);
        }


        $courseId =
            $item->section->course_id;


        $this->ensureEnrollment(
            $student->id,
            $courseId
        );


        // Once a course is completed and a certificate may have
        // been issued, do not allow the student to roll progress back.
        $completedEnrollment = Enrollment::where(
            'student_id',
            $student->id
        )
            ->where(
                'course_id',
                $courseId
            )
            ->where(
                'status',
                'Completed'
            )
            ->exists();


        if ($completedEnrollment) {
            return response()->json([
                'message' =>
                    'Completed courses cannot be marked incomplete.'
            ], 409);
        }


        $progress =
            SectionItemProgress::where(
                'student_id',
                $student->id
            )
                ->where(
                    'section_item_id',
                    $item->id
                )
                ->first();


        if ($progress) {

            $progress->update([
                'status' =>
                    'started',

                'completed_at' =>
                    null,
            ]);
        }


        $this->recalculateCourseProgress(
            $student->id,
            $courseId
        );


        $enrollment =
            Enrollment::where(
                'student_id',
                $student->id
            )
                ->where(
                    'course_id',
                    $courseId
                )
                ->first();


        return response()->json([
            'message' =>
                'Lesson marked as incomplete',

            'course_progress' =>
                $enrollment?->progress ?? 0,
        ]);
    }


    // =====================================
    // Recalculate Course Progress
    // =====================================

    private function recalculateCourseProgress(
        int $studentId,
        int $courseId
    ): int {

        /*
        |--------------------------------------------------------------------------
        | Total published content
        |--------------------------------------------------------------------------
        */

        $totalItems =
            SectionItem::whereHas(
                'section',
                function ($query)
                use ($courseId) {

                    $query
                        ->where(
                            'course_id',
                            $courseId
                        )
                        ->where(
                            'status',
                            'Published'
                        );
                }
            )
                ->where(
                    'status',
                    'Published'
                )
                ->count();


        if ($totalItems === 0) {

            $percentage = 0;

        } else {

            /*
            |--------------------------------------------------------------------------
            | Completed published content
            |--------------------------------------------------------------------------
            */

            $completed =
                SectionItemProgress::where(
                    'student_id',
                    $studentId
                )
                    ->where(
                        'status',
                        'completed'
                    )
                    ->whereHas(
                        'sectionItem',
                        function ($query)
                        use ($courseId) {

                            $query
                                ->where(
                                    'status',
                                    'Published'
                                )
                                ->whereHas(
                                    'section',
                                    function (
                                        $sectionQuery
                                    ) use (
                                        $courseId
                                    ) {

                                        $sectionQuery
                                            ->where(
                                                'course_id',
                                                $courseId
                                            )
                                            ->where(
                                                'status',
                                                'Published'
                                            );
                                    }
                                );
                        }
                    )
                    ->count();


            $percentage =
                (int) round(
                    (
                        $completed /
                        $totalItems
                    ) * 100
                );
        }


        Enrollment::where(
            'student_id',
            $studentId
        )
            ->where(
                'course_id',
                $courseId
            )
            ->update([
                'progress' =>
                    $percentage
            ]);


        return $percentage;
    }


    // =====================================
    // Enrollment Guard
    // =====================================

    private function ensureEnrollment(
        int $studentId,
        int $courseId
    ): void {

        $exists =
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


        if (!$exists) {

            abort(
                403,
                'You are not enrolled in this course.'
            );
        }
    }
}