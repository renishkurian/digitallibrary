<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class QueueWorkAiCommand extends Command
{
    protected $signature = 'queue:work-ai
                            {--queue=default : The queue to listen on}
                            {--memory=512 : Memory limit in MB}';

    protected $description = 'Run the queue worker with a 600s timeout for local LLM (Ollama) AI jobs';

    public function handle(): int
    {
        $this->warn('Stop any other "php artisan queue:work" processes first — they use a 60s timeout and will kill Ollama jobs.');
        $this->info('Starting AI queue worker (600s timeout for Ollama jobs)...');

        return $this->call('queue:work', [
            '--timeout' => 600,
            '--tries' => 2,
            '--memory' => $this->option('memory'),
            '--queue' => $this->option('queue'),
        ]);
    }
}
