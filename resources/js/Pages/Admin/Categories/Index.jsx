import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';

export default function Index({ categories, parentCategories }) {
    const [editingCategory, setEditingCategory] = useState(null);

    const { data, setData, post, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        parent_id: '',
        description: '',
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
        });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure? This will also delete any subcategories.')) {
            destroy(route('admin.categories.destroy', id));
        }
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
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a]">Slug</th>
                                    <th className="py-4 text-[11px] tracking-widest uppercase text-[#55556a] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => (
                                    <tr key={cat.id} className="border-b border-white/5 group">
                                        <td className="py-4 font-bold text-white group-hover:text-[#e8003d] transition-colors">{cat.name}</td>
                                        <td className="py-4 text-[#8888a0] text-sm">{cat.parent?.name || '-'}</td>
                                        <td className="py-4 font-mono text-[11px] text-[#55556a]">{cat.slug}</td>
                                        <td className="py-4 text-right flex items-center justify-end gap-3">
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
        </ComicLayout>
    );
}
