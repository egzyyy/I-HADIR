<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CoCurricular extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'co_curricular_id';

    protected $fillable = [
        'school_id',
        'name',
        'capacity',
        'user_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    // Alias for backward compatibility
    public function user()
    {
        return $this->teacher();
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'co_curricular_student', 'co_curricular_id', 'student_id')
                    ->withPivot('school_session_id')
                    ->withTimestamps();
    }
    
}
