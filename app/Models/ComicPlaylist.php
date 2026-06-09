<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ComicPlaylist extends Model
{
    protected $fillable = ['user_id', 'name', 'sort_order'];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comics(): BelongsToMany
    {
        return $this->belongsToMany(Comic::class, 'comic_playlist_comic')
            ->withPivot('position')
            ->withTimestamps()
            ->orderByPivot('position');
    }
}
