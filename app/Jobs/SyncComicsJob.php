<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;

class SyncComicsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 3600; // 1 hour

    public function handle()
    {
        Setting::set('sync_error', null);
        Setting::set('sync_progress', 'Starting scan...');

        try {
            Artisan::call('app:sync-comics', ['--force-rehash' => false]);
            // Note: The Artisan command updates sync_status back to idle and sets last_sync_at upon completion.
        } catch (\Exception $e) {
            Log::error("Sync Error: " . $e->getMessage());
            Setting::set('sync_status', 'error');
            Setting::set('sync_error', $e->getMessage());
        }
    }
}
