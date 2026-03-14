import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import ComicCard from '@/Components/ComicCard';
import Pagination from '@/Components/Pagination';

export default function Show({ shelf, children, comics, auth }) {
    const [viewMode, setViewMode] = useState('grid'); // grid, list, or rack
    return (
        <ComicLayout auth={auth} title={shelf.name}>
            <Head title={`${shelf.name} - Shelf`} />
            
            <div className="flex flex-col gap-8">
                <div className="shelf-header relative py-8 px-4 sm:py-12 sm:px-10 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/7 bg-[#0d0d14]">
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <Link 
                                href={route('shelves.index')}
                                className="flex items-center gap-2 text-[11px] tracking-widest uppercase font-bold text-[#8888a0] hover:text-white transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                                Shelves
                            </Link>
                            {shelf.parent && (
                                <>
                                    <span className="text-[#55556a]">/</span>
                                    <Link 
                                        href={route('shelves.show', shelf.parent.id)}
                                        className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0] hover:text-white transition-colors"
                                    >
                                        {shelf.parent.name}
                                    </Link>
                                </>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-['Bebas_Neue'] tracking-[2px] sm:tracking-[4px] text-white">
                            {shelf.name}
                        </h1>
                        <p className="text-[#8888a0] text-base mt-4 leading-relaxed font-light">
                            {shelf.description || 'Explore our collection in this shelf.'}
                        </p>
                    </div>
                    
                    {/* Abstract design elements */}
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#e8003d]/10 blur-[100px] rounded-full"></div>
                    <div className="absolute right-20 bottom-10 opacity-10">
                        <svg className="w-40 h-40 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                </div>

                {children && children.length > 0 && (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-white/7 pb-4">
                            <h2 className="text-[11px] tracking-[3px] uppercase font-black text-[#55556a]">Sub-Collections</h2>
                            <span className="text-[11px] tracking-wider text-[#8888a0] font-medium">{children.length} collections</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {children.map((child) => (
                                <Link 
                                    key={child.id} 
                                    href={route('shelves.show', child.id)}
                                    className="group relative bg-white/5 border border-white/7 rounded-2xl overflow-hidden transition-all duration-500 hover:border-[#e8003d]/50 hover:bg-white/8 hover:-translate-y-1 block"
                                >
                                    <div className="aspect-[16/9] w-full bg-[#0d0d14] relative overflow-hidden">
                                        {child.cover_image ? (
                                            <img 
                                                src={`/shelves/${child.cover_image}`} 
                                                alt={child.name} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a25] to-[#0a0a0f]">
                                                <svg className="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60"></div>
                                    </div>
                                    
                                    <div className="p-5">
                                        <h3 className="text-xl font-['Bebas_Neue'] tracking-wide text-white group-hover:text-[#e8003d] transition-colors">
                                            {child.name}
                                        </h3>
                                        <p className="text-[#8888a0] text-[13px] line-clamp-2 mt-2 leading-relaxed h-10">
                                            {child.description || 'No description available for this collection.'}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="comic-grid flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-white/7 pb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-[11px] tracking-[3px] uppercase font-black text-[#55556a]">Comics in this shelf</h2>
                            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#e8003d] text-white shadow-lg' : 'text-[#8888a0] hover:text-white'}`}
                                    title="Grid View"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#e8003d] text-white shadow-lg' : 'text-[#8888a0] hover:text-white'}`}
                                    title="List View (No Thumbnails)"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                </button>
                                <button 
                                    onClick={() => setViewMode('rack')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'rack' ? 'bg-[#e8003d] text-white shadow-lg' : 'text-[#8888a0] hover:text-white'}`}
                                    title="Rack View (Home Library)"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="3" y1="9" x2="21" y2="9"></line>
                                        <line x1="3" y1="15" x2="21" y2="15"></line>
                                        <line x1="9" y1="3" x2="9" y2="21"></line>
                                        <line x1="15" y1="3" x2="15" y2="21"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <span className="text-[11px] tracking-wider text-[#8888a0] font-medium">{comics.total} items</span>
                    </div>

                    {comics.data.length > 0 ? (
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
                                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"
                                    : "flex flex-col gap-3"
                                }>
                                    {comics.data.map((comic) => (
                                        <ComicCard key={comic.id} comic={comic} auth={auth} compact={viewMode === 'list'} />
                                    ))}
                                </div>
                            )}
                            <div className="mt-10">
                                <Pagination links={comics.links} />
                            </div>
                        </>
                    ) : (
                        <div className="py-20 flex flex-col items-center text-[#8888a0]">
                            <p>No comics found in this shelf.</p>
                        </div>
                    )}
                </div>
            </div>
        </ComicLayout>
    );
}
