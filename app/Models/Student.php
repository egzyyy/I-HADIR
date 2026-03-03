<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'student_id';

    protected $fillable = [
        'school_id',
        'name',
        'ic_number',
        'gender',
        'address',
        'email',
        'phone_num',
        'class',
        'profile_pic_path',
        'father_name',
        'father_ic',
        'father_phone_num',
        'mother_name',
        'mother_ic',
        'mother_phone_num',
        'emergency_name',
        'emergency_phone_num',
        'emergency_relation',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id', 'school_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'student_id', 'student_id');
    }

    /**
     * Helper method to get the student's enrollment for a specific session
     */
    public function getEnrollmentForSession($sessionId)
    {
        return $this->enrollments()->where('school_session_id', $sessionId)->first();
    }
}