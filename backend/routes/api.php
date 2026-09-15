<?php

use App\Http\Controllers\AcademicStructureController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseSectionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\InstructorController;
use App\Http\Controllers\PublicCourseController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentPortalController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\SectionItemController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\StudentAssessmentController;
use App\Http\Controllers\AssessmentResultController;
use App\Http\Controllers\StudentProgressController;
use App\Http\Controllers\StudentCertificateController;
use App\Http\Controllers\PublicCertificateController;
use App\Http\Controllers\Admin\CertificateController as AdminCertificateController;
use App\Http\Controllers\StudentAnalyticsController;

use App\Http\Controllers\Admin\StudentAnalyticsController as AdminStudentAnalyticsController;
use Illuminate\Support\Facades\Route;


// =====================================
// Public Routes
// =====================================

// Authentication

Route::post('/register', [
    AuthController::class,
    'register'
])->middleware('throttle:5,1');


Route::post('/login', [
    AuthController::class,
    'login'
])->middleware('throttle:10,1');


// =====================================
// Public Courses
// =====================================

Route::get('/public/courses', [
    PublicCourseController::class,
    'index'
]);

Route::get('/public/courses/{id}', [
    PublicCourseController::class,
    'show'
]);

Route::get(
    '/public/certificates/verify/{verificationCode}',
    [
        PublicCertificateController::class,
        'verify'
    ]
);

// =====================================
// Public Academic Structure
// =====================================

Route::get('/public/academic-structure', [
    AcademicStructureController::class,
    'index'
]);


// =====================================
// Authenticated Routes
// =====================================

