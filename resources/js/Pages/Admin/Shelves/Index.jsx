import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Library,
    LayoutGrid,
    Pencil,
    Trash2,
    X,
    Globe,
    User,
    Eye,
    Lock,
    Store,
    Plus,
} from 'lucide-react';
import ComicLayout from '@/Layouts/ComicLayout';
import ConfirmModal from '@/Components/ConfirmModal';

function Checkbox({ checked, onToggle, color = '#e8003d', 'aria-label': ariaLabel }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={onToggle}
            className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12]"
            style={{
                background: checked ? color : 'transparent',
                borderColor: checked ? color : 'rgba(255,255,255,0.22)',
            }}
        >
            {checked && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )}
        </button>
    );
}

function OwnershipBadge({ shelf }) {
    if (shelf.is_common) {
        return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2} aria-hidden />
                Common
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400">
            <User className="h-3.5 w-3.5 shrink-0 text-blue-400" strokeWidth={2} aria-hidden />
            Personal
        </span>
    );
}

function VisibilityBadge({ shelf }) {
    if (shelf.is_hidden) {
        return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
                <Lock className="h-3.5 w-3.5 shrink-0 text-red-400" strokeWidth={2} aria-hidden />
                Hidden
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            <Eye className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2} aria-hidden />
            Public
        </span>
    );
}

const adminNav = [
    { href: () => route('admin.users.index'), r: 'admin.users.index' },
    { href: () => route('admin.shelves.index'), r: 'admin.shelves.index' },
    { href: () => route('admin.categories.index'), r: 'admin.categories.index' },
    { href: () => route('admin.duplicates.index'), r: 'admin.duplicates.index' },
    { href: () => route('admin.logs.index'), r: 'admin.logs.index' },
];

const navLabel = {
    'admin.users.index': 'Users',
    'admin.shelves.index': 'Shelves',
    'admin.categories.index': 'Categories',
    'admin.duplicates.index': 'Duplicates',
    'admin.logs.index': 'Activity',
};

