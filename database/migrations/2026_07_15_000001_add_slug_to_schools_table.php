<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            // Public URL segment for the school's landing page (/school/{slug}).
            // Nullable: schools without a slug are not publicly listed yet.
            $table->string('slug')->nullable()->unique()->after('name');
        });

        // Backfill the one real school so its landing page goes live immediately.
        DB::table('schools')
            ->where('school_code', 'MEA0001')
            ->update(['slug' => 'pulau-serai']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
