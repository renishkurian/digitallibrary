import { Head, Link } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';

export default function Index({ shelves }) {
    return (
        <ComicLayout title="Shelves">
            <Head title="Shelves" />
            
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-['Bebas_Neue'] tracking-wider text-white">Shelves</h1>
                        <p className="text-[#8888a0] text-sm mt-1">Browse comics by collection</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {shelves.length > 0 ? (
                        shelves.map((shelf) => (
                            <Link 
                                key={shelf.id} 
                                href={route('shelves.show', shelf.id)}
                                className="group relative bg-white/5 border border-white/7 rounded-2xl overflow-hidden transition-all duration-500 hover:border-[#e8003d]/50 hover:bg-white/8 hover:-translate-y-1 block"
                            >
                                <div className="aspect-[16/9] w-full bg-[#0d0d14] relative overflow-hidden">
                                    {shelf.cover_image ? (
                                        <img 
                                            src={`/shelves/${shelf.cover_image}`} 
                                            alt={shelf.name} 
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
                                        {shelf.name}
                                    </h3>
                                    <p className="text-[#8888a0] text-[13px] line-clamp-2 mt-2 leading-relaxed h-10">
                                        {shelf.description || 'No description available for this shelf.'}
                                    </p>
                                    
                                    <div className="mt-4 flex items-center justify-between text-[11px] tracking-widest uppercase font-semibold text-[#55556a]">
                                        <span>Collection</span>
                                        <span className="flex items-center gap-1.5 text-[#e8003d]/80 group-hover:text-[#e8003d] transition-colors">
                                            View Library
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="m9 18 6-6-6-6" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center text-[#8888a0]">
                            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p>No shelves created yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </ComicLayout>
    );
}
