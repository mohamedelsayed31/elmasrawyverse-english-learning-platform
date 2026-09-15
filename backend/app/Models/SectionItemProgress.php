<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SectionItemProgress extends Model
{
    protected $table =
        'section_item_progress';


    protected $fillable = [
        'student_id',
        'section_item_id',
        'status',
        'opened_at',
        'completed_at',
        'last_position_seconds',
    ];


    protected $casts = [
        'opened_at' => 'datetime',
        'completed_at' => 'datetime',
        'last_position_seconds' => 'integer',
    ];


    public function student()
    {
        return $this->belongsTo(
            Student::class
        );
    }


    public function sectionItem()
    {
        return $this->belongsTo(
            SectionItem::class
        );
    }
}