<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();

            $table->string('title')
                ->unique();

            $table->foreignId('instructor_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('category');

            $table->string('status')
                ->default('Published');

            $table->integer('lessons')
                ->default(0);

            $table->decimal('price', 10, 2)
                ->default(0);

            $table->integer('enrolled')
                ->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};