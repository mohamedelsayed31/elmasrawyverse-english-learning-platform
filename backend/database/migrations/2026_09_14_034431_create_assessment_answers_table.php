<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_answers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('assessment_attempt_id')
                ->constrained('assessment_attempts')
                ->cascadeOnDelete();

            $table->foreignId('question_id')
                ->constrained('questions')
                ->cascadeOnDelete();

            $table->foreignId('selected_option_id')
                ->nullable()
                ->constrained('question_options')
                ->nullOnDelete();

            $table->text('answer_text')
                ->nullable();

            $table->boolean('is_correct')
                ->nullable();

            $table->decimal('awarded_points', 8, 2)
                ->nullable();

            $table->boolean('requires_manual_grading')
                ->default(false);

            $table->text('teacher_feedback')
                ->nullable();

            $table->timestamps();


            $table->unique(
                [
                    'assessment_attempt_id',
                    'question_id'
                ],
                'ans_attempt_question_unique'
            );


            $table->index(
                [
                    'assessment_attempt_id',
                    'is_correct'
                ],
                'ans_attempt_correct_idx'
            );
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('assessment_answers');
    }
};