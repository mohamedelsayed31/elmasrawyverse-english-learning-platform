<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseSection extends Model
{
    protected $fillable = [
        'course_id',
        'title',
        'description',
        'status',
        'sort_order',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function items()
    {
        return $this->hasMany(SectionItem::class)
            ->orderBy('sort_order');
    }

    public function questions()
    {
        return $this->hasMany(
            Question::class,
            'course_section_id'
        );
    }

    public function assessments()
    {
        return $this->hasMany(
            Assessment::class,
            'course_section_id'
        );
    }
}