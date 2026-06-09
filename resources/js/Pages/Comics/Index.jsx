import { useState, useEffect } from 'react';
import { Link, Head, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import ComicCard from '@/Components/ComicCard';
import Pagination from '@/Components/Pagination';

/* ── tiny icon helpers ────────────────────────────────────── */
const GridIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
);
const ListIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3" cy="6" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="3" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="3" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
);
const RackIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
);
const FilterIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
);
const ChevronRight = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
);
const CheckIcon = () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>
);

export default function Index({ comics, filters, auth, shelves, categories, recentlyRead, discoveryFacets = { series: [], publishers: [], languages: [] } }) {
    const [showSidebar, setShowSidebar] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    );
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024 && showSidebar) setShowSidebar(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showSidebar]);

    const hasActiveFilters =
        filters.status ||
        filters.shelf ||
        filters.category ||
        filters.date_from ||
        filters.date_to ||
        filters.personal ||
        filters.shared ||
        filters.hidden ||
        filters.series ||
        filters.publisher ||
        filters.language ||
        filters.rating_min ||
        filters.rating_max ||
        filters.year_from ||
        filters.year_to;

    const applyDiscovery = (patch) => {
        router.get(route('comics.index'), { ...filters, ...patch }, { preserveState: true });
    };
    return (
        <ComicLayout auth={auth}>
            <Head title="All Comics" />

            {/* ── PAGE HEADER ── */}
            <div className="mb-6 min-w-0 border-b border-white/[0.06] pt-6 pb-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start lg:items-center lg:justify-between lg:gap-4">
                    {/* Title + filter toggle */}
                    <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[1.5px] transition-all duration-200 ${
                                showSidebar
                                    ? 'bg-[#e8003d] text-white border-[#e8003d] shadow-[0_2px_16px_rgba(232,0,61,0.28)]'
                                    : 'bg-white/[0.04] text-[#6868a0] border-white/[0.09] hover:text-white hover:border-white/[0.18] hover:bg-white/[0.07]'
                            }`}
                        >
                            <FilterIcon />
                            Filters
                        </button>
                        <div className="min-w-0 flex-1 sm:flex-none">
                            <h1 className="break-words font-['Bebas_Neue'] text-[clamp(1.625rem,5vw,2.25rem)] leading-none uppercase tracking-[3px] text-white sm:text-[36px]">
                                Library <span className="text-[#e8003d]">Archive</span>
                            </h1>
                        </div>
                    </div>

                    {/* Stats + view toggles */}
                    <div className="flex w-full flex-wrap items-center gap-4 sm:w-auto lg:justify-end">
                        <div className="flex flex-wrap items-center gap-3 text-[12px]">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[20px] font-['Bebas_Neue'] text-[#e8003d] leading-none">{comics.total}</span>
                                <span className="text-[#4a4a6a] font-semibold tracking-widest uppercase">Comics</span>
                            </div>
                            <div className="w-px h-4 bg-white/[0.1]" />
                            <div className="flex items-center gap-1.5">
                                <span className="text-[20px] font-['Bebas_Neue'] text-white leading-none">{comics.last_page}</span>
                                <span className="text-[#4a4a6a] font-semibold tracking-widest uppercase">Pages</span>
                            </div>
                        </div>

                        {/* View mode toggle */}
                        <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
                            {[
                                { mode: 'grid', Icon: GridIcon, title: 'Grid' },
                                { mode: 'list', Icon: ListIcon, title: 'List' },
                                { mode: 'rack', Icon: RackIcon, title: 'Rack' },
                            ].map(({ mode, Icon, title }) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    title={`${title} View`}
                                    type="button"
                                    className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg transition-all duration-200 sm:min-h-10 sm:min-w-10 sm:p-2 ${
                                        viewMode === mode
                                            ? 'bg-[#e8003d] text-white shadow-[0_1px_8px_rgba(232,0,61,0.4)]'
                                            : 'text-[#6868a0] hover:text-white hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <Icon />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Active filter chips */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="text-[10px] text-[#4a4a6a] uppercase tracking-widest font-semibold self-center">Active:</span>
                        {filters.status && (
                            <FilterChip label={filters.status.replace('_', ' ')} onRemove={() => router.get(route('comics.index', { ...filters, status: null }), {}, { preserveState: true })} />
                        )}
                        {filters.category && (
                            <FilterChip label={filters.category} onRemove={() => router.get(route('comics.index', { ...filters, category: null }), {}, { preserveState: true })} />
                        )}
                        {filters.personal && (
                            <FilterChip label="Personal" onRemove={() => router.get(route('comics.index', { ...filters, personal: null }), {}, { preserveState: true })} />
                        )}
                        {filters.shared && (
                            <FilterChip label="Shared" onRemove={() => router.get(route('comics.index', { ...filters, shared: null }), {}, { preserveState: true })} />
                        )}
                        {filters.hidden && (
                            <FilterChip label="Hidden" onRemove={() => router.get(route('comics.index', { ...filters, hidden: null }), {}, { preserveState: true })} />
                        )}
                        {(filters.date_from || filters.date_to) && (
                            <FilterChip label={`${filters.date_from || '…'} → ${filters.date_to || '…'}`} onRemove={() => router.get(route('comics.index', { ...filters, date_from: null, date_to: null }), {}, { preserveState: true })} />
                        )}
                        {filters.series && (
                            <FilterChip label={`Series: ${filters.series}`} onRemove={() => router.get(route('comics.index', { ...filters, series: null }), {}, { preserveState: true })} />
                        )}
                        {filters.publisher && (
                            <FilterChip label={`Publisher: ${filters.publisher}`} onRemove={() => router.get(route('comics.index', { ...filters, publisher: null }), {}, { preserveState: true })} />
                        )}
                        {filters.language && (
                            <FilterChip label={`Lang: ${filters.language}`} onRemove={() => router.get(route('comics.index', { ...filters, language: null }), {}, { preserveState: true })} />
                        )}
                        {(filters.rating_min || filters.rating_max) && (
                            <FilterChip
                                label={`Rating ${filters.rating_min || '…'}–${filters.rating_max || '…'}`}
                                onRemove={() =>
                                    router.get(route('comics.index', { ...filters, rating_min: null, rating_max: null }), {}, { preserveState: true })
                                }
                            />
                        )}
                        {(filters.year_from || filters.year_to) && (
                            <FilterChip
                                label={`Years ${filters.year_from || '…'}–${filters.year_to || '…'}`}
                                onRemove={() =>
                                    router.get(route('comics.index', { ...filters, year_from: null, year_to: null }), {}, { preserveState: true })
                                }
                            />
                        )}
                    </div>
                )}
            </div>

            {/* ── CONTINUE READING STRIP ── */}
            {recentlyRead && recentlyRead.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1 h-5 bg-[#e8003d] rounded-full shadow-[0_0_10px_rgba(232,0,61,0.5)]" />
                            <h2 className="text-[11px] font-bold tracking-[3px] uppercase text-white/80">Continue Reading</h2>
                        </div>
                        <Link
                            href={route('comics.index', { status: 'history' })}
                            className="flex items-center gap-1 text-[11px] font-semibold text-[#6868a0] hover:text-white transition-colors tracking-wider uppercase"
                        >
                            View All <ChevronRight />
                        </Link>
                    </div>

                    <div
                        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] scrollbar-hide motion-reduce:snap-none"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {recentlyRead.map(comic => (
                            <Link
                                key={comic.id}
                                href={route('comics.show', comic.id)}
                                className="group flex w-[116px] shrink-0 snap-start flex-col gap-2 sm:w-[130px]"
                            >
                                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/[0.07] group-hover:border-[#e8003d]/40 group-hover:shadow-[0_8px_30px_rgba(232,0,61,0.15)] transition-all duration-300 group-hover:-translate-y-1">
                                    <img
                                        src={comic.thumbnail ? `/thumbs/${comic.thumbnail}` : '/img/no-thumb.jpg'}
                                        alt={comic.title}
                                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-400"
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    {/* Progress bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                        <div
                                            className="h-full bg-[#e8003d] shadow-[0_0_6px_rgba(232,0,61,0.6)]"
                                            style={{ width: `${Math.min(100, Math.round(((comic.last_read_page || 1) / (comic.pages_count || 100)) * 100))}%` }}
                                        />
                                    </div>
                                    {/* Page badge */}
                                    <div className="absolute bottom-2.5 right-2 bg-black/60 backdrop-blur-md border border-white/[0.12] rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white/90 tracking-wide">
                                        P{comic.last_read_page}
                                    </div>
                                    {/* Hover label */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="bg-[#e8003d]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase shadow-lg">Resume →</span>
                                    </div>
                                </div>
                                <p className="text-[11px] font-medium text-[#7070a0] group-hover:text-white transition-colors truncate px-0.5 leading-tight">
                                    {comic.title}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── MAIN LAYOUT ── */}
            <div className="flex min-w-0 flex-col gap-8 transition-all duration-300 lg:flex-row lg:gap-10">

                {/* ── SIDEBAR ── */}
                <aside className={`w-full lg:w-[240px] shrink-0 transition-all duration-300 ${showSidebar ? 'block' : 'hidden'}`}>
                    <div
                        className="flex max-h-[min(70dvh,calc(100dvh-7.5rem))] flex-col gap-2 overflow-y-auto pb-4 pr-1 lg:sticky lg:top-[80px] lg:max-h-[calc(100vh-100px)]"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e8003d transparent' }}
                    >

                        {/* Status filter */}
                        <SidebarSection title="Status">
                            <div className="flex flex-wrap gap-1.5">
                                <FilterPill href={route('comics.index', { ...filters, status: null })} active={!filters.status}>All</FilterPill>
                                {auth.user && (
                                    <>
                                        <FilterPill href={route('comics.index', { ...filters, status: 'unread' })} active={filters.status === 'unread'}>Unread</FilterPill>
                                        <FilterPill href={route('comics.index', { ...filters, status: 'read' })} active={filters.status === 'read'}>Read</FilterPill>
                                        <FilterPill href={route('comics.index', { ...filters, status: 'currently_reading' })} active={filters.status === 'currently_reading'}>Reading</FilterPill>
                                        <FilterPill href={route('comics.index', { ...filters, status: 'completed' })} active={filters.status === 'completed'}>Completed</FilterPill>
                                    </>
                                )}
                            </div>
                        </SidebarSection>

                        {auth.user && (
                            <SidebarSection title="Smart views" subtitle="Saved progress filters">
                                <p className="mb-2 text-[11px] leading-snug text-[#5a5a72]">
                                    Same rules as status, grouped for quick discovery—not separate shelves.
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    <FilterPill
                                        href={route('comics.index', { ...filters, status: 'unfinished' })}
                                        active={filters.status === 'unfinished'}
                                    >
                                        Unfinished
                                    </FilterPill>
                                    <FilterPill
                                        href={route('comics.index', { ...filters, status: 'completed' })}
                                        active={filters.status === 'completed'}
                                    >
                                        Finished
                                    </FilterPill>
                                    <FilterPill
                                        href={route('comics.index', { ...filters, status: 'currently_reading' })}
                                        active={filters.status === 'currently_reading'}
                                    >
                                        In progress
                                    </FilterPill>
                                </div>
                            </SidebarSection>
                        )}

                        <SidebarSection
                            title="Metadata"
                            subtitle="Series, publisher, language"
                            action={
                                (filters.series ||
                                    filters.publisher ||
                                    filters.language ||
                                    filters.rating_min ||
                                    filters.rating_max ||
                                    filters.year_from ||
                                    filters.year_to) && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            applyDiscovery({
                                                series: null,
                                                publisher: null,
                                                language: null,
                                                rating_min: null,
                                                rating_max: null,
                                                year_from: null,
                                                year_to: null,
                                            })
                                        }
                                        className="text-[10px] text-[#e8003d] hover:text-[#ff4466] font-semibold uppercase tracking-wider transition-colors"
                                    >
                                        Clear
                                    </button>
                                )
                            }
                        >
                            <div className="flex flex-col gap-3">
                                <div>
                                    <label htmlFor="flt-series" className="text-[10px] text-[#4a4a6a] uppercase tracking-wider font-semibold">
                                        Series
                                    </label>
                                    <select
                                        id="flt-series"
                                        value={filters.series || ''}
                                        onChange={(e) => applyDiscovery({ series: e.target.value || null })}
                                        className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-[12px] text-white focus:ring-1 focus:ring-[#e8003d]/50"
                                    >
                                        <option value="">Any series</option>
                                        {discoveryFacets.series?.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="flt-publisher" className="text-[10px] text-[#4a4a6a] uppercase tracking-wider font-semibold">
                                        Publisher
                                    </label>
                                    <select
                                        id="flt-publisher"
                                        value={filters.publisher || ''}
                                        onChange={(e) => applyDiscovery({ publisher: e.target.value || null })}
                                        className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-[12px] text-white focus:ring-1 focus:ring-[#e8003d]/50"
                                    >
                                        <option value="">Any publisher</option>
                                        {discoveryFacets.publishers?.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="flt-language" className="text-[10px] text-[#4a4a6a] uppercase tracking-wider font-semibold">
                                        Language
                                    </label>
                                    <select
                                        id="flt-language"
                                        value={filters.language || ''}
                                        onChange={(e) => applyDiscovery({ language: e.target.value || null })}
                                        className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-[12px] text-white focus:ring-1 focus:ring-[#e8003d]/50"
                                    >
                                        <option value="">Any</option>
                                        {discoveryFacets.languages?.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label htmlFor="flt-rmin" className="text-[10px] text-[#4a4a6a] uppercase tracking-wider font-semibold">
                                            Rating min
                                        </label>
                                        <input
                                            id="flt-rmin"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="10"
                                            placeholder="0"
                                            value={filters.rating_min ?? ''}
                                            onChange={(e) =>
                                                applyDiscovery({
                                                    rating_min: e.target.value === '' ? null : e.target.value,
                                                })
                                            }
                                            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-2 text-[12px] text-white"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="flt-rmax" className="text-[10px] text-[#4a4a6a] uppercase tracking-wider font-semibold">
                                            Rating max
                                        </label>
                                        <input
                                            id="flt-rmax"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="10"
                                            placeholder="10"
                                            value={filters.rating_max ?? ''}
                                            onChange={(e) =>
                                                applyDiscovery({
                                                    rating_max: e.target.value === '' ? null : e.target.value,
                                                })
                                            }
                                            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-2 text-[12px] text-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label htmlFor="flt-yfrom" className="text-[10px] text-[#4a4a6a] uppercase tracking-wider font-semibold">
                                            Year from
                                        </label>
                                        <input
                                            id="flt-yfrom"
                                            type="number"
                                            min="1900"
                                            max="2100"
                                            placeholder="Year"
                                            value={filters.year_from ?? ''}
                                            onChange={(e) =>
                                                applyDiscovery({
                                                    year_from: e.target.value === '' ? null : e.target.value,
                                                })
                                            }
                                            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-2 text-[12px] text-white"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="flt-yto" className="text-[10px] text-[#4a4a6a] uppercase tracking-wider font-semibold">
                                            Year to
                                        </label>
                                        <input
                                            id="flt-yto"
                                            type="number"
                                            min="1900"
                                            max="2100"
                                            placeholder="Year"
                                            value={filters.year_to ?? ''}
                                            onChange={(e) =>
                                                applyDiscovery({
                                                    year_to: e.target.value === '' ? null : e.target.value,
                                                })
                                            }
                                            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-2 text-[12px] text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </SidebarSection>

                        {/* Published date */}
                        <SidebarSection
                            title="Published Date"
                            action={
                                (filters.date_from || filters.date_to) && (
                                    <button
                                        onClick={() => router.get(route('comics.index', { ...filters, date_from: null, date_to: null }), {}, { preserveState: true })}
                                        className="text-[10px] text-[#e8003d] hover:text-[#ff4466] font-semibold uppercase tracking-wider transition-colors"
                                    >Clear</button>
                                )
                            }
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-[#4a4a6a] uppercase tracking-wider font-semibold">From</label>
                                    <input
                                        type="date"
                                        value={filters.date_from || ''}
                                        onChange={(e) => router.get(route('comics.index', { ...filters, date_from: e.target.value || null }), {}, { preserveState: true })}
                                        className="bg-white/[0.04] border border-white/[0.08] text-white text-[12px] rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#e8003d]/50 focus:border-[#e8003d]/50 hover:border-white/[0.15] transition-all w-full [color-scheme:dark]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-[#4a4a6a] uppercase tracking-wider font-semibold">To</label>
                                    <input
                                        type="date"
                                        value={filters.date_to || ''}
                                        onChange={(e) => router.get(route('comics.index', { ...filters, date_to: e.target.value || null }), {}, { preserveState: true })}
                                        className="bg-white/[0.04] border border-white/[0.08] text-white text-[12px] rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#e8003d]/50 focus:border-[#e8003d]/50 hover:border-white/[0.15] transition-all w-full [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </SidebarSection>

                        {/* My Library */}
                        {auth.user && (
                            <SidebarSection title="My Library">
                                <div className="flex flex-col gap-0.5">
                                    {[
                                        {
                                            label: 'Personal Items', key: 'personal',
                                            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                                            href: route('comics.index', { ...filters, personal: filters.personal ? null : 1, shared: null, hidden: null }),
                                            active: !!filters.personal, color: 'text-blue-400 bg-blue-500/10',
                                        },
                                        {
                                            label: 'Shared With Me', key: 'shared',
                                            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                                            href: route('comics.index', { ...filters, shared: filters.shared ? null : 1, personal: null, hidden: null }),
                                            active: !!filters.shared, color: 'text-purple-400 bg-purple-500/10',
                                        },
                                        {
                                            label: 'Hidden Items', key: 'hidden',
                                            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
                                            href: route('comics.index', { ...filters, hidden: filters.hidden ? null : 1, personal: null, shared: null }),
                                            active: !!filters.hidden, color: 'text-[#e8003d] bg-[#e8003d]/10',
                                        },
                                        {
                                            label: 'Reading History', key: 'history',
                                            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                                            href: route('comics.index', { ...filters, status: filters.status === 'history' ? null : 'history' }),
                                            active: filters.status === 'history', color: 'text-amber-400 bg-amber-500/10',
                                        },
                                    ].map(({ label, icon, href, active, color }) => (
                                        <Link
                                            key={label}
                                            href={href}
                                            className={`flex items-center justify-between gap-2.5 text-[12.5px] py-2 px-3 rounded-xl transition-all ${
                                                active ? `${color} font-semibold` : 'text-[#7070a0] hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2.5">{icon} {label}</span>
                                            {active && <CheckIcon />}
                                        </Link>
                                    ))}
                                </div>
                            </SidebarSection>
                        )}

                        {/* Shelves */}
                        <SidebarSection
                            title="Shelves"
                            action={
                                filters.shelf && (
                                    <button
                                        onClick={() => router.get(route('comics.index', { ...filters, shelf: null }), {}, { preserveState: true })}
                                        className="text-[10px] text-[#e8003d] hover:text-[#ff4466] font-semibold uppercase tracking-wider transition-colors"
                                    >Clear</button>
                                )
                            }
                        >
                            <div className="flex flex-col gap-0.5">
                                <button
                                    onClick={() => router.get(route('comics.index', { ...filters, shelf: null }), {}, { preserveState: true })}
                                    className={`text-[12.5px] py-1.5 px-3 rounded-xl transition-all text-left ${
                                        !filters.shelf ? 'bg-[#e8003d]/10 text-[#ff3355] font-semibold' : 'text-[#7070a0] hover:text-white hover:bg-white/[0.04]'
                                    }`}
                                >All Shelves</button>
                                {shelves.map(shelf => {
                                    const selectedIds = filters.shelf ? filters.shelf.split(',') : [];
                                    const isSelected = selectedIds.includes(String(shelf.id));
                                    const toggleShelf = (id) => {
                                        let newIds = [...selectedIds];
                                        const idStr = String(id);
                                        if (newIds.includes(idStr)) {
                                            newIds = newIds.filter(i => i !== idStr);
                                        } else {
                                            newIds.push(idStr);
                                        }
                                        router.get(route('comics.index', { ...filters, shelf: newIds.length > 0 ? newIds.join(',') : null }), {}, { preserveState: true });
                                    };
                                    return (
                                        <div key={shelf.id} className="flex flex-col gap-0.5">
                                            <button
                                                onClick={() => toggleShelf(shelf.id)}
                                                className={`text-[12.5px] py-1.5 px-3 rounded-xl transition-all flex items-center gap-2 min-w-0 text-left ${
                                                    isSelected ? 'bg-[#e8003d]/10 text-[#ff3355] font-semibold' : 'text-[#7070a0] hover:text-white hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <div className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all ${
                                                    isSelected ? 'bg-[#e8003d] border-[#e8003d]' : 'border-white/20 bg-white/[0.04]'
                                                }`}>
                                                    {isSelected && <CheckIcon />}
                                                </div>
                                                <div className="w-5 h-5 rounded-[5px] overflow-hidden border border-white/[0.1] shrink-0 bg-[#0d0d14]">
                                                    {shelf.cover_image ? (
                                                        <img src={shelf.cover_image} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[7px] text-[#4a4a6a] uppercase font-black">NA</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex items-center justify-between min-w-0">
                                                    <span className="truncate">{shelf.name}</span>
                                                    <span className="text-[10px] text-[#4a4a6a] font-bold bg-white/[0.04] px-1.5 py-0.5 rounded-md ml-2 shrink-0">{shelf.comics_count}</span>
                                                </div>
                                            </button>
                                            {shelf.children?.length > 0 && (
                                                <div className="flex flex-col gap-0.5 ml-4 border-l border-white/[0.05] pl-2 mt-0.5">
                                                    {shelf.children.map(child => {
                                                        const childSelected = selectedIds.includes(String(child.id));
                                                        return (
                                                            <button
                                                                key={child.id}
                                                                onClick={() => toggleShelf(child.id)}
                                                                className={`text-[12px] py-1 px-2 rounded-lg transition-all flex items-center gap-2 text-left ${
                                                                    childSelected ? 'text-[#ff3355] font-semibold bg-[#e8003d]/5' : 'text-[#6060a0] hover:text-white hover:bg-white/[0.04]'
                                                                }`}
                                                            >
                                                                <div className={`w-3 h-3 rounded-[3px] border flex-shrink-0 flex items-center justify-center transition-all ${
                                                                    childSelected ? 'bg-[#e8003d] border-[#e8003d]' : 'border-white/20 bg-white/[0.04]'
                                                                }`}>
                                                                    {childSelected && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                                                                </div>
                                                                <span className="truncate flex-1">{child.name}</span>
                                                                <span className="text-[10px] text-[#4a4a6a] shrink-0">{child.comics_count}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </SidebarSection>

                        {/* Categories */}
                        <SidebarSection title="Categories">
                            <div className="flex flex-col gap-0.5">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex flex-col gap-0.5">
                                        <Link
                                            href={route('comics.index', { ...filters, category: cat.slug })}
                                            className={`text-[12.5px] py-1.5 px-3 rounded-xl transition-all ${
                                                filters.category == cat.slug ? 'bg-[#e8003d]/10 text-[#ff3355] font-semibold' : 'text-[#7070a0] hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                        >{cat.name}</Link>
                                        {cat.children?.length > 0 && (
                                            <div className="flex flex-col gap-0.5 ml-4 border-l border-white/[0.05] pl-2">
                                                {cat.children.map(child => (
                                                    <Link
                                                        key={child.id}
                                                        href={route('comics.index', { ...filters, category: child.slug })}
                                                        className={`text-[12px] py-1 px-2 rounded-lg transition-all ${
                                                            filters.category == child.slug ? 'text-[#ff3355] font-semibold' : 'text-[#5a5a90] hover:text-white hover:bg-white/[0.04]'
                                                        }`}
                                                    >{child.name}</Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </SidebarSection>
                    </div>
                </aside>

                {/* ── COMICS GRID ── */}
                <div className="flex-1 min-w-0 transition-all duration-300">
                    {comics.data.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <>
                            {viewMode === 'rack' ? (
                                <RackView comics={comics} auth={auth} />
                            ) : (
                                <div className={
                                    viewMode === 'grid'
                                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4 sm:gap-5'
                                        : 'flex flex-col gap-2.5'
                                }>
                                    {comics.data.map(comic => (
                                        <ComicCard key={comic.id} comic={comic} auth={auth} compact={viewMode === 'list'} />
                                    ))}
                                </div>
                            )}

                            <div className="mt-14 flex justify-center">
                                <Pagination links={comics.links} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ComicLayout>
    );
}

/* ── SUB-COMPONENTS ─────────────────────────────────────── */

function FilterChip({ label, onRemove }) {
    return (
        <button
            onClick={onRemove}
            className="flex items-center gap-1.5 text-[11px] font-semibold bg-[#e8003d]/10 border border-[#e8003d]/25 text-[#ff4466] px-2.5 py-1 rounded-full hover:bg-[#e8003d]/20 transition-colors uppercase tracking-wide"
        >
            {label}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        </button>
    );
}

function SidebarSection({ title, children, action, subtitle }) {
    return (
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                    <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-[#4a4a6a]">{title}</span>
                    {subtitle && (
                        <p className="mt-1 text-[10px] font-medium normal-case tracking-normal text-[#55556a] leading-snug">
                            {subtitle}
                        </p>
                    )}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function FilterPill({ href, active, children }) {
    return (
        <Link
            href={href}
            className={`px-3 py-1 rounded-full text-[11.5px] border transition-all font-medium ${
                active
                    ? 'bg-[#e8003d] text-white border-[#e8003d] shadow-[0_1px_10px_rgba(232,0,61,0.3)]'
                    : 'bg-white/[0.04] border-white/[0.08] text-[#7070a0] hover:text-white hover:border-white/[0.18] hover:bg-white/[0.07]'
            }`}
        >
            {children}
        </Link>
    );
}

function RackView({ comics, auth }) {
    return (
        <div className="flex flex-col gap-0 py-4 bg-[#030306] rounded-3xl border border-white/[0.05] shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
            {Array.from({ length: Math.ceil(comics.data.length / 6) }).map((_, rowIndex) => (
                <div key={rowIndex} className="relative group/row">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-[22px] z-20 pointer-events-none">
                        <div className="absolute bottom-[4px] left-0 right-0 h-[18px] bg-[#1a120b] [transform:rotateX(60deg)] origin-bottom shadow-inner opacity-90" />
                        <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-gradient-to-r from-[#2a1d13] via-[#3d2b1f] to-[#2a1d13] border-t border-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/5" />
                        </div>
                    </div>
                    <div className="relative z-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 px-6 pt-10 pb-[22px]">
                        {comics.data.slice(rowIndex * 6, (rowIndex + 1) * 6).map(comic => (
                            <div key={comic.id} className="relative group flex justify-center items-end h-[180px] sm:h-[220px]">
                                <div className="w-full transform transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.03] [transform-style:preserve-3d] [transform:rotateX(-5deg)] shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
                                    <ComicCard comic={comic} auth={auth} />
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-4 bg-black/80 blur-md -z-10 rounded-full" />
                            </div>
                        ))}
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-28 text-center bg-white/[0.015] border border-white/[0.05] rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-[#4a4a6a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
            <h3 className="text-[18px] font-['Bebas_Neue'] tracking-[3px] uppercase text-white/70 mb-2">No matching comics</h3>
            <p className="text-[13px] text-[#4a4a6a] font-light max-w-xs">Try adjusting your filters or search query to find what you're looking for.</p>
        </div>
    );
}
