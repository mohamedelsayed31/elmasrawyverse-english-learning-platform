<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'section_item_progress',
            function (Blueprint $table) {

                $table->id();

                $table->foreignId('student_id')
                    ->constrained('students')
                    ->cascadeOnDelete();

                $table->foreignId('section_item_id')
                    ->constrained('section_items')
                    ->cascadeOnDelete();

                /*
                |--------------------------------------------------------------------------
                | Progress Status
                |--------------------------------------------------------------------------
                |
                | started
                | completed
                |
                */

                $table->string('status')
                    ->default('started');

                $table->timestamp('opened_at')
                    ->nullable();

                $table->timestamp('completed_at')
                    ->nullable();

                /*
                |--------------------------------------------------------------------------
                | Future video/audio resume support
                |--------------------------------------------------------------------------
                */

                $table->unsignedInteger(
                    'last_position_seconds'
                )->default(0);

                $table->timestamps();


                $table->unique(
                    [
                        'student_id',
                        'section_item_id'
                    ],
                    'sip_student_item_unique'
                );

                $table->index(
                    [
                        'student_id',
                        'status'
                    ],
                    'sip_student_status_idx'
                );
            }
        );
    }


    public function down(): void
    {
        Schema::dropIfExists(
            'section_item_progress'
        );
    }
};