import { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export default function Read({ comic, last_read_page }) {
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(last_read_page || 1);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [showAIInfo, setShowAIInfo] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    
    const canvasRef = useRef(null);
    const scrollRef = useRef(null);
    const lastSyncedPage = useRef(last_read_page || 1);
    const renderTaskRef = useRef(null);
    const timeRef = useRef(0);
    const lastSyncTimeRef = useRef(Date.now());
    const touchStartRef = useRef(null);

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

    // Touch swipe support for mobile page navigation
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleTouchStart = (e) => {
            if (e.touches.length === 1) {
                touchStartRef.current = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    time: Date.now(),
                };
            }
        };

        const handleTouchEnd = (e) => {
            if (!touchStartRef.current) return;
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;
            const elapsed = Date.now() - touchStartRef.current.time;

            // Only register as swipe if horizontal movement > 50px, 
            // more horizontal than vertical, and completed within 500ms
            if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && elapsed < 500) {
                if (deltaX < 0) {
                    // Swipe left → next page
                    goPage(1);
                } else {
                    // Swipe right → previous page
                    goPage(-1);
                }
            }
            touchStartRef.current = null;
        };

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchend', handleTouchEnd);
        };
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
            
            {/* Top Toolbar */}
            <div className="cv-bar flex-shrink-0 bg-[#0a0a0f]/97 border-b border-white/7 backdrop-blur-md">
                {/* Row 1: Back, Title, Menu */}
                <div className="flex items-center justify-between px-3 sm:px-5 h-12 sm:h-14 gap-2">
                    <div className="cv-bar-left flex items-center gap-2 sm:gap-3.5 flex-1 min-w-0">
                        <Link 
                            href={route('comics.show', comic.id)} 
                            className="cv-back flex items-center gap-1.5 sm:gap-2 bg-white/7 border border-white/10 text-[#f0f0f5] text-[12px] sm:text-[13px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg no-underline transition-colors hover:bg-white/13 flex-shrink-0"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            <span className="hidden sm:inline">Back to Details</span>
                        </Link>
                        <span className="cv-title font-['Bebas_Neue'] text-[15px] sm:text-[18px] tracking-[2px] text-[#f0f0f5] truncate">{comic.title}</span>
                    </div>

                    {/* Page nav — always visible */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5">
                        <button 
                            className="cv-nav-btn w-8 h-8 sm:w-9 sm:h-9 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] flex items-center justify-center cursor-pointer transition-colors hover:bg-white/13 disabled:opacity-30 disabled:cursor-default" 
                            onClick={() => goPage(-1)} 
                            disabled={pageNum <= 1}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[#8888a0] text-[12px] sm:text-[13px]">
                            <input 
                                className="cv-page-input w-10 sm:w-12 bg-white/7 border border-white/12 text-[#f0f0f5] text-center p-1 sm:p-1.5 rounded-md outline-none text-[12px] sm:text-[13px]" 
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
                            className="cv-nav-btn w-8 h-8 sm:w-9 sm:h-9 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] flex items-center justify-center cursor-pointer transition-colors hover:bg-white/13 disabled:opacity-30 disabled:cursor-default" 
                            onClick={() => goPage(1)} 
                            disabled={pageNum >= numPages}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden sm:flex items-center gap-2.5">
                        <button className="cv-nav-btn w-8.5 h-8.5 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] cursor-pointer" onClick={() => zoom(-0.1)}>-</button>
                        <button className="cv-nav-btn w-8.5 h-8.5 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] cursor-pointer" onClick={() => zoom(0.1)}>+</button>
                    </div>

                    {/* Mobile menu toggle */}
                    <div className="relative sm:hidden">
                        <button 
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="w-8 h-8 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] flex items-center justify-center"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="12" cy="19" r="2" />
                            </svg>
                        </button>

                        {/* Mobile dropdown menu */}
                        {showMobileMenu && (
                            <div className="absolute right-0 top-10 bg-[#16161f] border border-white/10 rounded-xl shadow-2xl z-[210] min-w-[180px] py-2 animate-slideDown">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <span className="text-[12px] text-[#8888a0] font-medium">Zoom</span>
                                    <div className="flex items-center gap-2">
                                        <button className="w-8 h-8 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] flex items-center justify-center" onClick={() => zoom(-0.1)}>-</button>
                                        <span className="text-[12px] text-white/70 w-10 text-center">{Math.round(scale * 100)}%</span>
                                        <button className="w-8 h-8 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] flex items-center justify-center" onClick={() => zoom(0.1)}>+</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading && (
                <div className="cv-loading absolute inset-0 top-14 flex flex-col items-center justify-center gap-4 z-[5] pointer-events-none">
                    <div className="cv-spinner w-10 h-10 border-3 border-[#e8003d]/20 border-t-[#e8003d] rounded-full animate-spin"></div>
                    <div className="text-[#8888a0] text-[13px]">Loading PDF...</div>
                </div>
            )}

            {/* Swipe hint for mobile (shown briefly) */}
            <div className="sm:hidden text-center text-[11px] text-[#55556a] py-1.5 bg-white/3 border-b border-white/5">
                ← Swipe left/right to change pages →
            </div>

            <div ref={scrollRef} className="cv-scroll flex-1 overflow-auto flex flex-col items-center p-2 sm:p-7 bg-[#0d0d14] scroll-smooth">
                <canvas ref={canvasRef} className="block shadow-[0_8px_40px_rgba(0,0,0,0.7)] rounded-sm max-w-full" />
            </div>
        </div>
    );
}
