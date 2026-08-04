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
        Schema::create('sport_house_student', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sport_house_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('school_session_id');
            $table->unsignedBigInteger('school_id');
            $table->timestamps();

            // Foreign keys
            $table->foreign('sport_house_id')->references('sport_house_id')->on('sport_houses')->onDelete('cascade');
            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
            $table->foreign('school_session_id')->references('school_session_id')->on('school_sessions')->onDelete('cascade');
            $table->foreign('school_id')->references('school_id')->on('schools')->onDelete('cascade');
            
            // Ensure a student can only join THIS specific sport house once per session
            $table->unique(['sport_house_id', 'student_id', 'school_session_id'], 'sh_student_session_unique');
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sport_house_student');
    }
};
