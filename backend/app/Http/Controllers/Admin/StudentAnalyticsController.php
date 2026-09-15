<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\StudentPerformanceService;

class StudentAnalyticsController extends Controller
{
    public function show(
        $studentId,
        StudentPerformanceService $service
    ) {
        $student =
            Student::find(
                $studentId
            );


        if (!$student) {

            return response()->json([
                'message' =>
                    'Student not found'
            ], 404);
        }


        return response()->json(
            $service->build(
                $student->id
            )
        );
    }
}