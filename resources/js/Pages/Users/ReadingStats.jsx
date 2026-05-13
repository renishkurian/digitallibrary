import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    BarChart3,
    BookOpen,
    Calendar,
    ChevronRight,
    Clock,
    Flame,
    Gauge,
    Library,
    Sparkles,
} from 'lucide-react';
import { useMemo } from 'react';
import ComicLayout from '@/Layouts/ComicLayout';

/** Gradient border shell — modern “raised glass” without extra deps */
function GradientFrame({ children, className = '' }) {
    return (
        <div
            className={`rounded-2xl bg-gradient-to-br from-white/[0.16] via-white/[0.04] to-transparent p-[1px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)] ${className}`}
        >
            <div className="h-full rounded-[15px] bg-[var(--surface)]/90 ring-1 ring-white/[0.04] backdrop-blur-xl">
                {children}
            </div>
        </div>
    );
}

export default function ReadingStats({ auth, comicStats, dailyLogs }) {
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0 || parts.length === 0) parts.push(`${s}s`);
        return parts.join(' ');
    };

    const totalSeconds = comicStats.reduce((sum, c) => sum + c.total_seconds, 0);
    const bookCount = comicStats.length;
    const avgSeconds = bookCount > 0 ? Math.round(totalSeconds / bookCount) : 0;
    const maxComicSeconds = useMemo(
        () => (comicStats.length ? Math.max(...comicStats.map((c) => c.total_seconds), 1) : 1),
        [comicStats],
    );

    const chartDays = useMemo(() => [...dailyLogs].reverse(), [dailyLogs]);
    const peakSeconds = useMemo(
        () => Math.max(...chartDays.map((d) => d.total_seconds), 1),
        [chartDays],
    );

    return (
        <ComicLayout auth={auth}>
            <Head title="Reading stats" />

            <main className="relative isolate pb-24 [--rs-pad:1.25rem] sm:[--rs-pad:1.5rem]">
                {/* Depth stack: mesh + noise + vignette */}
                <div className="pointer-events-none fixed inset-0 -z-30 bg-[var(--bg)]" aria-hidden />
                <div
                    className="pointer-events-none fixed inset-0 -z-20 opacity-80"
                    aria-hidden
                    style={{
                        background:
                            'radial-gradient(ellipse 120% 80% at 10% -20%, rgba(232,0,61,0.22), transparent 55%), radial-gradient(ellipse 90% 60% at 95% 10%, rgba(59,130,246,0.12), transparent 45%), radial-gradient(ellipse 70% 50% at 50% 110%, rgba(232,0,61,0.08), transparent 50%)',
                    }}
                />
                <div
                    className="pointer-events-none fixed inset-0 -z-10 mix-blend-overlay opacity-[0.07]"
                    aria-hidden
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    }}
                />
                <div
                    className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)]"
                    aria-hidden
                />

                <div
                    className="relative mx-auto max-w-[1200px] px-[var(--rs-pad)] pt-4"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    {/* ── Hero bento ── */}
                    <div className="mb-10 grid gap-4 lg:grid-cols-[1.15fr_minmax(0,0.85fr)]">
                        <GradientFrame className="min-h-[200px] motion-safe:animate-fadeUp">
                            <div className="relative overflow-hidden p-6 sm:p-8">
                                <div
                                    className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl"
                                    style={{ background: 'var(--accent-glow)' }}
                                    aria-hidden
                                />
                                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                                            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                                            Analytics
                                        </p>
                                        <h1
                                            className="max-w-[14ch] text-[clamp(2rem,5vw,3rem)] font-semibold leading-[0.95] tracking-tight text-[var(--text)]"
                                            style={{ fontFamily: 'var(--font-display)' }}
                                        >
                                            Reading{' '}
                                            <span className="bg-gradient-to-r from-white via-white to-[var(--accent-hover)] bg-clip-text text-transparent">
                                                pulse
                                            </span>
                                        </h1>
                                        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--text-muted)]">
                                            Session time, depth per title, and a 30-day snapshot—tuned for quick scans and
                                            deeper loops.
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap sm:flex-col sm:items-end">
                                        <Link
                                            href={route('comics.index')}
                                            className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_0_30px_var(--accent-glow)] transition hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                                        >
                                            <Library className="h-4 w-4 opacity-90" strokeWidth={2} aria-hidden />
                                            Library
                                            <ArrowUpRight
                                                className="h-4 w-4 opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                                                strokeWidth={2}
                                                aria-hidden
                                            />
                                        </Link>
                                        <Link
                                            href={route('shelves.index')}
                                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-hover)] bg-white/[0.03] px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:border-[var(--border-hover)] hover:bg-white/[0.06] hover:text-[var(--text)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                                        >
                                            Shelves
                                            <ChevronRight className="h-4 w-4 opacity-50" strokeWidth={2} aria-hidden />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </GradientFrame>

                        {/* KPI strip — dl for semantics */}
                        <div className="grid min-h-full grid-cols-2 gap-3 md:grid-cols-1 lg:grid-rows-3 motion-safe:animate-fadeUp [animation-delay:60ms]">
                            <dl className="contents">
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4 shadow-lg shadow-black/20 backdrop-blur-md ring-1 ring-inset ring-white/[0.03]">
                                    <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                                        <Gauge className="h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={2} aria-hidden />
                                        Total time
                                    </dt>
                                    <dd className="mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-wide text-[var(--text)]">
                                        {formatTime(totalSeconds)}
                                    </dd>
                                </div>
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4 shadow-lg shadow-black/20 backdrop-blur-md ring-1 ring-inset ring-white/[0.03]">
                                    <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                                        <BookOpen className="h-3.5 w-3.5 text-sky-400/90" strokeWidth={2} aria-hidden />
                                        In rotation
                                    </dt>
                                    <dd className="mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-wide text-[var(--accent)]">
                                        {bookCount}
                                    </dd>
                                </div>
                                <div className="col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4 shadow-lg shadow-black/20 backdrop-blur-md ring-1 ring-inset ring-white/[0.03] md:col-span-1">
                                    <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                                        <Flame className="h-3.5 w-3.5 text-amber-400/90" strokeWidth={2} aria-hidden />
                                        Avg / title
                                    </dt>
                                    <dd className="mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-wide text-emerald-400">
                                        {bookCount ? formatTime(avgSeconds) : '—'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Activity spark — pure CSS bars */}
                    {chartDays.length > 0 && (
                        <section
                            className="mb-10 motion-safe:animate-fadeUp [animation-delay:90ms]"
                            aria-labelledby="activity-chart-heading"
                        >
                            <GradientFrame>
                                <div className="p-5 sm:p-6">
                                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                                        <div>
                                            <h2
                                                id="activity-chart-heading"
                                                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]"
                                            >
                                                <BarChart3 className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} aria-hidden />
                                                Session intensity
                                            </h2>
                                            <p className="mt-1 text-[13px] text-[var(--text-dim)]">
                                                Relative reading volume by day (last {chartDays.length} active days).
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className="flex h-36 items-end gap-1 sm:gap-1.5"
                                        role="img"
                                        aria-label={`Bar chart of reading time over ${chartDays.length} days. Peak day ${formatTime(peakSeconds)}.`}
                                    >
                                        {chartDays.map((day) => {
                                            const pct = Math.round((day.total_seconds / peakSeconds) * 100);
                                            return (
                                                <div
                                                    key={day.date}
                                                    className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                                                >
                                                    <div className="relative flex h-28 w-full max-w-[48px] flex-col justify-end sm:max-w-none">
                                                        <div
                                                            className="w-full min-h-[4px] rounded-md bg-gradient-to-t from-[var(--accent)] to-[var(--accent-hover)] opacity-90 transition-[height,opacity] duration-300 ease-out group-hover:opacity-100 motion-reduce:transition-none"
                                                            style={{ height: `${Math.max(pct, 4)}%` }}
                                                        />
                                                    </div>
                                                    <span className="max-w-full truncate px-0.5 text-center text-[9px] font-medium uppercase tracking-wider text-[var(--text-dim)] sm:text-[10px]">
                                                        {day.date.replace(/,\s*\d{4}$/, '')}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </GradientFrame>
                        </section>
                    )}

                    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
                        {/* Comics — relative share bars */}
                        <section aria-labelledby="books-heading">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <h2
                                    id="books-heading"
                                    className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]"
                                >
                                    By title
                                </h2>
                                <span className="hidden text-[11px] text-[var(--text-dim)] sm:inline">Share of your total time</span>
                            </div>

                            {bookCount === 0 ? (
                                <GradientFrame>
                                    <div className="flex flex-col items-center px-6 py-16 text-center">
                                        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
                                            <Clock className="h-8 w-8 text-[var(--text-dim)]" strokeWidth={1.5} aria-hidden />
                                        </div>
                                        <p className="max-w-sm text-[15px] text-[var(--text-muted)]">
                                            No sessions logged yet. Open any comic—the reader tracks time in the background.
                                        </p>
                                        <Link
                                            href={route('comics.index')}
                                            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                                        >
                                            Go to library
                                        </Link>
                                    </div>
                                </GradientFrame>
                            ) : (
                                <ul className="flex flex-col gap-3" role="list">
                                    {comicStats.map((comic, i) => {
                                        const share = totalSeconds ? (comic.total_seconds / totalSeconds) * 100 : 0;
                                        const rel = (comic.total_seconds / maxComicSeconds) * 100;
                                        return (
                                            <li
                                                key={comic.id}
                                                className="motion-safe:animate-fadeUp"
                                                style={{ animationDelay: `${Math.min(i * 45, 400)}ms` }}
                                            >
                                                <GradientFrame className="transition hover:shadow-[0_12px_40px_-8px_rgba(232,0,61,0.12)]">
                                                    <article className="relative p-3 sm:p-4">
                                                        <div className="flex gap-4">
                                                            <div className="relative aspect-[3/4] h-[92px] shrink-0 overflow-hidden rounded-xl bg-[var(--bg2)] shadow-inner ring-1 ring-white/10">
                                                                <img
                                                                    src={
                                                                        comic.thumbnail
                                                                            ? `/thumbs/${comic.thumbnail}`
                                                                            : '/img/no-thumb.jpg'
                                                                    }
                                                                    alt=""
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="min-w-0 flex-1 py-0.5">
                                                                <Link
                                                                    href={route('comics.show', comic.id)}
                                                                    className="group/title inline-flex max-w-full items-center gap-1 text-[15px] font-semibold text-[var(--text)] transition-colors hover:text-[var(--accent-hover)] focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                                                                >
                                                                    <span className="truncate">{comic.title}</span>
                                                                    <ArrowUpRight
                                                                        className="h-4 w-4 shrink-0 opacity-0 transition group-hover/title:opacity-60 motion-reduce:opacity-60"
                                                                        strokeWidth={2}
                                                                        aria-hidden
                                                                    />
                                                                </Link>
                                                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--text-muted)]">
                                                                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                                                                        <Clock
                                                                            className="h-3.5 w-3.5 text-[var(--accent)]"
                                                                            strokeWidth={2}
                                                                            aria-hidden
                                                                        />
                                                                        {formatTime(comic.total_seconds)}
                                                                    </span>
                                                                    <span className="text-[var(--text-dim)]" aria-hidden>
                                                                        ·
                                                                    </span>
                                                                    <span className="tabular-nums">
                                                                        Page {comic.last_page ?? '—'}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-3 space-y-1">
                                                                    <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-[var(--text-dim)]">
                                                                        <span>Depth vs shelf</span>
                                                                        <span className="tabular-nums text-[var(--text-muted)]">
                                                                            {share.toFixed(0)}%
                                                                        </span>
                                                                    </div>
                                                                    <div
                                                                        className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                                                                        role="presentation"
                                                                    >
                                                                        <div
                                                                            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
                                                                            style={{ width: `${rel}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="hidden w-[88px] shrink-0 text-right text-[11px] leading-snug sm:block">
                                                                <div className="font-medium uppercase tracking-wider text-[var(--text-dim)]">
                                                                    Last
                                                                </div>
                                                                <div className="mt-1 text-[var(--text-muted)]">{comic.last_read}</div>
                                                            </div>
                                                        </div>
                                                    </article>
                                                </GradientFrame>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>

                        {/* Daily log — sticky rail */}
                        <section className="lg:sticky lg:top-24 lg:self-start" aria-labelledby="daily-heading">
                            <div className="mb-5 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-sky-400" strokeWidth={2} aria-hidden />
                                <h2
                                    id="daily-heading"
                                    className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]"
                                >
                                    Day log
                                </h2>
                            </div>
                            <p className="mb-4 text-[13px] leading-relaxed text-[var(--text-dim)]">
                                Recent days with reading sessions (newest first).
                            </p>

                            {dailyLogs.length === 0 ? (
                                <GradientFrame>
                                    <div className="flex flex-col items-center px-5 py-12 text-center">
                                        <Calendar className="mb-3 h-9 w-9 text-[var(--text-dim)]" strokeWidth={1.25} aria-hidden />
                                        <p className="text-[14px] text-[var(--text-muted)]">No daily entries in the last 30 days.</p>
                                    </div>
                                </GradientFrame>
                            ) : (
                                <ol className="relative max-h-[min(70vh,640px)] space-y-0 overflow-y-auto overflow-x-hidden border-l border-[var(--border)] pl-5 pr-1 [scrollbar-color:var(--accent)_transparent] [scrollbar-width:thin]">
                                    <div className="absolute left-0 top-2 bottom-2 w-px -translate-x-[0.5px] bg-gradient-to-b from-[var(--accent)]/50 via-white/10 to-transparent" aria-hidden />
                                    {dailyLogs.map((log) => (
                                        <li key={log.date} className="relative pb-8 last:pb-2">
                                            <span
                                                className="absolute -left-5 top-1.5 flex h-2.5 w-2.5 -translate-x-[5px] items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]"
                                                aria-hidden
                                            />
                                            <GradientFrame>
                                                <div className="overflow-hidden">
                                                    <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-black/20 px-4 py-3">
                                                        <span className="text-[13px] font-semibold text-[var(--text)]">
                                                            {log.date}
                                                        </span>
                                                        <span className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-hover)] tabular-nums">
                                                            {formatTime(log.total_seconds)}
                                                        </span>
                                                    </div>
                                                    <ul className="divide-y divide-[var(--border)]" role="list">
                                                        {log.comics.map((c) => (
                                                            <li
                                                                key={`${log.date}-${c.id}-${c.title}`}
                                                                className="flex items-start justify-between gap-3 px-4 py-2.5 text-[12px]"
                                                            >
                                                                <span className="min-w-0 flex-1 font-medium leading-snug text-[var(--text-muted)]">
                                                                    {c.title}
                                                                </span>
                                                                <span className="shrink-0 tabular-nums text-[var(--text-dim)]">
                                                                    {formatTime(c.seconds)}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </GradientFrame>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </ComicLayout>
    );
}
