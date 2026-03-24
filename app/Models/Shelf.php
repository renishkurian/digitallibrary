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
        'is_hidden',
    ];

    protected $casts = [
        'is_hidden' => 'boolean',
        'is_common' => 'boolean',
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

    protected $appends = ['aggregate_comics_count', 'hash_id'];

    public function getAggregateComicsCountAttribute()
    {
        $user = auth()->check() ? auth()->user() : null;
        $count = $this->comics()->visible($user)->count();
        foreach ($this->children as $child) {
            $count += $child->aggregate_comics_count;
        }
        return $count;
    }

    public function getHashIdAttribute()
    {
        // Simple obfuscation for URLs
        return base64_encode($this->id . 'balarama');
    }

    public function getDisplayCoverImageAttribute()
    {
        if ($this->cover_image) {
            return '/shelves/' . $this->cover_image;
        }

        $user = auth()->check() ? auth()->user() : null;
        $comic = $this->comics()->visible($user)->whereNotNull('thumbnail')->latest()->first();

        if (!$comic && $this->children()->count() > 0) {
            foreach ($this->children as $child) {
                $comic = $child->comics()->visible($user)->whereNotNull('thumbnail')->latest()->first();
                if ($comic) break;
            }
        }

        if ($comic && $comic->thumbnail) {
            return '/thumbs/' . $comic->thumbnail;
        }

        return null;
    }

    public static function findByHashId($hash)
    {
        $decoded = base64_decode($hash);
        $id = str_replace('balarama', '', $decoded);
        return self::find($id);
    }

    public function scopeVisible($query, $user = null)
    {
        $user = $user ?? auth()->user();

        return $query->where(function ($q) use ($user) {
            // Admins see everything
            if ($user && isset($user->is_admin) && $user->is_admin) {
                return $q;
            }

            // Normal visibility rules
            $q->where('is_hidden', false);

            $q->where(function ($inner) use ($user) {
                $inner->where('is_common', true);
                if ($user) {
                    $inner->orWhere('user_id', $user->id);
                }
            });
        });
    }
}
