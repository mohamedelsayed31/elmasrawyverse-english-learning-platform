<?php

namespace App\Http\Controllers;

use App\Models\Certificate;

class PublicCertificateController extends Controller
{
    public function verify(
        $verificationCode
    ) {
        $certificate =
            Certificate::with([
                'student',
                'course.instructor',
                'course.grade.academicStage',
            ])
                ->where(
                    'verification_code',
                    $verificationCode
                )
                ->first();


        if (
            !$certificate ||
            $certificate->status !==
            'Active'
        ) {
            return response()->json([
                'valid' => false,

                'message' =>
                    'Certificate not found or no longer valid.'
            ], 404);
        }


        return response()->json([
            'valid' => true,

            'certificate' => [
                'certificate_number' =>
                    $certificate
                        ->certificate_number,

                'student_name' =>
                    $certificate
                        ->student
                        ?->name,

                'course_title' =>
                    $certificate
                        ->course
                        ?->title,

                'issued_at' =>
                    $certificate
                        ->issued_at,

                'status' =>
                    $certificate
                        ->status,
            ]
        ]);
    }
}