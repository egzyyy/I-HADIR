<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    protected $table = 'attendance_logs';

    protected $fillable = [
        'school_id',
        'school_session_id',
        'user_type',
        'user_id',
        'classroom_id',
        'date',
        'check_in_time',
        'check_out_time',
        'status',
        'scan_method',
        'scanned_by',
        'reason_manual',
        'shift_id',
    ];

    protected $casts = [
        'date'          => 'date',
        'check_in_time' => 'datetime',
        'check_out_time'=> 'datetime',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    /**
     * Resolve the person's name and class info based on user_type + user_id.
     */
    public function resolveUser(): array
    {
        return match ($this->user_type) {
            'student' => $this->resolveStudent(),
            'teacher' => $this->resolveTeacher(),
            'staff'   => $this->resolveStaff(),
            default   => ['name' => 'Unknown', 'class' => '-'],
        };
    }

    private function resolveStudent(): array
    {
        $student = Student::where('student_id', $this->user_id)->first();
        return [
            'name'  => $student?->name ?? 'Unknown',
            'class' => $student?->class ?? '-',
        ];
    }

    private function resolveTeacher(): array
    {
        $teacher = User::where('user_id', $this->user_id)->where('user_type', 'teacher')->first();
        return ['name' => $teacher?->full_name ?? 'Unknown', 'class' => 'Teacher'];
    }

    private function resolveStaff(): array
    {
        $staff = User::where('user_id', $this->user_id)->whereIn('user_type', ['staff', 'security_staff'])->first();
        return ['name' => $staff?->full_name ?? 'Unknown', 'class' => 'Staff'];
    }
}
