import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { toast } from 'react-hot-toast';

export default function ComicCard({ comic, auth, compact = false }) {
    const [showInfo, setShowInfo] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    const toTitleCase = (str, stripMagazine = false) => {
        if (!str) return '';
        let clean = str.replace(/\.pdf$/i, '');
        if (stripMagazine) {
            clean = clean.replace(/balarama/gi, '').trim();
        }
        return clean.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\s+/g, ' ').trim();
    };

    const formatSize = (bytes) => {
        if (!bytes) return 'N/A';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    if (compact) {
        return (
            <div className="relative group">
                <Link href={route('comics.show', comic.id)} className="flex items-center gap-4 bg-[#16161f] border border-white/7 rounded-xl p-3 hover:bg-white/[0.05] hover:border-[#e8003d]/40 transition-all group-hover:-translate-y-0.5">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold group-hover:text-[#e8003d] transition-colors truncate text-sm flex items-center gap-2">
                            {toTitleCase(comic.title, true)}
                            {comic.is_personal && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded border border-blue-500/20 uppercase shrink-0">Personal</span>}
                        </h3>
                        {(() => {
                            let parsedTags = [];
                            try {
                                parsedTags = typeof comic.tags === 'string' ? JSON.parse(comic.tags) : (comic.tags || []);
                            } catch (e) {
                                parsedTags = [];
                            }
                            return parsedTags.length > 0 && (
                                <div className="flex gap-1 mt-1 overflow-hidden">
                                    {parsedTags.slice(0, 3).map((tag, idx) => (
                                        <span key={idx} className="text-[9px] text-[#8888a0] font-medium">#{tag}</span>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 text-[10px] text-[#55556a] font-bold">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>{comic.readers_count}</span>
                        </div>
                        {auth?.user && (
                            comic.is_read ? (
                                <span className="w-2 h-2 rounded-full bg-[#00ff88]" title="Read"></span>
                            ) : (
                                <span className="w-2 h-2 rounded-full bg-[#e8003d]" title="Unread"></span>
                            )
                        )}
                        <svg className="w-4 h-4 text-[#55556a] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </Link>
            </div>
        );
    }

    return (
        <div className="card-outer relative group perspective-1000">
            <div className={`card-inner relative w-full aspect-[2/3] transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front Side */}
                <div className="card-front absolute inset-0 backface-hidden z-[1]">
                    <Link href={route('comics.show', comic.id)} className="card block h-full w-full relative rounded-xl overflow-hidden bg-[#16161f] border border-white/7 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                        {comic.thumbnail ? (
                            <img src={`/thumbs/${comic.thumbnail}`} alt={comic.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-[#1a1a26] flex items-center justify-center text-[#8888a0]">
                                📖
                            </div>
                        )}

                        <div className="card-overlay absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/95 via-transparent to-transparent flex flex-col justify-end p-[15px]">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold group-hover/card:text-[#e8003d] transition-colors leading-tight truncate px-1 flex items-center gap-2 bg-black/40 backdrop-blur-sm py-1 rounded-lg">
                                    <span className="truncate">{toTitleCase(comic.title, true)}</span>
                                    {comic.is_personal && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded border border-blue-500/20 uppercase tracking-tighter shrink-0">Personal</span>}
                                </h3>
                                {(() => {
                                    let parsedTags = [];
                                    try {
                                        parsedTags = typeof comic.tags === 'string' ? JSON.parse(comic.tags) : (comic.tags || []);
                                    } catch (e) {
                                        parsedTags = [];
                                    }
                                    
                                    return parsedTags.length > 0 && (
                                        <div className="flex gap-1 mt-1.5 px-1 overflow-hidden">
                                            {parsedTags.slice(0, 2).map((tag, idx) => (
                                                <span key={idx} className="text-[9px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                    {tag}
                                                </span>
                                            ))}
                                            {parsedTags.length > 2 && <span className="text-[9px] text-gray-500 mt-0.5">+{parsedTags.length - 2}</span>}
                                        </div>
                                    );
                                })()}
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

                        {/* AI Summary Overlay (Existing) */}
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

                                {(() => {
                                    let parsedTags = [];
                                    try {
                                        parsedTags = typeof comic.tags === 'string' ? JSON.parse(comic.tags) : (comic.tags || []);
                                    } catch (e) {
                                        parsedTags = [];
                                    }
                                    
                                    return parsedTags.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-white/5">
                                            <h5 className="text-[9px] font-bold uppercase tracking-widest text-[#8888a0] mb-2">Genres</h5>
                                            <div className="flex flex-wrap gap-1">
                                                {parsedTags.map((tag, idx) => (
                                                    <span key={idx} className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Back Side (File Info) */}
                <div className="card-back absolute inset-0 backface-hidden rotate-y-180 bg-[#16161f] border border-[#e8003d]/30 rounded-xl p-5 flex flex-col shadow-2xl z-[0]">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[#e8003d] font-bold text-xs tracking-widest uppercase">File Information</h4>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsFlipped(false);
                            }}
                            className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full p-1.5 transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1 custom-scrollbar">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-[2px] text-[#55556a]">Filename</span>
                            <span className="text-[13px] text-cyan-400 font-bold leading-relaxed break-words">
                                {toTitleCase(comic.filename, true)}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-[2px] text-[#55556a]">Pages</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm text-white/90 font-bold">{comic.pages_count || 0}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-[2px] text-[#55556a]">Size</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-white/90 font-bold">{formatSize(comic.file_size)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <span className="text-[9px] font-black uppercase tracking-[2px] text-[#55556a]">Holding Shelves</span>
                            <div className="flex flex-wrap gap-1.5">
                                {comic.shelves && comic.shelves.length > 0 ? (
                                    comic.shelves.map((shelf, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/70 font-medium">
                                            {toTitleCase(shelf)}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[10px] text-gray-600 italic">No shelf assigned</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5">
                        <Link 
                            href={route('comics.show', comic.id)}
                            className="w-full py-2.5 bg-[#e8003d] hover:bg-[#ff0044] text-white text-[11px] font-black uppercase tracking-[3px] rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(232,0,61,0.3)] transition-all active:scale-95"
                        >
                            Read Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* Overlays (Buttons) */}
            <div className={`card-actions absolute top-[10px] right-[10px] z-[5] flex flex-col gap-[7px] transition-all duration-300 ${isFlipped ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-0 group-hover:opacity-100 scale-100'}`}>
                {/* File Info Toggle Button */}
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsFlipped(true);
                    }}
                    className="action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 bg-black/60 backdrop-blur-md text-cyan-400 cursor-pointer transition-all hover:bg-cyan-500 hover:text-white shadow-xl hover:-translate-y-1 active:scale-90"
                    title="View File Info"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                </button>

                {/* AI Info Button */}
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowInfo(!showInfo);
                    }}
                    className={`action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md cursor-pointer transition-all shadow-xl hover:-translate-y-1 active:scale-90 ${
                        showInfo ? 'bg-purple-500 text-white border-purple-400/50' : 'bg-black/60 text-purple-300 hover:bg-purple-500 hover:text-white'
                    }`}
                    title="View AI Summary"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>

                {/* Share button */}
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard.writeText(comic.share_url);
                        toast.success('Share link copied!');
                    }}
                    className="action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 bg-black/60 backdrop-blur-md text-white/80 cursor-pointer transition-all hover:bg-blue-500 hover:text-white shadow-xl hover:-translate-y-1 active:scale-90"
                    title="Copy Share Link"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                            className={`action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md cursor-pointer transition-all shadow-xl hover:-translate-y-1 active:scale-90 ${
                                comic.is_read ? 'text-[#00ff88] bg-[#00ff88]/20 border-[#00ff88]/30' : 'text-white/80 bg-black/60 hover:bg-[#e8003d] hover:text-white'
                            }`}
                            title="Toggle Read Status"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </Link>
                        
                        {auth.user.is_admin && (
                            <Link 
                                href={route('admin.comics.toggle-visibility', comic.id)} 
                                method="post" 
                                as="button" 
                                preserveScroll
                                className={`action-btn w-[30px] h-[30px] rounded-full flex items-center justify-center border border-white/10 bg-black/60 backdrop-blur-md cursor-pointer transition-all shadow-xl hover:-translate-y-1 active:scale-90 ${
                                    comic.is_hidden ? 'text-[#ffb400] bg-[#ffb400]/20 border-[#ffb400]/30' : 'text-white/80 hover:bg-[#e8003d] hover:text-white'
                                }`}
                                title="Toggle Visibility"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
