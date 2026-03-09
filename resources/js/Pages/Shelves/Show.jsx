import { Head, Link } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import ComicCard from '@/Components/ComicCard';
import Pagination from '@/Components/Pagination';

export default function Show({ shelf, comics, auth }) {
    return (
        <ComicLayout auth={auth} title={shelf.name}>
            <Head title={`${shelf.name} - Shelf`} />
            
            <div className="flex flex-col gap-8">
                <div className="shelf-header relative py-12 px-10 rounded-3xl overflow-hidden border border-white/7 bg-[#0d0d14]">
                    <div className="relative z-10 max-w-2xl">
                        <Link 
                            href={route('shelves.index')}
                            className="flex items-center gap-2 text-[11px] tracking-widest uppercase font-bold text-[#8888a0] hover:text-white transition-colors mb-4 inline-flex"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Back to Shelves
                        </Link>
                        <h1 className="text-5xl font-['Bebas_Neue'] tracking-[4px] text-white">
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

                <div className="comic-grid flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-white/7 pb-4">
                        <h2 className="text-[11px] tracking-[3px] uppercase font-black text-[#55556a]">Comics in this shelf</h2>
                        <span className="text-[11px] tracking-wider text-[#8888a0] font-medium">{comics.total} items</span>
                    </div>

                    {comics.data.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-5">
                                {comics.data.map((comic) => (
                                    <ComicCard key={comic.id} comic={comic} auth={auth} />
                                ))}
                            </div>
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
