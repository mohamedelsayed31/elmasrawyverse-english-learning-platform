<?php

namespace App\Http\Controllers;

use App\Services\StudentPerformanceService;
use Illuminate\Http\Request;

class StudentAnalyticsController extends Controller
{
    public function index(
        Request $request,
        StudentPerformanceService $service
    ) {
        $student =
            $request->user()->student;


        if (!$student) {

            return response()->json([
                'message' =>
                    'Student profile not found'
            ], 404);
        }


        return response()->json(
            $service->build(
                $student->id
            )
        );
    }
}