<?php

namespace Database\Seeders;

use App\Models\AcademicStage;
use App\Models\Grade;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AcademicStructureSeeder extends Seeder
{
    public function run(): void
    {
        $structure = [
            'Primary' => [
                'Grade 3',
                'Grade 4',
                'Grade 5',
                'Grade 6',
            ],

            'Preparatory' => [
                'Grade 1',
                'Grade 2',
                'Grade 3',
            ],

            'Secondary' => [
                'Grade 1',
                'Grade 2',
                'Grade 3',
            ],
        ];

        $stageOrder = 1;

        foreach ($structure as $stageName => $grades) {

            $stage = AcademicStage::updateOrCreate(
                [
                    'slug' => Str::slug($stageName),
                ],
                [
                    'name' => $stageName,
                    'sort_order' => $stageOrder++,
                    'is_active' => true,
                ]
            );

            foreach ($grades as $index => $gradeName) {

                Grade::updateOrCreate(
                    [
                        'academic_stage_id' => $stage->id,
                        'slug' => Str::slug($gradeName),
                    ],
                    [
                        'name' => $gradeName,
                        'sort_order' => $index + 1,
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}