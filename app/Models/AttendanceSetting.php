<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceSetting extends Model
{
    protected $table = 'attendance_time_settings';

    protected $fillable = [
        'school_id',
        'title',
        'check_in_start',
        'check_in_deadline',
        'late_threshold',
        'check_out_time',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];
}
