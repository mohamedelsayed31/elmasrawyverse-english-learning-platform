<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = [
        'grade_id',
        'course_id',
        'course_section_id',
        'question_text',
        'type',
        'skill',
        'topic',
        'difficulty',
        'points',
        'correct_answer',
        'explanation',
        'status',
    ];


    protected $casts = [
        'points' => 'decimal:2',
    ];


    public function grade()
    {
        return $this->belongsTo(
            Grade::class
        );
    }


    public function course()
    {
        return $this->belongsTo(
            Course::class
        );
    }


    public function section()
    {
        return $this->belongsTo(
            CourseSection::class,
            'course_section_id'
        );
    }


    public function options()
    {
        return $this->hasMany(
            QuestionOption::class
        )
            ->orderBy('sort_order');
    }


    public function assessments()
    {
        return $this->belongsToMany(
            Assessment::class,
            'assessment_question'
        )
            ->withPivot([
                'sort_order',
                'points',
            ])
            ->withTimestamps();
    }
}