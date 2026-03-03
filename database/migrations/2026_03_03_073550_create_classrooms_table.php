<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id('classroom_id');
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            
            $table->string('name'); // e.g., "1 Cekal", "2 Amanah"
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classrooms');
    }
};