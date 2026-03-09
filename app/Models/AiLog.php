<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'provider',
        'model',
        'prompt',
        'response',
        'tokens_used',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
