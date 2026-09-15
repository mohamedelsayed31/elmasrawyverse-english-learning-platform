<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssessmentAttempt extends Model
{
    protected $fillable = [
        'assessment_id',
        'student_id',
        'attempt_number',
        'status',
        'started_at',
        'submitted_at',
        'expires_at',
        'score',
        'max_score',
        'percentage',
        'passed',
        'duration_seconds',
    ];


    protected $casts = [
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'expires_at' => 'datetime',

        'score' => 'decimal:2',
        'max_score' => 'decimal:2',
        'percentage' => 'decimal:2',

        'passed' => 'boolean',
    ];


    public function assessment()
    {
        return $this->belongsTo(
            Assessment::class
        );
    }


    public function student()
    {
        return $this->belongsTo(
            Student::class
        );
    }


    public function answers()
    {
        return $this->hasMany(
            AssessmentAnswer::class
        );
    }
}