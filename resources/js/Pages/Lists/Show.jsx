import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import ComicLayout from '@/Layouts/ComicLayout';

export default function ListsShow({ auth, playlist, comics: initialComics }) {
    const comics = initialComics || [];

    const reorder = (nextIds) => {
        router.post(
            route('lists.reorder', playlist.id),
            { order: nextIds },
            { preserveScroll: true },
        );
    };

    const move = (index, delta) => {
        const j = index + delta;
        if (j < 0 || j >= comics.length) return;
        const ids = comics.map((c) => c.id);
        const t = ids[j];
        ids[j] = ids[index];
        ids[index] = t;
        reorder(ids);
    };

    const removeComic = (comicId) => {
        if (!confirm('Remove this comic from the list?')) return;
        router.delete(route('lists.detach', { list: playlist.id, comic: comicId }), {
            preserveScroll: true,
        });
    };

    return (
        <ComicLayout auth={auth}>
            <Head title={playlist.name} />

            <div className="relative mx-auto max-w-3xl min-w-0 px-4 py-8 sm:px-6">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href={route('lists.index')}
                            className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)] transition hover:text-[var(--accent)]"
                        >
                            ← All lists
                        </Link>
                        <h1
                            className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            {playlist.name}
                        </h1>
                        <p className="mt-1 text-[14px] text-[var(--text-muted)]">
                            Drag order: use arrows to reorder your read-next queue.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (confirm('Delete this entire list? Comics stay in your library.')) {
                                router.delete(route('lists.destroy', playlist.id));
                            }
                        }}
                        className="min-h-11 self-start rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-[11px] font-semibold uppercase tracking-wider text-red-400 transition hover:bg-red-500/20 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                    >
                        Delete list
                    </button>
                </div>

                {comics.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center text-[var(--text-muted)]">
                        This list is empty. Add titles from a comic&apos;s reader toolbar (Read lists) or from library cards when that ships.
                    </div>
                ) : (
                    <ol className="flex flex-col gap-2" role="list">
                        {comics.map((c, index) => (
                            <li
                                key={c.id}
                                className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-3 sm:flex-row sm:items-center"
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[12px] font-bold tabular-nums text-[var(--text-dim)]">
                                        {index + 1}
                                    </span>
                                    <Link
                                        href={route('comics.show', c.id)}
                                        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                                    >
                                    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md border border-white/10 bg-[var(--bg2)]">
                                        <img
                                            src={c.thumbnail ? `/thumbs/${c.thumbnail}` : '/img/no-thumb.jpg'}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate font-medium text-[var(--text)]">{c.title}</div>
                                        {c.series && (
                                            <div className="truncate text-[12px] text-[var(--text-dim)]">{c.series}</div>
                                        )}
                                    </div>
                                </Link>
                                </div>
                                <div className="flex w-full shrink-0 flex-row items-center justify-end gap-2 border-t border-[var(--border)] pt-3 sm:w-auto sm:justify-start sm:border-t-0 sm:pt-0">
                                    <button
                                        type="button"
                                        onClick={() => move(index, -1)}
                                        disabled={index === 0}
                                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:min-h-9 sm:min-w-9"
                                        aria-label={`Move ${c.title} up`}
                                    >
                                        <ChevronUp className="h-4 w-4" strokeWidth={2} aria-hidden />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(index, 1)}
                                        disabled={index === comics.length - 1}
                                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:min-h-9 sm:min-w-9"
                                        aria-label={`Move ${c.title} down`}
                                    >
                                        <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeComic(c.id)}
                                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-transparent text-[var(--text-dim)] transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 sm:min-h-9 sm:min-w-9"
                                        aria-label={`Remove ${c.title} from list`}
                                    >
                                        <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </ComicLayout>
    );
}
