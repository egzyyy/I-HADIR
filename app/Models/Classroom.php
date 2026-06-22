<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Classroom extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'classroom_id';

    protected $fillable = [
        'school_id',
        'name',
        'user_id',
        'capacity',
        'school_session_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id', 'school_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    // Alias for backward compatibility
    public function user()
    {
        return $this->teacher();
    }

    public function session()
    {
        return $this->belongsTo(SchoolSession::class, 'school_session_id', 'school_session_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'classroom_id', 'classroom_id');
    }
}