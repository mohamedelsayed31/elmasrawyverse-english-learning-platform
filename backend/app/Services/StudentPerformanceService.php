<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentAttempt;
use App\Models\Enrollment;
use App\Models\SectionItem;
use App\Models\SectionItemProgress;
use App\Models\Student;

class StudentPerformanceService
{
    public function build(
        int $studentId
    ): array {

        $student = Student::with(
            'user'
        )->findOrFail(
            $studentId
        );


        // =====================================
        // Courses / Enrollments
        // =====================================

        $enrollments =
            Enrollment::with([
                'course.grade.academicStage',
                'course.instructor',
            ])
                ->where(
                    'student_id',
                    $studentId
                )
                ->whereIn(
                    'status',
                    [
                        'Enrolled',
                        'Completed'
                    ]
                )
                ->get();


        $courseAnalytics =
            $enrollments->map(
                function ($enrollment)
                use ($studentId) {

                    $course =
                        $enrollment->course;


                    // =========================
                    // Published Lessons
                    // =========================

                    $itemIds =
                        SectionItem::where(
                            'status',
                            'Published'
                        )
                            ->whereHas(
                                'section',
                                function ($query)
                                use ($course) {

                                    $query
                                        ->where(
                                            'course_id',
                                            $course->id
                                        )
                                        ->where(
                                            'status',
                                            'Published'
                                        );
                                }
                            )
                            ->pluck('id');


                    $totalItems =
                        $itemIds->count();


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
                                    $itemIds
                                )
                                ->count()
                            : 0;


                    // =========================
                    // Required Assessments
                    // =========================

                    $requiredIds =
                        Assessment::where(
                            'course_id',
                            $course->id
                        )
                            ->where(
                                'status',
                                'Published'
                            )
                            ->where(
                                'is_required',
                                true
                            )
                            ->pluck('id');


                    $requiredTotal =
                        $requiredIds->count();


                    $requiredPassed =
                        $requiredTotal > 0
                            ? AssessmentAttempt::where(
                                'student_id',
                                $studentId
                            )
                                ->whereIn(
                                    'assessment_id',
                                    $requiredIds
                                )
                                ->where(
                                    'passed',
                                    true
                                )
                                ->whereIn(
                                    'status',
                                    [
                                        'submitted',
                                        'expired'
                                    ]
                                )
                                ->distinct()
                                ->count(
                                    'assessment_id'
                                )
                            : 0;


                    // =========================
                    // Assessment Performance
                    // =========================

                    $attempts =
                        AssessmentAttempt::where(
                            'student_id',
                            $studentId
                        )
                            ->whereHas(
                                'assessment',
                                function ($query)
                                use ($course) {

                                    $query->where(
                                        'course_id',
                                        $course->id
                                    );
                                }
                            )
                            ->whereIn(
                                'status',
                                [
                                    'submitted',
                                    'expired'
                                ]
                            )
                            ->get();


                    $gradedAttempts =
                        $attempts->filter(
                            fn ($attempt) =>
                                $attempt
                                    ->percentage
                                !== null
                        );


                        $averageScore =
                        $gradedAttempts
                            ->isNotEmpty()
                            ? round(
                                (float) $gradedAttempts
                                    ->avg(
                                        'percentage'
                                    ),
                                2
                            )
                            : null;


                    return [
                        'course_id' =>
                            $course->id,

                        'course_title' =>
                            $course->title,

                        'stage' =>
                            $course
                                ->grade
                                ?->academicStage
                                ?->name,

                        'grade' =>
                            $course
                                ->grade
                                ?->name,

                        'instructor' =>
                            $course
                                ->instructor
                                ?->name,

                        'status' =>
                            $enrollment->status,

                        'progress' =>
                            (int)
                            $enrollment
                                ->progress,

                        'completed_at' =>
                            $enrollment
                                ->completed_at,

                        'lessons' => [
                            'completed' =>
                                $completedItems,

                            'total' =>
                                $totalItems,
                        ],

                        'required_assessments' => [
                            'passed' =>
                                $requiredPassed,

                            'total' =>
                                $requiredTotal,
                        ],

                        'assessment_average' =>
                            $averageScore,

                        'completion_ready' =>
                            (
                                (
                                    $totalItems === 0
                                    ||
                                    $completedItems
                                        >= $totalItems
                                )
                                &&
                                (
                                    $requiredTotal === 0
                                    ||
                                    $requiredPassed
                                        >= $requiredTotal
                                )
                            ),
                    ];
                }
            )
            ->values();


