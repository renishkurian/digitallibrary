import { Link, Head } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import ComicCard from '@/Components/ComicCard';
import Pagination from '@/Components/Pagination';

export default function Index({ comics, filters, auth, shelves, categories }) {
    return (
        <ComicLayout auth={auth}>
            <Head title="All Comics" />

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-64 flex flex-col gap-8 shrink-0">
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
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h3 className="text-[11px] tracking-[3px] uppercase font-black text-[#55556a]">Shelves</h3>
                        <div className="flex flex-col gap-1">
                            <Link 
                                href={route('comics.index', { ...filters, shelf: null })}
                                className={`text-[13px] py-1.5 px-3 rounded-lg transition-all ${!filters.shelf ? 'bg-[#e8003d]/10 text-[#e8003d] font-bold' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                            >
                                All Shelves
                            </Link>
                            {shelves.map(shelf => (
                                <Link 
                                    key={shelf.id}
                                    href={route('comics.index', { ...filters, shelf: shelf.id })}
                                    className={`text-[13px] py-1.5 px-3 rounded-lg transition-all ${filters.shelf == shelf.id ? 'bg-[#e8003d]/10 text-[#e8003d] font-bold' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}
                                >
                                    {shelf.name}
                                </Link>
                            ))}
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
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="font-['Bebas_Neue'] text-[32px] tracking-[2px] uppercase text-white">
                            Library <span className="text-[#e8003d] ml-1">Archive</span>
                        </h2>
                        <span className="text-[11px] tracking-widest text-[#55556a] font-bold">{comics.total} ITEMS FOUND</span>
                    </div>

                    {comics.data.length === 0 ? (
                        <div className="text-center py-24 bg-white/[0.02] border border-white/5 rounded-3xl text-[#55556a]">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <h3 className="text-lg font-['Bebas_Neue'] tracking-widest">No matching comics</h3>
                            <p className="text-sm font-light mt-1">Try adjusting your filters or search query.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
                                {comics.data.map(comic => (
                                    <ComicCard key={comic.id} comic={comic} auth={auth} />
                                ))}
                            </div>

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
