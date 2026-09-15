<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Student;
use App\Models\Submission;

class DashboardController extends Controller
{
    public function index()
    {
        $totalStudents = Student::count();
        $totalCourses = Course::count();
        $totalInstructors = Instructor::count();
        $totalAssignments = Assignment::count();
        $totalSubmissions = Submission::count();

        $gradedSubmissions = Submission::where('status', 'Graded')->count();

        $pendingSubmissions = Submission::where('status', 'Submitted')->count();

        $publishedCourses = Course::where('status', 'Published')->count();

        $recentStudents = Student::latest()
            ->take(5)
            ->get();

        $recentSubmissions = Submission::with([
            'student',
            'assignment.course'
        ])
        ->latest()
        ->take(5)
        ->get();

        return response()->json([
            'statistics' => [
                'students' => $totalStudents,
                'courses' => $totalCourses,
                'instructors' => $totalInstructors,
                'assignments' => $totalAssignments,
                'submissions' => $totalSubmissions,
                'graded_submissions' => $gradedSubmissions,
                'pending_submissions' => $pendingSubmissions,
                'published_courses' => $publishedCourses,
            ],

            'recent_students' => $recentStudents,

            'recent_submissions' => $recentSubmissions
        ]);
    }
}