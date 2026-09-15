<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    // =====================================
    // List Students
    // =====================================

    public function index()
    {
        $students = Student::with([
            'user',
            'courses',
            'enrollments.course',
        ])
            ->latest()
            ->get();

        return response()->json([
            'students' => $students
        ]);
    }


    // =====================================
    // Create Student
    // =====================================
    //
    // Students are created automatically
    // when they register an account.
    // We intentionally prevent creating
    // orphan Student records from Admin.
    // =====================================

    public function store(Request $request)
    {
        return response()->json([
            'message' =>
                'Students are created automatically when they register an account.'
        ], 405);
    }


    // =====================================
    // Show Student
    // =====================================

    public function show($id)
    {
        $student = Student::with([
            'user',
            'courses',
            'enrollments.course.instructor',
            'submissions',
            'assessmentAttempts.assessment',
            'certificates.course',
        ])->find($id);

        if (!$student) {
            return response()->json([
                'message' => 'Student not found'
            ], 404);
        }

        return response()->json([
            'student' => $student
        ]);
    }


    // =====================================
    // Update Student + Login Account
    // =====================================

    public function update(
        Request $request,
        $id
    ) {
        $student = Student::with('user')
            ->find($id);

        if (!$student) {
            return response()->json([
                'message' => 'Student not found'
            ], 404);
        }


        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',

                Rule::unique(
                    'students',
                    'email'
                )->ignore(
                    $student->id
                ),

                Rule::unique(
                    'users',
                    'email'
                )->ignore(
                    $student->user_id
                ),
            ],

            'phone' => [
                'required',
                'string',
                'max:20',
            ],

            'status' => [
                'required',
                Rule::in([
                    'Active',
                    'Inactive',
                ]),
            ],
        ]);


        DB::transaction(
            function () use (
                $student,
                $validated
            ) {

                // Update Student profile.

                $student->update([
                    'name' =>
                        $validated['name'],

                    'email' =>
                        $validated['email'],

                    'phone' =>
                        $validated['phone'],

                    'status' =>
                        $validated['status'],
                ]);


                // Keep the login account in sync.

                if ($student->user) {

                    $student->user->update([
                        'name' =>
                            $validated['name'],

                        'email' =>
                            $validated['email'],

                        'status' =>
                            $validated['status'] ===
                            'Active'
                                ? '1'
                                : '0',
                    ]);
                }
            }
        );


        $student->refresh();

        $student->load([
            'user',
            'courses',
            'enrollments.course',
        ]);


        return response()->json([
            'message' =>
                'Student updated successfully',

            'student' =>
                $student,
        ]);
    }


    // =====================================
    // Delete Student Account
    // =====================================
    //
    // This removes the Student profile and
    // the linked User login account.
    //
    // Student-owned records that use
    // database cascade foreign keys will
    // be removed with the Student.
    // =====================================

    public function destroy($id)
    {
        $student = Student::with([
            'user',
            'enrollments',
        ])->find($id);


        if (!$student) {
            return response()->json([
                'message' =>
                    'Student not found'
            ], 404);
        }


        // Keep affected course counters correct.

        $courseIds =
            $student
                ->enrollments
                ->pluck('course_id')
                ->unique()
                ->values();


        DB::transaction(
            function () use (
                $student
            ) {

                $user =
                    $student->user;


                // Delete Student first.
                // Related student records that
                // use ON DELETE CASCADE will
                // be removed by the database.

                $student->delete();


                // Delete login tokens + account.

                if ($user) {

                    if (
                        method_exists(
                            $user,
                            'tokens'
                        )
                    ) {
                        $user
                            ->tokens()
                            ->delete();
                    }

                    $user->delete();
                }
            }
        );


        // Recalculate cached enrolled counts.

        if (
            $courseIds->isNotEmpty()
        ) {

            $courses =
                Course::whereIn(
                    'id',
                    $courseIds
                )->get();


            foreach (
                $courses as $course
            ) {

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


        return response()->json([
            'message' =>
                'Student account deleted successfully'
        ]);
    }
}
