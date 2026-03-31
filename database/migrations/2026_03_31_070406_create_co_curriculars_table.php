<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('co_curriculars', function (Blueprint $table) {
            $table->id('co_curricular_id');
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->foreign('teacher_id')->references('teacher_id')->on('teachers')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('co_curriculars');
    }
};
