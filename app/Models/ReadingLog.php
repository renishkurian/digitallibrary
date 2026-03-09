<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReadingLog extends Model
{
    protected $fillable = [
        'user_id',
        'comic_id',
        'date',
        'seconds_spent',
    ];

    protected $casts = [
        'date' => 'date',
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
