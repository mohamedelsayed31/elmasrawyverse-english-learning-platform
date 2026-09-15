<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Academic Scope
            |--------------------------------------------------------------------------
            |
            | Question can belong to:
            | Grade only
            | Course
            | Section
            |
            | Section is optional because some questions
            | may be general revision questions.
            |
            */

            $table->foreignId('grade_id')
                ->nullable()
                ->constrained('grades')
                ->nullOnDelete();

            $table->foreignId('course_id')
                ->nullable()
                ->constrained('courses')
                ->nullOnDelete();

            $table->foreignId('course_section_id')
                ->nullable()
                ->constrained('course_sections')
                ->nullOnDelete();


            /*
            |--------------------------------------------------------------------------
            | Question Information
            |--------------------------------------------------------------------------
            */

            $table->text('question_text');

            $table->string('type');

            /*
            | Supported initially:
            |
            | mcq
            | true_false
            | fill_blank
            | short_answer
            */

            $table->string('skill')
                ->nullable();

            /*
            | Examples:
            |
            | Grammar
            | Vocabulary
            | Reading
            | Translation
            | Listening
            | Writing
            | Story
            */

            $table->string('topic')
                ->nullable();

            $table->string('difficulty')
                ->default('Medium');

            /*
            | Easy
            | Medium
            | Hard
            */

            $table->decimal(
                'points',
                6,
                2
            )->default(1);


            /*
            |--------------------------------------------------------------------------
            | Non-MCQ Correct Answer
            |--------------------------------------------------------------------------
            |
            | Used for:
            | true_false
            | fill_blank
            | short_answer
            |
            */

            $table->text('correct_answer')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Explanation
            |--------------------------------------------------------------------------
            |
            | Student can see this after submitting.
            |
            */

            $table->text('explanation')
                ->nullable();


            $table->string('status')
                ->default('Draft');

            /*
            | Draft
            | Published
            */


            $table->timestamps();


            $table->index([
                'grade_id',
                'course_id'
            ]);

            $table->index([
                'course_section_id',
                'skill'
            ]);

            $table->index([
                'type',
                'difficulty'
            ]);
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};