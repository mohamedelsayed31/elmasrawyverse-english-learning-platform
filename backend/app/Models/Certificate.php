<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    protected $fillable = [
        'student_id',
        'course_id',
        'enrollment_id',
        'certificate_number',
        'verification_code',
        'issued_at',
        'status',
        'revoked_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(
            Student::class
        );
    }

    public function course()
    {
        return $this->belongsTo(
            Course::class
        );
    }

    public function enrollment()
    {
        return $this->belongsTo(
            Enrollment::class
        );
    }
}