<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('co_curricular_student', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('co_curricular_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('school_session_id');
            $table->unsignedBigInteger('school_id');
            $table->timestamps();

            // Foreign keys
            $table->foreign('co_curricular_id')->references('co_curricular_id')->on('co_curriculars')->onDelete('cascade');
            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
            $table->foreign('school_session_id')->references('school_session_id')->on('school_sessions')->onDelete('cascade');
            $table->foreign('school_id')->references('school_id')->on('schools')->onDelete('cascade');
            
            // Ensure a student can only join THIS specific co-curricular once per session
            $table->unique(['co_curricular_id', 'student_id', 'school_session_id'], 'cc_student_session_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('co_curricular_student');
    }
};
