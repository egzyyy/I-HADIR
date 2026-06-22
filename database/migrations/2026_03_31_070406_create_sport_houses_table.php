<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sport_houses', function (Blueprint $table) {
            $table->id('sport_house_id');
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            $table->string('name');
            $table->string('color')->nullable();
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('user_id')->on('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sport_houses');
    }
};
