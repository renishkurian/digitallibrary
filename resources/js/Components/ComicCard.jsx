import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { toast } from 'react-hot-toast';

export default function ComicCard({ comic, auth, compact = false }) {
    const [showInfo, setShowInfo] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    const toTitleCase = (str, stripMagazine = false) => {
        if (!str) return '';
        let clean = String(str).replace(/\.pdf$/i, '');
        if (stripMagazine) {
            clean = clean.replace(/balarama|balabhumi|kalakaumudi|fire|mangalam|mathrubhumi|manorama|arogyamasika|fasttrack|tell me why|vanitha/gi, '').trim();
        }
        return clean.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\s+/g, ' ').trim();
    };

    const formatComicTitle = (comic) => {
        if (comic.published_date) {
            const [year, month, day] = comic.published_date.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        return toTitleCase(comic.title, true);
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

    /* ── COMPACT / LIST ROW ── */
    if (compact) {
        return (
            <Link
                href={route('comics.show', comic.id)}
                className="group flex items-center gap-3.5 bg-white/[0.025] border border-white/[0.06] rounded-2xl px-4 py-3 hover:bg-white/[0.04] hover:border-[#e8003d]/30 hover:shadow-[0_2px_20px_rgba(232,0,61,0.08)] transition-all duration-200 group-hover:-translate-y-px"
            >
                <div className="flex-1 min-w-0">
                    <h3 className="text-[13.5px] text-white font-semibold group-hover:text-[#ff3355] transition-colors truncate flex items-center gap-2 leading-tight">
                        {formatComicTitle(comic)}
                        {comic.is_personal && (
                            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-md border border-blue-500/20 uppercase tracking-wide shrink-0">Personal</span>
                        )}
                    </h3>
                    <TagList comic={comic} limit={3} />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 text-[11px] text-[#4a4a6a] font-semibold">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        {comic.readers_count}
                    </div>
                    {auth?.user && (
                        <span className={`w-2 h-2 rounded-full ${comic.is_read ? 'bg-[#00e880]' : 'bg-[#e8003d]/60'}`} />
                    )}
                    <svg className="w-3.5 h-3.5 text-[#4a4a6a] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </Link>
        );
    }

    /* ── CARD (GRID / RACK) ── */
    return (
        <div className="card-outer relative group perspective-1000">
            <div className={`card-inner relative w-full aspect-[2/3] transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* ── FRONT ── */}
                <div className="card-front absolute inset-0 backface-hidden z-[1]">
                    <Link
                        href={route('comics.show', comic.id)}
                        className="block h-full w-full relative rounded-xl overflow-hidden bg-[#13131d] border border-white/[0.07] transition-all duration-300 hover:border-white/[0.15] hover:shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
                    >
                        {comic.thumbnail ? (
                            <img
                                src={`/thumbs/${comic.thumbnail}`}
                                alt={comic.title}
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#0d0d16] flex flex-col items-center justify-center gap-2">
                                <svg className="w-8 h-8 text-[#3a3a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="text-[10px] text-[#3a3a5a] font-semibold uppercase tracking-widest">No Cover</span>
                            </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#07070f]/95 via-[#07070f]/30 to-transparent" />

                        {/* Bottom info */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="text-[12px] text-white font-semibold leading-snug line-clamp-2 mb-1.5">
                                {formatComicTitle(comic)}
                                {comic.is_personal && (
                                    <span className="ml-1.5 text-[9px] bg-blue-500/15 text-blue-400 px-1 py-0.5 rounded border border-blue-500/20 uppercase tracking-wide align-middle">Personal</span>
                                )}
                            </h3>
                            <TagList comic={comic} limit={2} />
                            <div className="flex items-center justify-between mt-1.5">
                                {auth?.user && (
                                    comic.is_read ? (
                                        <span className="px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wide bg-[#00e880]/15 text-[#00e880] font-semibold border border-[#00e880]/20">Read</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wide bg-[#e8003d]/15 text-[#ff3355] font-semibold border border-[#e8003d]/20">Unread</span>
                                    )
                                )}
                                <div className="flex items-center gap-1 text-[10px] text-[#6060a0] font-medium ml-auto">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                    </svg>
                                    {comic.readers_count}
                                    {comic.rating && (
                                        <span className="ml-1.5 text-[#ffb400]">★ {comic.rating}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* AI Summary overlay */}
                        <div
                            className={`absolute inset-0 bg-[#07070f]/96 backdrop-blur-sm p-4 flex flex-col transition-all duration-250 z-[2] cursor-default ${showInfo ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-white font-bold text-[11px] tracking-widest uppercase flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                    AI Summary
                                </h4>
                                <button
                                    className="text-[#6060a0] hover:text-white transition-colors bg-white/[0.05] hover:bg-white/[0.1] rounded-full p-1"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowInfo(false); }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-0.5">
                                {comic.ai_summary ? (
                                    <p className="text-[#b0b0d0] text-[11px] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                        {comic.ai_summary}
                                    </p>
                                ) : (
                                    <p className="text-[#4a4a6a] text-[11px] italic">No AI summary available yet.</p>
                                )}
                                <TagList comic={comic} showLabel full className="mt-4 pt-3 border-t border-white/[0.05]" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* ── BACK (File Info) ── */}
                <div className="card-back absolute inset-0 backface-hidden rotate-y-180 bg-[#0e0e1a] border border-[#e8003d]/25 rounded-xl p-4 flex flex-col shadow-2xl z-[0]">
                    <div className="flex justify-between items-center mb-5">
                        <h4 className="text-[#e8003d] font-bold text-[10px] tracking-[2px] uppercase">File Info</h4>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFlipped(false); }}
                            className="bg-white/[0.05] hover:bg-white/[0.1] text-[#6060a0] hover:text-white rounded-full p-1.5 transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-[2px] text-[#4a4a6a] block mb-1">Filename</span>
                            <span className="text-[12px] text-cyan-400 font-semibold leading-relaxed break-words">{toTitleCase(comic.filename, true)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-[2px] text-[#4a4a6a] block mb-1">Pages</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-3 bg-blue-500 rounded-full" />
                                    <span className="text-[13px] text-white font-bold">{comic.pages_count || 0}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-[2px] text-[#4a4a6a] block mb-1">Size</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                                    <span className="text-[13px] text-white font-bold">{formatSize(comic.file_size)}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-[2px] text-[#4a4a6a] block mb-2">Shelves</span>
                            <div className="flex flex-wrap gap-1">
                                {comic.shelves?.length > 0 ? (
                                    comic.shelves.map((shelf, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-white/[0.05] border border-white/[0.09] rounded-md text-[10px] text-white/70 font-medium">
                                            {toTitleCase(shelf)}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[10px] text-[#4a4a6a] italic">No shelf assigned</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                        <Link
                            href={route('comics.show', comic.id)}
                            className="w-full py-2.5 bg-[#e8003d] hover:bg-[#ff1050] text-white text-[10px] font-bold uppercase tracking-[3px] rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_18px_rgba(232,0,61,0.3)] transition-all active:scale-[0.98]"
                        >
                            Read Now
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── ACTION BUTTONS (hover) ── */}
            <div className={`card-actions absolute top-2.5 right-2.5 z-[5] flex flex-col gap-1.5 transition-all duration-200 ${isFlipped ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-0 group-hover:opacity-100 scale-100'}`}>
                {/* Flip to File Info */}
                <ActionBtn
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFlipped(true); }}
                    title="View File Info"
                    className="text-cyan-400 hover:bg-cyan-500"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                    </svg>
                </ActionBtn>

                {/* AI Info */}
                <ActionBtn
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowInfo(!showInfo); }}
                    title="AI Summary"
                    className={showInfo ? 'bg-purple-500 text-white border-purple-400/40' : 'text-purple-300 hover:bg-purple-500'}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                </ActionBtn>

                {/* Share */}
                <ActionBtn
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(comic.share_url); toast.success('Link copied!'); }}
                    title="Copy Share Link"
                    className="text-white/70 hover:bg-blue-500"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                </ActionBtn>

                {auth?.user && (
                    <>
                        {/* Toggle Read */}
                        <Link
                            href={route('comics.toggle-read', comic.id)}
                            method="post"
                            as="button"
                            preserveScroll
                            className={`action-btn w-[28px] h-[28px] rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md cursor-pointer transition-all shadow-lg hover:-translate-y-0.5 active:scale-90 ${
                                comic.is_read ? 'text-[#00e880] bg-[#00e880]/15 border-[#00e880]/30' : 'text-white/60 bg-black/60 hover:bg-[#e8003d] hover:text-white'
                            }`}
                            title="Toggle Read"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </Link>

                        {auth.user.is_admin && (
                            <>
                                {/* Edit metadata */}
                                <Link
                                    href={route('admin.comics.index', { edit: comic.id })}
                                    className="action-btn w-[28px] h-[28px] rounded-full flex items-center justify-center border border-white/10 bg-black/60 backdrop-blur-md cursor-pointer transition-all shadow-lg hover:-translate-y-0.5 active:scale-90 text-white/60 hover:bg-purple-600 hover:text-white"
                                    title="Edit Metadata"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </Link>

                                {/* Toggle Visibility */}
                                <Link
                                    href={route('admin.comics.toggle-visibility', comic.id)}
                                    method="post"
                                    as="button"
                                    preserveScroll
                                    className={`action-btn w-[28px] h-[28px] rounded-full flex items-center justify-center border border-white/10 bg-black/60 backdrop-blur-md cursor-pointer transition-all shadow-lg hover:-translate-y-0.5 active:scale-90 ${
                                        comic.is_hidden ? 'text-[#ffb400] bg-[#ffb400]/15 border-[#ffb400]/30' : 'text-white/60 hover:bg-[#e8003d] hover:text-white'
                                    }`}
                                    title="Toggle Visibility"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        {comic.is_hidden ? (
                                            <>
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </>
                                        ) : (
                                            <>
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </>
                                        )}
                                    </svg>
                                </Link>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ── helpers ── */
function ActionBtn({ onClick, title, className, children }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`action-btn w-[28px] h-[28px] rounded-full flex items-center justify-center border border-white/10 bg-black/60 backdrop-blur-md cursor-pointer transition-all shadow-lg hover:-translate-y-0.5 active:scale-90 hover:text-white ${className}`}
        >
            {children}
        </button>
    );
}

function TagList({ comic, limit = 2, showLabel = false, full = false, className = '' }) {
    let parsedTags = [];
    try {
        parsedTags = typeof comic.tags === 'string' ? JSON.parse(comic.tags) : (comic.tags || []);
    } catch (e) {
        parsedTags = [];
    }
    if (parsedTags.length === 0) return null;
    const shown = full ? parsedTags : parsedTags.slice(0, limit);
    return (
        <div className={className}>
            {showLabel && <h5 className="text-[9px] font-bold uppercase tracking-widest text-[#4a4a6a] mb-2">Genres</h5>}
            <div className={`flex gap-1 overflow-hidden flex-wrap`}>
                {shown.map((tag, idx) => (
                    <span key={idx} className={`text-[9px] ${showLabel ? 'bg-white/[0.05] border border-white/[0.09] text-[#b0b0c8] px-2 py-0.5 rounded-full' : 'text-[#5a5a8a] font-medium'}`}>
                        {showLabel ? tag : `#${tag}`}
                    </span>
                ))}
                {!full && parsedTags.length > limit && (
                    <span className="text-[9px] text-[#4a4a6a]">+{parsedTags.length - limit}</span>
                )}
            </div>
        </div>
    );
}
