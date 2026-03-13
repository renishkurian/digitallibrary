<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Log;

class LoggingService
{
    public static function info($message, array $context = [])
    {
        self::log('info', $message, $context);
    }

    public static function warning($message, array $context = [])
    {
        self::log('warning', $message, $context);
    }

    public static function error($message, array $context = [])
    {
        self::log('error', $message, $context);
    }

    protected static function log($level, $message, array $context = [])
    {
        // 1. Log to standard Laravel logs
        Log::$level($message, $context);

        // 2. Log to database
        ActivityLog::create([
            'level' => $level,
            'message' => $message,
            'context' => $context,
        ]);
    }
}
