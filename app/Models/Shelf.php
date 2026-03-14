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
        'cover_image',
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
        return $this->belongsToMany(Comic::class);
    }

    public function parent()
    {
        return $this->belongsTo(Shelf::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Shelf::class, 'parent_id');
    }

    public function descendants()
    {
        return $this->children()->with('descendants');
    }

    public function getDescendantIds()
    {
        $ids = [];
        foreach ($this->descendants as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $child->getDescendantIds());
        }
        return $ids;
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
