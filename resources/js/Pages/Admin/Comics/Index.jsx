import { useState, useEffect } from 'react';
import { useForm, Head, Link, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import Pagination from '@/Components/Pagination';
import ConfirmModal from '@/Components/ConfirmModal';

export default function Index({ comics, auth, shelves, categories, users, roles, filters }) {
    const [editingComic, setEditingComic] = useState(null);
    const [sharingComic, setSharingComic] = useState(null);
    const [shareUserId, setShareUserId]   = useState('');
    const [selectedIds, setSelectedIds]   = useState([]);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', confirmStyle: 'danger' });
    const [syncStatus, setSyncStatus] = useState({ status: 'idle', progress: '', error: null, last_sync_at: null });

    // Poll for sync status if running
    useEffect(() => {
        let interval;
        const checkStatus = () => {
            fetch(route('admin.comics.sync-status'))
                .then(res => res.json())
                .then(data => {
                    setSyncStatus(data);
                    if (data.status !== 'running') {
                        clearInterval(interval);
                    }
                });
        };

        if (syncStatus.status === 'running') {
            interval = setInterval(checkStatus, 3000);
        } else {
            // Check once on load
            checkStatus();
        }

        return () => clearInterval(interval);
    }, [syncStatus.status]);

    const requestConfirm = (options) => setConfirmConfig({ ...options, isOpen: true });
    const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploading, errors: uploadErrors, reset: resetUpload } = useForm({ 
        comic: null, 
        is_personal: false,
        generate_ai: true,
        thumbnail: null 
    });
    const { data: editData, setData: setEditData, post: postUpdate, processing: updating, errors: editErrors, reset: resetEdit } = useForm({
        title: '', shelf_id: '', category_ids: [], is_hidden: false, is_personal: false, is_approved: false, thumbnail: null
    });
    const { post: syncPost, processing: syncProcessing } = useForm();

    const currentVisibility = filters?.visibility || 'all';

    const submitUpload = (e) => {
        e.preventDefault();
        postUpload(route('admin.comics.upload'), { onSuccess: () => resetUpload('comic') });
    };

    const runSync = () => {
        syncPost(route('admin.comics.sync'), {
            onSuccess: () => setSyncStatus(prev => ({ ...prev, status: 'running' }))
        });
    };

    const handleEdit = (comic) => {
        setEditingComic(comic);
        setEditData({
            title:        comic.title,
            shelf_id:     comic.shelf_id || '',
            category_ids: comic.categories.map(c => c.id),
            is_hidden:    comic.is_hidden,
            is_personal:  comic.is_personal,
            is_approved:  comic.is_approved,
            thumbnail:    null,
        });
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        postUpdate(route('admin.comics.update', editingComic.id), {
            onSuccess: () => { setEditingComic(null); resetEdit(); },
        });
    };

    const toggleCategory = (id) => {
        const ids    = [...editData.category_ids];
        const index  = ids.indexOf(id);
        if (index > -1) ids.splice(index, 1); else ids.push(id);
        setEditData('category_ids', ids);
    };

    const openShare = (comic) => { setSharingComic(comic); setShareUserId(''); };

    const submitShare = () => {
        if (!shareUserId) return;
        router.post(route('admin.comics.share', sharingComic.id), { user_id: shareUserId }, {
            preserveScroll: true,
            onSuccess: () => setSharingComic(null),
        });
    };

    const revokeShare = (comic, userId) => {
        router.delete(route('admin.comics.revoke-share', [comic.id, userId]), { preserveScroll: true });
    };

    const submitRoleShare = (roleId) => {
        router.post(route('admin.comics.share-role', sharingComic.id), { role_id: roleId }, {
            preserveScroll: true,
            onSuccess: () => setSharingComic(prev => ({ 
                ...prev, 
                shared_roles: [...(prev.shared_roles || []), roles.find(r => r.id == roleId)]
            })),
        });
    };

    const revokeRoleShare = (comic, roleId) => {
        router.delete(route('admin.comics.revoke-role-share', [comic.id, roleId]), { preserveScroll: true });
    };

    const approveComic = (id) => {
        router.post(route('admin.comics.approve', id), {}, { preserveScroll: true });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(comics.data.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const bulkApprove = () => {
        requestConfirm({
            title: 'Approve Comics',
            message: `Are you sure you want to approve ${selectedIds.length} comics?`,
            confirmText: 'Approve',
            confirmStyle: 'primary',
            onConfirm: () => {
                router.post(route('admin.comics.bulk-approve'), { ids: selectedIds }, {
                    preserveScroll: true,
                    onSuccess: () => setSelectedIds([]),
                });
            }
        });
    };

    const generateAiMeta = (id) => {
        router.post(route('admin.comics.generate-ai', id), {}, { preserveScroll: true });
    };

    const bulkGenerateAiMeta = () => {
        requestConfirm({
            title: 'Auto-Tag Comics',
            message: `Are you sure you want to queue ${selectedIds.length} comics for AI auto-tagging?`,
            confirmText: 'Queue Auto-Tag',
            confirmStyle: 'primary',
            onConfirm: () => {
                router.post(route('admin.comics.bulk-generate-ai'), { ids: selectedIds }, {
                    preserveScroll: true,
                });
            }
        });
    };

    const setVisibility = (v) => router.get(route('admin.comics.index'), { ...filters, visibility: v, approval: 'all' }, { replace: true, preserveScroll: false });
    const setApprovalFilter = (a) => router.get(route('admin.comics.index'), { ...filters, approval: a, visibility: 'all' }, { replace: true, preserveScroll: false });

    const approveAllPending = () => {
        requestConfirm({
            title: 'Approve All Pending',
            message: 'Are you sure you want to approve ALL pending comics? This cannot be undone.',
            confirmText: 'Approve All',
            confirmStyle: 'primary',
            onConfirm: () => {
                router.post(route('admin.comics.approve-all-pending'), {}, {
                    preserveScroll: true,
                });
            }
        });
    };

    const autoTagAllPending = () => {
        requestConfirm({
            title: 'Auto-Tag All Pending',
            message: 'Are you sure you want to queue AI tagging for ALL comics that missing metadata? This might take a while.',
            confirmText: 'Queue All',
            confirmStyle: 'primary',
            onConfirm: () => {
                router.post(route('admin.comics.auto-tag-all-pending'), {}, {
                    preserveScroll: true,
                });
            }
        });
    };

    const TABS = [
        { key: 'all',    label: 'All Comics' },
        { key: 'public', label: 'Public' },
        { key: 'hidden', label: 'Hidden' },
        { key: 'pending', label: 'Pending Approval', filter: 'approval' },
    ];

    return (
        <ComicLayout auth={auth}>
            <Head title="Manage Comics" />

            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="font-['Bebas_Neue'] text-4xl tracking-[3px] uppercase text-white">
                        Library <span className="text-[#e8003d]">Management</span>
                    </h2>
                    <div className="flex gap-3 flex-wrap">
                        <Link href={route('admin.users.index')} className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-colors">
                            👥 Users
                        </Link>
                        <Link href={route('admin.shelves.index')} className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-colors">
                            Shelves
                        </Link>
                        <Link href={route('admin.categories.index')} className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-colors">
                            Categories
                        </Link>
                        <Link href={route('admin.duplicates.index')} className="bg-blue-500/10 border border-blue-500/20 text-[#60a5fa] px-5 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-2">
                            🔍 Duplicates
                        </Link>
                        <Link href={route('admin.logs.index')} className="bg-purple-500/10 border border-purple-500/20 text-[#c084fc] px-5 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-purple-500/20 transition-colors flex items-center gap-2">
                            📜 Activity
                        </Link>
                    </div>
                </div>

                {/* Upload + Sync */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#16161f] border border-white/7 rounded-2xl p-6">
                        <h3 className="text-lg font-['Bebas_Neue'] tracking-widest text-white mb-4">Upload New Comic</h3>
                        <form onSubmit={submitUpload}>
                            <input
                                type="file"
                                onChange={(e) => setUploadData('comic', e.target.files[0])}
                                className="block w-full text-sm text-[#8888a0] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#e8003d]/10 file:text-[#e8003d] hover:file:bg-[#e8003d]/20 mb-4"
                                required
                            />
                            {uploadErrors.comic && <div className="text-[#e8003d] text-xs mb-2">{uploadErrors.comic}</div>}
                            
                            <div className="flex flex-col gap-4 mb-5">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        onChange={e => setUploadData('is_personal', e.target.checked)}
                                        className="hidden" 
                                    />
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${uploadData.is_personal ? 'bg-blue-500 border-blue-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                        {uploadData.is_personal && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                    </div>
                                    <span className="text-sm text-[#a0a0b8] group-hover:text-white transition-colors">Keep as Personal PDF</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={uploadData.generate_ai}
                                        onChange={e => setUploadData('generate_ai', e.target.checked)}
                                        className="hidden" 
                                    />
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${uploadData.generate_ai ? 'bg-purple-500 border-purple-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                        {uploadData.generate_ai && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                    </div>
                                    <span className="text-sm text-[#a0a0b8] group-hover:text-white transition-colors">Generate AI Tags & Summary</span>
                                </label>
                            </div>

                            <div className="flex flex-col gap-2 mb-5">
                                <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Optional Thumbnail (JPG/PNG)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setUploadData('thumbnail', e.target.files[0])}
                                    className="block w-full text-xs text-[#8888a0] file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10"
                                />
                                {uploadErrors.thumbnail && <div className="text-[#e8003d] text-xs mt-1">{uploadErrors.thumbnail}</div>}
                            </div>

                            <button type="submit" disabled={uploading} className="bg-[#e8003d] text-white px-8 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-[#ff0044] shadow-lg shadow-[#e8003d]/20">
                                {uploading ? 'Uploading...' : 'Upload PDF'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-[#16161f] border border-white/7 rounded-2xl p-6 flex flex-col justify-center">
                        <h3 className="text-lg font-['Bebas_Neue'] tracking-widest text-white mb-2">Library Sync</h3>
                        <p className="text-sm text-[#8888a0] mb-4">Scan the system folder for new PDFs and import them.</p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={runSync} 
                                disabled={syncProcessing || syncStatus.status === 'running'} 
                                className="bg-white/5 border border-white/7 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors hover:bg-white/10 w-max"
                            >
                                {syncStatus.status === 'running' ? 'Sync in Progress...' : 'Sync Now'}
                            </button>

                            {syncStatus.status === 'running' && (
                                <div className="animate-pulse">
                                    <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">
                                        {syncStatus.progress || 'Starting sync...'}
                                    </p>
                                </div>
                            )}

                            {syncStatus.status === 'idle' && syncStatus.last_sync_at && (
                                <p className="text-[10px] text-[#66667f] uppercase tracking-tighter">
                                    Last sync: {new Date(syncStatus.last_sync_at).toLocaleString()}
                                </p>
                            )}

                            {syncStatus.status === 'error' && (
                                <p className="text-xs text-[#e8003d] font-bold">
                                    Error: {syncStatus.error}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-1 p-1 bg-[#16161f] border border-white/7 rounded-xl w-fit">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => tab.filter === 'approval' ? setApprovalFilter(tab.key) : setVisibility(tab.key)}
                                className={`px-5 py-2 rounded-lg text-[12px] uppercase tracking-widest font-black transition-all ${
                                    (tab.filter === 'approval' ? filters.approval === tab.key : filters.visibility === tab.key) || (tab.key === 'all' && !filters.visibility && !filters.approval)
                                        ? 'bg-[#e8003d] text-white shadow-lg shadow-[#e8003d]/20'
                                        : 'text-[#8888a0] hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Approve All Pending button — always visible */}
                        <button 
                            onClick={approveAllPending}
                            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                        >
                            ✅ Approve All Pending
                        </button>

                        <button 
                            onClick={autoTagAllPending}
                            className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all"
                        >
                            ✨ Auto-Tag All Pending
                        </button>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-4 bg-[#e8003d]/10 border border-[#e8003d]/20 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2">
                            <span className="text-[11px] font-black text-[#e8003d] uppercase tracking-widest">{selectedIds.length} Selected</span>
                            <button 
                                onClick={bulkApprove}
                                className="bg-[#e8003d] text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#ff0044] transition-all shadow-lg shadow-[#e8003d]/20"
                            >
                                Bulk Approve
                            </button>
                            <button 
                                onClick={bulkGenerateAiMeta}
                                className="bg-purple-600/20 text-purple-400 border border-purple-500/30 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-600/40 transition-all shadow-lg"
                            >
                                ✨ Auto-Tag
                            </button>
                            <button onClick={() => setSelectedIds([])} className="text-[#8888a0] hover:text-white transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            </button>
                        </div>
                    )}
                    </div>
                </div>

                {/* Comics Table */}
                <div className="bg-[#16161f] border border-white/7 rounded-2xl overflow-hidden">
                    <div className="p-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5" style={{ minWidth: '840px' }}>
                            <thead>
                                <tr className="border-b border-white/7">
                                    <th className="px-4 py-4 text-left w-10">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.length === comics.data.length && comics.data.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#e8003d] focus:ring-[#e8003d] focus:ring-offset-0"
                                        />
                                    </th>
                                    {['Comic', 'Shelf', 'Categories', 'Status', 'Shared With', 'Uploaded By', 'Actions'].map(h => (
                                        <th key={h} className={`px-4 py-4 text-left text-[11px] font-black text-[#a0a0b8] uppercase tracking-widest whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {comics.data.map((comic) => (
                                    <tr key={comic.id} className={`group hover:bg-white/[0.02] transition-colors ${comic.is_hidden ? 'opacity-60' : ''} ${selectedIds.includes(comic.id) ? 'bg-[#e8003d]/5' : ''}`}>
                                        <td className="px-4 py-4">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(comic.id)}
                                                onChange={() => toggleSelect(comic.id)}
                                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#e8003d] focus:ring-[#e8003d] focus:ring-offset-0"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold group-hover:text-[#ff3366] transition-colors text-sm flex items-center gap-2">
                                                    {comic.title}
                                                    {comic.is_personal && <span className="text-[10px] bg-blue-500/20 text-[#60a5fa] px-1.5 py-0.5 rounded border border-blue-500/30 uppercase tracking-tighter">Personal</span>}
                                                </span>
                                                <span className="text-[10px] text-[#a0a0b8] font-mono mt-0.5 truncate max-w-[200px]">{comic.path}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium">
                                            {comic.shelf
                                                ? <span className="text-[#e2e8f0]">{comic.shelf.name}</span>
                                                : <span className="text-[10px] uppercase tracking-widest text-[#64748b] font-black">None</span>
                                            }
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {comic.categories.length > 0
                                                    ? comic.categories.slice(0, 2).map(c => (
                                                        <span key={c.id} className="text-[10px] bg-[#334155]/50 text-white px-2 py-0.5 rounded border border-[#475569] font-bold">{c.name}</span>
                                                    ))
                                                    : <span className="text-[10px] uppercase tracking-widest text-[#64748b] font-black">-</span>
                                                }
                                                {comic.categories.length > 2 && <span className="text-[10px] text-[#cbd5e1] font-bold">+{comic.categories.length - 2}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                {comic.is_hidden
                                                    ? <span className="text-[10px] text-[#f87171] font-black uppercase tracking-widest flex items-center gap-1">🔒 Hidden</span>
                                                    : <span className="text-[10px] text-[#22c55e] font-black uppercase tracking-widest">✓ Public</span>
                                                }
                                                {!comic.is_approved && !comic.is_personal && (
                                                    <span className="text-[10px] bg-[#fbbf24]/20 text-[#fde047] px-2 py-0.5 rounded border border-[#fbbf24]/40 uppercase font-black tracking-widest w-fit">Pending Auth</span>
                                                )}
                                                {comic.is_approved && !comic.is_personal && (
                                                    <span className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-widest">Approved</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1 items-center">
                                                {comic.shared_with?.length > 0
                                                    ? comic.shared_with.slice(0, 2).map(u => (
                                                        <span key={u.id} className="text-[10px] bg-[#fca5a5]/10 text-[#fca5a5] px-2 py-0.5 rounded border border-[#fca5a5]/30 font-bold flex items-center gap-1">
                                                            {u.name}
                                                            <button onClick={() => revokeShare(comic, u.id)} className="ml-1 hover:text-white transition-colors">✕</button>
                                                        </span>
                                                    ))
                                                    : <span className="text-[10px] text-[#64748b] font-black">—</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-[#e2e8f0] text-sm font-bold">
                                                {comic.uploader?.name || <span className="text-[#cbd5e1]">System</span>}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!comic.is_approved && !comic.is_personal && (
                                                    <button onClick={() => approveComic(comic.id)} className="p-2 rounded-lg bg-[#22c55e]/10 text-[#22c55e] hover:text-white hover:bg-[#22c55e] transition-all" title="Approve Comic">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </button>
                                                )}
                                                <button onClick={() => openShare(comic)} className="p-2 rounded-lg bg-blue-500/10 text-[#60a5fa] hover:text-white hover:bg-blue-500 transition-all" title="Share Access">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                                                </button>
                                                <button onClick={() => generateAiMeta(comic.id)} className="p-2 rounded-lg bg-purple-500/10 text-[#c084fc] hover:text-white hover:bg-purple-500 transition-all shadow-lg" title="Generate AI Summary & Tags">
                                                    ✨
                                                </button>
                                                <Link
                                                    href={route('admin.comics.regenerate-thumbnail', comic.id)}
                                                    method="post" as="button" preserveScroll
                                                    className="p-2 rounded-lg bg-white/10 text-[#cbd5e1] hover:text-white hover:bg-[#e8003d] transition-all font-bold text-[10px] uppercase tracking-tighter"
                                                    title="Regenerate Thumbnail"
                                                >
                                                    TMB
                                                </Link>
                                                <button onClick={() => handleEdit(comic)} className="p-2 rounded-lg bg-white/10 text-[#cbd5e1] hover:text-white hover:bg-white/20 transition-all font-bold" title="Edit Comic">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button 
                                                    onClick={() => syncPost(route('admin.comics.toggle-visibility', comic.id), { preserveScroll: true })} 
                                                    className={`p-2 rounded-lg transition-all font-bold ${comic.is_hidden ? 'bg-[#f87171]/20 text-[#f87171] hover:text-white hover:bg-[#f87171]' : 'bg-white/10 text-[#cbd5e1] hover:text-white hover:bg-white/20'}`}
                                                    title={comic.is_hidden ? 'Unhide' : 'Hide'}
                                                >
                                                    {comic.is_hidden ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-8 flex justify-center">
                            <Pagination links={comics.links} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Comic Modal */}
            {editingComic && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setEditingComic(null); resetEdit(); }} />
                    <div className="relative bg-[#111118] border border-[#e8003d]/30 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">Edit Comic: <span className="text-[#e8003d]">{editingComic.title}</span></h2>
                            <button onClick={() => { setEditingComic(null); resetEdit(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-[#8888a0] hover:text-white">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={submitUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] tracking-widest uppercase font-bold text-[#a0a0b8]">Title</label>
                                    <input type="text" value={editData.title} onChange={e => setEditData('title', e.target.value)} className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors" />
                                    {editErrors.title && <span className="text-[#e8003d] text-xs">{editErrors.title}</span>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] tracking-widest uppercase font-bold text-[#a0a0b8]">Shelf</label>
                                    <select value={editData.shelf_id} onChange={e => setEditData('shelf_id', e.target.value)} className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors">
                                        <option value="">No Shelf</option>
                                        {shelves.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] tracking-widest uppercase font-bold text-[#a0a0b8]">Visibility</label>
                                    <div className="flex flex-col gap-3 mt-1">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={editData.is_hidden} onChange={e => setEditData('is_hidden', e.target.checked)} className="hidden" />
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${editData.is_hidden ? 'bg-[#e8003d] border-[#e8003d]' : 'border-white/20 group-hover:border-white/40'}`}>
                                                {editData.is_hidden && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                            </div>
                                            <span className="text-[13px] text-[#a0a0b8] group-hover:text-white transition-colors">Hidden from Public</span>
                                        </label>
 
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={editData.is_personal} onChange={e => setEditData('is_personal', e.target.checked)} className="hidden" />
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${editData.is_personal ? 'bg-blue-500 border-blue-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                                {editData.is_personal && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                            </div>
                                            <span className="text-[13px] text-[#a0a0b8] group-hover:text-white transition-colors">Personal PDF (Private)</span>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={editData.is_approved} onChange={e => setEditData('is_approved', e.target.checked)} className="hidden" />
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${editData.is_approved ? 'bg-green-500 border-green-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                                {editData.is_approved && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                            </div>
                                            <span className="text-[13px] text-[#a0a0b8] group-hover:text-white transition-colors">Admin Approved</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] tracking-widest uppercase font-bold text-[#a0a0b8]">Optional Thumbnail (JPG/PNG)</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setEditData('thumbnail', e.target.files[0])}
                                        className="block w-full text-xs text-[#a0a0b8] file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10"
                                    />
                                    {editErrors.thumbnail && <div className="text-[#e8003d] text-xs mt-1">{editErrors.thumbnail}</div>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] tracking-widest uppercase font-bold text-[#a0a0b8]">Categories</label>
                                <div className="bg-[#0c0c12] border border-white/10 rounded-lg p-4 h-[300px] overflow-y-auto flex flex-col gap-2">
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                            <div onClick={() => toggleCategory(cat.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${editData.category_ids.includes(cat.id) ? 'bg-[#e8003d] border-[#e8003d]' : 'border-white/20 group-hover:border-white/40'}`}>
                                                {editData.category_ids.includes(cat.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                            </div>
                                            <span className={`text-[13px] ${editData.category_ids.includes(cat.id) ? 'text-white font-medium' : 'text-[#a0a0b8]'}`}>{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="md:col-span-2 flex gap-3">
                                <button type="submit" disabled={updating} className="bg-[#e8003d] text-white px-10 py-3 rounded-lg font-bold text-[13px] tracking-widest uppercase hover:bg-[#ff0044] transition-all disabled:opacity-50">
                                    {updating ? 'Updating...' : 'Save Changes'}
                                </button>
                                <button type="button" onClick={() => { setEditingComic(null); resetEdit(); }} className="bg-white/5 border border-white/10 text-white px-10 py-3 rounded-lg font-bold text-[13px] tracking-widest uppercase hover:bg-white/10 transition-all">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Comic Modal */}
            {sharingComic && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSharingComic(null)} />
                    <div className="relative bg-[#111118] border border-blue-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-['Bebas_Neue'] tracking-widest text-white mb-1">Share Comic</h2>
                        <p className="text-[#8888a0] text-sm mb-6">Grant a specific user access to <span className="text-white font-semibold">{sharingComic.title}</span> even when it's hidden.</p>

                        {/* Current shares */}
                        {sharingComic.shared_with?.length > 0 && (
                            <div className="mb-5">
                                <p className="text-[11px] uppercase tracking-widest text-[#55556a] mb-2 font-bold">Currently Shared With</p>
                                <div className="flex flex-wrap gap-2">
                                    {sharingComic.shared_with.map(u => (
                                        <span key={u.id} className="flex items-center gap-2 text-sm bg-[#e8003d]/10 text-[#e8003d] border border-[#e8003d]/20 px-3 py-1 rounded-full">
                                            {u.name}
                                            <button onClick={() => { revokeShare(sharingComic, u.id); setSharingComic(null); }} className="hover:text-white">✕</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-3">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-[#8888a0]">Shared with Users</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {sharingComic.shared_with?.map(u => (
                                        <span key={u.id} className="flex items-center gap-2 text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full">
                                            {u.name}
                                            <button onClick={() => revokeShare(sharingComic, u.id)} className="hover:text-white transition-colors">✕</button>
                                        </span>
                                    ))}
                                </div>
                                <select 
                                    value={shareUserId} 
                                    onChange={e => {
                                        const uid = e.target.value;
                                        if (uid) {
                                            router.post(route('admin.comics.share', sharingComic.id), { user_id: uid }, { preserveScroll: true });
                                            setShareUserId('');
                                        }
                                    }} 
                                    className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-sm"
                                >
                                    <option value="">Grant user access...</option>
                                    {users.filter(u => !sharingComic.shared_with?.find(s => s.id === u.id)).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-[#8888a0]">Shared with Roles</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {sharingComic.shared_roles?.map(r => (
                                        <span key={r.id} className="flex items-center gap-2 text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full">
                                            {r.name}
                                            <button onClick={() => revokeRoleShare(sharingComic, r.id)} className="hover:text-white transition-colors">✕</button>
                                        </span>
                                    ))}
                                </div>
                                <select 
                                    onChange={e => {
                                        const rid = e.target.value;
                                        if (rid) {
                                            submitRoleShare(rid);
                                            e.target.value = '';
                                        }
                                    }} 
                                    className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-purple-500 transition-colors text-sm"
                                >
                                    <option value="">Grant role access...</option>
                                    {roles.filter(r => !sharingComic.shared_roles?.find(s => s.id === r.id)).map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button onClick={() => setSharingComic(null)} className="w-full bg-white/5 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition mt-2">
                                Close
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
