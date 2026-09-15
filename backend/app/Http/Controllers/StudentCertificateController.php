<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Illuminate\Http\Request;

class StudentCertificateController extends Controller
{
    public function index(Request $request)
    {
        $student =
            $request->user()->student;


        if (!$student) {
            return response()->json([
                'message' =>
                    'Student profile not found'
            ], 404);
        }


        $certificates =
            Certificate::with([
                'course.instructor',
                'course.grade.academicStage',
            ])
                ->where(
                    'student_id',
                    $student->id
                )
                ->where(
                    'status',
                    'Active'
                )
                ->latest('issued_at')
                ->get();


        return response()->json([
            'certificates' =>
                $certificates
        ]);
    }


    public function show(
        Request $request,
        $id
    ) {
        $student =
            $request->user()->student;


        $certificate =
            Certificate::with([
                'student',
                'course.instructor',
                'course.grade.academicStage',
                'enrollment',
            ])
                ->where(
                    'student_id',
                    $student->id
                )
                ->find($id);


        if (!$certificate) {
            return response()->json([
                'message' =>
                    'Certificate not found'
            ], 404);
        }


        return response()->json([
            'certificate' =>
                $certificate
        ]);
    }
}