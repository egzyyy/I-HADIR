<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id('enrollment_id');
            
            // The three pillars of an enrollment: Who, When, Where
            $table->foreignId('student_id')->references('student_id')->on('students')->cascadeOnDelete();
            $table->foreignId('school_session_id')->references('school_session_id')->on('school_sessions')->cascadeOnDelete();
            $table->foreignId('classroom_id')->references('classroom_id')->on('classrooms')->cascadeOnDelete();
            
            $table->timestamps();
            
            // Ensure a student isn't enrolled twice in the same session
            $table->unique(['student_id', 'school_session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};