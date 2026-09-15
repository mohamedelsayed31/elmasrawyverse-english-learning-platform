<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class PublicCourseController extends Controller
{
    public function index(Request $request)
    {
        $query = Course::with([
            'instructor',
            'grade.academicStage',
        ])
            ->where('status', 'Published');


        // Search by course title
        if ($request->filled('search')) {
            $query->where(
                'title',
                'like',
                '%' . $request->search . '%'
            );
        }


        // Filter by category
        if ($request->filled('category')) {
            $query->where(
                'category',
                $request->category
            );
        }


        // Filter by grade
        if ($request->filled('grade_id')) {
            $query->where(
                'grade_id',
                $request->grade_id
            );
        }


        $courses = $query
            ->latest()
            ->get();


        return response()->json([
            'courses' => $courses
        ]);
    }


    public function show($id)
    {
        $course = Course::with([
            'instructor',
            'grade.academicStage',
            'sections' => function ($query) {
                $query
                    ->where('status', 'Published')
                    ->orderBy('sort_order');
            },
        ])
            ->where('status', 'Published')
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
}