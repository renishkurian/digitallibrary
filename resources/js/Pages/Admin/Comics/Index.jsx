import { useState, useEffect } from 'react';
import { useForm, Head, Link, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import Pagination from '@/Components/Pagination';
import ConfirmModal from '@/Components/ConfirmModal';
import SearchableSelect from '@/Components/SearchableSelect';

// ─── tiny icon helpers ────────────────────────────────────────────────────────
const Icon = ({ d, size = 14, stroke = 2.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}>
        <path d={d} />
    </svg>
);
const CheckIcon   = () => <Icon d="M20 6 9 17 4 12" />;
const EditIcon    = () => <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />;
const EyeIcon     = () => <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />;
const EyeOffIcon  = () => <Icon d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22" />;
const ShareIcon   = () => <Icon d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />;
const XIcon       = ({ size = 14 }) => <Icon d="M18 6 6 18M6 6l12 12" size={size} stroke={2.5} />;
const TrashIcon   = () => <Icon d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />;
const RefreshIcon = () => <Icon d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />;
const SearchIcon  = () => <Icon d="M21 21l-4.35-4.35 M11 19A8 8 0 1 0 11 3a8 8 0 0 0 0 16z" stroke={2.5} />;

// ─── reusable checkbox ────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, color = '#e8003d' }) {
    return (
        <div
            onClick={onChange}
            className="w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
            style={{
                background: checked ? color : 'transparent',
                borderColor: checked ? color : 'rgba(255,255,255,0.2)',
            }}
        >
            {checked && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )}
        </div>
    );
}

// ─── status pill ──────────────────────────────────────────────────────────────
function StatusPill({ comic }) {
    if (comic.is_hidden) return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Hidden
        </span>
    );
    if (!comic.is_approved && !comic.is_personal) return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Pending
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Public
        </span>
    );
}