        // =====================================
        // All Finished Assessment Attempts
        // =====================================

        $attempts =
            AssessmentAttempt::with([
                'assessment.course'
            ])
                ->where(
                    'student_id',
                    $studentId
                )
                ->whereIn(
                    'status',
                    [
                        'submitted',
                        'expired'
                    ]
                )
                ->latest(
                    'submitted_at'
                )
                ->get();


        $gradedAttempts =
            $attempts->filter(
                fn ($attempt) =>
                    $attempt->percentage
                    !== null
            );


        $passableAttempts =
            $attempts->filter(
                fn ($attempt) =>
                    $attempt->passed
                    !== null
            );


        $passedAttempts =
            $passableAttempts->where(
                'passed',
                true
            );


        // =====================================
        // Weak Skills
        // =====================================

        /*
        |--------------------------------------------------------------------------
        | Accuracy is based on answers where:
        | is_correct is true / false.
        |
        | Manual partial answers where is_correct=null
        | are excluded from skill accuracy.
        |--------------------------------------------------------------------------
        */

        $answers =
            AssessmentAnswer::with([
                'question'
            ])
                ->whereHas(
                    'attempt',
                    function ($query)
                    use ($studentId) {

                        $query
                            ->where(
                                'student_id',
                                $studentId
                            )
                            ->whereIn(
                                'status',
                                [
                                    'submitted',
                                    'expired'
                                ]
                            );
                    }
                )
                ->whereNotNull(
                    'is_correct'
                )
                ->get();


        $skills = [];


        foreach ($answers as $answer) {

            $skill =
                trim(
                    $answer
                        ->question
                        ?->skill
                    ?? ''
                );


            if ($skill === '') {
                continue;
            }


            if (
                !isset(
                    $skills[$skill]
                )
            ) {

                $skills[$skill] = [
                    'skill' =>
                        $skill,

                    'total' =>
                        0,

                    'correct' =>
                        0,
                ];
            }


            $skills[$skill][
                'total'
            ]++;


            if (
                $answer->is_correct
                === true
            ) {

                $skills[$skill][
                    'correct'
                ]++;
            }
        }


        $skillAnalytics =
            collect($skills)
                ->map(
                    function ($item) {

                        $accuracy =
                            $item['total'] > 0
                                ? round(
                                    (
                                        $item[
                                            'correct'
                                        ]
                                        /
                                        $item[
                                            'total'
                                        ]
                                    ) * 100,
                                    2
                                )
                                : 0;


                        return [
                            ...$item,

                            'accuracy' =>
                                $accuracy,
                        ];
                    }
                )
                ->sortBy(
                    'accuracy'
                )
                ->values();


        $weakSkills =
            $skillAnalytics
                ->take(5)
                ->values();


        // =====================================
        // Performance Trend
        // =====================================

        $performanceTrend =
            $gradedAttempts
                ->sortBy(
                    'submitted_at'
                )
                ->take(-8)
                ->values()
                ->map(
                    function ($attempt) {

                        return [
                            'attempt_id' =>
                                $attempt->id,

                            'assessment' =>
                                $attempt
                                    ->assessment
                                    ?->title,

                            'course' =>
                                $attempt
                                    ->assessment
                                    ?->course
                                    ?->title,

                            'percentage' =>
                                (float)
                                $attempt
                                    ->percentage,

                            'passed' =>
                                $attempt
                                    ->passed,

                            'submitted_at' =>
                                $attempt
                                    ->submitted_at,
                        ];
                    }
                );


        // =====================================
        // Recent Lesson Activity
        // =====================================

