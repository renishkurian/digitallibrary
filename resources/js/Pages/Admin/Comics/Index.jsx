import { useState } from 'react';
import { useForm, Head, Link, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import Pagination from '@/Components/Pagination';

export default function Index({ comics, auth, shelves, categories, users, filters }) {
    const [editingComic, setEditingComic] = useState(null);
    const [sharingComic, setSharingComic] = useState(null);
    const [shareUserId, setShareUserId]   = useState('');

    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploading, errors: uploadErrors, reset: resetUpload } = useForm({ 
        comic: null, 
        is_personal: false,
        thumbnail: null 
    });
    const { data: editData, setData: setEditData, post: postUpdate, processing: updating, errors: editErrors, reset: resetEdit } = useForm({
        title: '', shelf_id: '', category_ids: [], is_hidden: false, is_personal: false, thumbnail: null
    });
    const { post: syncPost, processing: syncProcessing } = useForm();

    const currentVisibility = filters?.visibility || 'all';

    const submitUpload = (e) => {
        e.preventDefault();
        postUpload(route('admin.comics.upload'), { onSuccess: () => resetUpload('comic') });
    };

    const runSync = () => syncPost(route('admin.comics.sync'));

    const handleEdit = (comic) => {
        setEditingComic(comic);
        setEditData({
            title:        comic.title,
            shelf_id:     comic.shelf_id || '',
            category_ids: comic.categories.map(c => c.id),
            is_hidden:    comic.is_hidden,
            is_personal:  comic.is_personal,
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

    const setVisibility = (v) => router.get(route('admin.comics.index'), { visibility: v }, { replace: true, preserveScroll: false });

    const TABS = [
        { key: 'all',    label: 'All Comics' },
        { key: 'public', label: 'Public' },
        { key: 'hidden', label: 'Hidden' },
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
                            
                            <div className="flex items-center gap-6 mb-5">
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
                        <button onClick={runSync} disabled={syncProcessing} className="bg-white/5 border border-white/7 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors hover:bg-white/10 w-max">
                            {syncProcessing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>
                </div>

                {/* Visibility Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-[#16161f] border border-white/7 rounded-xl w-fit">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setVisibility(tab.key)}
                            className={`px-5 py-2 rounded-lg text-[12px] uppercase tracking-widest font-black transition-all ${
                                currentVisibility === tab.key
                                    ? 'bg-[#e8003d] text-white shadow-lg shadow-[#e8003d]/20'
                                    : 'text-[#8888a0] hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                            {tab.key === 'hidden' && currentVisibility === 'all' && (
                                <span className="ml-2 text-[10px] bg-white/10 text-white px-1.5 py-0.5 rounded-full font-bold">
                                    {comics.data.filter(c => c.is_hidden).length}
                                </span>
                            )}
                        </button>
                    ))}
                    <span className="ml-3 text-[10px] text-[#55556a] uppercase tracking-[2px] font-bold pr-3 border-l border-white/10 pl-3">{comics.total} total</span>
                </div>

                {/* Comics Table */}
                <div className="bg-[#16161f] border border-white/7 rounded-2xl overflow-hidden">
                    <div className="p-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5" style={{ minWidth: '840px' }}>
                            <thead>
                                <tr className="border-b border-white/7">
                                    {['Comic', 'Shelf', 'Categories', 'Status', 'Shared With', 'Uploaded By', 'Actions'].map(h => (
                                        <th key={h} className={`px-4 py-4 text-left text-[11px] font-black text-[#a0a0b8] uppercase tracking-widest whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {comics.data.map((comic) => (
                                    <tr key={comic.id} className={`group hover:bg-white/[0.02] transition-colors ${comic.is_hidden ? 'opacity-60' : ''}`}>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold group-hover:text-[#e8003d] transition-colors text-sm flex items-center gap-2">
                                                    {comic.title}
                                                    {comic.is_personal && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-tighter">Personal</span>}
                                                </span>
                                                <span className="text-[10px] text-[#66667a] font-mono mt-0.5 truncate max-w-[200px]">{comic.path}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            {comic.shelf
                                                ? <span className="text-[#a0a0b8] font-medium">{comic.shelf.name}</span>
                                                : <span className="text-[10px] uppercase tracking-widest text-[#44445a] font-black">None</span>
                                            }
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {comic.categories.length > 0
                                                    ? comic.categories.slice(0, 2).map(c => (
                                                        <span key={c.id} className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded border border-white/10 font-medium">{c.name}</span>
                                                    ))
                                                    : <span className="text-[10px] uppercase tracking-widest text-[#66667a] font-black">-</span>
                                                }
                                                {comic.categories.length > 2 && <span className="text-[10px] text-[#55556a]">+{comic.categories.length - 2}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {comic.is_hidden
                                                ? <span className="text-[10px] text-[#e8003d] font-bold uppercase tracking-widest flex items-center gap-1">🔒 Hidden</span>
                                                : <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">✓ Public</span>
                                            }
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1 items-center">
                                                {comic.shared_with?.length > 0
                                                    ? comic.shared_with.slice(0, 2).map(u => (
                                                        <span key={u.id} className="text-[10px] bg-[#e8003d]/10 text-[#e8003d] px-2 py-0.5 rounded border border-[#e8003d]/20 flex items-center gap-1">
                                                            {u.name}
                                                            <button onClick={() => revokeShare(comic, u.id)} className="ml-1 hover:text-white transition-colors">✕</button>
                                                        </span>
                                                    ))
                                                    : <span className="text-[10px] text-[#55556a]">—</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-white/70 text-xs font-medium">
                                                {comic.uploader?.name || <span className="text-[#66667a]">System</span>}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openShare(comic)} className="p-2 rounded-lg bg-blue-500/5 text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Share Access">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                                                </button>
                                                <Link
                                                    href={route('admin.comics.regenerate-thumbnail', comic.id)}
                                                    method="post" as="button" preserveScroll
                                                    className="p-2 rounded-lg bg-white/5 text-[#8888a0] hover:text-[#e8003d] hover:bg-white/10 transition-all font-bold text-[10px] uppercase tracking-tighter"
                                                    title="Regenerate Thumbnail"
                                                >
                                                    TMB
                                                </Link>
                                                <button onClick={() => handleEdit(comic)} className="p-2 rounded-lg bg-white/5 text-[#8888a0] hover:text-white hover:bg-white/10 transition-all" title="Edit Comic">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button 
                                                    onClick={() => syncPost(route('admin.comics.toggle-visibility', comic.id), { preserveScroll: true })} 
                                                    className={`p-2 rounded-lg transition-all ${comic.is_hidden ? 'bg-[#e8003d]/10 text-[#e8003d]' : 'bg-white/5 text-[#8888a0] hover:bg-white/10'}`}
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

                        <div className="flex flex-col gap-3">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-[#8888a0]">Add User</label>
                            <select value={shareUserId} onChange={e => setShareUserId(e.target.value)} className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors">
                                <option value="">Select a user...</option>
                                {users.filter(u => !sharingComic.shared_with?.find(s => s.id === u.id)).map(u => (
                                    <option key={u.id} value={u.id} className="bg-[#111118]">{u.name} ({u.email})</option>
                                ))}
                            </select>
                            <div className="flex gap-3 mt-2">
                                <button onClick={submitShare} disabled={!shareUserId} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-blue-500 transition disabled:opacity-40">
                                    Grant Access
                                </button>
                                <button onClick={() => setSharingComic(null)} className="bg-white/5 text-white px-8 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ComicLayout>
    );
}