// ─── action button ────────────────────────────────────────────────────────────
function ActionBtn({ onClick, title, children, variant = 'ghost' }) {
    const base = "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer flex-shrink-0";
    const variants = {
        ghost:   "bg-white/5 text-[#8888a0] hover:bg-white/12 hover:text-white border border-transparent hover:border-white/10",
        green:   "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20",
        blue:    "bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20",
        purple:  "bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white border border-purple-500/20",
        red:     "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20",
        accent:  "bg-[#e8003d]/10 text-[#e8003d] hover:bg-[#e8003d] hover:text-white border border-[#e8003d]/20",
    };
    return (
        <button onClick={onClick} title={title} className={`${base} ${variants[variant]}`}>
            {children}
        </button>
    );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function Index({ comics, auth, shelves, categories, users, roles, filters }) {
    const [editingComic, setEditingComic]   = useState(null);
    const [sharingComic, setSharingComic]   = useState(null);
    const [shareUserId, setShareUserId]     = useState('');
    const [selectedIds, setSelectedIds]     = useState([]);
    const [bulkShelfId, setBulkShelfId]     = useState('');
    const [searchQuery, setSearchQuery]     = useState(filters.q || '');
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });
    const [syncStatus, setSyncStatus]       = useState({ status: 'idle', progress: '', error: null, last_sync_at: null });
    const [uploadPanelOpen, setUploadPanelOpen] = useState(false);

    useEffect(() => {
        let interval;
        const check = () => fetch(route('admin.comics.sync-status')).then(r => r.json()).then(d => {
            setSyncStatus(d);
            if (d.status !== 'running') clearInterval(interval);
        });
        if (syncStatus.status === 'running') interval = setInterval(check, 3000);
        else check();
        return () => clearInterval(interval);
    }, [syncStatus.status]);

    const requestConfirm = (opts) => setConfirmConfig({ ...opts, isOpen: true });
    const closeConfirm   = () => setConfirmConfig(p => ({ ...p, isOpen: false }));

    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploading, errors: uploadErrors, reset: resetUpload } = useForm({
        comic: null, is_personal: false, generate_ai: true, thumbnail: null, shelf_ids: []
    });
    const { data: editData, setData: setEditData, post: postUpdate, processing: updating, errors: editErrors, reset: resetEdit } = useForm({
        title: '', shelf_ids: [], category_ids: [], is_hidden: false, is_personal: false, is_approved: false, thumbnail: null,
        author: '', series: '', series_index: '', publisher: '', description: '', language: '', isbn: ''
    });
    const { data: renameData, setData: setRenameData, post: postRename, processing: renaming, errors: renameErrors, reset: resetRename } = useForm({
        new_filename: '', update_title: false
    });
    const { post: syncPost, processing: syncProcessing } = useForm();

    const submitUpload = (e) => {
        e.preventDefault();
        postUpload(route('admin.comics.upload'), { onSuccess: () => { resetUpload('comic'); setUploadPanelOpen(false); } });
    };

    const runSync = () => syncPost(route('admin.comics.sync'), {
        onSuccess: () => setSyncStatus(p => ({ ...p, status: 'running' }))
    });

    const handleEdit = (comic) => {
        setEditingComic(comic);
        setEditData({ 
            title: comic.title, shelf_ids: comic.shelves?.map(s => s.id) ?? [], category_ids: comic.categories.map(c => c.id), 
            is_hidden: comic.is_hidden, is_personal: comic.is_personal, is_approved: comic.is_approved, thumbnail: null,
            author: comic.author || '', series: comic.series || '', series_index: comic.series_index || '', 
            publisher: comic.publisher || '', description: comic.description || '', language: comic.language || '', isbn: comic.isbn || ''
        });
        setRenameData({ new_filename: comic.filename || '', update_title: false });
    };

    const fetchCalibreMeta = () => {
        router.post(route('admin.comics.fetch-calibre-meta', editingComic.id), {}, {
            preserveScroll: true,
            onSuccess: (page) => {
                // The page props usually contain the updated data if using direct lists, 
                // but for simple feedback we rely on back() + session success.
                // Re-syncing the form manually is safer if the modal is still open.
            }
        });
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        postUpdate(route('admin.comics.update', editingComic.id), { onSuccess: () => { setEditingComic(null); resetEdit(); } });
    };

    const submitRename = (e) => {
        e.preventDefault();
        postRename(route('admin.comics.rename', editingComic.id), {
            preserveScroll: true,
            onSuccess: () => {
                // The backend will have updated the comic record, 
                // and Inertia will re-fetch the page data.
                resetRename();
            }
        });
    };

    const toggle = (field, id) => {
        const ids = [...(editData[field] || [])];
        const i = ids.indexOf(id);
        if (i > -1) ids.splice(i, 1); else ids.push(id);
        setEditData(field, ids);
    };

    const toggleUploadShelf = (id) => {
        const ids = [...(uploadData.shelf_ids || [])];
        const i = ids.indexOf(id);
        if (i > -1) ids.splice(i, 1); else ids.push(id);
        setUploadData('shelf_ids', ids);
    };

    const approveComic  = (id) => router.post(route('admin.comics.approve', id), {}, { preserveScroll: true });
    const generateAiMeta = (id) => router.post(route('admin.comics.generate-ai', id), {}, { preserveScroll: true });
    const revokeShare   = (comic, uid) => router.delete(route('admin.comics.revoke-share', [comic.id, uid]), { preserveScroll: true });
    const revokeRoleShare = (comic, rid) => router.delete(route('admin.comics.revoke-role-share', [comic.id, rid]), { preserveScroll: true });

    const submitRoleShare = (rid) => router.post(route('admin.comics.share-role', sharingComic.id), { role_id: rid }, {
        preserveScroll: true,
        onSuccess: () => setSharingComic(p => ({ ...p, shared_roles: [...(p.shared_roles || []), roles.find(r => r.id == rid)] })),
    });

    const handleSelectAll = (e) => setSelectedIds(e.target.checked ? comics.data.map(c => c.id) : []);
    const toggleSelect    = (id) => setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

    const bulkApprove = () => requestConfirm({
        title: 'Approve Comics', message: `Approve ${selectedIds.length} comics?`, confirmText: 'Approve', confirmStyle: 'primary',
        onConfirm: () => router.post(route('admin.comics.bulk-approve'), { ids: selectedIds }, { preserveScroll: true, onSuccess: () => setSelectedIds([]) })
    });

    const bulkGenerateAiMeta = () => requestConfirm({
        title: 'AI Auto-Tagging', message: `Queue ${selectedIds.length} comics for AI tagging?`,
        onConfirm: () => router.post(route('admin.comics.bulk-generate-ai'), { ids: selectedIds }, { onSuccess: () => { setSelectedIds([]); closeConfirm(); } })
    });

    const bulkTrash = () => requestConfirm({
        title: 'Move to Trash', message: `Move ${selectedIds.length} selected comics to Trash?`, confirmText: 'Move to Trash', confirmStyle: 'danger',
        onConfirm: () => router.post(route('admin.comics.bulk-trash'), { ids: selectedIds }, { preserveScroll: true, onSuccess: () => { setSelectedIds([]); closeConfirm(); } })
    });

    const bulkRestore = () => requestConfirm({
        title: 'Restore Comics', message: `Restore ${selectedIds.length} selected comics?`, confirmText: 'Restore', confirmStyle: 'primary',
        onConfirm: () => router.post(route('admin.comics.bulk-restore'), { ids: selectedIds }, { preserveScroll: true, onSuccess: () => { setSelectedIds([]); closeConfirm(); } })
    });

    const bulkForceDelete = () => requestConfirm({
        title: 'Delete Permanently', message: `PERMANENTLY delete ${selectedIds.length} selected comics? This cannot be undone!`, confirmText: 'Delete Permanently', confirmStyle: 'danger',
        onConfirm: () => router.delete(route('admin.comics.bulk-force-delete'), { data: { ids: selectedIds }, preserveScroll: true, onSuccess: () => { setSelectedIds([]); closeConfirm(); } })
    });

    const bulkToggleVisibility = () => requestConfirm({
        title: 'Toggle Visibility', message: `Toggle visibility for ${selectedIds.length} selected comics?`, confirmText: 'Toggle', confirmStyle: 'primary',
        onConfirm: () => router.post(route('admin.comics.bulk-visibility'), { ids: selectedIds }, { preserveScroll: true, onSuccess: () => { setSelectedIds([]); closeConfirm(); } })
    });

    const handleBulkShelf = (action) => {
        if (!bulkShelfId) return;
        const shelfName = shelves.find(s => s.id == bulkShelfId)?.name;
        requestConfirm({
            title: `Bulk ${action === 'set' ? 'Move' : 'Add'} to Shelf`,
            message: `${action === 'set' ? 'Move' : 'Add'} ${selectedIds.length} comics to "${shelfName}"?`,
            onConfirm: () => router.post(route('admin.comics.bulk-shelves'), { ids: selectedIds, shelf_id: bulkShelfId, action }, {
                onSuccess: () => { setSelectedIds([]); setBulkShelfId(''); closeConfirm(); }
            })
        });
    };

    const setVisibility     = (v) => router.get(route('admin.comics.index'), { ...filters, visibility: v, approval: 'all' }, { replace: true, preserveScroll: true });
    const setApprovalFilter = (a) => router.get(route('admin.comics.index'), { ...filters, approval: a, visibility: 'all' }, { replace: true, preserveScroll: true });
    const setShelfFilter    = (s) => router.get(route('admin.comics.index'), { ...filters, shelf: s }, { replace: true, preserveScroll: true });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.comics.index'), { ...filters, q: searchQuery }, { replace: true, preserveScroll: true });
    };

    const approveAllPending = () => requestConfirm({
        title: 'Approve All Pending', message: 'Approve ALL pending comics? This cannot be undone.', confirmText: 'Approve All', confirmStyle: 'primary',
        onConfirm: () => router.post(route('admin.comics.approve-all-pending'), {}, { preserveScroll: true })
    });

    const autoTagAllPending = () => requestConfirm({
        title: 'Auto-Tag All Pending', message: 'Queue AI tagging for ALL comics missing metadata? This may take a while.', confirmText: 'Queue All', confirmStyle: 'primary',
        onConfirm: () => router.post(route('admin.comics.auto-tag-all-pending'), {}, { preserveScroll: true })
    });

    const handleTrash = (id) => requestConfirm({
        title: 'Move to Trash', message: 'Are you sure you want to move this comic to Trash?', confirmText: 'Move to Trash', confirmStyle: 'danger',
        onConfirm: () => router.delete(route('admin.comics.destroy', id), { preserveScroll: true, onSuccess: closeConfirm })
    });

    const handleRestore = (id) => requestConfirm({
        title: 'Restore Comic', message: 'Restore this comic to the main library?', confirmText: 'Restore', confirmStyle: 'primary',
        onConfirm: () => router.post(route('admin.comics.restore', id), {}, { preserveScroll: true, onSuccess: closeConfirm })
    });

    const handleForceDelete = (id) => requestConfirm({
        title: 'Delete Permanently', message: 'PERMANENTLY delete this comic and its files? This action cannot be undone!', confirmText: 'Delete Permanently', confirmStyle: 'danger',
        onConfirm: () => router.delete(route('admin.comics.force-delete', id), { preserveScroll: true, onSuccess: closeConfirm })
    });

    const TABS = [
        { key: 'all',     label: 'All',     filter: 'visibility' },
        { key: 'public',  label: 'Public',  filter: 'visibility' },
        { key: 'hidden',  label: 'Hidden',  filter: 'visibility' },
        { key: 'pending', label: 'Pending', filter: 'approval'   },
        { key: 'trash',   label: 'Trash',   filter: 'approval'   },
    ];

    const isTabActive = (tab) =>
        tab.filter === 'approval' ? filters.approval === tab.key
        : tab.key === 'all'      ? !filters.visibility || filters.visibility === 'all'
        : filters.visibility === tab.key;

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <ComicLayout auth={auth} fullHeight>
            <Head title="Manage Comics" />

            {/*
              ┌─────────────────────────────────────────────────────────────┐
              │  FIXED-HEIGHT SHELL — fills viewport height passed from     │
              │  ComicLayout via CSS. Only .scroll-zone overflows.          │
              └─────────────────────────────────────────────────────────────┘
              Add this to your global CSS / app.css:
                .admin-shell { display:flex; flex-direction:column; height:100%; overflow:hidden; }
                .scroll-zone { flex:1; overflow-y:auto; overflow-x:hidden; }
                .scroll-zone::-webkit-scrollbar { width:4px }
                .scroll-zone::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px }
              And make ComicLayout pass height:100vh (minus its own nav) down.
            */}

            <div className="admin-shell" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                {/* ── HEADER BAR ──────────────────────────────────────── */}
                <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0e0e16' }}>
                    {/* Top row */}
                    <div className="flex items-center justify-between px-6 py-3 gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: '#fff' }}>
                                Library <span style={{ color: '#e8003d' }}>Management</span>
                            </h1>
                            {/* Quick nav links */}
                            <div className="flex items-center gap-1 ml-4">
                                {[
                                    { href: route('admin.users.index'), label: 'Users' },
                                    { href: route('admin.shelves.index'), label: 'Shelves' },
                                    { href: route('admin.categories.index'), label: 'Categories' },
                                    { href: route('admin.duplicates.index'), label: 'Duplicates' },
                                    { href: route('admin.logs.index'), label: 'Activity' },
                                ].map(({ href, label }) => (
                                    <Link key={label} href={href}
                                        className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg text-[#666688] hover:text-white hover:bg-white/8 transition-all">
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Sync status + upload toggle */}
                        <div className="flex items-center gap-2">
                            {syncStatus.status === 'running' && (
                                <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider animate-pulse">
                                    ⟳ {syncStatus.progress || 'Syncing...'}
                                </span>
                            )}
                            {syncStatus.status === 'idle' && syncStatus.last_sync_at && (
                                <span className="text-[10px] text-[#44445a] uppercase tracking-tighter">
                                    Synced {new Date(syncStatus.last_sync_at).toLocaleString()}
                                </span>
                            )}
                            <button onClick={runSync} disabled={syncProcessing || syncStatus.status === 'running'}
                                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/10 text-[#888] hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
                                title="Scan system for new comics and duplicates">
                                ⟳ Ingress
                            </button>
                            <button onClick={() => setUploadPanelOpen(p => !p)}
                                className="text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-lg border transition-all"
                                style={{ background: uploadPanelOpen ? '#e8003d' : 'rgba(232,0,61,0.12)', borderColor: 'rgba(232,0,61,0.4)', color: uploadPanelOpen ? '#fff' : '#e8003d' }}>
                                + Upload PDF
                            </button>
                        </div>
                    </div>

                    {/* Upload slide-down panel */}
                    {uploadPanelOpen && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a12', padding: '20px 24px' }}>
                            <form onSubmit={submitUpload} className="flex items-end gap-6 flex-wrap">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#666688]">PDF File *</label>
                                    <input type="file" onChange={e => setUploadData('comic', e.target.files[0])} required
                                        className="text-sm text-[#8888a0] file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#e8003d]/15 file:text-[#e8003d] hover:file:bg-[#e8003d]/25" />
                                    {uploadErrors.comic && <span className="text-[#e8003d] text-xs">{uploadErrors.comic}</span>}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#666688]">Thumbnail (optional)</label>
                                    <input type="file" onChange={e => setUploadData('thumbnail', e.target.files[0])}
                                        className="text-sm text-[#8888a0] file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-white/8 file:text-white hover:file:bg-white/12" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#666688]">Shelves</label>
                                    <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                                        {shelves.map(s => (
                                            <button key={s.id} type="button" onClick={() => toggleUploadShelf(s.id)}
                                                className="text-[11px] font-bold px-3 py-1 rounded-lg border transition-all"
                                                style={{ background: uploadData.shelf_ids.includes(s.id) ? 'rgba(232,0,61,0.2)' : 'rgba(255,255,255,0.05)', borderColor: uploadData.shelf_ids.includes(s.id) ? 'rgba(232,0,61,0.5)' : 'rgba(255,255,255,0.1)', color: uploadData.shelf_ids.includes(s.id) ? '#e8003d' : '#888' }}>
                                                {s.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {[['is_personal', 'Personal', '#3b82f6'], ['generate_ai', 'AI Tags', '#a855f7']].map(([key, label, color]) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                                            <Checkbox checked={uploadData[key]} onChange={() => setUploadData(key, !uploadData[key])} color={color} />
                                            <span className="text-[12px] text-[#888]">{label}</span>
                                        </label>
                                    ))}
                                </div>

                                <button type="submit" disabled={uploading}
                                    className="px-6 py-2 rounded-lg font-bold text-[12px] uppercase tracking-widest text-white disabled:opacity-50 transition-all"
                                    style={{ background: '#e8003d' }}>
                                    {uploading ? 'Uploading…' : 'Upload'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Sync Progress Bar */}
                    {syncStatus.status === 'running' && (
                        <div className="px-6 py-4 bg-blue-500/5 border-b border-white/5 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">System Scan in Progress</span>
                                <span className="text-[10px] font-black text-blue-400">Updating library...</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-500 animate-pulse w-full" />
                            </div>
                            <p className="text-[10px] text-[#64748b] mt-2 italic px-1">
                                {syncStatus.progress || 'Scanning filesystem for new and duplicate comics...'}
                            </p>
                        </div>
                    )}

                    {/* Toolbar: filters + search + actions */}
                    <div className="flex items-center gap-3 px-6 py-2.5 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative flex items-center">
                            <span className="absolute left-3 text-[#44445a] pointer-events-none">
                                <SearchIcon />
                            </span>
                            <input
                                type="text"
                                placeholder="Search comics…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-white/5 border border-white/8 text-white text-[12px] py-1.5 pl-9 pr-8 rounded-lg w-56 outline-none focus:border-[#e8003d]/50 transition-all placeholder:text-[#44445a]"
                            />
                            {searchQuery && (
                                <button type="button" onClick={() => { setSearchQuery(''); router.get(route('admin.comics.index'), { ...filters, q: '' }, { replace: true }); }}
                                    className="absolute right-2.5 text-[#44445a] hover:text-white transition-colors">
                                    <XIcon size={11} />
                                </button>
                            )}
                        </form>

                        {/* Shelf Filter */}
                        <div className="flex items-center gap-2">
                            <SearchableSelect 
                                value={filters.shelf || ''}
                                options={shelves}
                                onChange={setShelfFilter}
                                placeholder="All Shelves"
                                className="min-w-[180px]"
                            />
                        </div>

                        {/* Tab filters */}
                        <div className="flex items-center gap-0.5 bg-white/4 border border-white/8 rounded-lg p-0.5">
                            {TABS.map(tab => (
                                <button key={tab.key}
                                    onClick={() => tab.filter === 'approval' ? setApprovalFilter(tab.key) : setVisibility(tab.key)}
                                    className="px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all"
                                    style={isTabActive(tab)
                                        ? { background: '#e8003d', color: '#fff' }
                                        : { color: '#666688' }}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1" />

                        {/* Approve + autotag all */}
                        <button onClick={approveAllPending}
                            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                            ✓ Approve All
                        </button>
                        <button onClick={autoTagAllPending}
                            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-purple-500/25 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all">
                            ✦ Auto-Tag All
                        </button>
                    </div>

                    {/* Bulk action bar — appears when rows are selected */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 px-6 py-2 flex-wrap" style={{ background: 'rgba(232,0,61,0.06)', borderTop: '1px solid rgba(232,0,61,0.15)' }}>
                            <span className="text-[11px] font-black text-[#e8003d] uppercase tracking-wider">
                                {selectedIds.length} selected
                            </span>
                            <div className="w-px h-4 bg-white/10" />
                            <button onClick={bulkApprove}
                                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[#e8003d] text-white hover:bg-[#ff1a4d] transition-all">
                                Approve
                            </button>
                            <button onClick={bulkGenerateAiMeta}
                                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all">
                                ✦ AI Tag
                            </button>
                            <button onClick={bulkToggleVisibility}
                                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-all flex items-center gap-1.5"
                                title="Toggle Visibility">
                                <EyeIcon /> Visibility
                            </button>
                            <div className="w-px h-4 bg-white/10" />
                            <SearchableSelect 
                                value={bulkShelfId}
                                options={shelves}
                                onChange={setBulkShelfId}
                                placeholder="Shelf…"
                                className="min-w-[150px]"
                            />
                            <button onClick={() => handleBulkShelf('add')} disabled={!bulkShelfId}
                                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 transition-all">
                                Add to Shelf
                            </button>
                            <button onClick={() => handleBulkShelf('set')} disabled={!bulkShelfId}
                                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-teal-500/25 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 disabled:opacity-30 transition-all">
                                Move to Shelf
                            </button>
                            <div className="w-px h-4 bg-white/10" />
                            {filters.approval === 'trash' ? (
                                <>
                                    <button onClick={bulkRestore}
                                        className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
                                        Restore
                                    </button>
                                    <button onClick={bulkForceDelete}
                                        className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                                        Delete Permanently
                                    </button>
                                </>
                            ) : (
                                <button onClick={bulkTrash}
                                    className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                                    Move to Trash
                                </button>
                            )}
                            <button onClick={() => setSelectedIds([])} className="ml-auto text-[#44445a] hover:text-white transition-colors">
                                <XIcon />
                            </button>
                        </div>
                    )}
                </div>

                {/* ── SCROLLABLE TABLE ZONE ───────────────────────────── */}
                <div className="scroll-zone" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ minWidth: 860, width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0b0b14' }}>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                    <th className="px-4 py-3 w-10">
                                        <input type="checkbox"
                                            checked={selectedIds.length === comics.data.length && comics.data.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded accent-[#e8003d] cursor-pointer" />
                                    </th>
                                    {['TMB', 'Comic', 'Shelf', 'Categories', 'Status', 'Shared', 'By', 'Actions'].map((h, i) => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                                            style={{ color: '#44445a', textAlign: h === 'Actions' ? 'right' : 'left' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {comics.data.map((comic, idx) => (
                                    <tr key={comic.id}
                                        style={{
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                            background: selectedIds.includes(comic.id) ? 'rgba(232,0,61,0.05)' : 'transparent',
                                            opacity: comic.is_hidden ? 0.6 : 1,
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => { if (!selectedIds.includes(comic.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = selectedIds.includes(comic.id) ? 'rgba(232,0,61,0.05)' : 'transparent'; }}>

                                        {/* Checkbox */}
                                        <td className="px-4 py-3">
                                            <input type="checkbox" checked={selectedIds.includes(comic.id)} onChange={() => toggleSelect(comic.id)}
                                                className="w-4 h-4 rounded accent-[#e8003d] cursor-pointer" />
                                        </td>

                                        {/* Thumbnail */}
                                        <td className="px-4 py-3">
                                            <Link href={route('comics.show', comic.id)} target="_blank"
                                                className="block w-9 h-12 rounded-md overflow-hidden flex-shrink-0"
                                                style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                                                {comic.thumbnail
                                                    ? <img src={`/thumbs/${comic.thumbnail}`} className="w-full h-full object-cover" alt="" />
                                                    : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#44445a]">NA</div>
                                                }
                                            </Link>
                                        </td>

                                        {/* Title + path */}
                                        <td className="px-4 py-3" style={{ maxWidth: 220 }}>
                                            <Link href={route('comics.show', comic.id)} target="_blank"
                                                className="text-[13px] font-semibold text-white hover:text-[#ff3366] transition-colors truncate block">
                                                {comic.title}
                                                {comic.is_personal && <span className="ml-1.5 text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/25 uppercase">Personal</span>}
                                            </Link>
                                            <span className="text-[10px] text-[#44445a] font-mono block truncate mt-0.5">{comic.path}</span>
                                        </td>

                                        {/* Shelf */}
                                        <td className="px-4 py-3">
                                            {comic.shelves?.length > 0
                                                ? <div className="flex flex-col gap-0.5">{comic.shelves.map(s => <span key={s.id} className="text-[11px] text-[#cbd5e1]">{s.name}</span>)}</div>
                                                : <span className="text-[10px] font-bold uppercase tracking-wider text-[#333348]">—</span>}
                                        </td>

                                        {/* Categories */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {comic.categories.slice(0, 2).map(c => (
                                                    <span key={c.id} className="text-[10px] font-bold px-2 py-0.5 rounded"
                                                        style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        {c.name}
                                                    </span>
                                                ))}
                                                {comic.categories.length > 2 && <span className="text-[10px] text-[#64748b] font-bold">+{comic.categories.length - 2}</span>}
                                                {comic.categories.length === 0 && <span className="text-[10px] font-bold uppercase tracking-wider text-[#333348]">—</span>}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3"><StatusPill comic={comic} /></td>

                                        {/* Shared with */}
                                        <td className="px-4 py-3">
                                            {comic.shared_with?.length > 0
                                                ? <div className="flex flex-wrap gap-1">
                                                    {comic.shared_with.slice(0, 2).map(u => (
                                                        <span key={u.id} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                            style={{ background: 'rgba(232,0,61,0.1)', color: '#fca5a5', border: '1px solid rgba(232,0,61,0.2)' }}>
                                                            {u.name}
                                                            <button onClick={() => revokeShare(comic, u.id)} className="hover:text-white transition-colors ml-0.5"><XIcon size={9} /></button>
                                                        </span>
                                                    ))}
                                                  </div>
                                                : <span className="text-[10px] font-bold uppercase tracking-wider text-[#333348]">—</span>}
                                        </td>

                                        {/* Uploaded by */}
                                        <td className="px-4 py-3">
                                            <span className="text-[12px] text-[#8888a0]">{comic.uploader?.name ?? 'System'}</span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {!comic.is_approved && !comic.is_personal && (
                                                    <ActionBtn onClick={() => approveComic(comic.id)} title="Approve" variant="green"><CheckIcon /></ActionBtn>
                                                )}
                                                <ActionBtn onClick={() => { setSharingComic(comic); setShareUserId(''); }} title="Share" variant="blue"><ShareIcon /></ActionBtn>
                                                <ActionBtn onClick={() => generateAiMeta(comic.id)} title="AI Tag" variant="purple">✦</ActionBtn>
                                                <Link href={route('admin.comics.regenerate-thumbnail', comic.id)} method="post" as="button" preserveScroll>
                                                    <ActionBtn title="Regen Thumbnail">
                                                        <span className="text-[9px] font-black tracking-tighter">TMB</span>
                                                    </ActionBtn>
                                                </Link>
                                                <ActionBtn onClick={() => handleEdit(comic)} title="Edit"><EditIcon /></ActionBtn>
                                                {filters.approval === 'trash' ? (
                                                    <>
                                                        <ActionBtn onClick={() => handleRestore(comic.id)} title="Restore" variant="blue"><RefreshIcon /></ActionBtn>
                                                        <ActionBtn onClick={() => handleForceDelete(comic.id)} title="Delete Permanently" variant="red"><TrashIcon /></ActionBtn>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ActionBtn onClick={() => syncPost(route('admin.comics.toggle-visibility', comic.id), { preserveScroll: true })} title={comic.is_hidden ? 'Unhide' : 'Hide'} variant={comic.is_hidden ? 'red' : 'ghost'}>
                                                            {comic.is_hidden ? <EyeOffIcon /> : <EyeIcon />}
                                                        </ActionBtn>
                                                        <ActionBtn onClick={() => handleTrash(comic.id)} title="Move to Trash" variant="red"><TrashIcon /></ActionBtn>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 flex justify-between items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-[11px] text-[#44445a] uppercase tracking-wider">
                            {comics.total} comics total
                        </span>
                        <Pagination links={comics.links} />
                    </div>
                </div>
            </div>

            {/* ── EDIT MODAL ─────────────────────────────────────────── */}
            {editingComic && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => { setEditingComic(null); resetEdit(); }} />
                    <div className="relative rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl"
                        style={{ background: '#0f0f1a', border: '1px solid rgba(232,0,61,0.25)' }}>
                        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: '#fff' }}>
                                Edit <span style={{ color: '#e8003d' }}>{editingComic.title}</span>
                            </h2>
                            <button onClick={() => { setEditingComic(null); resetEdit(); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#666688] hover:text-white hover:bg-white/10 transition-all">
                                <XIcon />
                            </button>
                        </div>

                        <form onSubmit={submitUpdate} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Title */}
                            <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#666688]">Title</label>
                                <input type="text" value={editData.title} onChange={e => setEditData('title', e.target.value)}
                                    className="bg-white/4 border border-white/10 text-white rounded-lg px-4 py-2.5 outline-none focus:border-[#e8003d]/60 transition-colors text-sm"
                                    style={{ fontFamily: 'inherit' }} />
                                {editErrors.title && <span className="text-[#e8003d] text-xs">{editErrors.title}</span>}
                            </div>

                            {/* Shelves */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#666688]">Shelves</label>
                                <div className="rounded-lg p-3 flex flex-col gap-1.5 overflow-y-auto" style={{ height: 120, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {shelves.map(s => (
                                        <label key={s.id} className="flex items-center gap-2.5 cursor-pointer">
                                            <Checkbox checked={(editData.shelf_ids || []).includes(s.id)} onChange={() => toggle('shelf_ids', s.id)} />
                                            <span className="text-[12px] text-[#8888a0]">{s.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#666688]">Categories</label>
                                <div className="rounded-lg p-3 flex flex-col gap-1.5 overflow-y-auto" style={{ height: 120, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer">
                                            <Checkbox checked={editData.category_ids.includes(cat.id)} onChange={() => toggle('category_ids', cat.id)} />
                                            <span className="text-[12px] text-[#8888a0]">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Visibility flags */}
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#666688]">Visibility</label>
                                {[
                                    ['is_hidden', 'Hidden from Public', '#e8003d'],
                                    ['is_personal', 'Personal (Private)', '#3b82f6'],
                                    ['is_approved', 'Admin Approved', '#22c55e'],
                                ].map(([key, label, color]) => (
                                    <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                                        <Checkbox checked={editData[key]} onChange={() => setEditData(key, !editData[key])} color={color} />
                                        <span className="text-[12px] text-[#8888a0]">{label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Thumbnail */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#666688]">Replace Thumbnail</label>
                                <input type="file" onChange={e => setEditData('thumbnail', e.target.files[0])}
                                    className="text-xs text-[#8888a0] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white/8 file:text-white hover:file:bg-white/12" />
                                {editErrors.thumbnail && <span className="text-[#e8003d] text-xs">{editErrors.thumbnail}</span>}
                            </div>

                            {/* Metadata Section */}
                            <div className="md:col-span-2 p-5 rounded-xl bg-white/3 border border-white/10 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-[#666688]">Extended Metadata</h3>
                                    <button 
                                        type="button" 
                                        onClick={fetchCalibreMeta}
                                        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-purple-500/25 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1.5"
                                    >
                                        ✦ Fetch Calibre Meta
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#44445a]">Author</label>
                                        <input type="text" value={editData.author} onChange={e => setEditData('author', e.target.value)}
                                            className="bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:border-[#e8003d]/60 transition-colors text-[12px]" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#44445a]">Series</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={editData.series} onChange={e => setEditData('series', e.target.value)} placeholder="Series Name"
                                                className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:border-[#e8003d]/60 transition-colors text-[12px]" />
                                            <input type="number" step="0.1" value={editData.series_index} onChange={e => setEditData('series_index', e.target.value)} placeholder="#"
                                                className="w-16 bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:border-[#e8003d]/60 transition-colors text-[12px]" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#44445a]">Publisher</label>
                                        <input type="text" value={editData.publisher} onChange={e => setEditData('publisher', e.target.value)}
                                            className="bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:border-[#e8003d]/60 transition-colors text-[12px]" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#44445a]">Language / ISBN</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={editData.language} onChange={e => setEditData('language', e.target.value)} placeholder="en"
                                                className="w-16 bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:border-[#e8003d]/60 transition-colors text-[12px]" />
                                            <input type="text" value={editData.isbn} onChange={e => setEditData('isbn', e.target.value)} placeholder="ISBN"
                                                className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:border-[#e8003d]/60 transition-colors text-[12px]" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#44445a]">Description</label>
                                        <textarea value={editData.description} onChange={e => setEditData('description', e.target.value)} rows={3}
                                            className="bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:border-[#e8003d]/60 transition-colors text-[12px] resize-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Rename File Section */}
                            <div className="md:col-span-2 mt-4 p-5 rounded-xl bg-[#e8003d]/5 border border-[#e8003d]/15 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-[#e8003d]">Dangerous Action: Rename PDF File</h3>
                                    <span className="text-[9px] text-[#666688] font-mono italic">Renames file on disk and in DB</span>
                                </div>
                                
                                <div className="flex gap-3">
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <input 
                                            type="text" 
                                            value={renameData.new_filename} 
                                            onChange={e => setRenameData('new_filename', e.target.value)}
                                            placeholder="new_filename.pdf"
                                            className="bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:border-[#e8003d]/60 transition-colors text-[13px]"
                                        />
                                        {renameErrors.new_filename && <span className="text-[#e8003d] text-[10px] font-bold">{renameErrors.new_filename}</span>}
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={submitRename}
                                        disabled={renaming || !renameData.new_filename || renameData.new_filename === editingComic.filename}
                                        className="px-5 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider text-white bg-[#e8003d] disabled:opacity-30 disabled:bg-[#888] transition-all whitespace-nowrap"
                                    >
                                        {renaming ? 'Renaming…' : 'Rename File'}
                                    </button>
                                </div>

                                <label className="flex items-center gap-2.5 cursor-pointer self-start">
                                    <Checkbox 
                                        checked={renameData.update_title} 
                                        onChange={() => setRenameData('update_title', !renameData.update_title)} 
                                        color="#e8003d" 
                                    />
                                    <span className="text-[11px] text-[#8888a0] font-medium">Update comic title to match new filename</span>
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="md:col-span-2 flex gap-3 pt-2">
                                <button type="submit" disabled={updating}
                                    className="px-8 py-2.5 rounded-lg font-bold text-[12px] uppercase tracking-widest text-white disabled:opacity-50 transition-all hover:brightness-110"
                                    style={{ background: '#e8003d' }}>
                                    {updating ? 'Saving…' : 'Save Changes'}
                                </button>
                                <button type="button" onClick={() => { setEditingComic(null); resetEdit(); }}
                                    className="px-8 py-2.5 rounded-lg font-bold text-[12px] uppercase tracking-widest text-[#888] hover:text-white hover:bg-white/8 transition-all border border-white/10">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── SHARE MODAL ────────────────────────────────────────── */}
            {sharingComic && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSharingComic(null)} />
                    <div className="relative rounded-2xl w-full max-w-md shadow-2xl"
                        style={{ background: '#0f0f1a', border: '1px solid rgba(59,130,246,0.25)' }}>
                        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div>
                                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: '#fff' }}>Share Comic</h2>
                                <p className="text-[11px] text-[#666688] mt-0.5">{sharingComic.title}</p>
                            </div>
                            <button onClick={() => setSharingComic(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#666688] hover:text-white hover:bg-white/10 transition-all"><XIcon /></button>
                        </div>

                        <div className="p-7 flex flex-col gap-6">
                            {/* Users */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#666688]">Users</label>
                                <div className="flex flex-wrap gap-1.5 mb-1">
                                    {sharingComic.shared_with?.map(u => (
                                        <span key={u.id} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
                                            style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}>
                                            {u.name}
                                            <button onClick={() => revokeShare(sharingComic, u.id)} className="hover:text-white transition-colors"><XIcon size={9} /></button>
                                        </span>
                                    ))}
                                </div>
                                <select value={shareUserId} onChange={e => { const uid = e.target.value; if (uid) { router.post(route('admin.comics.share', sharingComic.id), { user_id: uid }, { preserveScroll: true }); setShareUserId(''); } }}
                                    className="bg-white/4 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition-colors">
                                    <option value="">Grant user access…</option>
                                    {users.filter(u => !sharingComic.shared_with?.find(s => s.id === u.id)).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Roles */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#666688]">Roles</label>
                                <div className="flex flex-wrap gap-1.5 mb-1">
                                    {sharingComic.shared_roles?.map(r => (
                                        <span key={r.id} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
                                            style={{ background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)' }}>
                                            {r.name}
                                            <button onClick={() => revokeRoleShare(sharingComic, r.id)} className="hover:text-white transition-colors"><XIcon size={9} /></button>
                                        </span>
                                    ))}
                                </div>
                                <select onChange={e => { const rid = e.target.value; if (rid) { submitRoleShare(rid); e.target.value = ''; } }}
                                    className="bg-white/4 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-purple-500/50 transition-colors">
                                    <option value="">Grant role access…</option>
                                    {roles.filter(r => !sharingComic.shared_roles?.find(s => s.id === r.id)).map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button onClick={() => setSharingComic(null)}
                                className="w-full py-2.5 rounded-lg font-bold text-[12px] uppercase tracking-widest text-[#888] hover:text-white border border-white/10 hover:bg-white/8 transition-all">
                                Done
                            </button>
                        </div>
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