Route::middleware('auth:sanctum')->group(function () {

    // =====================================
    // Authentication
    // =====================================

    Route::get('/me', [
        AuthController::class,
        'me'
    ]);

    Route::post('/logout', [
        AuthController::class,
        'logout'
    ]);


    // =====================================
    // Student Routes
    // =====================================

    Route::middleware('student')->group(function () {

        // My Courses

        Route::get('/my/courses', [
            StudentPortalController::class,
            'courses'
        ]);


        // My Assignments

        Route::get('/my/assignments', [
            StudentPortalController::class,
            'assignments'
        ]);


        // My Submissions

        Route::get('/my/submissions', [
            StudentPortalController::class,
            'submissions'
        ]);


        // Submit Assignment

        Route::post('/assignments/{id}/submit', [
            SubmissionController::class,
            'store'
        ]);

        // =====================================
        // Student Assessments
        // =====================================

        Route::get('/my/assessments', [
            StudentAssessmentController::class,
            'index'
        ]);


        Route::post('/my/assessments/{assessmentId}/start', [
            StudentAssessmentController::class,
            'start'
        ]);


        Route::get('/my/assessment-attempts/{attemptId}', [
            StudentAssessmentController::class,
            'showAttempt'
        ]);


        Route::put(
            '/my/assessment-attempts/{attemptId}/answers/{questionId}',
            [
                StudentAssessmentController::class,
                'saveAnswer'
            ]
        );


        Route::post(
            '/my/assessment-attempts/{attemptId}/submit',
            [
                StudentAssessmentController::class,
                'submit'
            ]
        );


        Route::get(
            '/my/assessment-attempts/{attemptId}/result',
            [
                StudentAssessmentController::class,
                'result'
            ]
        );


        Route::get(
            '/my/assessments/{assessmentId}/history',
            [
                StudentAssessmentController::class,
                'history'
            ]
        );

        Route::get(
            '/my/courses/{courseId}/content',
            [
                StudentPortalController::class,
                'courseContent'
            ]
        );

        Route::post(
            '/my/course-items/{itemId}/open',
            [
                StudentProgressController::class,
                'open'
            ]
        );
        
        
        Route::put(
            '/my/course-items/{itemId}/position',
            [
                StudentProgressController::class,
                'position'
            ]
        );
        
        
        Route::put(
            '/my/course-items/{itemId}/complete',
            [
                StudentProgressController::class,
                'complete'
            ]
        );
        
        
        Route::put(
            '/my/course-items/{itemId}/uncomplete',
            [
                StudentProgressController::class,
                'uncomplete'
            ]
        );


        Route::get(
            '/my/continue-learning',
            [
                StudentPortalController::class,
                'continueLearning'
            ]
        );

        Route::get(
            '/my/certificates',
            [
                StudentCertificateController::class,
                'index'
            ]
        );
        
        Route::get(
            '/my/certificates/{id}',
            [
                StudentCertificateController::class,
                'show'
            ]
        );

        Route::get(
            '/my/analytics',
            [
                StudentAnalyticsController::class,
                'index'
            ]
        );

    });


    // =====================================
    // Admin Routes
    // =====================================

    Route::middleware('admin')->group(function () {


        // =====================================
        // Dashboard
        // =====================================

        Route::get('/dashboard', [
            DashboardController::class,
            'index'
        ]);


        // =====================================
        // Students
        // =====================================

        Route::get('/students', [
            StudentController::class,
            'index'
        ]);

        Route::post('/students', [
            StudentController::class,
            'store'
        ]);

        Route::get('/students/{id}', [
            StudentController::class,
            'show'
        ]);

        Route::put('/students/{id}', [
            StudentController::class,
            'update'
        ]);

        Route::delete('/students/{id}', [
            StudentController::class,
            'destroy'
        ]);


        // =====================================
        // Instructors
        // =====================================

        Route::get('/instructors', [
            InstructorController::class,
            'index'
        ]);

        Route::post('/instructors', [
            InstructorController::class,
            'store'
        ]);

        Route::get('/instructors/{id}', [
            InstructorController::class,
            'show'
        ]);

        Route::put('/instructors/{id}', [
            InstructorController::class,
            'update'
        ]);

        Route::delete('/instructors/{id}', [
            InstructorController::class,
            'destroy'
        ]);


        // =====================================
        // Courses
        // =====================================

        Route::get('/courses', [
            CourseController::class,
            'index'
        ]);

        Route::post('/courses', [
            CourseController::class,
            'store'
        ]);

        Route::get('/courses/{id}', [
            CourseController::class,
            'show'
        ]);

        Route::put('/courses/{id}', [
            CourseController::class,
            'update'
        ]);

        Route::delete('/courses/{id}', [
            CourseController::class,
            'destroy'
        ]);


        // =====================================
        // Course Sections
        // Dynamic:
        // Unit / Chapter / Revision / Story / etc.
        // =====================================

        Route::get('/courses/{courseId}/sections', [
            CourseSectionController::class,
            'index'
        ]);

        Route::post('/courses/{courseId}/sections', [
            CourseSectionController::class,
            'store'
        ]);

        Route::get('/courses/{courseId}/sections/{sectionId}', [
            CourseSectionController::class,
            'show'
        ]);

        Route::put('/courses/{courseId}/sections/{sectionId}', [
            CourseSectionController::class,
            'update'
        ]);

        Route::delete('/courses/{courseId}/sections/{sectionId}', [
            CourseSectionController::class,
            'destroy'
        ]);


        // =====================================
        // Section Content Items
        // =====================================

        Route::get(
            '/courses/{courseId}/sections/{sectionId}/items',
            [
                SectionItemController::class,
                'index'
            ]
        );

        Route::post(
            '/courses/{courseId}/sections/{sectionId}/items',
            [
                SectionItemController::class,
                'store'
            ]
        );

        Route::get(
            '/courses/{courseId}/sections/{sectionId}/items/{itemId}',
            [
                SectionItemController::class,
                'show'
            ]
        );

        Route::put(
            '/courses/{courseId}/sections/{sectionId}/items/{itemId}',
            [
                SectionItemController::class,
                'update'
            ]
        );

        // =====================================
        // Question Bank
        // =====================================

        Route::get('/questions', [
            QuestionController::class,
            'index'
        ]);

        Route::post('/questions', [
            QuestionController::class,
            'store'
        ]);

        Route::get('/questions/{id}', [
            QuestionController::class,
            'show'
        ]);

        Route::put('/questions/{id}', [
            QuestionController::class,
            'update'
        ]);

        Route::delete('/questions/{id}', [
            QuestionController::class,
            'destroy'
        ]);

        /*
        |--------------------------------------------------------------------------
        | Multipart Update
        |--------------------------------------------------------------------------
        |
        | Use this POST endpoint when updating
        | PDF / Audio with FormData.
        |
        */

        Route::post(
            '/courses/{courseId}/sections/{sectionId}/items/{itemId}',
            [
                SectionItemController::class,
                'update'
            ]
        );

        Route::delete(
            '/courses/{courseId}/sections/{sectionId}/items/{itemId}',
            [
                SectionItemController::class,
                'destroy'
            ]
        );

        // =====================================
        // Enrollments
        // =====================================

        Route::get('/enrollments', [
            EnrollmentController::class,
            'index'
        ]);

        Route::post('/enrollments', [
            EnrollmentController::class,
            'store'
        ]);

        Route::get('/enrollments/{id}', [
            EnrollmentController::class,
            'show'
        ]);

        Route::put('/enrollments/{id}', [
            EnrollmentController::class,
            'update'
        ]);

        Route::delete('/enrollments/{id}', [
            EnrollmentController::class,
            'destroy'
        ]);


        // =====================================
        // Assignments
        // =====================================

        Route::get('/assignments', [
            AssignmentController::class,
            'index'
        ]);

        Route::post('/assignments', [
            AssignmentController::class,
            'store'
        ]);

        Route::get('/assignments/{id}', [
            AssignmentController::class,
            'show'
        ]);

        Route::put('/assignments/{id}', [
            AssignmentController::class,
            'update'
        ]);

        Route::delete('/assignments/{id}', [
            AssignmentController::class,
            'destroy'
        ]);


        // =====================================
        // Submissions
        // =====================================

        Route::get('/submissions', [
            SubmissionController::class,
            'index'
        ]);

        Route::get('/submissions/{id}', [
            SubmissionController::class,
            'show'
        ]);

        Route::put('/submissions/{id}/grade', [
            SubmissionController::class,
            'grade'
        ]);


        // =====================================
        // Assessments
        // =====================================

        Route::get('/assessments', [
            AssessmentController::class,
            'index'
        ]);

        Route::post('/assessments', [
            AssessmentController::class,
            'store'
        ]);

        Route::get('/assessments/{id}', [
            AssessmentController::class,
            'show'
        ]);

        Route::put('/assessments/{id}', [
            AssessmentController::class,
            'update'
        ]);

        Route::put('/assessments/{id}/questions', [
            AssessmentController::class,
            'syncQuestions'
        ]);

        Route::get(
            '/assessments/{id}/available-questions',
            [
                AssessmentController::class,
                'availableQuestions'
            ]
        );

        Route::delete('/assessments/{id}', [
            AssessmentController::class,
            'destroy'
        ]);

        // =====================================
        // Assessment Results / Manual Grading
        // =====================================

        Route::get('/assessment-attempts', [
            AssessmentResultController::class,
            'index'
        ]);


        Route::get('/assessment-attempts/{id}', [
            AssessmentResultController::class,
            'show'
        ]);


        Route::put(
            '/assessment-attempts/{attemptId}/answers/{answerId}/grade',
            [
                AssessmentResultController::class,
                'gradeAnswer'
            ]
        );

        Route::get(
            '/admin/certificates/analytics',
            [
                AdminCertificateController::class,
                'analytics'
            ]
        );
        
        Route::get(
            '/admin/certificates',
            [
                AdminCertificateController::class,
                'index'
            ]
        );
        
        Route::get(
            '/admin/certificates/{id}',
            [
                AdminCertificateController::class,
                'show'
            ]
        );
        
        Route::put(
            '/admin/certificates/{id}/revoke',
            [
                AdminCertificateController::class,
                'revoke'
            ]
        );
        
        Route::put(
            '/admin/certificates/{id}/reissue',
            [
                AdminCertificateController::class,
                'reissue'
            ]
        );

        Route::get(
            '/admin/students/{studentId}/analytics',
            [
                AdminStudentAnalyticsController::class,
                'show'
            ]
        );




        
    });

});