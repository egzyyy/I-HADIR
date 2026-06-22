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
}
