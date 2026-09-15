<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $fillable = [
        'academic_stage_id',
        'name',
        'slug',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function academicStage()
    {
        return $this->belongsTo(AcademicStage::class);
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }
}