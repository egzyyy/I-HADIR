<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create the new per-visit logs table
        Schema::create('visitor_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('visitor_id');
            $table->string('phone_number', 30)->nullable();
            $table->string('plate_number', 30)->nullable();
            $table->string('category', 100)->nullable();
            $table->string('person_to_meet', 255)->nullable();
            $table->string('pass_badge_no', 50)->nullable();
            $table->string('purpose', 255)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 50)->default('In Premise');
            $table->timestamp('check_in_time')->nullable();
            $table->timestamp('check_out_time')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('visitor_id')
                ->references('visitor_id')
                ->on('visitors')
                ->onDelete('cascade');

            $table->index(['school_id', 'status']);
        });

        // 2. Copy existing visitor records into visitor_logs so no history is lost
        $existingVisitors = DB::table('visitors')->get();
        foreach ($existingVisitors as $v) {
            DB::table('visitor_logs')->insert([
                'school_id'      => $v->school_id,
                'visitor_id'     => $v->visitor_id,
                'phone_number'   => $v->phone_number,
                'plate_number'   => $v->plate_number,
                'category'       => $v->category,
                'person_to_meet' => $v->person_to_meet,
                'pass_badge_no'  => $v->pass_badge_no,
                'purpose'        => $v->purpose,
                'notes'          => $v->notes,
                'status'         => $v->status ?? 'In Premise',
                'check_in_time'  => $v->created_at,
                'check_out_time' => $v->check_out_time,
                'created_at'     => $v->created_at,
                'updated_at'     => $v->updated_at,
                'deleted_at'     => $v->deleted_at,
            ]);
        }

        // 3. Turn `visitors` into the master identity table (school_id, ic_number, name)
        Schema::table('visitors', function (Blueprint $table) {
            $table->string('ic_number', 20)->nullable()->after('school_id');
            $table->unique(['school_id', 'ic_number'], 'visitors_school_ic_unique');

            $table->dropColumn([
                'phone_number',
                'plate_number',
                'category',
                'person_to_meet',
                'pass_badge_no',
                'purpose',
                'notes',
                'status',
                'check_out_time',
            ]);
        });

        // 4. Ensure facility_logs.user_type accepts 'visitor' (safe for both ENUM and VARCHAR)
        if (Schema::hasTable('facility_logs')) {
            DB::statement("ALTER TABLE facility_logs MODIFY user_type VARCHAR(30) NOT NULL");
        }
    }

    public function down(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropUnique('visitors_school_ic_unique');
            $table->dropColumn('ic_number');

            $table->string('phone_number')->nullable();
            $table->string('plate_number')->nullable();
            $table->string('category')->nullable();
            $table->string('person_to_meet')->nullable();
            $table->string('pass_badge_no')->nullable();
            $table->string('purpose')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('In Premise');
            $table->timestamp('check_out_time')->nullable();
        });

        Schema::dropIfExists('visitor_logs');
    }
};