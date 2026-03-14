<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Jenssegers\ImageHash\ImageHash;
use Jenssegers\ImageHash\Implementations\DifferenceHash;

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
        'shelf_id',
        'ai_summary',
        'rating',
        'tags',
        'md5_hash',
        'visual_hash', // ADD this column via migration: string, nullable
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

    public function shelves()
    {
        return $this->belongsToMany(Shelf::class);
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
        if (!$user) {
            return $query->where('is_hidden', false)
                ->where('is_personal', false)
                ->where('is_approved', true);
        }

        if ($user->hasRole('admin')) {
            return $query;
        }

        return $query->where(function ($q) use ($user) {
            $q->where(function ($sq) {
                $sq->where('is_hidden', false)
                    ->where('is_personal', false)
                    ->where('is_approved', true);
            })
                ->orWhere('user_id', $user->id)
                ->orWhereHas('sharedWith', function ($sq) use ($user) {
                    $sq->where('users.id', $user->id);
                })
                ->orWhereHas('sharedRoles', function ($sq) use ($user) {
                    $sq->whereIn('roles.id', $user->roles->pluck('id'));
                })
                ->orWhereHas('categories', function ($sq) use ($user) {
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
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', '%' . $search . '%')
                ->orWhere('ai_summary', 'like', '%' . $search . '%')
                ->orWhereJsonContains('tags', $search);
        });
    }

    public function isReadBy(User $user)
    {
        return $this->readers()->where('user_id', $user->id)->exists();
    }

    /**
     * Original partial hash — kept for backward compatibility.
     * NOTE: This breaks after compression. Use getVisualHash() for duplicate detection.
     */
    public static function getPartialHash($path)
    {
        if (!file_exists($path)) return null;

        $size = filesize($path);
        $handle = fopen($path, 'rb');
        if (!$handle) return null;

        $data = fread($handle, 1024 * 1024);
        fclose($handle);

        return md5($data) . ':' . $size;
    }

    /**
     * Returns a visual fingerprint that survives PDF compression.
     * Renders the first page at 30 DPI and hashes the image,
     * combined with page count for a stronger signal.
     *
     * Format: "<image_md5>:<page_count>"
     */


    public static function getVisualHash($path): ?string
    {
        if (!file_exists($path)) return null;

        $pageCount = self::getPageCount($path);
        if (!$pageCount) return null;

        $tempPrefix = sys_get_temp_dir() . '/' . uniqid('vhash_');

        // Render at higher resolution for better perceptual accuracy
        exec(
            "pdftoppm -f 1 -l 1 -r 72 -png " . escapeshellarg($path) . " " . escapeshellarg($tempPrefix) . " 2>/dev/null",
            $out,
            $code
        );

        $files = glob($tempPrefix . '-*.png');

        if ($code !== 0 || empty($files)) {
            foreach ($files as $f) @unlink($f);
            return null;
        }

        try {
            $hasher = new ImageHash(new DifferenceHash());
            $hash = $hasher->hash($files[0]);
            $hexHash = $hash->toHex();
        } catch (\Exception $e) {
            foreach ($files as $f) @unlink($f);
            return null;
        }

        foreach ($files as $f) @unlink($f);

        return $hexHash . ':' . $pageCount;
    }

    /**
     * Get the number of pages in a PDF using pdfinfo.
     */
    public static function getPageCount($path): ?int
    {
        exec(
            "pdfinfo " . escapeshellarg($path) . " 2>/dev/null | grep -i '^Pages:' | awk '{print $2}'",
            $out,
            $code
        );

        $count = isset($out[0]) ? (int) trim($out[0]) : null;
        return $count > 0 ? $count : null;
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

        $basename = pathinfo($absolutePdfPath, PATHINFO_BASENAME);
        $filename = pathinfo($absolutePdfPath, PATHINFO_FILENAME);

        $patterns = [
            $basename . ".png",
            $basename . ".PNG",
            $filename . ".png",
            $filename . ".jpg",
            $filename . ".jpeg",
            str_replace('.pdf', '.PDF.png', $basename),
            str_replace('.pdf', '.Pdf.png', $basename),
        ];

        foreach ($patterns as $pattern) {
            if (file_exists($thumbDir . "/" . $pattern)) {
                $this->update(['thumbnail' => $pattern]);
                return true;
            }
        }

        $contentMd5 = self::getPartialHash($absolutePdfPath);
        $this->update(['md5_hash' => $contentMd5]);

        $tempPrefix = $thumbDir . '/' . uniqid('thumb_');
        $pdfPathEscaped = escapeshellarg($absolutePdfPath);
        $tempPrefixEscaped = escapeshellarg($tempPrefix);

        $command = "pdftoppm -f 1 -l 1 -png " . $pdfPathEscaped . " " . $tempPrefixEscaped . " 2>&1";
        exec($command, $output, $returnVar);

        $generatedFiles = glob($tempPrefix . "-*.png");
        $finalFile = $filename . ".png";

        if ($returnVar === 0 && !empty($generatedFiles)) {
            $generatedFile = $generatedFiles[0];
            rename($generatedFile, $thumbDir . '/' . $finalFile);
            $this->update(['thumbnail' => $finalFile]);

            foreach (glob($tempPrefix . "-*.png") as $extra) {
                @unlink($extra);
            }
            return true;
        }

        return false;
    }
}
