<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    // =====================================
    // List Courses
    // =====================================

    public function index()
    {
        $courses = Course::with([
            'instructor',
            'grade.academicStage',
        ])
            ->withCount('sections')
            ->latest()
            ->get();

        return response()->json([
            'courses' => $courses
        ]);
    }


    // =====================================
    // Create Course
    // =====================================

    public function store(Request $request)
    {
        $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
                'unique:courses,title'
            ],

            'instructor_id' => [
                'required',
                'exists:instructors,id'
            ],

            // Nullable temporarily so the old frontend
            // continues working during the migration.
            'grade_id' => [
                'nullable',
                'exists:grades,id'
            ],

            'category' => [
                'required',
                'string',
                'max:255'
            ],

            'status' => [
                'required',
                'in:Published,Draft'
            ],

            // Legacy field for now.
            // Later sections/content will replace this count.
            'lessons' => [
                'required',
                'integer',
                'min:0'
            ],

            'price' => [
                'required',
                'numeric',
                'min:0'
            ],
        ]);


        $course = Course::create([
            'title' => $request->title,

            'instructor_id' =>
                $request->instructor_id,

            'grade_id' =>
                $request->grade_id,

            'category' =>
                $request->category,

            'status' =>
                $request->status,

            'lessons' =>
                $request->lessons,

            'price' =>
                $request->price,

            'enrolled' => 0,
        ]);


        $course->load([
            'instructor',
            'grade.academicStage',
        ]);


        return response()->json([
            'message' => 'Course created successfully',
            'course' => $course
        ], 201);
    }


    // =====================================
    // Show Course
    // =====================================

    public function show($id)
    {
        $course = Course::with([
            'instructor',

            'grade.academicStage',

            'sections',

            'students',

            'assignments',
        ])
            ->withCount([
                'sections',
                'enrollments',
                'assignments',
            ])
            ->find($id);


        if (!$course) {
            return response()->json([
                'message' => 'Course not found'
            ], 404);
        }


        return response()->json([
            'course' => $course
        ]);
    }


    // =====================================
    // Update Course
    // =====================================

    public function update(Request $request, $id)
    {
        $course = Course::find($id);


        if (!$course) {
            return response()->json([
                'message' => 'Course not found'
            ], 404);
        }


        $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
                'unique:courses,title,' . $course->id
            ],

            'instructor_id' => [
                'required',
                'exists:instructors,id'
            ],

            'grade_id' => [
                'nullable',
                'exists:grades,id'
            ],

            'category' => [
                'required',
                'string',
                'max:255'
            ],

            'status' => [
                'required',
                'in:Published,Draft'
            ],

            'lessons' => [
                'required',
                'integer',
                'min:0'
            ],

            'price' => [
                'required',
                'numeric',
                'min:0'
            ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | Important
        |--------------------------------------------------------------------------
        |
        | لو الـFrontend القديم لسه مش بيبعت grade_id
        | مش عايزين كل Update يمسح الـGrade الموجودة.
        |
        | لو grade_id اتبعت:
        | نستخدم القيمة الجديدة.
        |
        | لو متبعتش:
        | نحتفظ بالقيمة القديمة.
        |
        */

        $gradeId = $request->has('grade_id')
            ? $request->grade_id
            : $course->grade_id;


        $course->update([
            'title' =>
                $request->title,

            'instructor_id' =>
                $request->instructor_id,

            'grade_id' =>
                $gradeId,

            'category' =>
                $request->category,

            'status' =>
                $request->status,

            'lessons' =>
                $request->lessons,

            'price' =>
                $request->price,
        ]);


        $course->load([
            'instructor',
            'grade.academicStage',
        ]);


        return response()->json([
            'message' => 'Course updated successfully',
            'course' => $course
        ]);
    }


    // =====================================
    // Delete Course
    // =====================================

    public function destroy($id)
    {
        $course = Course::withCount([
            'enrollments',
            'assignments',
            'sections',
        ])->find($id);


        if (!$course) {
            return response()->json([
                'message' => 'Course not found'
            ], 404);
        }


        // Prevent deleting a course with enrolled students.

        if ($course->enrollments_count > 0) {
            return response()->json([
                'message' =>
                    'Cannot delete course because students are enrolled in it.'
            ], 409);
        }


        // Prevent deleting a course with assignments.

        if ($course->assignments_count > 0) {
            return response()->json([
                'message' =>
                    'Cannot delete course because it has assignments.'
            ], 409);
        }


        // Prevent accidental deletion of dynamic content structure.

        if ($course->sections_count > 0) {
            return response()->json([
                'message' =>
                    'Cannot delete course because it contains sections. Delete the sections first.'
            ], 409);
        }


        $course->delete();


        return response()->json([
            'message' => 'Course deleted successfully'
        ]);
    }
}