<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Category extends Model
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

    public function sharedRoles()
    {
        return $this->belongsToMany(\Spatie\Permission\Models\Role::class, 'category_role_access', 'category_id', 'role_id')->withTimestamps();
    }

    public function sharedUsers()
    {
        return $this->belongsToMany(User::class, 'category_user_access')->withTimestamps();
    }

    public function scopeVisible($query, $user = null)
    {
        $user = $user ?? auth()->user();

        return $query->where(function ($q) use ($user) {
            $q->where('is_common', true);
            if ($user) {
                $q->orWhere('user_id', $user->id)
                    ->orWhereHas('sharedUsers', fn($sq) => $sq->where('users.id', $user->id))
                    ->orWhereHas('sharedRoles', fn($sq) => $sq->whereIn('roles.id', $user->roles->pluck('id')));
            }
        });
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('sort_order');
    }

    public function comics()
    {
        return $this->belongsToMany(Comic::class);
    }
}
