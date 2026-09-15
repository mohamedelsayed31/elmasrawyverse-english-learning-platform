<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'assessment_question',
            function (Blueprint $table) {

                $table->id();

                $table->foreignId(
                    'assessment_id'
                )
                    ->constrained(
                        'assessments'
                    )
                    ->cascadeOnDelete();


                $table->foreignId(
                    'question_id'
                )
                    ->constrained(
                        'questions'
                    )
                    ->cascadeOnDelete();


                $table->unsignedInteger(
                    'sort_order'
                )->default(0);


                /*
                |--------------------------------------------------------------------------
                | Optional points override
                |--------------------------------------------------------------------------
                |
                | Question may normally be worth 1 point,
                | but inside a specific exam it could be 2.
                |
                */

                $table->decimal(
                    'points',
                    6,
                    2
                )->nullable();


                $table->timestamps();


                $table->unique([
                    'assessment_id',
                    'question_id'
                ]);


                $table->index([
                    'assessment_id',
                    'sort_order'
                ]);
            }
        );
    }


    public function down(): void
    {
        Schema::dropIfExists(
            'assessment_question'
        );
    }
};