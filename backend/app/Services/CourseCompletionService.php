<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\SectionItem;
use App\Models\SectionItemProgress;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CourseCompletionService
{
    public function evaluate(
        int $studentId,
        int $courseId
    ): array {
        return DB::transaction(
            function () use (
                $studentId,
                $courseId
            ) {

                $enrollment = Enrollment::where(
                    'student_id',
                    $studentId
                )
                    ->where(
                        'course_id',
                        $courseId
                    )
                    ->lockForUpdate()
                    ->first();


                if (!$enrollment) {
                    return [
                        'eligible' => false,
                        'completed' => false,
                        'reason' =>
                            'Enrollment not found',
                    ];
                }


                /*
                |--------------------------------------------------------------------------
                | Once completed, don't downgrade it.
                |--------------------------------------------------------------------------
                */

                if (
                    $enrollment->status ===
                    'Completed'
                ) {
                    $certificate =
                        Certificate::where(
                            'student_id',
                            $studentId
                        )
                            ->where(
                                'course_id',
                                $courseId
                            )
                            ->first();


                    return [
                        'eligible' => true,
                        'completed' => true,
                        'progress' => 100,
                        'certificate' =>
                            $certificate,
                    ];
                }


                // =====================================
                // Published Content
                // =====================================

                $publishedItemIds =
                    SectionItem::where(
                        'status',
                        'Published'
                    )
                        ->whereHas(
                            'section',
                            function ($query)
                            use ($courseId) {

                                $query
                                    ->where(
                                        'course_id',
                                        $courseId
                                    )
                                    ->where(
                                        'status',
                                        'Published'
                                    );
                            }
                        )
                        ->pluck('id');


                $totalItems =
                    $publishedItemIds->count();


                $completedItems =
                    $totalItems > 0
                        ? SectionItemProgress::where(
                            'student_id',
                            $studentId
                        )
                            ->where(
                                'status',
                                'completed'
                            )
                            ->whereIn(
                                'section_item_id',
                                $publishedItemIds
                            )
                            ->count()
                        : 0;


                $contentCompleted =
                    $totalItems === 0
                        ? true
                        : $completedItems
                            >= $totalItems;


                // =====================================
                // Required Assessments
                // =====================================

                $requiredAssessments =
                    Assessment::where(
                        'course_id',
                        $courseId
                    )
                        ->where(
                            'status',
                            'Published'
                        )
                        ->where(
                            'is_required',
                            true
                        )
                        ->get();


                $passedRequired = 0;


                foreach (
                    $requiredAssessments
                    as $assessment
                ) {
                    $passed =
                        AssessmentAttempt::where(
                            'assessment_id',
                            $assessment->id
                        )
                            ->where(
                                'student_id',
                                $studentId
                            )
                            ->where(
                                'passed',
                                true
                            )
                            ->where(
                                'status',
                                '!=',
                                'in_progress'
                            )
                            ->exists();


                    if ($passed) {
                        $passedRequired++;
                    }
                }


                $requiredAssessmentsCompleted =
                    $passedRequired ===
                    $requiredAssessments->count();


                /*
                |--------------------------------------------------------------------------
                | Prevent empty course auto-completion
                |--------------------------------------------------------------------------
                */

                $hasRequirements =
                    $totalItems > 0 ||
                    $requiredAssessments->isNotEmpty();


                $eligible =
                    $hasRequirements &&
                    $contentCompleted &&
                    $requiredAssessmentsCompleted;


                if (!$eligible) {
                    return [
                        'eligible' => false,

                        'completed' => false,

                        'content' => [
                            'completed' =>
                                $completedItems,

                            'total' =>
                                $totalItems,

                            'done' =>
                                $contentCompleted,
                        ],

                        'required_assessments' => [
                            'passed' =>
                                $passedRequired,

                            'total' =>
                                $requiredAssessments
                                    ->count(),

                            'done' =>
                                $requiredAssessmentsCompleted,
                        ],
                    ];
                }


                // =====================================
                // Complete Enrollment
                // =====================================

                $enrollment->update([
                    'status' =>
                        'Completed',

                    'progress' =>
                        100,

                    'completed_at' =>
                        now(),
                ]);


                // =====================================
                // Issue Certificate
                // =====================================

                $certificate =
                    Certificate::firstOrCreate(
                        [
                            'student_id' =>
                                $studentId,

                            'course_id' =>
                                $courseId,
                        ],
                        [
                            'enrollment_id' =>
                                $enrollment->id,

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
                        ]
                    );


                return [
                    'eligible' => true,

                    'completed' => true,

                    'progress' => 100,

                    'certificate' =>
                        $certificate,
                ];
            }
        );
    }


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