import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import ConfirmModal from '@/Components/ConfirmModal';

export default function Index({ shelves }) {
    const [editingShelf, setEditingShelf] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', confirmStyle: 'danger' });

    const requestConfirm = (options) => setConfirmConfig({ ...options, isOpen: true });
    const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
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
                }
            });
        } else {
            post(route('admin.shelves.store'), {
                onSuccess: () => reset()
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
            title: 'Delete Shelf',
            message: 'Are you sure you want to delete this shelf?',
            confirmText: 'Delete',
            confirmStyle: 'danger',
            onConfirm: () => {
                destroy(route('admin.shelves.destroy', id));
            }
        });
    };

    return (
        <ComicLayout title="Admin Shelves">
            <Head title="Admin - Manage Shelves" />
            
            <div className="max-w-6xl mx-auto flex flex-col gap-10">
                <div className="flex flex-col gap-6 bg-white/5 border border-white/7 rounded-2xl p-8">
                    <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">
                        Create New Shelf
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Name</label>
                            <input 
                                type="text"
                                value={editingShelf ? '' : data.name}
                                onChange={e => !editingShelf && setData('name', e.target.value)}
                                className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                                placeholder="Shelf name"
                            />
                            {!editingShelf && errors.name && <span className="text-[#e8003d] text-xs">{errors.name}</span>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Parent Shelf</label>
                            <select 
                                value={data.parent_id}
                                onChange={e => setData('parent_id', e.target.value)}
                                className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                            >
                                <option value="">None (Top Level)</option>
                                {shelves.filter(s => !editingShelf || s.id !== editingShelf.id).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {errors.parent_id && <span className="text-[#e8003d] text-xs">{errors.parent_id}</span>}
                        </div>

                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Visibility & Ownership</label>
                            <div className="flex items-center gap-6 mt-1">
                                <select 
                                    value={data.is_hidden ? '1' : '0'}
                                    onChange={e => setData('is_hidden', e.target.value === '1')}
                                    className="bg-[#0c0c12] border border-white/10 text-white rounded-lg py-2 px-4 outline-none focus:border-[#e8003d] transition-colors text-sm w-48"
                                >
                                    <option value="0">Public / Shared</option>
                                    <option value="1">Hidden (Admin Only)</option>
                                </select>
                                
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={data.is_common}
                                        onChange={e => setData('is_common', e.target.checked)}
                                        className="hidden" 
                                    />
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${data.is_common ? 'bg-[#e8003d] border-[#e8003d]' : 'border-white/20 group-hover:border-white/40'}`}>
                                        {data.is_common && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                    </div>
                                    <span className="text-[11px] text-[#a0a0b8] group-hover:text-white transition-colors font-bold uppercase tracking-widest">Common Shelf (Visible to All)</span>
                                </label>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Description</label>
                            <textarea 
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 h-24 outline-none focus:border-[#e8003d] transition-colors resize-none"
                                placeholder="Write something about this shelf..."
                            />
                        </div>

                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Shelf Cover Image</label>
                            <div className="flex items-center gap-4">
                                {editingShelf?.cover_image && (
                                    <div className="w-16 h-16 rounded overflow-hidden border border-white/10">
                                        <img src={`/shelves/${editingShelf.cover_image}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                )}
                                <input 
                                    type="file"
                                    onChange={e => setData('cover_image', e.target.files[0])}
                                    className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors flex-1"
                                />
                            </div>
                            {errors.cover_image && <span className="text-[#e8003d] text-xs">{errors.cover_image}</span>}
                        </div>

                        <div className="md:col-span-2 flex gap-3">
                            <button 
                                type="submit" 
                                disabled={processing || editingShelf}
                                className="bg-[#e8003d] text-white px-8 py-3 rounded-lg font-bold text-[13px] tracking-widest uppercase hover:bg-[#ff0044] transition-all disabled:opacity-50"
                            >
                                Create Shelf
                            </button>
                        </div>
                    </form>
                </div>

                <div className="flex flex-col gap-6 bg-white/5 border border-white/7 rounded-2xl p-8">
                    <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">Existing Shelves</h2>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/7">
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a] w-12">Cover</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Name</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Ownership</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Status</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shelves.map(shelf => (
                                    <tr key={shelf.id} className="border-b border-white/5 group">
                                        <td className="py-4">
                                            <div className="w-10 h-10 rounded overflow-hidden bg-white/5 border border-white/10">
                                                {shelf.cover_image ? (
                                                    <img src={`/shelves/${shelf.cover_image}`} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[#55556a] uppercase font-black">NA</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 font-bold text-white group-hover:text-[#e8003d] transition-colors">
                                            <div className="flex flex-col">
                                                <span>{shelf.name}</span>
                                                {shelf.parent && (
                                                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">
                                                        ↳ Under {shelf.parent.name}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-[#55556a] font-normal normal-case mt-0.5 line-clamp-1">{shelf.description || 'No description'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col gap-1">
                                                {shelf.is_common 
                                                    ? <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">🌍 Common</span>
                                                    : <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">👤 Personal</span>
                                                }
                                                <span className="text-[9px] text-[#55556a] uppercase">By {shelf.user?.name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col gap-1">
                                                {shelf.is_hidden ? (
                                                    <span className="text-[10px] text-[#e8003d] font-bold uppercase tracking-widest">🔒 Hidden</span>
                                                ) : (
                                                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">✓ Public</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => handleEdit(shelf)}
                                                className="text-[#8888a0] hover:text-white transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(shelf.id)}
                                                className="text-[#e8003d]/60 hover:text-[#e8003d] transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0c0c12] border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">Edit Shelf: {editingShelf?.name}</h2>
                            <button onClick={handleCancelEdit} className="text-[#55556a] hover:text-white transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Name</label>
                                <input 
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="bg-[#16161f] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                                    placeholder="Shelf name"
                                />
                                {errors.name && <span className="text-[#e8003d] text-xs">{errors.name}</span>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Parent Shelf</label>
                                <select 
                                    value={data.parent_id}
                                    onChange={e => setData('parent_id', e.target.value)}
                                    className="bg-[#16161f] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                                >
                                    <option value="">None (Top Level)</option>
                                    {shelves.filter(s => s.id !== editingShelf?.id).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {errors.parent_id && <span className="text-[#e8003d] text-xs">{errors.parent_id}</span>}
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-2">
                                <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Visibility & Ownership</label>
                                <div className="flex items-center gap-6 mt-1">
                                    <select 
                                        value={data.is_hidden ? '1' : '0'}
                                        onChange={e => setData('is_hidden', e.target.value === '1')}
                                        className="bg-[#16161f] border border-white/10 text-white rounded-lg py-2 px-4 outline-none focus:border-[#e8003d] transition-colors text-sm w-48"
                                    >
                                        <option value="0">Public / Shared</option>
                                        <option value="1">Hidden (Admin Only)</option>
                                    </select>
                                    
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={data.is_common}
                                            onChange={e => setData('is_common', e.target.checked)}
                                            className="hidden" 
                                        />
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${data.is_common ? 'bg-[#e8003d] border-[#e8003d]' : 'border-white/20 group-hover:border-white/40'}`}>
                                            {data.is_common && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                        </div>
                                        <span className="text-[11px] text-[#a0a0b8] group-hover:text-white transition-colors font-bold uppercase tracking-widest">Common Shelf</span>
                                    </label>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-2">
                                <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Description</label>
                                <textarea 
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="bg-[#16161f] border border-white/10 text-white rounded-lg p-3 h-24 outline-none focus:border-[#e8003d] transition-colors resize-none"
                                    placeholder="Description..."
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-2">
                                <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Shelf Cover Image</label>
                                <div className="flex items-center gap-4">
                                    {editingShelf?.cover_image && (
                                        <div className="w-16 h-16 rounded overflow-hidden border border-white/10">
                                            <img src={`/shelves/${editingShelf.cover_image}`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                    )}
                                    <input 
                                        type="file"
                                        onChange={e => setData('cover_image', e.target.files[0])}
                                        className="bg-[#16161f] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors flex-1"
                                    />
                                </div>
                                {errors.cover_image && <span className="text-[#e8003d] text-xs">{errors.cover_image}</span>}
                            </div>

                            <div className="md:col-span-2 flex gap-3 pt-4">
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-[#e8003d] text-white px-8 py-3 rounded-lg font-bold text-[13px] tracking-widest uppercase hover:bg-[#ff0044] transition-all disabled:opacity-50"
                                >
                                    Update Shelf
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="bg-white/10 text-white px-8 py-3 rounded-lg font-bold text-[13px] tracking-widest uppercase hover:bg-white/15 transition-all"
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
