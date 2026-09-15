<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'status',
        'progress',
    ];


    protected $casts = [
        'progress' => 'integer',
    ];


    // =====================================
    // User
    // =====================================

    public function user()
    {
        return $this->belongsTo(
            User::class
        );
    }


    // =====================================
    // Enrollments
    // =====================================

    public function enrollments()
    {
        return $this->hasMany(
            Enrollment::class
        );
    }


    // =====================================
    // Courses
    // =====================================

    public function courses()
    {
        return $this->belongsToMany(
            Course::class,
            'enrollments'
        )
            ->withPivot([
                'status',
                'progress',
                'completed_at',
            ])
            ->withTimestamps();
    }


    // =====================================
    // Assignment Submissions
    // =====================================

    public function submissions()
    {
        return $this->hasMany(
            Submission::class
        );
    }


    // =====================================
    // Assessment Attempts
    // =====================================

    public function assessmentAttempts()
    {
        return $this->hasMany(
            AssessmentAttempt::class
        );
    }


    // =====================================
    // Learning Progress
    // =====================================

    public function sectionItemProgress()
    {
        return $this->hasMany(
            SectionItemProgress::class
        );
    }


    // =====================================
    // Certificates
    // =====================================

    public function certificates()
    {
        return $this->hasMany(
            Certificate::class
        );
    }
}