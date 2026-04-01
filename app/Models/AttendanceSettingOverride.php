<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceSettingOverride extends Model
{
    protected $table = 'attendance_setting_overrides';

    protected $fillable = [
        'school_id',
        'date',
        'setting_id',
        'note',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function setting()
    {
        return $this->belongsTo(AttendanceSetting::class, 'setting_id');
    }
}
