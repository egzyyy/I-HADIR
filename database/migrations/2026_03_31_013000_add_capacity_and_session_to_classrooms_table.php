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
        Schema::table('classrooms', function (Blueprint $table) {
            $table->unsignedSmallInteger('capacity')->nullable()->after('teacher_id');
            $table->unsignedBigInteger('school_session_id')->nullable()->after('capacity');
            $table->foreign('school_session_id')
                  ->references('school_session_id')
                  ->on('school_sessions')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropForeign(['school_session_id']);
            $table->dropColumn(['capacity', 'school_session_id']);
        });
    }
};
