<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'teacher_id';

    protected $fillable = [
        'school_id',
        'name',
        'ic_number',
        'phone_number',
        'email',
        'gender',
        'address',
        'profile_pic_path',
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

    public function employments()
    {
        return $this->hasMany(TeacherEmployment::class, 'teacher_id', 'teacher_id');
    }

    public function getEmploymentForSession($sessionId)
    {
        return $this->employments()->where('school_session_id', $sessionId)->first();
    }
}