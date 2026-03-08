<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shelf extends Model
{
    protected $fillable = [
        'name',
        'description',
        'cover_image',
        'sort_order',
        'is_hidden',
    ];

    public function comics()
    {
        return $this->hasMany(Comic::class);
    }

    public function scopeVisible($query)
    {
        return $query->where('is_hidden', false);
    }
}
