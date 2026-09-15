<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();

            $table->string('title');

            $table->foreignId('course_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->date('due_date');

            $table->integer('marks')
                ->default(0);

            $table->integer('submissions')
                ->default(0);

            $table->string('status')
                ->default('Open');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};