import { useState } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import Pagination from '@/Components/Pagination';

export default function Index({ comics, auth, shelves, categories }) {
    const [editingComic, setEditingComic] = useState(null);

    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploading, errors: uploadErrors, reset: resetUpload } = useForm({
        comic: null,
    });

    const { data: editData, setData: setEditData, post: postUpdate, processing: updating, errors: editErrors, reset: resetEdit } = useForm({
        title: '',
        shelf_id: '',
        category_ids: [],
        is_hidden: false,
    });

    const { post: syncPost, processing: syncProcessing } = useForm();

    const submitUpload = (e) => {
        e.preventDefault();
        postUpload(route('admin.comics.upload'), {
            onSuccess: () => resetUpload('comic'),
        });
    };

    const runSync = () => {
        syncPost(route('admin.comics.sync'));
    };

    const handleEdit = (comic) => {
        setEditingComic(comic);
        setEditData({
            title: comic.title,
            shelf_id: comic.shelf_id || '',
            category_ids: comic.categories.map(c => c.id),
            is_hidden: comic.is_hidden,
        });
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        postUpdate(route('admin.comics.update', editingComic.id), {
            onSuccess: () => {
                setEditingComic(null);
                resetEdit();
            }
        });
    };

    const toggleCategory = (id) => {
        const ids = [...editData.category_ids];
        const index = ids.indexOf(id);
        if (index > -1) {
            ids.splice(index, 1);
        } else {
            ids.push(id);
        }
        setEditData('category_ids', ids);
    };

    return (
        <ComicLayout auth={auth}>
            <Head title="Manage Comics" />

            <div className="max-w-7xl mx-auto flex flex-col gap-10">
                <div className="flex items-center justify-between">
                    <h2 className="font-['Bebas_Neue'] text-3xl tracking-[2px] uppercase">
                        Library <span className="text-[#e8003d]">Management</span>
                    </h2>
                    <div className="flex gap-3">
                        <Link href={route('admin.shelves.index')} className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-colors">Manage Shelves</Link>
                        <Link href={route('admin.categories.index')} className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-colors">Manage Categories</Link>
                    </div>
                </div>

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
                            <button 
                                type="submit" 
                                disabled={uploading}
                                className="bg-[#e8003d] text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors hover:bg-opacity-90"
                            >
                                {uploading ? 'Uploading...' : 'Upload PDF'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-[#16161f] border border-white/7 rounded-2xl p-6 flex flex-col justify-center">
                        <h3 className="text-lg font-['Bebas_Neue'] tracking-widest text-white mb-2">Library Sync</h3>
                        <p className="text-sm text-[#8888a0] mb-4">Scan the system folder for new PDF files and import them.</p>
                        <button 
                            onClick={runSync}
                            disabled={syncProcessing}
                            className="bg-white/5 border border-white/7 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors hover:bg-white/10 w-max"
                        >
                            {syncProcessing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>
                </div>

                {editingComic && (
                    <div className="bg-white/5 border border-[#e8003d]/30 rounded-2xl p-8 animate-fadeIn">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">Edit Comic: <span className="text-[#e8003d]">{editingComic.title}</span></h2>
                            <button onClick={() => { setEditingComic(null); resetEdit(); }} className="text-[#8888a0] hover:text-white">Close</button>
                        </div>
                        
                        <form onSubmit={submitUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Title</label>
                                    <input 
                                        type="text"
                                        value={editData.title}
                                        onChange={e => setEditData('title', e.target.value)}
                                        className="bg-white/7 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                                    />
                                    {editErrors.title && <span className="text-[#e8003d] text-xs">{editErrors.title}</span>}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Assign to Shelf</label>
                                    <select 
                                        value={editData.shelf_id}
                                        onChange={e => setEditData('shelf_id', e.target.value)}
                                        className="bg-white/7 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                                    >
                                        <option value="">No Shelf</option>
                                        {shelves.map(shelf => (
                                            <option key={shelf.id} value={shelf.id}>{shelf.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Visibility</label>
                                    <select 
                                        value={editData.is_hidden ? '1' : '0'}
                                        onChange={e => setEditData('is_hidden', e.target.value === '1')}
                                        className="bg-white/7 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors"
                                    >
                                        <option value="0">Public</option>
                                        <option value="1">Hidden</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0]">Categories</label>
                                <div className="bg-white/7 border border-white/10 rounded-lg p-4 h-[280px] overflow-y-auto grid grid-cols-1 gap-2">
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                            <div 
                                                onClick={() => toggleCategory(cat.id)}
                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${editData.category_ids.includes(cat.id) ? 'bg-[#e8003d] border-[#e8003d]' : 'border-white/20 group-hover:border-white/40'}`}
                                            >
                                                {editData.category_ids.includes(cat.id) && (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={`text-[13px] ${editData.category_ids.includes(cat.id) ? 'text-white font-medium' : 'text-[#8888a0]'}`}>{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <button 
                                    type="submit" 
                                    disabled={updating}
                                    className="bg-[#e8003d] text-white px-10 py-3 rounded-lg font-bold text-[13px] tracking-widest uppercase hover:bg-[#ff0044] transition-all disabled:opacity-50"
                                >
                                    {updating ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-[#16161f] border border-white/7 rounded-2xl overflow-hidden">
                    <div className="p-6">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#55556a] uppercase tracking-widest">Comic</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#55556a] uppercase tracking-widest">Shelf</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#55556a] uppercase tracking-widest">Categories</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#55556a] uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-[#55556a] uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {comics.data.map((comic) => (
                                    <tr key={comic.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold group-hover:text-[#e8003d] transition-colors">{comic.title}</span>
                                                <span className="text-[10px] text-[#44445a] font-mono mt-1">{comic.path}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {comic.shelf ? (
                                                <span className="text-[12px] text-[#8888a0]">{comic.shelf.name}</span>
                                            ) : (
                                                <span className="text-[10px] uppercase tracking-widest text-[#333345] font-black">None</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-1">
                                                {comic.categories.length > 0 ? (
                                                    comic.categories.slice(0, 3).map(c => (
                                                        <span key={c.id} className="text-[10px] bg-white/5 text-[#8888a0] px-2 py-0.5 rounded border border-white/5">{c.name}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] uppercase tracking-widest text-[#333345] font-black">-</span>
                                                )}
                                                {comic.categories.length > 3 && <span className="text-[10px] text-[#44445a]">+{comic.categories.length - 3}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {comic.is_hidden ? (
                                                <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Hidden</span>
                                            ) : (
                                                <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Public</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right flex items-center justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEdit(comic)}
                                                className="text-[#8888a0] hover:text-white transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => syncPost(route('admin.comics.toggle-visibility', comic.id), { preserveScroll: true })}
                                                className="text-[#e8003d]/60 hover:text-[#e8003d] transition-colors"
                                            >
                                                {comic.is_hidden ? 'Show' : 'Hide'}
                                            </button>
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
        </ComicLayout>
    );
}
