<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = [
        'title',
        'instructor_id',
        'grade_id',
        'category',
        'status',
        'lessons',
        'price',
        'enrolled',
    ];


    protected $casts = [
        'lessons' => 'integer',
        'enrolled' => 'integer',
        'price' => 'decimal:2',
    ];


    // =====================================
    // Instructor
    // =====================================

    public function instructor()
    {
        return $this->belongsTo(
            Instructor::class
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
    // Students
    // =====================================

    public function students()
    {
        return $this->belongsToMany(
            Student::class,
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
    // Assignments
    // =====================================

    public function assignments()
    {
        return $this->hasMany(
            Assignment::class
        );
    }


    // =====================================
    // Grade
    // =====================================

    public function grade()
    {
        return $this->belongsTo(
            Grade::class
        );
    }


    // =====================================
    // Course Sections
    // =====================================

    public function sections()
    {
        return $this->hasMany(
            CourseSection::class
        )
            ->orderBy(
                'sort_order'
            );
    }


    // =====================================
    // Question Bank
    // =====================================

    public function questions()
    {
        return $this->hasMany(
            Question::class
        );
    }


    // =====================================
    // Assessments
    // =====================================

    public function assessments()
    {
        return $this->hasMany(
            Assessment::class
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