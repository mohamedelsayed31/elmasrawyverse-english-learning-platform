<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SectionItem extends Model
{
    protected $fillable = [
        'course_section_id',
        'title',
        'type',
        'description',
        'content',
        'resource_url',
        'file_path',
        'sort_order',
        'status',
        'is_preview',
        'published_at',
    ];

    protected $casts = [
        'is_preview' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected $appends = [
        'file_url',
    ];


    public function section()
    {
        return $this->belongsTo(
            CourseSection::class,
            'course_section_id'
        );
    }


    public function getFileUrlAttribute()
    {
        if (!$this->file_path) {
            return null;
        }
    
        return asset('storage/' . $this->file_path);
    }

    public function progressRecords()
    {
        return $this->hasMany(
            SectionItemProgress::class
        );
    }
}