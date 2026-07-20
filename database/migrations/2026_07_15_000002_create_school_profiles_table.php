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
        Schema::create('school_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->unique()
                ->references('school_id')->on('schools')->cascadeOnDelete();

            // Public landing-page copy — all nullable; the frontend falls back
            // to its static defaults for anything left unset.
            $table->string('tagline')->nullable();
            $table->string('established_year', 20)->nullable();
            $table->text('about')->nullable();          // multi-paragraph (split on blank lines)
            $table->text('vision')->nullable();
            $table->text('mission')->nullable();

            // Organization hierarchy: [{name, position, level}] — level 1 = head,
            // 2 = deputies, 3 = other staff.
            $table->json('organization')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_profiles');
    }
};
