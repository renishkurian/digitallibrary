import { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronRight,
    Copy,
    ExternalLink,
    Info,
    Layers,
    Loader2,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
} from 'lucide-react';
import ComicLayout from '@/Layouts/ComicLayout';
import Pagination from '@/Components/Pagination';
import ConfirmModal from '@/Components/ConfirmModal';

function GradientFrame({ children, className = '' }) {
    return (
        <div
            className={`rounded-2xl bg-gradient-to-br from-white/[0.14] via-white/[0.04] to-transparent p-px shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)] ${className}`}
        >
            <div className="h-full rounded-[15px] bg-[var(--surface)]/95 ring-1 ring-white/[0.04] backdrop-blur-xl">{children}</div>
        </div>
    );
}

export default function Duplicates({ auth, paginatedData, filters }) {
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        comicId: null,
        type: 'single',
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [syncStatus, setSyncStatus] = useState({ status: 'idle', progress: '', error: null, last_sync_at: null });

    useEffect(() => {
        let interval;
        const check = () =>
            fetch(route('admin.comics.sync-status'))
                .then((r) => r.json())
                .then((d) => {
                    setSyncStatus(d);
                    if (d.status !== 'running') clearInterval(interval);
                });
        if (syncStatus.status === 'running') interval = setInterval(check, 3000);
        else check();
        return () => clearInterval(interval);
    }, [syncStatus.status]);

    const { data: searchData, setData, get: getSearch } = useForm({
        q: filters.q || '',
    });

    const { post: syncPost, processing: syncProcessing } = useForm();

    const runSync = () =>
        syncPost(route('admin.comics.sync'), {
            onSuccess: () => setSyncStatus((p) => ({ ...p, status: 'running' })),
        });

    const handleSearch = (e) => {
        e.preventDefault();
        getSearch(route('admin.duplicates.index'));
    };

    const bulkTrash = () => {
        if (selectedIds.length === 0) return;
        setConfirmConfig({
            isOpen: true,
            title: 'Move to Trash',
            message: `Move ${selectedIds.length} selected files to Trash? They can be restored later from the Trash tab.`,
            comicId: null,
            type: 'bulk',
        });
    };

    const handleDelete = () => {
        if (confirmConfig.type === 'bulk') {
            router.post(route('admin.duplicates.bulk-trash'), { ids: selectedIds }, {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
                    setSelectedIds([]);
                },
            });
        } else {
            router.post(route('admin.duplicates.trash', confirmConfig.comicId), {}, {
                preserveScroll: true,
                onSuccess: () => setConfirmConfig((prev) => ({ ...prev, isOpen: false })),
            });
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const toggleGroupSelect = (groupItems) => {
        const groupIds = groupItems.map((item) => item.id);
        const allInGroupSelected = groupIds.every((id) => selectedIds.includes(id));

        if (allInGroupSelected) {
            setSelectedIds((prev) => prev.filter((id) => !groupIds.includes(id)));
        } else {
            setSelectedIds((prev) => [...new Set([...prev, ...groupIds])]);
        }
    };

    const selectAllDuplicates = () => {
        const toDeleteForG = (g) => g.items.filter((i) => i.id !== g.suggested_keep_id).map((i) => i.id);
        const allToDelete = duplicates.flatMap(toDeleteForG);
        const allAlreadySelected = allToDelete.length > 0 && allToDelete.every((id) => selectedIds.includes(id));

        if (allAlreadySelected) {
            setSelectedIds((prev) => prev.filter((id) => !allToDelete.includes(id)));
        } else {
            setSelectedIds((prev) => [...new Set([...prev, ...allToDelete])]);
        }
    };

    const duplicates = paginatedData.data;
    const allNonKeepSelected =
        duplicates.length > 0 &&
        duplicates.every((group) =>
            group.items
                .filter((item) => item.id !== group.suggested_keep_id)
                .every((item) => selectedIds.includes(item.id)),
        );

    return (
        <ComicLayout auth={auth}>
            <Head title="Duplicate Comics" />

            <div className="relative isolate pb-28">
                <div className="pointer-events-none fixed inset-0 -z-20 bg-[var(--bg)]" aria-hidden />
                <div
                    className="pointer-events-none fixed inset-0 -z-10 opacity-75"
                    aria-hidden
                    style={{
                        background:
                            'radial-gradient(ellipse 100% 70% at 8% -15%, rgba(232,0,61,0.18), transparent 50%), radial-gradient(ellipse 80% 50% at 100% 0%, rgba(59,130,246,0.1), transparent 45%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(232,0,61,0.06), transparent 42%)',
                    }}
                />

                <div className="relative mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8">
                    {/* Masthead toolbar */}
                    <header className="mb-8">
                        <GradientFrame>
                            <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex min-w-0 items-start gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent)]/35 bg-[var(--accent)]/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                        <Copy className="h-7 w-7 text-[#ff6b8a]" strokeWidth={1.75} aria-hidden />
                                    </div>
                                    <div>
                                        <p className="mb-1.5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                                            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                                            Admin
                                        </p>
                                        <h1
                                            className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-tight text-[var(--text)]"
                                            style={{ fontFamily: 'var(--font-display)' }}
                                        >
                                            Duplicate{' '}
                                            <span className="bg-gradient-to-r from-white to-[var(--accent-hover)] bg-clip-text text-transparent">
                                                detection
                                            </span>
                                        </h1>
                                        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
                                            Visual-hash clusters: same page content, different files. Smallest on-disk copy is
                                            suggested to keep.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                                    {syncStatus.status === 'running' && (
                                        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">
                                            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                                            {syncStatus.progress || 'Scanning…'}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={runSync}
                                        disabled={syncProcessing || syncStatus.status === 'running'}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-hover)] bg-white/[0.04] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] transition hover:border-white/20 hover:bg-white/[0.07] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                                        title="Scan filesystem for new comics and duplicates"
                                    >
                                        {syncProcessing || syncStatus.status === 'running' ? (
                                            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden />
                                        )}
                                        Ingress sync
                                    </button>

                                    <form onSubmit={handleSearch} className="flex w-full sm:w-auto sm:min-w-[280px]">
                                        <label htmlFor="dup-search" className="sr-only">
                                            Search duplicates by title, path, or filename
                                        </label>
                                        <div className="relative flex-1">
                                            <Search
                                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]"
                                                strokeWidth={2}
                                                aria-hidden
                                            />
                                            <input
                                                id="dup-search"
                                                type="search"
                                                name="q"
                                                autoComplete="off"
                                                placeholder="Search title, path, filename…"
                                                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)]/90 py-2 pl-10 pr-3 text-[14px] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
                                                value={searchData.q}
                                                onChange={(e) => setData('q', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="ml-2 inline-flex min-h-11 shrink-0 items-center rounded-xl bg-[var(--accent)] px-4 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                                        >
                                            Go
                                        </button>
                                    </form>

                                    <Link
                                        href={route('admin.comics.index', { approval: 'trash' })}
                                        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-hover)] transition hover:bg-[var(--accent)]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                                    >
                                        Trash
                                        <ChevronRight className="h-4 w-4 opacity-70" strokeWidth={2} aria-hidden />
                                    </Link>
                                    <Link
                                        href={route('admin.comics.index')}
                                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border-hover)] bg-white/[0.05] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] transition hover:border-white/20 hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                                    >
                                        Management
                                    </Link>
                                </div>
                            </div>
                        </GradientFrame>
                    </header>

                    {duplicates.length === 0 ? (
                        <GradientFrame>
                            <div className="flex flex-col items-center px-6 py-16 text-center sm:py-20">
                                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/[0.04]">
                                    {searchData.q ? (
                                        <Search className="h-8 w-8 text-[var(--text-dim)]" strokeWidth={1.5} aria-hidden />
                                    ) : (
                                        <CheckCircle2 className="h-8 w-8 text-emerald-400/90" strokeWidth={1.5} aria-hidden />
                                    )}
                                </div>
                                <h2 className="text-xl font-semibold text-[var(--text)]">
                                    {searchData.q ? 'No matches' : 'No duplicate clusters'}
                                </h2>
                                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--text-muted)]">
                                    {searchData.q
                                        ? `Nothing matched “${searchData.q}”. Try a shorter query or clear the filter.`
                                        : 'All indexed comics passed visual uniqueness for the current hash rules.'}
                                </p>
                                {searchData.q && (
                                    <Link
                                        href={route('admin.duplicates.index')}
                                        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border-hover)] px-6 text-[12px] font-semibold uppercase tracking-wider text-[var(--text)] transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                                    >
                                        Clear search
                                    </Link>
                                )}
                            </div>
                        </GradientFrame>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <aside
                                className="flex flex-col gap-4 rounded-2xl border border-sky-500/25 bg-sky-500/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                                aria-label="Duplicate detection rules"
                            >
                                <p className="flex gap-3 text-[13px] leading-relaxed text-[var(--text-muted)] sm:max-w-[65%]">
                                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" strokeWidth={2} aria-hidden />
                                    <span>
                                        Groups use visual hashing (same pages, tolerant to compression).{' '}
                                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                                            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                                            Keep
                                        </span>{' '}
                                        marks the smallest file we recommend retaining.
                                    </span>
                                </p>
                                <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-4 sm:border-t-0 sm:pt-0">
                                    <label className="flex cursor-pointer items-center gap-3">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded-md border-white/30 bg-white/[0.06] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
                                            checked={allNonKeepSelected}
                                            onChange={selectAllDuplicates}
                                        />
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text)]">
                                            Select all duplicates
                                        </span>
                                    </label>
                                    <span className="hidden h-8 w-px bg-white/10 sm:block" aria-hidden />
                                    <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-dim)]">
                                        <Layers className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} aria-hidden />
                                        {paginatedData.meta.total} groups
                                    </span>
                                </div>
                            </aside>

                            {syncStatus.status === 'running' && (
                                <div
                                    className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
                                            Library scan
                                        </span>
                                        <Loader2 className="h-4 w-4 animate-spin text-sky-400 motion-reduce:animate-none" aria-hidden />
                                    </div>
                                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full w-full animate-pulse rounded-full bg-sky-500/80 motion-reduce:animate-none" />
                                    </div>
                                    <p className="mt-2 text-[11px] italic text-[var(--text-dim)]">
                                        {syncStatus.progress || 'Scanning filesystem for new and duplicate comics…'}
                                    </p>
                                </div>
                            )}

                            {duplicates.map((group) => (
                                <GradientFrame key={group.hash} className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
                                    <div>
                                        <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 rounded-md border-white/30 bg-white/[0.08] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
                                                    checked={group.items.every((item) => selectedIds.includes(item.id))}
                                                    onChange={() => toggleGroupSelect(group.items)}
                                                    aria-label={`Select all files in cluster ${group.count}`}
                                                />
                                                <span className="inline-flex items-center rounded-full border border-[var(--accent)]/35 bg-[var(--accent)]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#ff9aad]">
                                                    {group.count} files
                                                </span>
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                                                        Visual hash
                                                    </span>
                                                    <span className="max-w-[min(100%,52rem)] truncate font-mono text-[12px] text-[var(--text-muted)]">
                                                        {group.hash}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-[var(--border)] text-left">
                                                <caption className="sr-only">
                                                    Files in this duplicate cluster with shelf, size, and actions
                                                </caption>
                                                <thead>
                                                    <tr className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">
                                                        <th scope="col" className="w-10 px-4 py-3 sm:px-6">
                                                            <span className="sr-only">Select</span>
                                                        </th>
                                                        <th scope="col" className="w-16 px-2 py-3">
                                                            Cover
                                                        </th>
                                                        <th scope="col" className="px-4 py-3 sm:px-6">
                                                            Title & path
                                                        </th>
                                                        <th scope="col" className="hidden px-4 py-3 md:table-cell">
                                                            Shelf
                                                        </th>
                                                        <th scope="col" className="whitespace-nowrap px-4 py-3">
                                                            Size
                                                        </th>
                                                        <th scope="col" className="px-4 py-3 text-right sm:px-6">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--border)]">
                                                    {group.items.map((comic) => {
                                                        const isSuggested = comic.id === group.suggested_keep_id;
                                                        const isRowSelected = selectedIds.includes(comic.id);
                                                        return (
                                                            <tr
                                                                key={comic.id}
                                                                className={`transition-colors motion-safe:duration-150 ${
                                                                    isRowSelected
                                                                        ? 'bg-[rgba(232,0,61,0.06)]'
                                                                        : 'hover:bg-white/[0.03]'
                                                                }`}
                                                            >
                                                                <td className="px-4 py-4 align-middle sm:px-6">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-5 w-5 rounded-md border-white/30 bg-white/[0.08] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
                                                                        checked={isRowSelected}
                                                                        onChange={() => toggleSelect(comic.id)}
                                                                        aria-label={`Select ${comic.title}`}
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-4 align-middle">
                                                                    <div
                                                                        className={`relative h-16 w-12 overflow-hidden rounded-lg bg-[var(--bg2)] shadow-inner ring-1 ${
                                                                            isRowSelected
                                                                                ? 'ring-[var(--accent)]'
                                                                                : isSuggested
                                                                                  ? 'ring-emerald-500/45'
                                                                                  : 'ring-white/10'
                                                                        }`}
                                                                    >
                                                                        {comic.thumbnail ? (
                                                                            <img
                                                                                src={`/thumbs/${comic.thumbnail}`}
                                                                                alt=""
                                                                                loading="lazy"
                                                                                decoding="async"
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex h-full w-full items-center justify-center font-mono text-[9px] text-[var(--text-dim)]">
                                                                                PDF
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="max-w-[min(100vw,28rem)] px-4 py-4 align-top sm:max-w-none">
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="font-semibold text-[var(--text)]">
                                                                                {comic.title}
                                                                            </span>
                                                                            {isSuggested && (
                                                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                                                                                    <CheckCircle2
                                                                                        className="h-3 w-3"
                                                                                        strokeWidth={2}
                                                                                        aria-hidden
                                                                                    />
                                                                                    Keep
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span className="truncate font-mono text-[10px] text-[var(--text-dim)] md:max-w-xl">
                                                                            {comic.path}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="hidden max-w-[140px] truncate px-4 py-4 align-middle text-[12px] text-[var(--text-muted)] md:table-cell">
                                                                    {comic.shelf}
                                                                </td>
                                                                <td className="whitespace-nowrap px-4 py-4 align-middle">
                                                                    <span
                                                                        className={`font-mono text-xs tabular-nums ${
                                                                            isSuggested ? 'text-emerald-400' : 'text-[var(--text-muted)]'
                                                                        }`}
                                                                    >
                                                                        {comic.size}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-4 align-middle sm:px-6">
                                                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                                                        {!isSuggested && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setConfirmConfig({
                                                                                        isOpen: true,
                                                                                        title: 'Move to Trash',
                                                                                        message:
                                                                                            'Move this duplicate to Trash? It can be restored later.',
                                                                                        comicId: comic.id,
                                                                                        type: 'single',
                                                                                    });
                                                                                }}
                                                                                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-transparent text-[var(--text-dim)] transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                                                                                title="Move to Trash"
                                                                                aria-label={`Move ${comic.title} to trash`}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                                                                            </button>
                                                                        )}
                                                                        <Link
                                                                            href={route('admin.comics.index', { q: comic.title })}
                                                                            className="inline-flex min-h-10 items-center rounded-lg border border-[var(--border)] bg-white/[0.05] px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] transition hover:border-white/20 hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                                                                        >
                                                                            Manage
                                                                        </Link>
                                                                        <a
                                                                            href={route('comics.show', comic.id)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-[var(--accent)] px-3 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg shadow-[var(--accent-glow)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                                                                        >
                                                                            Read
                                                                            <ExternalLink className="h-3.5 w-3.5 opacity-80" strokeWidth={2} aria-hidden />
                                                                        </a>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </GradientFrame>
                            ))}

                            <div className="flex justify-center pt-2">
                                <Pagination links={paginatedData.links} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div
                    className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300"
                    role="region"
                    aria-label="Bulk actions"
                >
                    <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-[var(--accent)]/35 bg-[var(--card)]/95 px-5 py-4 shadow-[0_0_40px_rgba(232,0,61,0.2)] backdrop-blur-xl sm:max-w-2xl sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
                                {selectedIds.length}
                            </div>
                            <span className="text-[13px] font-semibold uppercase tracking-wider text-[var(--text)]">
                                Selected
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="min-h-11 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)] transition hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={bulkTrash}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-[var(--accent-glow)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] sm:flex-none"
                            >
                                <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                                Move to trash ({selectedIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={handleDelete}
                onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                confirmText={confirmConfig.type === 'bulk' ? 'Move Selected to Trash' : 'Move to Trash'}
                confirmStyle="danger"
            />
        </ComicLayout>
    );
}
