<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->foreignId('enrollment_id')
                ->constrained('enrollments')
                ->cascadeOnDelete();

            $table->string('certificate_number')
                ->unique();

            $table->string('verification_code')
                ->unique();

            $table->timestamp('issued_at');

            $table->string('status')
                ->default('Active');

            $table->timestamp('revoked_at')
                ->nullable();

            $table->timestamps();

            $table->unique(
                [
                    'student_id',
                    'course_id'
                ],
                'cert_student_course_unique'
            );

            $table->index(
                [
                    'course_id',
                    'status'
                ],
                'cert_course_status_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};