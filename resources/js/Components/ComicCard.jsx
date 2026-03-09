import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { toast } from 'react-hot-toast';

export default function ComicCard({ comic, auth }) {
    const [showInfo, setShowInfo] = useState(false);

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
                    {comic.tags && comic.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 px-1 overflow-hidden">
                            {comic.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="text-[9px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    {tag}
                                </span>
                            ))}
                            {comic.tags.length > 2 && <span className="text-[9px] text-gray-500 mt-0.5">+{comic.tags.length - 2}</span>}
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-1 px-1">
                        <p className="text-[#55556a] text-[10px] font-medium tracking-wide uppercase">
                            {comic.readers_count} {comic.readers_count === 1 ? 'Reader' : 'Readers'}
                        </p>
                        {comic.rating && (
                            <div className="flex items-center gap-0.5 text-[#ffb400] text-[10px] font-bold">
                                <span>★</span> {comic.rating}
                            </div>
                        )}
                    </div>
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

                {/* AI Summary Overlay */}
                <div 
                    className={`absolute inset-0 bg-[#0a0a0f]/95 backdrop-blur-md p-5 flex flex-col transition-all duration-300 z-[2] cursor-default ${showInfo ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5">
                            <span className="text-purple-400">✨</span> AI Info
                        </h4>
                        <button 
                            className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-1"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowInfo(false);
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-1">
                        {comic.ai_summary ? (
                            <p className="text-gray-300 text-xs leading-relaxed font-['DM_Sans']">
                                {comic.ai_summary}
                            </p>
                        ) : (
                            <p className="text-gray-500 text-xs italic">
                                No AI summary available yet.
                            </p>
                        )}

                        {comic.tags && comic.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-white/5">
                                <h5 className="text-[9px] font-bold uppercase tracking-widest text-[#8888a0] mb-2">Genres</h5>
                                <div className="flex flex-wrap gap-1">
                                    {comic.tags.map((tag, idx) => (
                                        <span key={idx} className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {comic.rating && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#8888a0]">Maturity / Quality</span>
                                <div className="flex items-center gap-1.5 text-[#ffb400] font-bold text-xs bg-[#ffb400]/10 px-2 py-0.5 rounded border border-[#ffb400]/20">
                                    <span>★</span> {comic.rating}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            <div className="card-actions absolute top-[10px] right-[10px] z-[5] flex gap-[5px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* AI Info Button */}
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowInfo(!showInfo);
                    }}
                    className={`action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md cursor-pointer transition-colors shadow-lg ${
                        showInfo ? 'bg-purple-500 text-white border-purple-400/50' : 'bg-black/50 text-purple-300 hover:bg-purple-500 hover:text-white'
                    }`}
                    title="View AI Summary"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>

                {/* Share button - visible to everyone */}
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard.writeText(comic.share_url);
                        toast.success('Share link copied!');
                    }}
                    className="action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 bg-black/50 backdrop-blur-md text-white cursor-pointer transition-colors hover:bg-blue-500 shadow-lg"
                    title="Copy Share Link"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                </button>

                {auth?.user && (
                    <>
                        <Link 
                            href={route('comics.toggle-read', comic.id)} 
                            method="post" 
                            as="button" 
                            preserveScroll
                            className={`action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md cursor-pointer transition-colors shadow-lg ${
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
                                className="action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 bg-black/50 backdrop-blur-md text-white cursor-pointer transition-colors hover:bg-[#e8003d] shadow-lg"
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
                    </>
                )}
            </div>
        </div>
    );
}
