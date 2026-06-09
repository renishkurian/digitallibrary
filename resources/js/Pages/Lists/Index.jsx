import { Head, Link, useForm } from '@inertiajs/react';
import { ListPlus, Layers } from 'lucide-react';
import ComicLayout from '@/Layouts/ComicLayout';

export default function ListsIndex({ auth, playlists }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('lists.store'), {
            preserveScroll: true,
            onSuccess: () => reset('name'),
        });
    };

    return (
        <ComicLayout auth={auth}>
            <Head title="Read lists" />

            <div className="relative mx-auto max-w-3xl min-w-0 px-4 py-8 sm:px-6">
                <header className="mb-10">
                    <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                        <Layers className="h-4 w-4" strokeWidth={2} aria-hidden />
                        Discovery
                    </div>
                    <h1
                        className="mt-2 text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-tight text-[var(--text)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Read next <span className="text-[var(--accent)]">lists</span>
                    </h1>
                    <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[var(--text-muted)]">
                        Ordered queues for what to open next—separate from shelves. Use them for story arcs,
                        borrowed recommendations, or a private queue.
                    </p>
                </header>

                <form
                    onSubmit={submit}
                    className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-5 backdrop-blur-sm"
                >
                    <label htmlFor="list-name" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
                        New list
                    </label>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <input
                            id="list-name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Finish this weekend"
                            className="min-h-11 w-full flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg2)] px-4 py-2.5 text-[15px] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            disabled={processing || !data.name.trim()}
                            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-[12px] font-semibold uppercase tracking-wider text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                        >
                            <ListPlus className="h-4 w-4" strokeWidth={2} aria-hidden />
                            Create
                        </button>
                    </div>
                    {errors.name && (
                        <p className="mt-2 text-[13px] text-red-400" role="alert">
                            {errors.name}
                        </p>
                    )}
                </form>

                {playlists.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/[0.02] px-8 py-16 text-center">
                        <p className="text-[15px] text-[var(--text-muted)]">No lists yet. Create one above to start a read-next queue.</p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-2" role="list">
                        {playlists.map((p) => (
                            <li key={p.id}>
                                <Link
                                    href={route('lists.show', p.id)}
                                    className="group flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 px-5 py-4 transition hover:border-[var(--accent)]/35 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                                >
                                    <div className="min-w-0 text-left">
                                        <span className="block truncate font-semibold text-[var(--text)] group-hover:text-[var(--accent-hover)]">
                                            {p.name}
                                        </span>
                                        <span className="text-[12px] text-[var(--text-dim)] tabular-nums">
                                            {p.comics_count} {p.comics_count === 1 ? 'title' : 'titles'}
                                        </span>
                                    </div>
                                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)] group-hover:text-[var(--text)]">
                                        Open →
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </ComicLayout>
    );
}
