<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $primaryKey = 'enrollment_id';

    protected $fillable = [
        'student_id',
        'school_session_id',
        'classroom_id',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }

    public function schoolSession()
    {
        return $this->belongsTo(SchoolSession::class, 'school_session_id', 'school_session_id');
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'classroom_id', 'classroom_id');
    }
}