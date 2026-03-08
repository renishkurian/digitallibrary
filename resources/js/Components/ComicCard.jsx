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
                    <div className="card-title text-[14px] font-medium text-white mb-[5px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {comic.title}
                    </div>
                    <div className="card-meta flex justify-between items-center">
                        {auth.user && (
                            comic.is_read ? (
                                <span className="read-status px-2 py-0.5 rounded text-[10px] uppercase tracking-tighter bg-[#00ff88]/20 text-[#00ff88]">READ</span>
                            ) : (
                                <span className="read-status px-2 py-0.5 rounded text-[10px] uppercase tracking-tighter bg-[#e8003d]/20 text-[#e8003d]">UNREAD</span>
                            )
                        )}
                    </div>
                </div>
            </Link>

            {auth.user && (
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
                    
                    {auth.user.is_admin && (
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
