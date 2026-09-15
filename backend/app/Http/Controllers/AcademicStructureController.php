<?php

namespace App\Http\Controllers;

use App\Models\AcademicStage;

class AcademicStructureController extends Controller
{
    public function index()
    {
        $stages = AcademicStage::query()
            ->where('is_active', true)
            ->with([
                'grades' => function ($query) {
                    $query
                        ->where('is_active', true)
                        ->orderBy('sort_order');
                }
            ])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'stages' => $stages
        ]);
    }
}