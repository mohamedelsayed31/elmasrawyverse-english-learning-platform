<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->foreignId('course_section_id')
                ->nullable()
                ->constrained('course_sections')
                ->cascadeOnDelete();


            $table->string('title');

            $table->text('description')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Assessment Type
            |--------------------------------------------------------------------------
            |
            | practice
            | quiz
            | homework
            | exam
            |
            */

            $table->string('type');


            /*
            |--------------------------------------------------------------------------
            | Exam Settings
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('duration_minutes')
                ->nullable();

            $table->decimal(
                'passing_score',
                5,
                2
            )->nullable();

            /*
            | Example:
            | 70 = student needs 70%
            */


            $table->unsignedInteger('max_attempts')
                ->nullable();

            /*
            | null = unlimited
            */


            $table->boolean('shuffle_questions')
                ->default(false);

            $table->boolean('show_answers_after_submit')
                ->default(true);


            $table->string('status')
                ->default('Draft');

            $table->timestamp('published_at')
                ->nullable();


            $table->timestamps();


            $table->index([
                'course_id',
                'type'
            ]);

            $table->index([
                'course_section_id',
                'status'
            ]);
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};