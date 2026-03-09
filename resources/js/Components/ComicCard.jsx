import { Link } from '@inertiajs/react';

export default function ComicCard({ comic, auth }) {
    return (
        <div className="card-wrap relative group">
            <Link href={route('comics.show', comic.id)} className="card block relative aspect-[2/3] rounded-xl overflow-hidden bg-[#16161f] border border-white/7 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                {comic.thumbnail ? (
                    <img src={`/thumbs/${comic.thumbnail}`} alt={comic.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-[#1a1a26] flex items-center justify-center text-[#8888a0]">
                        📖
                    </div>
                )}

                <div className="card-overlay absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/95 via-transparent to-transparent flex flex-col justify-end p-[15px]">
                    <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold group-hover/card:text-[#e8003d] transition-colors leading-tight truncate px-1 flex items-center gap-2">
                        {comic.title}
                        {comic.is_personal && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded border border-blue-500/20 uppercase tracking-tighter shrink-0">Personal</span>}
                    </h3>
                    <p className="text-[#55556a] text-[11px] font-medium tracking-wide mt-1 uppercase px-1">
                        {comic.readers_count} {comic.readers_count === 1 ? 'Reader' : 'Readers'}
                    </p>
                </div>
                    <div className="card-meta flex justify-between items-center">
                        {auth?.user && (
                            comic.is_read ? (
                                <span className="read-status px-2 py-0.5 rounded text-[10px] uppercase tracking-tighter bg-[#00ff88]/20 text-[#00ff88]">READ</span>
                            ) : (
                                <span className="read-status px-2 py-0.5 rounded text-[10px] uppercase tracking-tighter bg-[#e8003d]/20 text-[#e8003d]">UNREAD</span>
                            )
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-[#8888a0] font-bold">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>{comic.readers_count}</span>
                        </div>
                    </div>
                </div>
            </Link>

            {auth?.user && (
                <div className="card-actions absolute top-[10px] right-[10px] z-[5] flex gap-[5px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Link 
                        href={route('comics.toggle-read', comic.id)} 
                        method="post" 
                        as="button" 
                        preserveScroll
                        className={`action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md cursor-pointer transition-colors ${
                            comic.is_read ? 'text-[#00ff88] bg-[#00ff88]/20' : 'text-white bg-black/50 hover:bg-[#e8003d]'
                        }`}
                        title="Toggle Read Status"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </Link>
                    
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigator.clipboard.writeText(comic.share_url);
                            alert('Share link copied!');
                        }}
                        className="action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 bg-black/50 backdrop-blur-md text-white cursor-pointer transition-colors hover:bg-blue-500"
                        title="Copy Share Link"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16 6 12 2 8 6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                    </button>

                    {auth?.user?.is_admin && (
                        <Link 
                            href={route('admin.comics.toggle-visibility', comic.id)} 
                            method="post" 
                            as="button" 
                            preserveScroll
                            className="action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 bg-black/50 backdrop-blur-md text-white cursor-pointer transition-colors hover:bg-[#e8003d]"
                            title="Toggle Visibility"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {comic.is_hidden ? (
                                    <>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </>
                                ) : (
                                    <>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </>
                                )}
                            </svg>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
