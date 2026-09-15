<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicStage extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function grades()
    {
        return $this->hasMany(Grade::class)
            ->orderBy('sort_order');
    }
}