<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssessmentAnswer extends Model
{
    protected $fillable = [
        'assessment_attempt_id',
        'question_id',
        'selected_option_id',
        'answer_text',
        'is_correct',
        'awarded_points',
        'requires_manual_grading',
        'teacher_feedback',
    ];


    protected $casts = [
        'is_correct' => 'boolean',

        'requires_manual_grading' =>
            'boolean',

        'awarded_points' =>
            'decimal:2',
    ];


    public function attempt()
    {
        return $this->belongsTo(
            AssessmentAttempt::class,
            'assessment_attempt_id'
        );
    }


    public function question()
    {
        return $this->belongsTo(
            Question::class
        );
    }


    public function selectedOption()
    {
        return $this->belongsTo(
            QuestionOption::class,
            'selected_option_id'
        );
    }
}