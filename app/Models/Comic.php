<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Jenssegers\ImageHash\ImageHash;
use Jenssegers\ImageHash\Implementations\DifferenceHash;

class Comic extends Model
{
    use SoftDeletes;
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
        'published_date',
        'file_size',
        'pages_count',
        'visual_hash',
        'author',
        'series',
        'series_index',
        'publisher',
        'language',
        'isbn',
    ];

    protected $appends = ['encrypted_id', 'share_url'];

    protected $casts = [
        'is_hidden' => 'boolean',
        'is_personal' => 'boolean',
        'is_common' => 'boolean',
        'is_approved' => 'boolean',
        'tags' => 'array',
        'rating' => 'float',
        'published_date' => 'date',
        'series_index' => 'float',
    ];

    public function getRouteKey()
    {
        return $this->hash_id;
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->findByHashId($value) ?? $this->where('id', $value)->first();
    }

    public function getHashIdAttribute()
    {
        return base64_encode($this->id . 'comic_vault');
    }

    public static function findByHashId($hash)
    {
        try {
            $decoded = base64_decode($hash);
            if (!$decoded) return null;
            $id = str_replace('comic_vault', '', $decoded);
            return self::find($id);
        } catch (\Exception $e) {
            return null;
        }
    }

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
        $user = $user ?? auth()->user();

        if ($user && $user->hasRole('admin')) {
            return $query;
        }

        return $query->where(function ($q) use ($user) {
            // Standard visibility
            $q->where(function ($sq) use ($user) {
                $sq->where('is_hidden', false)
                    ->where('is_personal', false)
                    ->where('is_approved', true);

                // Shelf privacy: Must not be ONLY in hidden shelves
                $sq->where(function ($ssq) use ($user) {
                    $ssq->whereDoesntHave('shelves')
                        ->orWhereHas('shelves', function ($sssq) use ($user) {
                            $sssq->visible($user);
                        });
                });
            });

            if ($user) {
                // Owner visibility
                $q->orWhere('user_id', $user->id)
                    // Direct sharing
                    ->orWhereHas('sharedWith', function ($sq) use ($user) {
                        $sq->where('users.id', $user->id);
                    })
                    // Role sharing
                    ->orWhereHas('sharedRoles', function ($sq) use ($user) {
                        $sq->whereIn('roles.id', $user->roles->pluck('id'));
                    })
                    // Category sharing
                    ->orWhereHas('categories', function ($sq) use ($user) {
                        $sq->whereHas('sharedUsers', function ($ssq) use ($user) {
                            $ssq->where('users.id', $user->id);
                        })
                            ->orWhereHas('sharedRoles', function ($ssq) use ($user) {
                                $ssq->whereIn('roles.id', $user->roles->pluck('id'));
                            });
                    });
            }
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
            "pdfinfo " . escapeshellarg($path) . " 2>/dev/null | grep -a -i '^Pages:' | awk '{print $2}'",
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
            $filename . ".jpg",
            $filename . ".jpeg",
            $basename . ".jpg",
            $basename . ".jpeg",
            $basename . ".png",
            $filename . ".png",
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

        // Use absolute path for pdftoppm to be safe in different environments
        $pdftoppmPath = '/usr/bin/pdftoppm';
        if (!file_exists($pdftoppmPath)) {
            $pdftoppmPath = 'pdftoppm'; // Fallback to PATH
        }

        $command = "{$pdftoppmPath} -f 1 -l 1 -jpeg -scale-to 800 -jpegopt quality=80 " . $pdfPathEscaped . " " . $tempPrefixEscaped . " 2>&1";
        exec($command, $output, $returnVar);

        $generatedFiles = glob($tempPrefix . "-*.jpg");
        $finalFile = $filename . ".jpg";

        if ($returnVar === 0 && !empty($generatedFiles)) {
            $generatedFile = $generatedFiles[0];
            rename($generatedFile, $thumbDir . '/' . $finalFile);
            $this->update(['thumbnail' => $finalFile]);

            foreach (glob($tempPrefix . "-*.jpg") as $extra) {
                @unlink($extra);
            }
            return true;
        }

        // Log failure for debugging
        \Illuminate\Support\Facades\Log::error("Thumbnail generation failed for comic ID {$this->id}", [
            'command' => $command,
            'return_var' => $returnVar,
            'output' => $output,
            'pdf_exists' => file_exists($absolutePdfPath),
            'thumb_dir_writable' => is_writable($thumbDir),
        ]);

        return false;
    }

    /**
     * Parse date from filename or title.
     * Supports:
     * - Month Day Year (April 12 2024, 20 February 2021)
     * - Year Month Day (2018 9 21, 2023-06-28)
     * - Day Month Year (29.06.2023, 13/04/2024)
     * - Month Year (april 2024)
     */
    public static function parseDateFromFilename($string): ?\Carbon\Carbon
    {
        if (empty($string)) return null;

        // Clean up string: replace underscores, dashes, dots, and COMMAS with spaces
        $clean = preg_replace('/[._\/,\-]/', ' ', $string);
        $clean = preg_replace('/\s+/', ' ', $clean);
        $clean = trim($clean);

        // 1. Full matches with month names (using word boundaries to avoid partial matches)
        $months = '\b(?:January|February|March|April|May|June|July|August|Auguest|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b';

        // Month Day Year or Day Month Year
        if (preg_match('/(?:(' . $months . ')\s+(\d{1,2})|(\d{1,2})\s+(' . $months . '))\s+(\d{4})/i', $clean, $matches)) {
            $month = !empty($matches[1]) ? $matches[1] : $matches[4];
            $day = !empty($matches[2]) ? $matches[2] : $matches[3];
            $year = $matches[5];

            // Normalize month name for Carbon
            if (stripos($month, 'Augu') === 0) $month = 'August';
            if (stripos($month, 'Sept') === 0) $month = 'September';

            try {
                return \Carbon\Carbon::parse("$month $day $year");
            } catch (\Exception $e) {
            }
        }

        // Year Month Day (numeric or with month name)
        if (preg_match('/(\d{4})\s+(' . $months . '|\d{1,2})\s+(\d{1,2})/i', $clean, $matches)) {
            $year = $matches[1];
            $month = $matches[2];
            $day = $matches[3];

            if (!is_numeric($month)) {
                if (stripos($month, 'Augu') === 0) $month = 'August';
                if (stripos($month, 'Sept') === 0) $month = 'September';
            }

            try {
                return \Carbon\Carbon::parse("$year-$month-$day");
            } catch (\Exception $e) {
            }
        }

        // 2. Numeric patterns (D M Y or M D Y)
        if (preg_match('/(\d{1,2})\s+(\d{1,2})\s+(\d{4})/', $clean, $matches)) {
            try {
                // Try D-M-Y first
                return \Carbon\Carbon::createFromFormat('d m Y', $matches[1] . ' ' . $matches[2] . ' ' . $matches[3])->startOfDay();
            } catch (\Exception $e) {
                try {
                    // Try M-D-Y
                    return \Carbon\Carbon::createFromFormat('m d Y', $matches[1] . ' ' . $matches[2] . ' ' . $matches[3])->startOfDay();
                } catch (\Exception $ee) {
                }
            }
        }

        // 3. Month Year only
        if (preg_match('/(' . $months . ')\s+(\d{4})/i', $clean, $matches)) {
            try {
                return \Carbon\Carbon::parse($matches[0])->startOfMonth();
            } catch (\Exception $e) {
            }
        }

        return null;
    }

    /**
     * Attempt to extract metadata from a sibling metadata.opf file (Calibre style)
     */
    public function extractCalibreMeta()
    {
        $baseDir = rtrim(config('comics.base_dir'), '/');
        $absolutePdfPath = $baseDir . '/' . ltrim($this->path, '/');
        $directory = dirname($absolutePdfPath);
        $opfPath = $directory . '/metadata.opf';

        if (!\Illuminate\Support\Facades\File::exists($opfPath)) {
            return false;
        }

        try {
            $xml = simplexml_load_file($opfPath);
            if (!$xml) return false;

            $metadata = $xml->metadata->children('dc', true);

            $updates = [];

            if (isset($metadata->title)) $updates['title'] = (string)$metadata->title;
            if (isset($metadata->creator)) $updates['author'] = (string)$metadata->creator;
            if (isset($metadata->description)) $updates['description'] = strip_tags((string)$metadata->description);
            if (isset($metadata->publisher)) $updates['publisher'] = (string)$metadata->publisher;
            if (isset($metadata->language)) $updates['language'] = (string)$metadata->language;

            // Series info is in <meta> tags
            foreach ($xml->metadata->meta as $meta) {
                $name = (string)$meta['name'];
                $content = (string)$meta['content'];
                if ($name === 'calibre:series') $updates['series'] = $content;
                if ($name === 'calibre:series_index') $updates['series_index'] = (float)$content;
            }

            if (!empty($updates)) {
                $this->update($updates);
                return true;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to extract Calibre meta for comic {$this->id}: " . $e->getMessage());
        }

        return false;
    }
}
