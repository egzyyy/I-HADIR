<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SportHouse extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'sport_house_id';

    protected $fillable = [
        'school_id',
        'name',
        'color',
        'capacity',
        'teacher_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'teacher_id', 'teacher_id');
    }
}
