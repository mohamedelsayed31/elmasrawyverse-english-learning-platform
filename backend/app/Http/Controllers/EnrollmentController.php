<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Student;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    // =====================================
    // List Enrollments
    // =====================================

    public function index()
    {
        $enrollments =
            Enrollment::with([
                'student.user',
                'course.instructor',
            ])
                ->latest()
                ->get();


        return response()->json([
            'enrollments' =>
                $enrollments
        ]);
    }


    // =====================================
    // Enroll Student
    // =====================================

    public function store(
        Request $request
    ) {
        $validated =
            $request->validate([
                'student_id' => [
                    'required',
                    'exists:students,id',
                ],

                'course_id' => [
                    'required',
                    'exists:courses,id',
                ],
            ]);


        $student =
            Student::with('user')
                ->find(
                    $validated[
                        'student_id'
                    ]
                );


        if (
            !$student ||
            !$student->user_id ||
            !$student->user
        ) {

            return response()->json([
                'message' =>
                    'This student does not have a login account.'
            ], 409);
        }


        if (
            $student->status !==
            'Active'
        ) {

            return response()->json([
                'message' =>
                    'Inactive students cannot be enrolled.'
            ], 409);
        }


        $exists =
            Enrollment::where(
                'student_id',
                $student->id
            )
                ->where(
                    'course_id',
                    $validated[
                        'course_id'
                    ]
                )
                ->exists();


        if ($exists) {

            return response()->json([
                'message' =>
                    'Student is already enrolled in this course'
            ], 409);
        }


        /*
        |--------------------------------------------------------------------------
        | New enrollment always starts
        | as Enrolled with 0% progress.
        |--------------------------------------------------------------------------
        */

        $enrollment =
            Enrollment::create([
                'student_id' =>
                    $student->id,

                'course_id' =>
                    $validated[
                        'course_id'
                    ],

                'status' =>
                    'Enrolled',

                'progress' =>
                    0,

                'completed_at' =>
                    null,
            ]);


        $this->refreshCourseCount(
            $enrollment->course_id
        );


        $enrollment->load([
            'student.user',
            'course.instructor',
        ]);


        return response()->json([
            'message' =>
                'Student enrolled successfully',

            'enrollment' =>
                $enrollment
        ], 201);
    }


    // =====================================
    // Show Enrollment
    // =====================================

    public function show($id)
    {
        $enrollment =
            Enrollment::with([
                'student.user',
                'course.instructor',
            ])->find($id);


        if (!$enrollment) {

            return response()->json([
                'message' =>
                    'Enrollment not found'
            ], 404);
        }


        return response()->json([
            'enrollment' =>
                $enrollment
        ]);
    }


    // =====================================
    // Update Enrollment
    // =====================================
    //
    // Progress is normally updated by
    // the learning/progress system.
    //
    // We keep progress accepted here for
    // compatibility with the current Admin
    // UI during the functional review.
    // =====================================

    public function update(
        Request $request,
        $id
    ) {
        $enrollment =
            Enrollment::find($id);


        if (!$enrollment) {

            return response()->json([
                'message' =>
                    'Enrollment not found'
            ], 404);
        }


        $validated =
            $request->validate([
                'status' => [
                    'required',
                    'in:Enrolled,Completed,Dropped',
                ],

                'progress' => [
                    'sometimes',
                    'integer',
                    'min:0',
                    'max:100',
                ],
            ]);


        $data = [
            'status' =>
                $validated['status'],
        ];


        if (
            array_key_exists(
                'progress',
                $validated
            )
        ) {

            $data['progress'] =
                $validated[
                    'progress'
                ];
        }


        if (
            $validated['status'] ===
            'Completed'
        ) {

            $data['progress'] =
                100;

            $data['completed_at'] =
                $enrollment->completed_at
                ?? now();

        } elseif (
            $validated['status'] !==
            'Completed'
        ) {

            $data['completed_at'] =
                null;
        }


        $enrollment->update(
            $data
        );


        $this->refreshCourseCount(
            $enrollment->course_id
        );


        $enrollment->load([
            'student.user',
            'course.instructor',
        ]);


        return response()->json([
            'message' =>
                'Enrollment updated successfully',

            'enrollment' =>
                $enrollment
        ]);
    }


    // =====================================
    // Delete Enrollment
    // =====================================

    public function destroy($id)
    {
        $enrollment =
            Enrollment::find($id);


        if (!$enrollment) {

            return response()->json([
                'message' =>
                    'Enrollment not found'
            ], 404);
        }


        $courseId =
            $enrollment->course_id;


        $enrollment->delete();


        $this->refreshCourseCount(
            $courseId
        );


        return response()->json([
            'message' =>
                'Enrollment deleted successfully'
        ]);
    }


    // =====================================
    // Refresh Course Enrolled Count
    // =====================================

    private function refreshCourseCount(
        int $courseId
    ): void {

        $course =
            Course::find(
                $courseId
            );


        if (!$course) {
            return;
        }


        $course->update([
            'enrolled' =>
                $course
                    ->enrollments()
                    ->whereIn(
                        'status',
                        [
                            'Enrolled',
                            'Completed',
                        ]
                    )
                    ->count(),
        ]);
    }
}
