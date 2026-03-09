import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import ConfirmModal from '@/Components/ConfirmModal';

export default function Index({ categories, parentCategories, auth, users, roles }) {
    const [editingCategory, setEditingCategory] = useState(null);
    const [sharingCategory, setSharingCategory] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', confirmStyle: 'danger' });

    const requestConfirm = (options) => setConfirmConfig({ ...options, isOpen: true });
    const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

    const { data, setData, post, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        parent_id: '',
        description: '',
        is_common: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            post(route('admin.categories.update', editingCategory.id), {
                onSuccess: () => {
                    setEditingCategory(null);
                    reset();
                }
            });
        } else {
            post(route('admin.categories.store'), {
                onSuccess: () => reset()
            });
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            parent_id: category.parent_id || '',
            description: category.description || '',
            is_common: category.is_common,
        });
    };

    const submitUserShare = (userId) => {
        if (!userId) return;
        router.post(route('admin.categories.share-user', sharingCategory.id), { user_id: userId }, {
            preserveScroll: true,
            onSuccess: () => setSharingCategory(null),
        });
    };

    const submitRoleShare = (roleId) => {
        if (!roleId) return;
        router.post(route('admin.categories.share-role', sharingCategory.id), { role_id: roleId }, {
            preserveScroll: true,
            onSuccess: () => setSharingCategory(null),
        });
    };

    const revokeUserShare = (category, userId) => {
        router.delete(route('admin.categories.revoke-user-share', [category.id, userId]), { preserveScroll: true });
    };

    const revokeRoleShare = (category, roleId) => {
        router.delete(route('admin.categories.revoke-role-share', [category.id, roleId]), { preserveScroll: true });
    };

    const handleDelete = (id) => {
        requestConfirm({
            title: 'Delete Category',
            message: 'Are you sure? This will also delete any subcategories.',
            confirmText: 'Delete',
            confirmStyle: 'danger',
            onConfirm: () => {
                destroy(route('admin.categories.destroy', id));
            }
        });
    };

    return (
        <ComicLayout title="Admin Categories">
            <Head title="Admin - Manage Categories" />
            
            <div className="max-w-6xl mx-auto flex flex-col gap-10">
                <div className="flex flex-col gap-6 bg-white/5 border border-white/7 rounded-2xl p-8">
                    <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">
                        {editingCategory ? 'Edit Category' : 'Create New Category'}
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Name</label>
                            <input 
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                                placeholder="Category name"
                            />
                            {errors.name && <span className="text-[#e8003d] text-xs">{errors.name}</span>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Parent Category</label>
                            <select 
                                value={data.parent_id}
                                onChange={e => setData('parent_id', e.target.value)}
                                className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                            >
                                <option value="">No Parent (Top Level)</option>
                                {parentCategories.map(parent => (
                                    <option key={parent.id} value={parent.id}>{parent.name}</option>
                                ))}
                            </select>
                            {errors.parent_id && <span className="text-[#e8003d] text-xs">{errors.parent_id}</span>}
                        </div>

                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Description</label>
                            <textarea 
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 h-24 outline-none focus:border-[#e8003d] transition-colors resize-none"
                                placeholder="Describe this category..."
                            />
                        </div>

                        <div className="md:col-span-2 flex items-center gap-6">
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
                                <span className="text-sm text-[#a0a0b8] group-hover:text-white transition-colors font-bold uppercase tracking-widest text-[11px]">Common Category (Visible to All)</span>
                            </label>
                        </div>

                        <div className="md:col-span-2 flex gap-3">
                            <button 
                                type="submit" 
                                disabled={processing}
                                className="bg-[#e8003d] text-white px-8 py-3 rounded-lg font-bold text-[13px] tracking-widest uppercase hover:bg-[#ff0044] transition-all disabled:opacity-50"
                            >
                                {editingCategory ? 'Update Category' : 'Create Category'}
                            </button>
                            {editingCategory && (
                                <button 
                                    type="button"
                                    onClick={() => { setEditingCategory(null); reset(); }}
                                    className="bg-white/10 text-white px-8 py-3 rounded-lg font-bold text-[13px] tracking-widest uppercase hover:bg-white/15 transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="flex flex-col gap-6 bg-white/5 border border-white/7 rounded-2xl p-8">
                    <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">Existing Categories</h2>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/7">
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Name</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Parent</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Ownership</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Shared With</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => (
                                    <tr key={cat.id} className="border-b border-white/5 group">
                                        <td className="py-4 font-bold text-white group-hover:text-[#e8003d] transition-colors">{cat.name}</td>
                                        <td className="py-4 text-[#8888a0] text-sm">{cat.parent?.name || '-'}</td>
                                        <td className="py-4">
                                            <div className="flex flex-col gap-1">
                                                {cat.is_common 
                                                    ? <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">🌍 Common</span>
                                                    : <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">👤 Personal</span>
                                                }
                                                <span className="text-[9px] text-[#55556a] uppercase">By {cat.user?.name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {cat.shared_users?.map(u => (
                                                    <span key={u.id} className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">U:{u.name}</span>
                                                ))}
                                                {cat.shared_roles?.map(r => (
                                                    <span key={r.id} className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">R:{r.name}</span>
                                                ))}
                                                {(!cat.shared_users?.length && !cat.shared_roles?.length) && <span className="text-[10px] text-[#44445a]">—</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => setSharingCategory(cat)}
                                                className="text-blue-400/60 hover:text-blue-400 transition-colors"
                                                title="Share Category"
                                            >
                                                Share
                                            </button>
                                            <button 
                                                onClick={() => handleEdit(cat)}
                                                className="text-[#8888a0] hover:text-white transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(cat.id)}
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
            {/* Share Category Modal */}
            {sharingCategory && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSharingCategory(null)} />
                    <div className="relative bg-[#111118] border border-blue-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-['Bebas_Neue'] tracking-widest text-white mb-1">Share Category</h2>
                        <p className="text-[#8888a0] text-sm mb-6">Access control for <span className="text-white font-semibold">{sharingCategory.name}</span></p>

                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-3">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-[#8888a0]">Users Access</label>
                                <div className="flex flex-wrap gap-2">
                                    {sharingCategory.shared_users?.map(u => (
                                        <span key={u.id} className="flex items-center gap-2 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full uppercase font-bold">
                                            {u.name}
                                            <button onClick={() => revokeUserShare(sharingCategory, u.id)} className="hover:text-white">✕</button>
                                        </span>
                                    ))}
                                </div>
                                <select 
                                    className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-2 text-xs outline-none focus:border-blue-500 transition-colors"
                                    onChange={e => {
                                        submitUserShare(e.target.value);
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Grant user access...</option>
                                    {users.filter(u => !sharingCategory.shared_users?.find(su => su.id === u.id)).map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-[#8888a0]">Role Access</label>
                                <div className="flex flex-wrap gap-2">
                                    {sharingCategory.shared_roles?.map(r => (
                                        <span key={r.id} className="flex items-center gap-2 text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-full uppercase font-bold">
                                            {r.name}
                                            <button onClick={() => revokeRoleShare(sharingCategory, r.id)} className="hover:text-white">✕</button>
                                        </span>
                                    ))}
                                </div>
                                <select 
                                    className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-2 text-xs outline-none focus:border-purple-500 transition-colors"
                                    onChange={e => {
                                        submitRoleShare(e.target.value);
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Grant role access...</option>
                                    {roles.filter(r => !sharingCategory.shared_roles?.find(sr => sr.id === r.id)).map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button onClick={() => setSharingCategory(null)} className="w-full bg-white/5 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition mt-2">
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
