<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CertificateController extends Controller
{
    // =====================================
    // List Certificates
    // =====================================

    public function index(Request $request)
    {
        $query = Certificate::with([
            'student',
            'course.instructor',
            'course.grade.academicStage',
            'enrollment',
        ]);


        // =====================================
        // Search
        // =====================================

        if ($request->filled('search')) {

            $search =
                trim(
                    $request->search
                );


            $query->where(
                function ($q) use ($search) {

                    $q->where(
                        'certificate_number',
                        'like',
                        "%{$search}%"
                    )
                        ->orWhere(
                            'verification_code',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhereHas(
                            'student',
                            function ($studentQuery)
                            use ($search) {

                                $studentQuery
                                    ->where(
                                        'name',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'email',
                                        'like',
                                        "%{$search}%"
                                    );
                            }
                        )
                        ->orWhereHas(
                            'course',
                            function ($courseQuery)
                            use ($search) {

                                $courseQuery->where(
                                    'title',
                                    'like',
                                    "%{$search}%"
                                );
                            }
                        );
                }
            );
        }


        // =====================================
        // Status Filter
        // =====================================

        if ($request->filled('status')) {

            $query->where(
                'status',
                $request->status
            );
        }


        // =====================================
        // Course Filter
        // =====================================

        if ($request->filled('course_id')) {

            $query->where(
                'course_id',
                $request->course_id
            );
        }


        // =====================================
        // Student Filter
        // =====================================

        if ($request->filled('student_id')) {

            $query->where(
                'student_id',
                $request->student_id
            );
        }


        $certificates =
            $query
                ->latest('issued_at')
                ->paginate(20);


        return response()->json(
            $certificates
        );
    }


    // =====================================
    // Show Certificate
    // =====================================

    public function show($id)
    {
        $certificate =
            Certificate::with([
                'student.user',
                'course.instructor',
                'course.grade.academicStage',
                'enrollment',
            ])
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


    // =====================================
    // Analytics
    // =====================================

    public function analytics()
    {
        $total =
            Certificate::count();


        $active =
            Certificate::where(
                'status',
                'Active'
            )
                ->count();


        $revoked =
            Certificate::where(
                'status',
                'Revoked'
            )
                ->count();


        $issuedThisMonth =
            Certificate::whereYear(
                'issued_at',
                now()->year
            )
                ->whereMonth(
                    'issued_at',
                    now()->month
                )
                ->count();


        $issuedThisYear =
            Certificate::whereYear(
                'issued_at',
                now()->year
            )
                ->count();


        $recent =
            Certificate::with([
                'student',
                'course',
            ])
                ->latest(
                    'issued_at'
                )
                ->limit(5)
                ->get();


        return response()->json([
            'analytics' => [
                'total' =>
                    $total,

                'active' =>
                    $active,

                'revoked' =>
                    $revoked,

                'issued_this_month' =>
                    $issuedThisMonth,

                'issued_this_year' =>
                    $issuedThisYear,
            ],

            'recent' =>
                $recent,
        ]);
    }


    // =====================================
    // Revoke Certificate
    // =====================================

    public function revoke(
        Request $request,
        $id
    ) {
        $certificate =
            Certificate::find($id);


        if (!$certificate) {

            return response()->json([
                'message' =>
                    'Certificate not found'
            ], 404);
        }


        if (
            $certificate->status ===
            'Revoked'
        ) {

            return response()->json([
                'message' =>
                    'Certificate is already revoked.'
            ], 409);
        }


        $certificate->update([
            'status' =>
                'Revoked',

            'revoked_at' =>
                now(),
        ]);


        return response()->json([
            'message' =>
                'Certificate revoked successfully.',

            'certificate' =>
                $certificate->fresh(),
        ]);
    }


    // =====================================
    // Reissue Certificate
    // =====================================

    public function reissue(
        Request $request,
        $id
    ) {
        $certificate =
            Certificate::with([
                'enrollment'
            ])
                ->find($id);


        if (!$certificate) {

            return response()->json([
                'message' =>
                    'Certificate not found'
            ], 404);
        }


        if (
            !$certificate->enrollment
            ||
            $certificate
                ->enrollment
                ->status !==
                'Completed'
        ) {

            throw ValidationException::withMessages([
                'certificate' => [
                    'The course enrollment must be completed before reissuing this certificate.'
                ]
            ]);
        }


        $certificate->update([
            'certificate_number' =>
                $this
                    ->generateCertificateNumber(),

            'verification_code' =>
                $this
                    ->generateVerificationCode(),

            'issued_at' =>
                now(),

            'status' =>
                'Active',

            'revoked_at' =>
                null,
        ]);


        return response()->json([
            'message' =>
                'Certificate reissued successfully.',

            'certificate' =>
                $certificate->fresh([
                    'student',
                    'course'
                ]),
        ]);
    }


    // =====================================
    // Generate Certificate Number
    // =====================================

    private function generateCertificateNumber(): string
    {
        do {

            $number =
                'EV-' .
                now()->format('Y') .
                '-' .
                strtoupper(
                    Str::random(10)
                );

        } while (
            Certificate::where(
                'certificate_number',
                $number
            )->exists()
        );


        return $number;
    }


    // =====================================
    // Generate Verification Code
    // =====================================

    private function generateVerificationCode(): string
    {
        do {

            $code =
                strtoupper(
                    Str::random(24)
                );

        } while (
            Certificate::where(
                'verification_code',
                $code
            )->exists()
        );


        return $code;
    }
}