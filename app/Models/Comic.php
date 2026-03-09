<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comic extends Model
{
    protected $fillable = [
        'title',
        'description',
        'filename',
        'path',
        'thumbnail',
        'is_hidden',
        'is_personal',
        'is_common',
        'is_approved',
        'user_id',
        'ai_summary',
        'rating',
        'tags',
    ];

    protected $appends = ['encrypted_id', 'share_url'];

    protected $casts = [
        'is_hidden' => 'boolean',
        'is_personal' => 'boolean',
        'is_common' => 'boolean',
        'is_approved' => 'boolean',
        'tags' => 'array',
        'rating' => 'float',
    ];

    public function getEncryptedIdAttribute()
    {
        return encrypt($this->id);
    }

    public function getShareUrlAttribute()
    {
        return route('comics.shared', ['id' => $this->encrypted_id]);
    }

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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sharedRoles()
    {
        return $this->belongsToMany(\Spatie\Permission\Models\Role::class, 'comic_role_access', 'comic_id', 'role_id')->withTimestamps();
    }

    public function scopeVisible($query, $user = null)
    {
        // 1. If no user, only show public AND approved by admin
        if (!$user) {
            return $query->where('is_hidden', false)
                ->where('is_personal', false)
                ->where('is_approved', true);
        }

        // 2. If admin, show all (including hidden and unapproved)
        if ($user->hasRole('admin')) {
            return $query;
        }

        // 3. For regular users:
        return $query->where(function ($q) use ($user) {
            $q->where(function ($sq) {
                // Public AND Approved
                $sq->where('is_hidden', false)
                    ->where('is_personal', false)
                    ->where('is_approved', true);
            })
                ->orWhere('user_id', $user->id) // Uploaded by them (even if not approved)
                ->orWhereHas('sharedWith', function ($sq) use ($user) {
                    $sq->where('users.id', $user->id); // Explicitly shared with them
                })
                ->orWhereHas('sharedRoles', function ($sq) use ($user) {
                    $sq->whereIn('roles.id', $user->roles->pluck('id')); // Shared with one of their roles
                })
                ->orWhereHas('categories', function ($sq) use ($user) {
                    // Cascading Sharing via Category
                    $sq->whereHas('sharedUsers', function ($ssq) use ($user) {
                        $ssq->where('users.id', $user->id);
                    })
                        ->orWhereHas('sharedRoles', function ($ssq) use ($user) {
                            $ssq->whereIn('roles.id', $user->roles->pluck('id'));
                        });
                });
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
        $absolutePdfPath = $baseDir . '/' . ltrim($this->path, '/');

        if (!file_exists($absolutePdfPath)) {
            return false;
        }

        if (!is_dir($thumbDir)) {
            mkdir($thumbDir, 0755, true);
        }

        // 1. Try Filename-based variants (highest priority)
        $basename = pathinfo($absolutePdfPath, PATHINFO_BASENAME); // e.g., "ബാലഭൂമി.pdf"
        $filename = pathinfo($absolutePdfPath, PATHINFO_FILENAME); // e.g., "ബാലഭൂമി"

        $patterns = [
            $basename . ".png",   // "ബാലഭൂമി.pdf.png"
            $basename . ".PNG",   // "ബാലഭൂമി.pdf.PNG"
            $filename . ".png",   // "ബാലഭൂമി.png"
            $filename . ".jpg",   // "ബാലഭൂമി.jpg"
            $filename . ".jpeg",  // "ബാലഭൂമി.jpeg"
            str_replace('.pdf', '.PDF.png', $basename), // "ബാലഭൂമി.PDF.png"
            str_replace('.pdf', '.Pdf.png', $basename), // "ബാലഭൂമി.Pdf.png"
        ];

        foreach ($patterns as $pattern) {
            if (file_exists($thumbDir . "/" . $pattern)) {
                $this->update(['thumbnail' => $pattern]);
                return true;
            }
        }

        // 2. Try MD5-based variants (second priority)
        $md5 = md5($absolutePdfPath);
        $md5Patterns = [
            $md5 . ".png",
            $md5 . ".jpg",
            $md5 . ".jpeg",
        ];

        foreach ($md5Patterns as $pattern) {
            if (file_exists($thumbDir . "/" . $pattern)) {
                $this->update(['thumbnail' => $pattern]);
                return true;
            }
        }

        // 3. Generate if neither exists
        $tempPrefix = $thumbDir . '/' . $md5;
        $pdfPathEscaped = escapeshellarg($absolutePdfPath);
        $tempPrefixEscaped = escapeshellarg($tempPrefix);

        // pdftoppm -f 1 -l 1 -png "pdfPath" "tempPrefix"
        $command = "pdftoppm -f 1 -l 1 -png " . $pdfPathEscaped . " " . $tempPrefixEscaped . " 2>&1";
        exec($command, $output, $returnVar);

        $generatedFiles = glob($tempPrefix . "-*.png");
        $finalFile = $md5 . ".png";

        if ($returnVar === 0 && !empty($generatedFiles)) {
            $generatedFile = $generatedFiles[0];
            rename($generatedFile, $thumbDir . '/' . $finalFile);
            $this->update(['thumbnail' => $finalFile]);

            // Clean up extras
            foreach (glob($tempPrefix . "-*.png") as $extra) {
                @unlink($extra);
            }
            return true;
        }

        return false;
    }
}
