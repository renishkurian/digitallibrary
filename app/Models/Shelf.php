<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shelf extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'parent_id',
        'description',
        'sort_order',
        'is_common',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comics()
    {
        return $this->hasMany(Comic::class);
    }

    public function scopeVisible($query, $user = null)
    {
        $user = $user ?? auth()->user();

        return $query->where('is_hidden', false)
            ->where(function ($q) use ($user) {
                $q->where('is_common', true);
                if ($user) {
                    $q->orWhere('user_id', $user->id);
                }
            });
    }
}
