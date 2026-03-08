import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';

export default function Index({ shelves }) {
    const [editingShelf, setEditingShelf] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        description: '',
        is_hidden: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingShelf) {
            post(route('admin.shelves.update', editingShelf.id), {
                onSuccess: () => {
                    setEditingShelf(null);
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
        setData({
            name: shelf.name,
            description: shelf.description || '',
            is_hidden: shelf.is_hidden,
        });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this shelf?')) {
            destroy(route('admin.shelves.destroy', id));
        }
    };

    return (
        <ComicLayout title="Admin Shelves">
            <Head title="Admin - Manage Shelves" />
            
            <div className="max-w-6xl mx-auto flex flex-col gap-10">
                <div className="flex flex-col gap-6 bg-white/5 border border-white/7 rounded-2xl p-8">
                    <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">
                        {editingShelf ? 'Edit Shelf' : 'Create New Shelf'}
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Name</label>
                            <input 
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="bg-white/7 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                                placeholder="Shelf name"
                            />
                            {errors.name && <span className="text-[#e8003d] text-xs">{errors.name}</span>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Visibility</label>
                            <select 
                                value={data.is_hidden ? '1' : '0'}
                                onChange={e => setData('is_hidden', e.target.value === '1')}
                                className="bg-white/7 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                            >
                                <option value="0">Public</option>
                                <option value="1">Hidden (Admin Only)</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Description</label>
                            <textarea 
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                className="bg-white/7 border border-white/10 text-white rounded-lg p-3 h-24 outline-none focus:border-[#e8003d] transition-colors resize-none"
                                placeholder="Write something about this shelf..."
                            />
                        </div>

                        <div className="md:col-span-2 flex gap-3">
                            <button 
                                type="submit" 
                                disabled={processing}
                                className="bg-[#e8003d] text-white px-8 py-3 rounded-lg font-bold text-[13px] tracking-widest uppercase hover:bg-[#ff0044] transition-all disabled:opacity-50"
                            >
                                {editingShelf ? 'Update Shelf' : 'Create Shelf'}
                            </button>
                            {editingShelf && (
                                <button 
                                    type="button"
                                    onClick={() => { setEditingShelf(null); reset(); }}
                                    className="bg-white/10 text-white px-8 py-3 rounded-lg font-bold text-[13px] tracking-widest uppercase hover:bg-white/15 transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="flex flex-col gap-6 bg-white/5 border border-white/7 rounded-2xl p-8">
                    <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">Existing Shelves</h2>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/7">
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Name</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Description</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Status</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shelves.map(shelf => (
                                    <tr key={shelf.id} className="border-b border-white/5 group">
                                        <td className="py-4 font-bold text-white group-hover:text-[#e8003d] transition-colors">{shelf.name}</td>
                                        <td className="py-4 text-[#8888a0] text-sm max-w-xs truncate">{shelf.description || '-'}</td>
                                        <td className="py-4">
                                            {shelf.is_hidden ? (
                                                <span className="bg-white/5 text-[#8888a0] px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider border border-white/5">Hidden</span>
                                            ) : (
                                                <span className="bg-[#e8003d]/10 text-[#e8003d] px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider border border-[#e8003d]/20">Public</span>
                                            )}
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
        </ComicLayout>
    );
}
