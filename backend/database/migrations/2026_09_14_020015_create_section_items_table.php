<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('section_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('course_section_id')
                ->constrained('course_sections')
                ->cascadeOnDelete();

            $table->string('title');

            /*
            |--------------------------------------------------------------------------
            | Item Type
            |--------------------------------------------------------------------------
            |
            | Current learning materials:
            |
            | video
            | pdf
            | text
            | audio
            | link
            |
            | Future interactive content:
            |
            | question_set
            | quiz
            | homework
            | exam
            | live_session
            |
            */

            $table->string('type');

            $table->text('description')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Text Content
            |--------------------------------------------------------------------------
            |
            | Used when type = text.
            |
            */

            $table->longText('content')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | External Resource URL
            |--------------------------------------------------------------------------
            |
            | Used for:
            | video URLs
            | external audio
            | external websites
            | future streaming providers
            |
            */

            $table->text('resource_url')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Uploaded File
            |--------------------------------------------------------------------------
            |
            | Used for:
            | PDF
            | audio
            | other learning resources
            |
            */

            $table->string('file_path')
                ->nullable();

            $table->unsignedInteger('sort_order')
                ->default(0);

            $table->string('status')
                ->default('Draft');

            /*
            |--------------------------------------------------------------------------
            | Free Preview
            |--------------------------------------------------------------------------
            |
            | Allows a published lesson/resource
            | to be viewed before enrollment.
            |
            */

            $table->boolean('is_preview')
                ->default(false);

            $table->timestamp('published_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'course_section_id',
                'sort_order'
            ]);

            $table->index([
                'course_section_id',
                'status'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('section_items');
    }
};