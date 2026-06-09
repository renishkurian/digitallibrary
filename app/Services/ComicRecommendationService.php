<?php

namespace App\Services;

use App\Models\Comic;
use Illuminate\Support\Collection as BaseCollection;

class ComicRecommendationService
{
    /**
     * Recommend similar comics using tags, series, and publisher/language overlap.
     * Embeddings can be added later by inserting candidate IDs from a vector search.
     *
     * @return BaseCollection<int, Comic>
     */
    public function similar(Comic $seed, int $limit = 12): BaseCollection
    {
        $seedTags = collect($seed->tags ?? [])->filter()->map(fn ($t) => mb_strtolower((string) $t))->unique()->all();

        if (!$seed->series && !$seed->publisher && !$seed->language && $seedTags === []) {
            return collect();
        }

        $q = Comic::query()
            ->visible()
            ->where('comics.id', '!=', $seed->id);

        $q->where(function ($outer) use ($seed, $seedTags) {
            $outer->whereRaw('0 = 1');
            if ($seed->series) {
                $outer->orWhere('series', $seed->series);
            }
            if ($seed->publisher) {
                $outer->orWhere('publisher', $seed->publisher);
            }
            if ($seed->language) {
                $outer->orWhere('language', $seed->language);
            }
            if ($seed->publisher && $seed->language) {
                $outer->orWhere(function ($p) use ($seed) {
                    $p->where('publisher', $seed->publisher)
                        ->where('language', $seed->language);
                });
            }
            foreach (array_slice($seedTags, 0, 12) as $tag) {
                $safe = addcslashes($tag, '%_\\');
                $outer->orWhere('tags', 'like', '%' . $safe . '%');
            }
        });

        /** @var BaseCollection<int, Comic> $candidates */
        $candidates = $q->limit(120)->get();

        $scored = $candidates->map(function (Comic $c) use ($seed, $seedTags) {
            $score = 0;
            if ($seed->series && $c->series === $seed->series) {
                $score += 100;
            }
            if ($seed->publisher && $c->publisher === $seed->publisher
                && $seed->language && $c->language === $seed->language) {
                $score += 40;
            }
            $cTags = collect($c->tags ?? [])->map(fn ($t) => mb_strtolower((string) $t));
            foreach ($seedTags as $t) {
                if ($t !== '' && $cTags->contains($t)) {
                    $score += 15;
                }
            }
            if ($seed->series_index !== null && $c->series_index !== null
                && abs((float) $c->series_index - (float) $seed->series_index) <= 1.5) {
                $score += 10;
            }

            return ['comic' => $c, 'score' => $score];
        })
            ->sortByDesc('score')
            ->values();

        return $scored
            ->take($limit)
            ->pluck('comic')
            ->filter(fn (Comic $c) => $c->id !== $seed->id);
    }
}