        $lessonActivity =
            SectionItemProgress::with([
                'sectionItem.section.course'
            ])
                ->where(
                    'student_id',
                    $studentId
                )
                ->latest(
                    'updated_at'
                )
                ->limit(8)
                ->get()
                ->map(
                    function ($progress) {

                        return [
                            'type' =>
                                'lesson',

                            'title' =>
                                $progress
                                    ->sectionItem
                                    ?->title,

                            'course' =>
                                $progress
                                    ->sectionItem
                                    ?->section
                                    ?->course
                                    ?->title,

                            'status' =>
                                $progress->status,

                            'timestamp' =>
                                $progress
                                    ->updated_at,
                        ];
                    }
                );


        // =====================================
        // Recent Assessment Activity
        // =====================================

        $assessmentActivity =
            $attempts
                ->take(8)
                ->map(
                    function ($attempt) {

                        return [
                            'type' =>
                                'assessment',

                            'title' =>
                                $attempt
                                    ->assessment
                                    ?->title,

                            'course' =>
                                $attempt
                                    ->assessment
                                    ?->course
                                    ?->title,

                            'status' =>
                                $attempt
                                    ->passed === true
                                    ? 'passed'
                                    : (
                                        $attempt
                                            ->passed
                                        === false
                                            ? 'failed'
                                            : 'pending'
                                    ),

                            'percentage' =>
                                $attempt
                                    ->percentage,

                            'timestamp' =>
                                $attempt
                                    ->submitted_at,
                        ];
                    }
                );


        // =====================================
        // Merge Activity
        // =====================================

        $recentActivity =
            $lessonActivity
                ->concat(
                    $assessmentActivity
                )
                ->sortByDesc(
                    function ($item) {

                        return $item[
                            'timestamp'
                        ] ?? null;
                    }
                )
                ->take(10)
                ->values();


        // =====================================
        // Overall Summary
        // =====================================

        $totalLessons =
            $courseAnalytics
                ->sum(
                    fn ($course) =>
                        $course[
                            'lessons'
                        ][
                            'total'
                        ]
                );


        $completedLessons =
            $courseAnalytics
                ->sum(
                    fn ($course) =>
                        $course[
                            'lessons'
                        ][
                            'completed'
                        ]
                );


                $averageCourseProgress =
                $courseAnalytics
                    ->isNotEmpty()
                    ? round(
                        (float) $courseAnalytics
                            ->avg(
                                'progress'
                            ),
                        2
                    )
                    : 0;


                    $averageAssessmentScore =
                    $gradedAttempts
                        ->isNotEmpty()
                        ? round(
                            (float) $gradedAttempts
                                ->avg(
                                    'percentage'
                                ),
                            2
                        )
                        : 0;


        $passRate =
            $passableAttempts
                ->isNotEmpty()
                ? round(
                    (
                        $passedAttempts
                            ->count()
                        /
                        $passableAttempts
                            ->count()
                    ) * 100,
                    2
                )
                : 0;


        return [
            'student' => [
                'id' =>
                    $student->id,

                'name' =>
                    $student->name,

                'email' =>
                    $student->email,

                'status' =>
                    $student->status,
            ],

            'summary' => [
                'courses' =>
                    $courseAnalytics
                        ->count(),

                'completed_courses' =>
                    $enrollments
                        ->where(
                            'status',
                            'Completed'
                        )
                        ->count(),

                'average_course_progress' =>
                    $averageCourseProgress,

                'lessons_completed' =>
                    $completedLessons,

                'lessons_total' =>
                    $totalLessons,

                'assessments_taken' =>
                    $attempts->count(),

                'average_assessment_score' =>
                    $averageAssessmentScore,

                'pass_rate' =>
                    $passRate,
            ],

            'courses' =>
                $courseAnalytics,

            'weak_skills' =>
                $weakSkills,

            'skill_performance' =>
                $skillAnalytics,

            'performance_trend' =>
                $performanceTrend,

            'recent_activity' =>
                $recentActivity,
        ];
    }
}