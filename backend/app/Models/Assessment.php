<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assessment extends Model
{
    protected $fillable = [
        'course_id',
        'course_section_id',
        'title',
        'description',
        'type',
        'duration_minutes',
        'passing_score',
        'max_attempts',
        'shuffle_questions',
        'show_answers_after_submit',

        // Required for course completion
        'is_required',

        'status',
        'published_at',
    ];


    protected $casts = [
        'duration_minutes' => 'integer',

        'passing_score' => 'decimal:2',

        'max_attempts' => 'integer',

        'shuffle_questions' =>
            'boolean',

        'show_answers_after_submit' =>
            'boolean',

        'is_required' =>
            'boolean',

        'published_at' =>
            'datetime',
    ];


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
    // Course Section
    // =====================================

    public function section()
    {
        return $this->belongsTo(
            CourseSection::class,
            'course_section_id'
        );
    }


    // =====================================
    // Questions
    // =====================================

    public function questions()
    {
        return $this->belongsToMany(
            Question::class,
            'assessment_question'
        )
            ->withPivot([
                'sort_order',
                'points',
            ])
            ->withTimestamps()
            ->orderByPivot(
                'sort_order'
            );
    }


    // =====================================
    // Student Attempts
    // =====================================

    public function attempts()
    {
        return $this->hasMany(
            AssessmentAttempt::class
        );
    }
}