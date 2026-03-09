import { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export default function Show({ comic, last_read_page }) {
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(last_read_page || 1);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [showAIInfo, setShowAIInfo] = useState(false);
    
    const canvasRef = useRef(null);
    const lastSyncedPage = useRef(last_read_page || 1);
    const renderTaskRef = useRef(null);
    const timeRef = useRef(0);
    const lastSyncTimeRef = useRef(Date.now());

    const renderPage = useCallback((num, currentScale) => {
        if (!pdfDoc) return;

        pdfDoc.getPage(num).then((page) => {
            const viewport = page.getViewport({ scale: currentScale });
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Cancel previous render task if any
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            renderTaskRef.current = page.render(renderContext);
            renderTaskRef.current.promise.then(() => {
                renderTaskRef.current = null;
                setLoading(false);
            }).catch(err => {
                if (err.name === 'RenderingCancelledException') return;
                console.error('Render error:', err);
            });
        });
    }, [pdfDoc]);

    useEffect(() => {
        const loadingTask = pdfjsLib.getDocument(`/comics/${comic.id}/serve`);
        loadingTask.promise.then((pdf) => {
            setPdfDoc(pdf);
            setNumPages(pdf.numPages);
        }).catch(err => {
            console.error('Error loading PDF:', err);
            setLoading(false);
        });
    }, [comic.id]);

    useEffect(() => {
        if (pdfDoc) {
            renderPage(pageNum, scale);
        }
    }, [pdfDoc, pageNum, scale, renderPage]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') goPage(-1);
            if (e.key === 'ArrowRight') goPage(1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pageNum, numPages]);

    // Sync page number to backend
    useEffect(() => {
        if (pageNum !== lastSyncedPage.current) {
            const timeout = setTimeout(() => {
                const currentSeconds = Math.floor((Date.now() - lastSyncTimeRef.current) / 1000);
                
                axios.post(route('comics.sync-time', comic.id), { 
                    page: pageNum,
                    seconds: Math.max(1, currentSeconds)
                })
                .then(() => {
                    lastSyncedPage.current = pageNum;
                    lastSyncTimeRef.current = Date.now();
                })
                .catch(err => console.error('Failed to sync page/time:', err));
            }, 2000); // 2 second debounce

            return () => clearTimeout(timeout);
        }
    }, [pageNum, comic.id]);

    // Periodic time sync (every 30s)
    useEffect(() => {
        const interval = setInterval(() => {
            const currentSeconds = Math.floor((Date.now() - lastSyncTimeRef.current) / 1000);
            if (currentSeconds >= 30) {
                axios.post(route('comics.sync-time', comic.id), { 
                    page: pageNum,
                    seconds: currentSeconds
                })
                .then(() => {
                    lastSyncTimeRef.current = Date.now();
                })
                .catch(err => console.error('Failed periodic sync:', err));
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [comic.id, pageNum]);

    // Final sync on unmount
    useEffect(() => {
        return () => {
            const currentSeconds = Math.floor((Date.now() - lastSyncTimeRef.current) / 1000);
            if (currentSeconds > 0) {
                // Use Navigator.sendBeacon for more reliable unmount sync if needed, 
                // but axios with a small delay or just a standard post might work here in Inertia.
                // However, since we want to be sure, we'll just try a standard post.
                navigator.sendBeacon(route('comics.sync-time', comic.id), JSON.stringify({
                    page: pageNum,
                    seconds: currentSeconds,
                    _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }));
            }
        };
    }, [comic.id, pageNum]);

    const goPage = (offset) => {
        const newPage = pageNum + offset;
        if (newPage >= 1 && newPage <= numPages) {
            setPageNum(newPage);
        }
    };

    const jumpPage = (val) => {
        const num = parseInt(val);
        if (num >= 1 && num <= numPages) {
            setPageNum(num);
        }
    };

    const zoom = (delta) => {
        setScale(prev => Math.max(0.5, Math.min(3.0, prev + delta)));
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#0a0a0f] flex flex-col animate-fadeIn font-['DM_Sans']">
            <Head title={comic.title} />
            
            <div className="cv-bar flex-shrink-0 h-14 bg-[#0a0a0f]/97 border-b border-white/7 flex items-center justify-between px-5 gap-3 backdrop-blur-md">
                <div className="cv-bar-left flex items-center gap-3.5 flex-1 min-w-0">
                    <Link 
                        href={route('comics.index')} 
                        className="cv-back flex items-center gap-2 bg-white/7 border border-white/10 text-[#f0f0f5] text-[13px] px-3.5 py-2 rounded-lg no-underline transition-colors hover:bg-white/13 flex-shrink-0"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Library
                    </Link>
                    <span className="cv-title font-['Bebas_Neue'] text-[18px] tracking-[2px] text-[#f0f0f5] truncate">{comic.title}</span>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded-md text-[#8888a0] text-[11px] font-bold flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>{comic.readers_count} READS</span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button 
                        className="cv-nav-btn w-8.5 h-8.5 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] flex items-center justify-center cursor-pointer transition-colors hover:bg-white/13 disabled:opacity-30 disabled:cursor-default" 
                        onClick={() => goPage(-1)} 
                        disabled={pageNum <= 1}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    
                    <div className="flex items-center gap-1.5 text-[#8888a0] text-[13px]">
                        <input 
                            className="cv-page-input w-12 bg-white/7 border border-white/12 text-[#f0f0f5] text-center p-1.5 rounded-md outline-none" 
                            type="number" 
                            min="1" 
                            max={numPages}
                            value={pageNum} 
                            onChange={(e) => jumpPage(e.target.value)} 
                        />
                        <span>/</span>
                        <span>{numPages || '?'}</span>
                    </div>

                    <button 
                        className="cv-nav-btn w-8.5 h-8.5 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] flex items-center justify-center cursor-pointer transition-colors hover:bg-white/13 disabled:opacity-30 disabled:cursor-default" 
                        onClick={() => goPage(1)} 
                        disabled={pageNum >= numPages}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>

                <div className="flex items-center gap-2.5">
                    {(comic.ai_summary || (comic.tags && comic.tags.length > 0)) && (
                        <button 
                            onClick={() => setShowAIInfo(!showAIInfo)}
                            className={`cv-nav-btn px-3 h-8.5 rounded-lg text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-1.5 ${showAIInfo ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400' : 'bg-white/5 border border-white/10 text-[#8888a0] hover:bg-white/10 hover:text-white'}`}
                        >
                            <span className="text-[13px] leading-none">✨</span> AI Info
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(comic.share_url);
                            toast.success('Share link copied!');
                        }}
                        className="cv-nav-btn px-3 h-8.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-colors hover:bg-blue-500/30 flex items-center justify-center"
                    >
                        Share PDF
                    </button>
                    <button className="cv-nav-btn w-8.5 h-8.5 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] cursor-pointer" onClick={() => zoom(-0.1)}>-</button>
                    <button className="cv-nav-btn w-8.5 h-8.5 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] cursor-pointer" onClick={() => zoom(0.1)}>+</button>
                </div>
            </div>

            {/* AI Info Panel */}
            {showAIInfo && (comic.ai_summary || comic.tags) && (
                <div className="border-b border-white/5 p-5 shadow-2xl z-[150] relative bg-[#0a0a0f]/95 backdrop-blur-md">
                    <div className="max-w-4xl mx-auto flex flex-col gap-4">
                        {comic.ai_summary && (
                            <div>
                                <h4 className="text-purple-400 text-[10px] font-bold uppercase tracking-[2px] mb-2 flex items-center gap-1.5"><span className="text-[12px]">✨</span> AI GENERATED SUMMARY</h4>
                                <p className="text-gray-300 text-[13px] leading-relaxed font-normal">{comic.ai_summary}</p>
                            </div>
                        )}
                        {comic.tags && comic.tags.length > 0 && (
                            <div>
                                <h4 className="text-[#8888a0] text-[10px] font-bold uppercase tracking-[2px] mb-2">METADATA</h4>
                                <div className="flex flex-wrap gap-2">
                                    {comic.tags.map((tag, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold uppercase tracking-wide">
                                            {tag}
                                        </span>
                                    ))}
                                    {comic.rating && (
                                        <span className="px-3 py-1 rounded bg-[#ffb400]/10 border border-[#ffb400]/20 text-[#ffb400] text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ml-2">
                                            <span>★</span> {comic.rating} RATING
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading && (
                <div className="cv-loading absolute inset-0 top-14 flex flex-col items-center justify-center gap-4 z-[5] pointer-events-none">
                    <div className="cv-spinner w-10 h-10 border-3 border-[#e8003d]/20 border-t-[#e8003d] rounded-full animate-spin"></div>
                    <div className="text-[#8888a0] text-[13px]">Loading comic...</div>
                </div>
            )}

            <div className="cv-scroll flex-1 overflow-auto flex flex-col items-center p-7 bg-[#0d0d14] scroll-smooth">
                <canvas ref={canvasRef} className="block shadow-[0_8px_40px_rgba(0,0,0,0.7)] rounded-sm max-w-full" />
            </div>
        </div>
    );
}
