import { Head, Link } from '@inertiajs/react';
import {
    BookMarked,
    ChevronRight,
    Layers,
    Library,
    Sparkles,
} from 'lucide-react';
import ComicLayout from '@/Layouts/ComicLayout';

export default function Index({ shelves }) {
    const totalComics = shelves.reduce((n, s) => n + (s.comics_count || 0), 0);
    const totalStacks = shelves.length;

    return (
        <ComicLayout>
            <Head title="Browse stacks" />

            <div className="relative min-w-0 pb-10">
                {/* subtle newsstand backdrop */}
                <div
                    className="pointer-events-none absolute inset-0 -top-4 opacity-[0.07] motion-reduce:opacity-0"
                    aria-hidden
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(232,0,61,0.9) 1px, transparent 0)`,
                        backgroundSize: '10px 10px',
                    }}
                />

                <div className="relative">
                    {/* Masthead */}
                    <header className="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#12121c] via-[#0b0b12] to-[#06060a] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                        <div className="relative px-5 py-7 sm:px-8 sm:py-9">
                            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#e8003d]/12 blur-3xl" aria-hidden />
                            <div className="pointer-events-none absolute -bottom-24 left-1/4 h-40 w-40 rounded-full bg-[#e8003d]/6 blur-3xl" aria-hidden />

                            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                <div className="min-w-0 max-w-2xl">
                                    <p className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#e8003d]">
                                        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                                        ComicVault
                                    </p>
                                    <h1
                                        className="break-words text-[clamp(2rem,5vw,2.75rem)] leading-[0.95] tracking-[0.12em] text-white"
                                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                    >
                                        Browse{' '}
                                        <span className="text-[#e8003d]" style={{ textShadow: '0 0 40px rgba(232,0,61,0.35)' }}>
                                            stacks
                                        </span>
                                    </h1>
                                    <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-[#8888a0]">
                                        Shop the wall—every stack is a curated run, event, or era. Pick a shelf to open the
                                        long box.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 backdrop-blur-sm">
                                        <Layers className="h-5 w-5 shrink-0 text-[#e8003d]" strokeWidth={2} aria-hidden />
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#55556a]">Stacks</p>
                                            <p className="font-['Bebas_Neue',sans-serif] text-2xl leading-none tracking-wider text-white">
                                                {totalStacks}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 backdrop-blur-sm">
                                        <BookMarked className="h-5 w-5 shrink-0 text-emerald-400/90" strokeWidth={2} aria-hidden />
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#55556a]">Issues</p>
                                            <p className="font-['Bebas_Neue',sans-serif] text-2xl leading-none tracking-wider text-white tabular-nums">
                                                {totalComics}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('comics.index')}
                                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8c8dc] transition-all hover:border-[#e8003d]/40 hover:bg-[#e8003d]/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
                                    >
                                        <Library className="h-4 w-4 text-[#e8003d]" strokeWidth={2} aria-hidden />
                                        Full library
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Shelf grid */}
                    {shelves.length > 0 ? (
                        <ul
                            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            role="list"
                        >
                            {shelves.map((shelf, idx) => {
                                const headingId = `shelf-card-title-${idx}`;
                                return (
                                <li key={shelf.id}>
                                    <Link
                                        href={route('shelves.show', shelf.id)}
                                        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b12]/90 shadow-[0_12px_40px_rgba(0,0,0,0.35)] outline-none transition-all duration-300 hover:-translate-y-1 hover:border-[#e8003d]/35 hover:shadow-[0_18px_48px_rgba(232,0,61,0.12)] focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a] motion-reduce:transform-none"
                                    >
                                        {/* “Comic cover” frame */}
                                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0d0d14]">
                                            <div
                                                className="pointer-events-none absolute inset-0 z-[1] ring-1 ring-inset ring-white/[0.08]"
                                                aria-hidden
                                            />
                                            <div
                                                className="pointer-events-none absolute inset-x-3 top-3 z-[2] h-1 rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
                                                aria-hidden
                                            />

                                            {shelf.cover_image ? (
                                                <img
                                                    src={shelf.cover_image}
                                                    alt=""
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#161622] to-[#08080f] px-6 text-center">
                                                    <BookMarked
                                                        className="h-14 w-14 text-white/[0.08]"
                                                        strokeWidth={1.25}
                                                        aria-hidden
                                                    />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3a3a4a]">
                                                        No cover art
                                                    </span>
                                                </div>
                                            )}

                                            <div
                                                className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#050508] via-[#050508]/40 to-transparent opacity-90"
                                                aria-hidden
                                            />

                                            <div className="absolute bottom-0 left-0 right-0 z-[2] p-4">
                                                <p
                                                    className="font-['Bebas_Neue',sans-serif] text-[22px] leading-tight tracking-[0.08em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
                                                    id={headingId}
                                                >
                                                    {shelf.name}
                                                </p>
                                            </div>

                                            <div className="absolute right-3 top-3 z-[3]">
                                                <span className="inline-flex items-center rounded-md border border-white/10 bg-black/55 px-2 py-1 text-[10px] font-bold tabular-nums text-white backdrop-blur-md">
                                                    {shelf.comics_count}{' '}
                                                    <span className="ml-1 text-[9px] font-semibold uppercase tracking-wider text-[#a0a0b8]">
                                                        books
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        <article
                                            className="flex flex-1 flex-col border-t border-white/[0.06] bg-[#08080f]/95 px-4 pb-4 pt-4"
                                            aria-labelledby={headingId}
                                        >
                                            <p className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug text-[#8888a0]">
                                                {shelf.description || 'Explore this stack—pulls, keys, and reader picks inside.'}
                                            </p>

                                            {shelf.children?.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Sub-stacks">
                                                    {shelf.children.slice(0, 3).map((child) => (
                                                        <span
                                                            key={child.id}
                                                            className="inline-flex items-center rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#9a9ab0]"
                                                        >
                                                            {child.name}
                                                        </span>
                                                    ))}
                                                    {shelf.children.length > 3 && (
                                                        <span className="inline-flex items-center px-1 text-[10px] font-bold text-[#55556a]">
                                                            +{shelf.children.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-auto flex items-center justify-between border-t border-white/[0.05] pt-3">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4a4a5c]">
                                                    Open stack
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#e8003d] transition-colors group-hover:text-[#ff4d73]">
                                                    Enter
                                                    <ChevronRight className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" strokeWidth={2.5} aria-hidden />
                                                </span>
                                            </div>
                                        </article>
                                    </Link>
                                </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-[#08080f]/80 px-6 py-20 text-center">
                            <Layers className="mb-4 h-12 w-12 text-[#3a3a48]" strokeWidth={1.25} aria-hidden />
                            <p className="max-w-sm text-[15px] font-medium text-[#8888a0]">
                                No stacks on the floor yet. Check back soon—or head to the full library.
                            </p>
                            <Link
                                href={route('comics.index')}
                                className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#e8003d] px-6 text-[12px] font-bold uppercase tracking-widest text-white transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
                            >
                                Go to library
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </ComicLayout>
    );
}
