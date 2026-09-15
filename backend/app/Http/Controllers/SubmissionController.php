<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Enrollment;
use App\Models\Submission;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function store(Request $request, $assignmentId)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'message' => 'Student profile not found'
            ], 404);
        }

        $assignment = Assignment::find($assignmentId);

        if (!$assignment) {
            return response()->json([
                'message' => 'Assignment not found'
            ], 404);
        }


        $enrolled = Enrollment::where('student_id', $student->id)
            ->where('course_id', $assignment->course_id)
            ->exists();

        if (!$enrolled) {
            return response()->json([
                'message' => 'You are not enrolled in this course'
            ], 403);
        }


        if ($assignment->status != 'Open') {
            return response()->json([
                'message' => 'This assignment is closed'
            ], 409);
        }


        if (now()->startOfDay()->gt($assignment->due_date)) {
            return response()->json([
                'message' => 'Assignment deadline has passed'
            ], 409);
        }


        $alreadySubmitted = Submission::where(
            'assignment_id',
            $assignment->id
        )
        ->where(
            'student_id',
            $student->id
        )
        ->exists();

        if ($alreadySubmitted) {
            return response()->json([
                'message' => 'Assignment already submitted'
            ], 409);
        }


        $request->validate([
            'file' => 'required|file|max:10240|mimes:pdf,doc,docx,zip',
        ]);


        $filePath = $request->file('file')
            ->store('submissions', 'public');


        $submission = Submission::create([
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'file' => $filePath,
            'submitted_at' => now(),
            'grade' => null,
            'status' => 'Submitted',
        ]);


        $assignment->update([
            'submissions' => $assignment
                ->studentSubmissions()
                ->count()
        ]);


        $submission->load([
            'assignment.course',
            'student'
        ]);


        return response()->json([
            'message' => 'Assignment submitted successfully',
            'submission' => $submission
        ], 201);
    }


    public function index()
    {
        $submissions = Submission::with([
            'student',
            'assignment.course'
        ])
        ->latest()
        ->get();

        return response()->json([
            'submissions' => $submissions
        ]);
    }


    public function show($id)
    {
        $submission = Submission::with([
            'student',
            'assignment.course.instructor'
        ])->find($id);

        if (!$submission) {
            return response()->json([
                'message' => 'Submission not found'
            ], 404);
        }

        return response()->json([
            'submission' => $submission
        ]);
    }


    public function grade(Request $request, $id)
    {
        $submission = Submission::with('assignment')->find($id);

        if (!$submission) {
            return response()->json([
                'message' => 'Submission not found'
            ], 404);
        }

        $request->validate([
            'grade' => 'required|numeric|min:0',
        ]);

        if ($request->grade > $submission->assignment->marks) {
            return response()->json([
                'message' => 'Grade cannot exceed assignment marks'
            ], 422);
        }

        $submission->update([
            'grade' => $request->grade,
            'status' => 'Graded',
        ]);

        return response()->json([
            'message' => 'Submission graded successfully',
            'submission' => $submission
        ]);
    }
}