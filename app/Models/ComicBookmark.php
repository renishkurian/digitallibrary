<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComicBookmark extends Model
{
    protected $fillable = [
        'user_id',
        'comic_id',
        'page_number',
        'note',
    ];

    protected $casts = [
        'page_number' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comic()
    {
        return $this->belongsTo(Comic::class);
    }
}
