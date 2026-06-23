<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherEmployment extends Model
{
    use HasFactory;

    protected $primaryKey = 'teacher_employment_id';

    protected $fillable = [
        'teacher_id',
        'school_session_id',
        'position',
    ];

    // Renamed to teacher() for consistency
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id', 'user_id');
    }

    public function schoolSession()
    {
        return $this->belongsTo(SchoolSession::class, 'school_session_id', 'school_session_id');
    }
}