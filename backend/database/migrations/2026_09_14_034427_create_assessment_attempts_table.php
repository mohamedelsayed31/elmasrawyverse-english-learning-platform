<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_attempts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('assessment_id')
                ->constrained('assessments')
                ->cascadeOnDelete();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->unsignedInteger('attempt_number');

            $table->string('status')
                ->default('in_progress');

            $table->timestamp('started_at');

            $table->timestamp('submitted_at')
                ->nullable();

            $table->timestamp('expires_at')
                ->nullable();

            $table->decimal('score', 8, 2)
                ->nullable();

            $table->decimal('max_score', 8, 2)
                ->nullable();

            $table->decimal('percentage', 5, 2)
                ->nullable();

            $table->boolean('passed')
                ->nullable();

            $table->unsignedInteger('duration_seconds')
                ->nullable();

            $table->timestamps();


            // One numbered attempt per student per assessment
            $table->unique(
                [
                    'assessment_id',
                    'student_id',
                    'attempt_number'
                ],
                'aa_student_attempt_unique'
            );


            $table->index(
                [
                    'student_id',
                    'status'
                ],
                'aa_student_status_idx'
            );


            $table->index(
                [
                    'assessment_id',
                    'status'
                ],
                'aa_assessment_status_idx'
            );
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('assessment_attempts');
    }
};