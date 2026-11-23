<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Visitor extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'visitors';
    protected $primaryKey = 'visitor_id';

    protected $fillable = [
        'school_id',
        'ic_number',
        'name',
    ];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id', 'school_id');
    }

    public function logs()
    {
        return $this->hasMany(VisitorLog::class, 'visitor_id', 'visitor_id');
    }
}