export default function Index({ shelves }) {
    const [editingShelf, setEditingShelf] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: 'Confirm',
        confirmStyle: 'danger',
    });

    const requestConfirm = (options) => setConfirmConfig({ ...options, isOpen: true });
    const closeConfirm = () => setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        parent_id: '',
        is_hidden: false,
        is_common: true,
        cover_image: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingShelf) {
            post(route('admin.shelves.update', editingShelf.id), {
                onSuccess: () => {
                    setEditingShelf(null);
                    setIsEditModalOpen(false);
                    reset();
                },
            });
        } else {
            post(route('admin.shelves.store'), {
                onSuccess: () => reset(),
            });
        }
    };

    const handleEdit = (shelf) => {
        setEditingShelf(shelf);
        clearErrors();
        setData({
            name: shelf.name,
            description: shelf.description || '',
            parent_id: shelf.parent_id || '',
            is_hidden: shelf.is_hidden,
            is_common: shelf.is_common,
            cover_image: null,
        });
        setIsEditModalOpen(true);
    };

    const handleCancelEdit = () => {
        setEditingShelf(null);
        setIsEditModalOpen(false);
        reset();
    };

    const handleDelete = (id) => {
        requestConfirm({
            title: 'Delete shelf',
            message: 'This removes the shelf from the store. Comics assigned only to this shelf may need to be reassigned.',
            confirmText: 'Delete',
            confirmStyle: 'danger',
            onConfirm: () => {
                closeConfirm();
                router.delete(route('admin.shelves.destroy', id), { preserveScroll: true });
            },
        });
    };

    const inputClass =
        'min-h-[44px] w-full rounded-xl border border-white/10 bg-[#0c0c12] px-3 py-2.5 text-[14px] text-white outline-none transition-colors placeholder:text-[#4a4a6a] focus:border-[#e8003d]/55 focus:ring-2 focus:ring-[#e8003d]/20 md:min-h-0';
    const inputClassModal =
        'min-h-[44px] w-full rounded-xl border border-white/10 bg-[#16161f] px-3 py-2.5 text-[14px] text-white outline-none transition-colors placeholder:text-[#4a4a6a] focus:border-[#e8003d]/55 focus:ring-2 focus:ring-[#e8003d]/20 md:min-h-0';

    return (
        <ComicLayout>
            <Head title="Shelves — Admin" />

            <div className="admin-shelves-shell -mx-4 flex max-h-[calc(100dvh-8.5rem)] min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0c0c16] via-[#090912] to-[#050508] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:-mx-8 lg:-mx-14">
                {/* Masthead */}
                <header className="shrink-0 border-b border-white/[0.06] bg-[#0e0e16]/95 backdrop-blur-md">
                    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
                        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
                            <Link
                                href={route('comics.index')}
                                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-[11px] font-bold uppercase tracking-wider text-[#8888a0] transition-all hover:border-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e16]"
                            >
                                <Library className="h-4 w-4 text-[#e8003d]" strokeWidth={2} aria-hidden />
                                <span className="hidden sm:inline">Reader</span>
                            </Link>
                            <div className="flex items-center gap-2 border-l border-white/[0.06] pl-3 sm:pl-4">
                                <Store className="hidden h-6 w-6 text-[#e8003d] sm:block" strokeWidth={2} aria-hidden />
                                <div>
                                    <h1 className="text-xl tracking-[0.18em] text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                        Shelf <span className="text-[#e8003d]">Gallery</span>
                                    </h1>
                                    <p className="text-[11px] font-medium text-[#55556a]">Curate store shelves, visibility, and covers</p>
                                </div>
                            </div>
                            <nav className="flex flex-wrap items-center gap-0.5 border-l border-white/[0.06] pl-3 sm:ml-1 sm:pl-4" aria-label="Admin sections">
                                {adminNav.map(({ href, r }) => {
                                    const active = route().current(r);
                                    return (
                                        <Link
                                            key={r}
                                            href={href()}
                                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e16] sm:px-3 ${
                                                active
                                                    ? 'bg-[#e8003d]/15 text-[#ff6b8a]'
                                                    : 'text-[#666688] hover:bg-white/[0.06] hover:text-white'
                                            }`}
                                        >
                                            {navLabel[r]}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                        <Link
                            href={route('admin.comics.index')}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#a0a0b8] transition-all hover:border-white/18 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e16]"
                        >
                            <LayoutGrid className="h-4 w-4" strokeWidth={2} aria-hidden />
                            Comics
                        </Link>
                    </div>
                </header>

                <div className="scroll-zone min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                    {/* Create shelf */}
                    <section
                        className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-inner sm:p-8"
                        aria-labelledby="create-shelf-heading"
                    >
                        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 id="create-shelf-heading" className="text-2xl tracking-[0.12em] text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                    Stock a new shelf
                                </h2>
                                <p className="mt-1 text-[12px] text-[#666688]">Add a browse stack for the comic store. Name it, nest it, set who sees it.</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8003d]/25 bg-[#e8003d]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ff6b8a]">
                                <Plus className="h-3 w-3 text-[#e8003d]" strokeWidth={2.5} aria-hidden />
                                Create
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="shelf-name" className="text-[10px] font-black uppercase tracking-widest text-[#8888a0]">
                                    Name
                                </label>
                                <input
                                    id="shelf-name"
                                    type="text"
                                    value={editingShelf ? '' : data.name}
                                    onChange={(e) => !editingShelf && setData('name', e.target.value)}
                                    className={inputClass}
                                    placeholder="e.g. Bronze Age, Indie Weeklies"
                                    autoComplete="off"
                                />
                                {!editingShelf && errors.name && <span className="text-xs text-[#e8003d]">{errors.name}</span>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="shelf-parent" className="text-[10px] font-black uppercase tracking-widest text-[#8888a0]">
                                    Parent shelf
                                </label>
                                <select
                                    id="shelf-parent"
                                    value={data.parent_id}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">None (top level)</option>
                                    {shelves.filter((s) => !editingShelf || s.id !== editingShelf.id).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.display_name || s.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.parent_id && <span className="text-xs text-[#e8003d]">{errors.parent_id}</span>}
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#8888a0]">Visibility & ownership</span>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                                    <div className="flex flex-col gap-2 sm:min-w-[12rem]">
                                        <label htmlFor="shelf-visibility" className="sr-only">
                                            Shelf visibility
                                        </label>
                                        <select
                                            id="shelf-visibility"
                                            value={data.is_hidden ? '1' : '0'}
                                            onChange={(e) => setData('is_hidden', e.target.value === '1')}
                                            className={inputClass}
                                        >
                                            <option value="0">Public / shared</option>
                                            <option value="1">Hidden (admin only)</option>
                                        </select>
                                    </div>
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition-colors hover:border-white/10">
                                        <Checkbox
                                            checked={data.is_common}
                                            onToggle={() => setData('is_common', !data.is_common)}
                                            aria-label="Common shelf visible to all customers"
                                        />
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#a0a0b8]">Common shelf (store-wide)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-2">
                                <label htmlFor="shelf-desc" className="text-[10px] font-black uppercase tracking-widest text-[#8888a0]">
                                    Description
                                </label>
                                <textarea
                                    id="shelf-desc"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className={`${inputClass} min-h-[6rem] resize-none py-3`}
                                    placeholder="What lives on this shelf? Short blurb for admins and future readers."
                                    rows={4}
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-2">
                                <label htmlFor="shelf-cover" className="text-[10px] font-black uppercase tracking-widest text-[#8888a0]">
                                    Shelf cover image
                                </label>
                                <div className="flex flex-wrap items-center gap-4">
                                    {editingShelf?.cover_image && (
                                        <div className="h-16 w-16 overflow-hidden rounded-lg border border-white/10">
                                            <img
                                                src={`/shelves/${editingShelf.cover_image}`}
                                                className="h-full w-full object-cover"
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>
                                    )}
                                    <input
                                        id="shelf-cover"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('cover_image', e.target.files[0])}
                                        className="min-h-[44px] flex-1 cursor-pointer rounded-xl border border-white/10 bg-[#0c0c12] px-3 py-2 text-[13px] text-[#8888a0] outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8003d]/15 file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:uppercase file:text-[#e8003d] focus:border-[#e8003d]/55 focus:ring-2 focus:ring-[#e8003d]/20"
                                    />
                                </div>
                                {errors.cover_image && <span className="text-xs text-[#e8003d]">{errors.cover_image}</span>}
                            </div>

                            <div className="md:col-span-2 flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={processing || editingShelf}
                                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#e8003d] px-8 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090912] disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    Create shelf
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Table */}
                    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-8" aria-labelledby="shelves-list-heading">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 id="shelves-list-heading" className="text-2xl tracking-[0.12em] text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                    Store shelves
                                </h2>
                                <p className="mt-1 text-[12px] text-[#666688]">{shelves.length} shelf{shelves.length === 1 ? '' : 's'} in catalog</p>
                            </div>
                        </div>

                        {shelves.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#08080f] py-16 text-center">
                                <LayoutGrid className="mb-3 h-10 w-10 text-[#44445a]" strokeWidth={1.5} aria-hidden />
                                <p className="text-[14px] font-medium text-[#8888a0]">No shelves yet — create one above.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                                <table className="w-full min-w-[640px] border-collapse text-left">
                                    <caption className="sr-only">Shelves: cover, name, ownership, visibility, actions</caption>
                                    <thead>
                                        <tr className="border-b border-white/[0.08]">
                                            <th scope="col" className="w-14 py-3 pl-0 pr-2 text-[10px] font-black uppercase tracking-widest text-[#44445a]">
                                                Cover
                                            </th>
                                            <th scope="col" className="py-3 text-[10px] font-black uppercase tracking-widest text-[#44445a]">
                                                Shelf
                                            </th>
                                            <th scope="col" className="py-3 text-[10px] font-black uppercase tracking-widest text-[#44445a]">
                                                Ownership
                                            </th>
                                            <th scope="col" className="py-3 text-[10px] font-black uppercase tracking-widest text-[#44445a]">
                                                Visibility
                                            </th>
                                            <th scope="col" className="py-3 pr-0 text-right text-[10px] font-black uppercase tracking-widest text-[#44445a]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shelves.map((shelf) => (
                                            <tr
                                                key={shelf.id}
                                                className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.02]"
                                            >
                                                <td className="py-3 pl-0 pr-2 align-middle">
                                                    <div className="h-11 w-11 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                                                        {shelf.cover_image ? (
                                                            <img
                                                                src={`/shelves/${shelf.cover_image}`}
                                                                className="h-full w-full object-cover"
                                                                alt=""
                                                                loading="lazy"
                                                                decoding="async"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-[9px] font-black uppercase text-[#55556a]">
                                                                —
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="max-w-[220px] py-3 align-middle">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[14px] font-semibold text-white">{shelf.display_name || shelf.name}</span>
                                                        <span className="line-clamp-2 text-[11px] font-normal text-[#666688]">
                                                            {shelf.description || 'No description'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 align-middle">
                                                    <div className="flex flex-col gap-1">
                                                        <OwnershipBadge shelf={shelf} />
                                                        <span className="text-[10px] uppercase text-[#55556a]">By {shelf.user?.name || 'System'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 align-middle">
                                                    <VisibilityBadge shelf={shelf} />
                                                </td>
                                                <td className="py-3 pr-0 text-right align-middle">
                                                    <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(shelf)}
                                                            className="inline-flex h-10 min-w-[40px] items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[12px] font-semibold text-[#a0a0b8] transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090912]"
                                                        >
                                                            <Pencil className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                                                            <span className="hidden sm:inline">Edit</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(shelf.id)}
                                                            className="inline-flex h-10 min-w-[40px] items-center justify-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 text-[12px] font-semibold text-red-400 transition-all hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090912]"
                                                        >
                                                            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                                                            <span className="hidden sm:inline">Delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {isEditModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                        onClick={handleCancelEdit}
                        aria-label="Close dialog"
                    />
                    <div
                        className="relative max-h-[min(90dvh,880px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 shadow-2xl"
                        style={{
                            background: '#0f0f1a',
                            boxShadow: '0 0 0 1px rgba(232,0,61,0.12), 0 24px 80px rgba(0,0,0,0.6)',
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-shelf-title"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5 sm:px-8">
                            <h2 id="edit-shelf-title" className="text-xl tracking-[0.1em] text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                Edit <span className="text-[#e8003d]">{editingShelf?.name}</span>
                            </h2>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#666688] transition-all hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d]"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 sm:gap-6 sm:px-8 sm:pb-8">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-widest text-[#8888a0]">
                                    Name
                                </label>
                                <input
                                    id="edit-name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={inputClassModal}
                                    placeholder="Shelf name"
                                />
                                {errors.name && <span className="text-xs text-[#e8003d]">{errors.name}</span>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="edit-parent" className="text-[10px] font-black uppercase tracking-widest text-[#8888a0]">
                                    Parent shelf
                                </label>
                                <select
                                    id="edit-parent"
                                    value={data.parent_id}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                    className={inputClassModal}
                                >
                                    <option value="">None (top level)</option>
                                    {shelves.filter((s) => s.id !== editingShelf?.id).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.display_name || s.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.parent_id && <span className="text-xs text-[#e8003d]">{errors.parent_id}</span>}
                            </div>

                            <div className="sm:col-span-2 flex flex-col gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#8888a0]">Visibility & ownership</span>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                                    <select
                                        value={data.is_hidden ? '1' : '0'}
                                        onChange={(e) => setData('is_hidden', e.target.value === '1')}
                                        className={`${inputClassModal} sm:max-w-xs`}
                                        aria-label="Shelf visibility"
                                    >
                                        <option value="0">Public / shared</option>
                                        <option value="1">Hidden (admin only)</option>
                                    </select>
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                                        <Checkbox
                                            checked={data.is_common}
                                            onToggle={() => setData('is_common', !data.is_common)}
                                            aria-label="Common shelf"
                                        />
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#a0a0b8]">Common shelf</span>
                                    </label>
                                </div>
                            </div>

                            <div className="sm:col-span-2 flex flex-col gap-2">
                                <label htmlFor="edit-desc" className="text-[10px] font-black uppercase tracking-widest text-[#8888a0]">
                                    Description
                                </label>
                                <textarea
                                    id="edit-desc"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className={`${inputClassModal} min-h-[6rem] resize-none py-3`}
                                    placeholder="Description…"
                                    rows={4}
                                />
                            </div>

                            <div className="sm:col-span-2 flex flex-col gap-2">
                                <label htmlFor="edit-cover" className="text-[10px] font-black uppercase tracking-widest text-[#8888a0]">
                                    Shelf cover image
                                </label>
                                <div className="flex flex-wrap items-center gap-4">
                                    {editingShelf?.cover_image && (
                                        <div className="h-16 w-16 overflow-hidden rounded-lg border border-white/10">
                                            <img
                                                src={`/shelves/${editingShelf.cover_image}`}
                                                className="h-full w-full object-cover"
                                                alt=""
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <input
                                        id="edit-cover"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('cover_image', e.target.files[0])}
                                        className="min-h-[44px] flex-1 cursor-pointer rounded-xl border border-white/10 bg-[#16161f] px-3 py-2 text-[13px] text-[#8888a0] outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:text-white focus:border-[#e8003d]/55 focus:ring-2 focus:ring-[#e8003d]/20"
                                    />
                                </div>
                                {errors.cover_image && <span className="text-xs text-[#e8003d]">{errors.cover_image}</span>}
                            </div>

                            <div className="sm:col-span-2 flex flex-wrap gap-3 border-t border-white/[0.06] pt-6">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#e8003d] px-8 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] disabled:opacity-50"
                                >
                                    Update shelf
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] px-8 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#a0a0b8] transition-all hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                confirmStyle={confirmConfig.confirmStyle}
                onConfirm={confirmConfig.onConfirm}
                onCancel={closeConfirm}
            />
        </ComicLayout>
    );
}
