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
        'date',
        'check_in_time',
        'check_out_time',
        'status',
        'scan_method',
        'scanned_by',
    ];

    protected $casts = [
        'date'          => 'date',
        'check_in_time' => 'datetime',
        'check_out_time'=> 'datetime',
    ];

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
        $teacher = Teacher::where('teacher_id', $this->user_id)->first();
        return ['name' => $teacher?->name ?? 'Unknown', 'class' => 'Teacher'];
    }

    private function resolveStaff(): array
    {
        $staff = Staff::where('staff_id', $this->user_id)->first();
        return ['name' => $staff?->name ?? 'Unknown', 'class' => 'Staff'];
    }
}
