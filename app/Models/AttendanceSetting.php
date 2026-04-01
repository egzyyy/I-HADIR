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
        'absent_threshold',
        'check_out_time',
        'is_default',
        'applies_to_days',
    ];

    protected $casts = [
        'is_default'      => 'boolean',
        'applies_to_days' => 'array',
    ];

    public function overrides()
    {
        return $this->hasMany(AttendanceSettingOverride::class, 'setting_id');
    }
}
