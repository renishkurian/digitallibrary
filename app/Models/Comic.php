<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comic extends Model
{
    protected $fillable = [
        'title',
        'filename',
        'path',
        'thumbnail',
        'is_hidden',
        'shelf_id',
    ];

    public function readers()
    {
        return $this->belongsToMany(User::class, 'comic_user');
    }

    public function shelf()
    {
        return $this->belongsTo(Shelf::class);
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class);
    }

    public function scopeVisible($query)
    {
        return $query->where('is_hidden', false);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('title', 'like', '%' . $search . '%');
    }

    public function isReadBy(User $user)
    {
        return $this->readers()->where('user_id', $user->id)->exists();
    }
}
