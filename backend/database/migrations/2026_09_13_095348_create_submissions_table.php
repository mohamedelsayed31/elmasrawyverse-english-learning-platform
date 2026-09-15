<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('assignment_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('student_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('file')
                ->nullable();

            $table->timestamp('submitted_at')
                ->nullable();

            $table->decimal('grade', 5, 2)
                ->nullable();

            $table->string('status')
                ->default('Submitted');

            $table->timestamps();

            $table->unique([
                'assignment_id',
                'student_id'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};