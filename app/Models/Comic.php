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
        'is_personal',
        'shelf_id',
        'user_id',
    ];

    public function readers()
    {
        return $this->belongsToMany(User::class, 'comic_user')
            ->withPivot('last_read_page')
            ->withTimestamps();
    }

    public function shelf()
    {
        return $this->belongsTo(Shelf::class);
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class);
    }

    public function sharedWith()
    {
        return $this->belongsToMany(User::class, 'comic_user_access');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeVisible($query)
    {
        /** @var \App\Models\User|null $user */
        $user = auth()->user();
        $userId = $user?->id;

        return $query->where(function ($q) use ($user, $userId) {
            // General visibility: Public, non-personal comics
            $q->where('is_hidden', false)
                ->where('is_personal', false);

            if ($userId) {
                // Own comics (personal or hidden)
                $q->orWhere('user_id', $userId);

                // Explicitly shared comics
                $q->orWhereHas('sharedWith', fn($sq) => $sq->where('user_id', $userId));
            }
        });
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('title', 'like', '%' . $search . '%');
    }

    public function isReadBy(User $user)
    {
        return $this->readers()->where('user_id', $user->id)->exists();
    }

    public function generateThumbnail()
    {
        $baseDir = rtrim(config('comics.base_dir'), '/');
        $thumbDir = rtrim(config('comics.thumb_dir'), '/');

        $pdfPath = escapeshellarg($baseDir . '/' . urldecode(ltrim($this->path, '/')));

        if (!file_exists($baseDir . '/' . urldecode(ltrim($this->path, '/')))) {
            return false;
        }

        if (!is_dir($thumbDir)) {
            mkdir($thumbDir, 0755, true);
        }

        $md5 = md5($baseDir . '/' . urldecode(ltrim($this->path, '/')));
        $tempPrefix = $thumbDir . '/' . $md5;

        // pdftoppm -f 1 -l 1 -png "pdfPath" "tempPrefix"
        $command = "pdftoppm -f 1 -l 1 -png " . $pdfPath . " " . escapeshellarg($tempPrefix) . " 2>&1";
        exec($command, $output, $returnVar);

        // pdftoppm appends -1.png or -01.png depending on page count length. We can use glob to find it.
        $generatedFiles = glob($tempPrefix . "-*.png");
        $finalFile = $md5 . ".png";

        if ($returnVar === 0 && !empty($generatedFiles)) {
            $generatedFile = $generatedFiles[0];
            rename($generatedFile, $thumbDir . '/' . $finalFile);
            $this->update(['thumbnail' => $finalFile]);
            // Clean up any other pages if pdftoppm ignored -l 1 somehow
            foreach (glob($tempPrefix . "-*.png") as $extra) {
                @unlink($extra);
            }
            return true;
        }

        return false;
    }
}
