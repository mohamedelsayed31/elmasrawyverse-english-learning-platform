<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function index()
    {
        $assignments = Assignment::with([
            'course.instructor'
        ])
        ->latest()
        ->get();

        return response()->json([
            'assignments' => $assignments
        ]);
    }


    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'course_id' => 'required|exists:courses,id',
            'due_date' => 'required|date|after_or_equal:today',
            'marks' => 'required|integer|min:0',
            'status' => 'required|in:Open,Closed',
        ]);

        $assignment = Assignment::create([
            'title' => $request->title,
            'course_id' => $request->course_id,
            'due_date' => $request->due_date,
            'marks' => $request->marks,
            'submissions' => 0,
            'status' => $request->status,
        ]);

        $assignment->load('course.instructor');

        return response()->json([
            'message' => 'Assignment created successfully',
            'assignment' => $assignment
        ], 201);
    }


    public function show($id)
    {
        $assignment = Assignment::with([
            'course.instructor',
            'studentSubmissions.student'
        ])->find($id);

        if (!$assignment) {
            return response()->json([
                'message' => 'Assignment not found'
            ], 404);
        }

        return response()->json([
            'assignment' => $assignment
        ]);
    }


    public function update(Request $request, $id)
    {
        $assignment = Assignment::find($id);

        if (!$assignment) {
            return response()->json([
                'message' => 'Assignment not found'
            ], 404);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'course_id' => 'required|exists:courses,id',
            'due_date' => 'required|date',
            'marks' => 'required|integer|min:0',
            'status' => 'required|in:Open,Closed',
        ]);

        $assignment->update([
            'title' => $request->title,
            'course_id' => $request->course_id,
            'due_date' => $request->due_date,
            'marks' => $request->marks,
            'status' => $request->status,
        ]);

        $assignment->load('course.instructor');

        return response()->json([
            'message' => 'Assignment updated successfully',
            'assignment' => $assignment
        ]);
    }


    public function destroy($id)
    {
        $assignment = Assignment::withCount(
            'studentSubmissions'
        )->find($id);
    
        if (!$assignment) {
            return response()->json([
                'message' => 'Assignment not found'
            ], 404);
        }
    
        if ($assignment->student_submissions_count > 0) {
            return response()->json([
                'message' =>
                    'Cannot delete assignment because students have submitted work.'
            ], 409);
        }
    
        $assignment->delete();
    
        return response()->json([
            'message' => 'Assignment deleted successfully'
        ]);
    }
}