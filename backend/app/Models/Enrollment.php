<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $fillable = [
        'student_id',
        'course_id',
        'status',
        'progress',
        'completed_at',
    ];


    protected $casts = [
        'progress' => 'integer',
        'completed_at' => 'datetime',
    ];


    // =====================================
    // Student
    // =====================================

    public function student()
    {
        return $this->belongsTo(
            Student::class
        );
    }


    // =====================================
    // Course
    // =====================================

    public function course()
    {
        return $this->belongsTo(
            Course::class
        );
    }


    // =====================================
    // Certificate
    // =====================================

    public function certificate()
    {
        return $this->hasOne(
            Certificate::class
        );
    }
}