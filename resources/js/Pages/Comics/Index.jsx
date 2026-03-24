import { useState, useEffect } from 'react';
import { Link, Head, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import ComicCard from '@/Components/ComicCard';
import Pagination from '@/Components/Pagination';
import SpaceLibrary from '@/Components/SpaceLibrary';

export default function Index({ comics, filters, auth, shelves, categories, recentlyRead }) {
    const [showSidebar, setShowSidebar] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    );
    const [viewMode, setViewMode] = useState('grid'); // grid, list, or rack

    // Update default state on resize if needed
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024 && showSidebar) {
                setShowSidebar(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showSidebar]);

    return (
        <ComicLayout auth={auth}>
            <Head title="All Comics" />

            {/* View Controls & Stats Headers */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[12px] tracking-wider transition-colors border ${showSidebar ? 'bg-[#e8003d] text-white border-[#e8003d]' : 'bg-transparent text-[#8888a0] border-white/20 hover:text-white hover:border-white/50'}`}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="4" y1="21" x2="4" y2="14"></line>
                            <line x1="4" y1="10" x2="4" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="3"></line>
                            <line x1="20" y1="21" x2="20" y2="16"></line>
                            <line x1="20" y1="12" x2="20" y2="3"></line>
                            <line x1="1" y1="14" x2="7" y2="14"></line>
                            <line x1="9" y1="8" x2="15" y2="8"></line>
                            <line x1="17" y1="16" x2="23" y2="16"></line>
                        </svg>
                        FILTERS
                    </button>
                    <h2 className="font-['Bebas_Neue'] text-[32px] tracking-[2px] uppercase text-white m-0 leading-none">
                        Library <span className="text-[#e8003d] ml-1">Archive</span>
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[14px] font-['Bebas_Neue'] tracking-[2px] text-white">
                        <span className="text-[20px] text-[#e8003d] mr-1">{comics.total}</span> COMICS
                    </span>
                    <span className="text-[14px] font-['Bebas_Neue'] tracking-[2px] text-[#8888a0] border-l border-white/20 pl-4">
                        <span className="text-[20px] text-white mr-1">{comics.last_page}</span> PAGES
                    </span>
                </div>

                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#e8003d] text-white shadow-lg' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                        title="Grid View"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#e8003d] text-white shadow-lg' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                        title="List View (No Thumbnails)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    </button>
                    <button 
                        onClick={() => setViewMode('rack')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'rack' ? 'bg-[#e8003d] text-white shadow-lg' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                        title="Rack View (Home Library)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="3" y1="15" x2="21" y2="15"></line>
                            <line x1="9" y1="3" x2="9" y2="21"></line>
                            <line x1="15" y1="3" x2="15" y2="21"></line>
                        </svg>
                    </button>
                    <button 
                        onClick={() => setViewMode('space')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'space' ? 'bg-[#e8003d] text-white shadow-lg' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                        title="3D Space View (Anti-Gravity)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="4"></circle>
                            <line x1="12" y1="2" x2="12" y2="22"></line>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>

            {recentlyRead && recentlyRead.length > 0 && (
                <div className="mb-12 animate-fadeIn">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#e8003d] rounded-full shadow-[0_0_12px_rgba(232,0,61,0.5)]"></div>
                            <h3 className="text-[14px] font-['Bebas_Neue'] tracking-[3px] uppercase text-white/90">Recently Read</h3>
                        </div>
                        <Link 
                            href={route('comics.index', { status: 'history' })}
                            className="text-[11px] font-bold text-[#8888a0] hover:text-white transition-colors tracking-widest uppercase"
                        >
                            View All History →
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {recentlyRead.map(comic => (
                            <Link 
                                key={comic.id} 
                                href={route('comics.show', comic.id)}
                                className="group flex flex-col gap-2.5"
                            >
                                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/7 transition-all group-hover:border-white/20 group-hover:scale-[1.03] shadow-lg">
                                    <img 
                                        src={comic.thumbnail ? `/thumbs/${comic.thumbnail}` : '/img/no-thumb.jpg'} 
                                        alt={comic.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Resume →</span>
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-bold text-white/90">
                                        PG {comic.last_read_page}
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-[#a0a0b8] group-hover:text-white transition-colors truncate px-1">
                                    {comic.title}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className={`flex flex-col lg:flex-row gap-10 transition-all duration-300`}>
                {/* Sidebar Filters */}
                <aside className={`w-full lg:w-64 flex flex-col gap-8 shrink-0 transition-all duration-300 origin-left ${showSidebar ? 'opacity-100 translate-x-0' : 'hidden opacity-0 -translate-x-full'}`}>
                    <div className="flex flex-col gap-4">
                        <h3 className="text-[11px] tracking-[3px] uppercase font-black text-[#55556a]">Status</h3>
                        <div className="flex flex-wrap gap-2">
                            <Link 
                                href={route('comics.index', { ...filters, status: null })}
                                className={`px-4 py-1.5 rounded-full text-[12px] border transition-all ${!filters.status ? 'bg-[#e8003d] text-white border-[#e8003d]' : 'bg-white/5 border-white/7 text-[#8888a0] hover:text-white'}`}
                            >
                                ALL
                            </Link>
                            {auth.user && (
                                <>
                                    <Link 
                                        href={route('comics.index', { ...filters, status: 'unread' })}
                                        className={`px-4 py-1.5 rounded-full text-[12px] border transition-all ${filters.status === 'unread' ? 'bg-[#e8003d] text-white border-[#e8003d]' : 'bg-white/5 border-white/7 text-[#8888a0] hover:text-white'}`}
                                    >
                                        UNREAD
                                    </Link>
                                    <Link 
                                        href={route('comics.index', { ...filters, status: 'read' })}
                                        className={`px-4 py-1.5 rounded-full text-[12px] border transition-all ${filters.status === 'read' ? 'bg-[#e8003d] text-white border-[#e8003d]' : 'bg-white/5 border-white/7 text-[#8888a0] hover:text-white'}`}
                                    >
                                        READ
                                    </Link>
                                    <Link 
                                        href={route('comics.index', { ...filters, status: 'currently_reading' })}
                                        className={`px-4 py-1.5 rounded-full text-[12px] border transition-all ${filters.status === 'currently_reading' ? 'bg-[#e8003d] text-white border-[#e8003d]' : 'bg-white/5 border-white/7 text-[#8888a0] hover:text-white'}`}
                                    >
                                        CURRENTLY READING
                                    </Link>
                                    <Link 
                                        href={route('comics.index', { ...filters, status: 'completed' })}
                                        className={`px-4 py-1.5 rounded-full text-[12px] border transition-all ${filters.status === 'completed' ? 'bg-[#e8003d] text-white border-[#e8003d]' : 'bg-white/5 border-white/7 text-[#8888a0] hover:text-white'}`}
                                    >
                                        COMPLETED
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {auth.user && (
                        <div className="flex flex-col gap-4">
                            <h3 className="text-[11px] tracking-[3px] uppercase font-black text-[#55556a]">My Library</h3>
                            <div className="flex flex-col gap-1">
                                <Link 
                                    href={route('comics.index', { ...filters, personal: filters.personal ? null : 1, shared: null, hidden: null })}
                                    className={`text-[13px] py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${filters.personal ? 'bg-blue-500/10 text-blue-400 font-bold' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        Personal Items
                                    </span>
                                    {filters.personal && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                </Link>
                                <Link 
                                    href={route('comics.index', { ...filters, shared: filters.shared ? null : 1, personal: null, hidden: null })}
                                    className={`text-[13px] py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${filters.shared ? 'bg-purple-500/10 text-purple-400 font-bold' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                        Shared With Me
                                    </span>
                                    {filters.shared && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                </Link>
                                <Link 
                                    href={route('comics.index', { ...filters, hidden: filters.hidden ? null : 1, personal: null, shared: null })}
                                    className={`text-[13px] py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${filters.hidden ? 'bg-[#e8003d]/10 text-[#e8003d] font-bold' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                        Hidden Items
                                    </span>
                                    {filters.hidden && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                </Link>
                                <Link 
                                    href={route('comics.index', { ...filters, status: filters.status === 'history' ? null : 'history' })}
                                    className={`text-[13px] py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${filters.status === 'history' ? 'bg-[#e8003d]/10 text-[#e8003d] font-bold' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        Reading History
                                    </span>
                                    {filters.status === 'history' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] tracking-[3px] uppercase font-black text-[#55556a]">Shelves</h3>
                            {filters.shelf && (
                                <button 
                                    onClick={() => router.get(route('comics.index', { ...filters, shelf: null }), {}, { preserveState: true })}
                                    className="text-[9px] text-[#e8003d] hover:text-[#ff0044] font-bold uppercase tracking-wider transition-colors"
                                >Clear</button>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <button 
                                onClick={() => router.get(route('comics.index', { ...filters, shelf: null }), {}, { preserveState: true })}
                                className={`text-[13px] py-1.5 px-3 rounded-lg transition-all text-left ${!filters.shelf ? 'bg-[#e8003d]/10 text-[#e8003d] font-bold' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                            >
                                All Shelves
                            </button>
                            {shelves.map(shelf => {
                                const selectedIds = filters.shelf ? filters.shelf.split(',') : [];
                                const isSelected = selectedIds.includes(String(shelf.id));
                                const toggleShelf = (id) => {
                                    let newIds = [...selectedIds];
                                    const idStr = String(id);
                                    if (newIds.includes(idStr)) {
                                        newIds = newIds.filter(i => i !== idStr);
                                    } else {
                                        newIds.push(idStr);
                                    }
                                    const shelfParam = newIds.length > 0 ? newIds.join(',') : null;
                                    router.get(route('comics.index', { ...filters, shelf: shelfParam }), {}, { preserveState: true });
                                };
                                return (
                                    <div key={shelf.id} className="flex flex-col gap-1">
                                        <button 
                                            onClick={() => toggleShelf(shelf.id)}
                                            className={`text-[13px] py-1.5 px-3 rounded-lg transition-all flex items-center gap-2 min-w-0 text-left ${isSelected ? 'bg-[#e8003d]/10 text-[#e8003d] font-bold' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                                        >
                                            {/* Checkbox indicator */}
                                            <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                                                isSelected 
                                                    ? 'bg-[#e8003d] border-[#e8003d]' 
                                                    : 'border-white/20 bg-white/5'
                                            }`}>
                                                {isSelected && (
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                                )}
                                            </div>
                                            <div className="w-6 h-6 rounded overflow-hidden border border-white/10 shrink-0 bg-[#0d0d14]">
                                                {shelf.cover_image ? (
                                                    <img src={`/shelves/${shelf.cover_image}`} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-[#55556a] uppercase font-black">NA</div>
                                                )}
                                            </div>
                                            <div className="flex-1 flex items-center justify-between min-w-0">
                                                <span className="truncate">{shelf.name}</span>
                                                <span className="text-[10px] text-[#55556a] font-black bg-white/5 px-1.5 py-0.5 rounded ml-2">
                                                    {shelf.comics_count}
                                                </span>
                                            </div>
                                        </button>
                                        
                                        {shelf.children?.length > 0 && (
                                            <div className="flex flex-col gap-1 ml-4 border-l border-white/5 pl-2 mt-1">
                                                {shelf.children.map(child => {
                                                    const childSelected = selectedIds.includes(String(child.id));
                                                    return (
                                                        <button 
                                                            key={child.id}
                                                            onClick={() => toggleShelf(child.id)}
                                                            className={`text-[12px] py-1 px-3 rounded-lg transition-all flex items-center gap-2 justify-between min-w-0 text-left ${childSelected ? 'text-[#e8003d] font-bold bg-[#e8003d]/5' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                                                                    childSelected 
                                                                        ? 'bg-[#e8003d] border-[#e8003d]' 
                                                                        : 'border-white/20 bg-white/5'
                                                                }`}>
                                                                    {childSelected && (
                                                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                                                    )}
                                                                </div>
                                                                <span className="truncate">{child.name}</span>
                                                            </div>
                                                            <span className="text-[9px] opacity-60 ml-2">{child.comics_count}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h3 className="text-[11px] tracking-[3px] uppercase font-black text-[#55556a]">Categories</h3>
                        <div className="flex flex-col gap-3">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex flex-col gap-1">
                                    <Link 
                                        href={route('comics.index', { ...filters, category: cat.slug })}
                                        className={`text-[13px] py-1.5 px-3 rounded-lg transition-all ${filters.category == cat.slug ? 'bg-[#e8003d]/10 text-[#e8003d] font-bold' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                                    >
                                        {cat.name}
                                    </Link>
                                    {cat.children?.length > 0 && (
                                        <div className="flex flex-col gap-1 ml-4 border-l border-white/5 pl-2">
                                            {cat.children.map(child => (
                                                <Link 
                                                    key={child.id}
                                                    href={route('comics.index', { ...filters, category: child.slug })}
                                                    className={`text-[12px] py-1 px-3 rounded-lg transition-all ${filters.category == child.slug ? 'text-[#e8003d] font-bold' : 'text-[#55556a] hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Comic Grid */}
                <div className="flex-1 transition-all duration-300 w-full min-w-0">
                    {viewMode === 'space' ? (
                        <SpaceLibrary comics={comics.data} onExit={() => setViewMode('grid')} />
                    ) : comics.data.length === 0 ? (
                        <div className="text-center py-24 bg-white/[0.02] border border-white/5 rounded-3xl text-[#55556a]">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <h3 className="text-lg font-['Bebas_Neue'] tracking-widest">No matching comics</h3>
                            <p className="text-sm font-light mt-1">Try adjusting your filters or search query.</p>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'rack' ? (
                                <div className="flex flex-col gap-0 py-4 bg-[#050508] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                                    {Array.from({ length: Math.ceil(comics.data.length / 6) }).map((_, rowIndex) => (
                                        <div key={rowIndex} className="relative group/row">
                                            {/* Shelf Back Wall */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent pointer-events-none"></div>
                                            
                                            {/* The Shelf Structure */}
                                            <div className="absolute bottom-0 left-0 right-0 h-[22px] z-20 pointer-events-none">
                                                {/* Shelf Top Surface (Depth) */}
                                                <div className="absolute bottom-[4px] left-0 right-0 h-[18px] bg-[#1a120b] [transform:rotateX(60deg)] origin-bottom shadow-inner opacity-90"></div>
                                                
                                                {/* Shelf Front Edge (Lip) */}
                                                <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-gradient-to-r from-[#2a1d13] via-[#3d2b1f] to-[#2a1d13] border-t border-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                                                    {/* Edge Highlight */}
                                                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/5"></div>
                                                </div>
                                            </div>
                                            
                                            {/* Comics Container */}
                                            <div className="relative z-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-2 sm:gap-4 px-6 pt-10 pb-[22px]">
                                                {comics.data.slice(rowIndex * 6, (rowIndex + 1) * 6).map((comic) => (
                                                    <div key={comic.id} className="relative group flex justify-center items-end h-[180px] sm:h-[220px]">
                                                        {/* Comic Card with 3D lean */}
                                                        <div className="w-full transform transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.02] [transform-style:preserve-3d] [transform:rotateX(-5deg)] shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
                                                            <ComicCard comic={comic} auth={auth} />
                                                        </div>
                                                        
                                                        {/* Base Shadow (Ambient Occlusion) */}
                                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-4 bg-black/80 blur-md -z-10 rounded-full"></div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Row Divider / Shadow Wall */}
                                            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={viewMode === 'grid' 
                                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 sm:gap-6"
                                    : "flex flex-col gap-3"
                                }>
                                    {comics.data.map(comic => (
                                        <ComicCard key={comic.id} comic={comic} auth={auth} compact={viewMode === 'list'} />
                                    ))}
                                </div>
                            )}

                            <div className="mt-16 flex justify-center">
                                <Pagination links={comics.links} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ComicLayout>
    );
}
