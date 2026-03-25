import { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import Pagination from '@/Components/Pagination';
import ConfirmModal from '@/Components/ConfirmModal';

export default function Duplicates({ auth, paginatedData, filters }) {
    const [searchQuery, setSearchQuery] = useState(filters.q || '');
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', comicId: null, type: 'single' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [syncStatus, setSyncStatus]   = useState({ status: 'idle', progress: '', error: null, last_sync_at: null });

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

    const { data: searchData, setData, get: getSearch } = useForm({
        q: filters.q || '',
    });

    const { post: syncPost, processing: syncProcessing } = useForm();

    const runSync = () => syncPost(route('admin.comics.sync'), {
        onSuccess: () => setSyncStatus(p => ({ ...p, status: 'running' }))
    });

    const handleSearch = (e) => {
        e.preventDefault();
        getSearch(route('admin.duplicates.index'));
    };

    const confirmDelete = (comic) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Duplicate File',
            message: `Are you sure you want to delete "${comic.title}"? This will physically remove the PDF from storage and cannot be undone.`,
            comicId: comic.id,
            type: 'single'
        });
    };

    const confirmBulkDelete = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Bulk Delete Duplicates',
            message: `Are you sure you want to delete ${selectedIds.length} selected files? This will physically remove them from storage and cannot be undone.`,
            comicId: null,
            type: 'bulk'
        });
    };

    const handleDelete = () => {
        if (confirmConfig.type === 'bulk') {
            router.post(route('admin.duplicates.bulk-delete'), { ids: selectedIds }, {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                    setSelectedIds([]);
                }
            });
        } else {
            router.delete(route('admin.duplicates.destroy', confirmConfig.comicId), {
                preserveScroll: true,
                onSuccess: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleGroupSelect = (groupItems) => {
        const groupIds = groupItems.map(item => item.id);
        const allInGroupSelected = groupIds.every(id => selectedIds.includes(id));

        if (allInGroupSelected) {
            setSelectedIds(prev => prev.filter(id => !groupIds.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...groupIds])]);
        }
    };

    // Pre-select all non-suggested (i.e. the ones to delete) across all groups
    const selectAllDuplicates = () => {
        const toDelete = paginatedData.data.flatMap(group =>
            group.items.filter(item => item.id !== group.suggested_keep_id).map(item => item.id)
        );
        setSelectedIds(toDelete);
    };

    const duplicates = paginatedData.data;

    return (
        <ComicLayout auth={auth}>
            <Head title="Duplicate Comics" />

            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="font-['Bebas_Neue'] text-4xl tracking-[3px] uppercase text-white">
                        Duplicate <span className="text-[#e8003d]">Detection</span>
                    </h2>
                    <div className="flex gap-4 items-center">
                        {syncStatus.status === 'running' && (
                            <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider animate-pulse">
                                ⟳ {syncStatus.progress || 'Scanning...'}
                            </span>
                        )}
                        <button 
                            onClick={runSync} 
                            disabled={syncProcessing || syncStatus.status === 'running'}
                            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/10 text-[#888] hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
                            title="Scan system for new comics and duplicates"
                        >
                            ⟳ Ingress
                        </button>
                        <form onSubmit={handleSearch} className="relative w-[300px]">
                            <input
                                type="text"
                                placeholder="Search duplicates..."
                                className="w-full bg-[#16161f] border border-white/7 rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8003d] transition-all"
                                value={searchData.q}
                                onChange={(e) => setData('q', e.target.value)}
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            </button>
                        </form>
                        <Link
                            href={route('admin.comics.index')}
                            className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
                        >
                            Back to Management
                        </Link>
                    </div>
                </div>

                {duplicates.length === 0 ? (
                    <div className="bg-[#16161f] border border-white/7 rounded-2xl p-12 text-center">
                        <div className="text-5xl mb-4">
                            {searchData.q ? '🔍' : '🎉'}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {searchData.q ? 'No matching duplicates found' : 'No duplicates found!'}
                        </h3>
                        <p className="text-[#8888a0]">
                            {searchData.q ? `Try adjusting your search for "${searchData.q}"` : 'All files in your library have unique content.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                            <p className="text-[#8888a0] text-sm">
                                <span className="font-bold text-blue-400">Note:</span> Duplicates are identified by visual content — same pages, regardless of compression or filename.{' '}
                                <span className="text-green-400 font-bold">Green = suggested keep</span> (smallest/compressed file).
                            </p>
                            <div className="flex items-center gap-4 shrink-0">
                                <button
                                    onClick={selectAllDuplicates}
                                    className="text-[10px] font-black uppercase tracking-widest text-[#e8003d] hover:text-white transition-colors whitespace-nowrap"
                                >
                                    Select All Duplicates
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#a0a0b8]">
                                    Found {paginatedData.meta.total} Group{paginatedData.meta.total > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {syncStatus.status === 'running' && (
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">System Scan in Progress</span>
                                    <span className="text-[10px] font-black text-blue-400">Updating library...</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500 animate-pulse w-full" />
                                </div>
                                <p className="text-[10px] text-[#64748b] mt-2 italic">
                                    {syncStatus.progress || 'Scanning filesystem for new and duplicate comics...'}
                                </p>
                            </div>
                        )}

                        {duplicates.map((group) => (
                            <div key={group.hash} className="bg-[#16161f] border border-white/7 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-300">
                                <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/7">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#e8003d] focus:ring-[#e8003d] transition-all cursor-pointer"
                                            checked={group.items.every(item => selectedIds.includes(item.id))}
                                            onChange={() => toggleGroupSelect(group.items)}
                                        />
                                        <div className="bg-[#e8003d] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                            {group.count} Files
                                        </div>
                                        <div className="flex flex-col">
                                            {/* Updated label: Visual Hash instead of MD5 Hash */}
                                            <span className="text-[10px] text-[#64748b] uppercase tracking-widest font-black">Visual Hash</span>
                                            <span className="text-xs font-mono text-[#a0a0b8]">{group.hash}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-white/5">
                                        <tbody className="divide-y divide-white/5">
                                            {group.items.map((comic) => {
                                                const isSuggested = comic.id === group.suggested_keep_id;
                                                return (
                                                    <tr key={comic.id} className={`group hover:bg-white/[0.04] transition-colors ${selectedIds.includes(comic.id) ? 'bg-white/[0.03]' : ''}`}>
                                                        <td className="px-6 py-4 w-4">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#e8003d] focus:ring-[#e8003d] transition-all cursor-pointer"
                                                                checked={selectedIds.includes(comic.id)}
                                                                onChange={() => toggleSelect(comic.id)}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 w-16">
                                                            <div className={`w-12 h-16 bg-[#0a0a0f] rounded-lg overflow-hidden border ${selectedIds.includes(comic.id) ? 'border-[#e8003d]' : isSuggested ? 'border-green-500/50' : 'border-white/10 group-hover:border-[#e8003d]/30'} transition-colors shadow-sm`}>
                                                                {comic.thumbnail ? (
                                                                    <img
                                                                        src={`/thumbs/${comic.thumbnail}`}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[#333]">PDF</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-white font-bold text-sm group-hover:text-[#ff3366] transition-colors">{comic.title}</span>
                                                                    {isSuggested && (
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                                                            Keep
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-[#64748b] font-mono truncate max-w-md">{comic.path}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs text-[#a0a0b8] font-medium">{comic.shelf}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-xs font-mono whitespace-nowrap ${isSuggested ? 'text-green-400' : 'text-[#a0a0b8]'}`}>
                                                                {comic.size}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {!isSuggested && (
                                                                    <button
                                                                        onClick={() => confirmDelete(comic)}
                                                                        className="text-[10px] font-black uppercase tracking-widest text-[#8888a0] hover:text-[#e8003d] transition-colors"
                                                                        title="Delete this duplicate file permanently"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                )}
                                                                <Link
                                                                    href={route('admin.comics.index', { q: comic.title })}
                                                                    className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors h-7 px-3 flex items-center bg-white/5 rounded-lg border border-white/10"
                                                                >
                                                                    Manage
                                                                </Link>
                                                                <a
                                                                    href={route('comics.show', comic.id)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[10px] font-black uppercase tracking-widest text-white h-7 px-3 flex items-center bg-[#e8003d] hover:bg-[#ff0044] rounded-lg shadow-lg shadow-[#e8003d]/20 transition-all"
                                                                >
                                                                    Read
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
                        ))}

                        <div className="mt-4 flex justify-center">
                            <Pagination links={paginatedData.links} />
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
                    <div className="bg-[#16161f] border border-[#e8003d]/30 shadow-[0_0_30px_rgba(232,0,61,0.15)] rounded-2xl px-6 py-4 flex items-center gap-8 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#e8003d] flex items-center justify-center text-white font-black text-xs">
                                {selectedIds.length}
                            </div>
                            <span className="text-sm text-white font-bold uppercase tracking-wider">Items Selected</span>
                        </div>

                        <div className="h-8 w-px bg-white/10"></div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-xs font-bold text-[#8888a0] hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBulkDelete}
                                className="bg-[#e8003d] hover:bg-[#ff0044] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#e8003d]/20 transition-all flex items-center gap-2"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                                Delete Selected
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
                confirmText="Delete PDF"
                confirmStyle="danger"
            />
        </ComicLayout>
    );
}