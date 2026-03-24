import { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export default function Show({ comic, last_read_page, personal_shelves, bookmarks: initialBookmarks }) {
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(last_read_page || 1);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [showAIInfo, setShowAIInfo] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showShelfMenu, setShowShelfMenu] = useState(false);
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('comic_view_mode') || 'single';
        }
        return 'single';
    });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bookmarksList, setBookmarksList] = useState(initialBookmarks || []);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [showBookmarkPopover, setShowBookmarkPopover] = useState(false);
    const [bookmarkNote, setBookmarkNote] = useState('');
    const [bookmarkThumbs, setBookmarkThumbs] = useState({});
    const [flipDirection, setFlipDirection] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('comic_sound') !== 'off';
        }
        return true;
    });
    const audioCtxRef = useRef(null);
    
    const canvasRef = useRef(null);
    const bookCanvasLeftRef = useRef(null);
    const bookCanvasRightRef = useRef(null);
    const scrollRef = useRef(null);
    const scrollCanvasRefs = useRef([]);
    const lastSyncedPage = useRef(last_read_page || 1);
    const renderTaskRef = useRef(null);
    const timeRef = useRef(0);
    const lastSyncTimeRef = useRef(Date.now());
    const touchStartRef = useRef(null);
    const observerRef = useRef(null);
    const readerContainerRef = useRef(null);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            readerContainerRef.current?.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
        }
    }, []);

    // Persist sound setting
    useEffect(() => {
        localStorage.setItem('comic_sound', soundEnabled ? 'on' : 'off');
    }, [soundEnabled]);

    // Page flip sound using Web Audio API
    const playFlipSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            const duration = 0.15;
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const t = i / ctx.sampleRate;
                const envelope = Math.exp(-t * 30);
                data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2000;
            filter.Q.value = 0.5;
            const gain = ctx.createGain();
            gain.gain.value = 0.4;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start();
        } catch (e) { /* silent fail */ }
    }, [soundEnabled]);

    // Listen for fullscreen changes (e.g. Escape key exit)
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Persist view mode
    useEffect(() => {
        localStorage.setItem('comic_view_mode', viewMode);
    }, [viewMode]);

    // ─── Single-page rendering ───
    const renderPage = useCallback((num, currentScale) => {
        if (!pdfDoc) return;

        pdfDoc.getPage(num).then((page) => {
            const viewport = page.getViewport({ scale: currentScale });
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

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

    // ─── Book mode rendering (two pages side by side) ───
    const renderBookPages = useCallback((leftPageNum, currentScale) => {
        if (!pdfDoc) return;

        const renderToCanvas = (pageNumber, canvasEl) => {
            if (!canvasEl || pageNumber < 1 || pageNumber > pdfDoc.numPages) {
                if (canvasEl) {
                    canvasEl.width = 0;
                    canvasEl.height = 0;
                }
                return;
            }
            pdfDoc.getPage(pageNumber).then((page) => {
                const viewport = page.getViewport({ scale: currentScale });
                const context = canvasEl.getContext('2d');
                canvasEl.height = viewport.height;
                canvasEl.width = viewport.width;
                page.render({ canvasContext: context, viewport });
            });
        };

        renderToCanvas(leftPageNum, bookCanvasLeftRef.current);
        renderToCanvas(leftPageNum + 1, bookCanvasRightRef.current);
        setLoading(false);
    }, [pdfDoc]);

    // ─── Scroll mode: render all pages ───
    const renderAllPages = useCallback((currentScale) => {
        if (!pdfDoc) return;

        const renderQueue = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            renderQueue.push(i);
        }

        const renderNext = (idx) => {
            if (idx >= renderQueue.length) {
                setLoading(false);
                return;
            }
            const pgNum = renderQueue[idx];
            const canvas = scrollCanvasRefs.current[pgNum - 1];
            if (!canvas) { renderNext(idx + 1); return; }

            pdfDoc.getPage(pgNum).then((page) => {
                const viewport = page.getViewport({ scale: currentScale });
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const task = page.render({ canvasContext: context, viewport });
                task.promise.then(() => renderNext(idx + 1)).catch(() => renderNext(idx + 1));
            });
        };
        renderNext(0);
    }, [pdfDoc]);

    // ─── Load PDF ───
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

    // ─── Trigger rendering based on view mode ───
    useEffect(() => {
        if (!pdfDoc) return;
        setLoading(true);

        if (viewMode === 'single') {
            renderPage(pageNum, scale);
        } else if (viewMode === 'book') {
            // In book mode, align to odd page (left page of a spread)
            const leftPage = pageNum % 2 === 1 ? pageNum : pageNum - 1;
            renderBookPages(Math.max(1, leftPage), scale);
        } else if (viewMode === 'scroll') {
            renderAllPages(scale);
        }
    }, [pdfDoc, pageNum, scale, viewMode, renderPage, renderBookPages, renderAllPages]);

    // ─── IntersectionObserver for scroll mode page tracking ───
    useEffect(() => {
        if (viewMode !== 'scroll' || !pdfDoc) return;

        // Slight delay to allow canvases to render
        const timeout = setTimeout(() => {
            if (observerRef.current) observerRef.current.disconnect();

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    let bestEntry = null;
                    let bestRatio = 0;
                    entries.forEach(entry => {
                        if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
                            bestRatio = entry.intersectionRatio;
                            bestEntry = entry;
                        }
                    });
                    if (bestEntry) {
                        const idx = parseInt(bestEntry.target.dataset.page);
                        if (idx && idx !== pageNum) {
                            setPageNum(idx);
                        }
                    }
                },
                { root: scrollRef.current, threshold: [0.3, 0.5, 0.7] }
            );

            scrollCanvasRefs.current.forEach((canvas) => {
                if (canvas) observerRef.current.observe(canvas);
            });
        }, 500);

        return () => {
            clearTimeout(timeout);
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [viewMode, pdfDoc, numPages]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') goPage(-1);
            if (e.key === 'ArrowRight') goPage(1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pageNum, numPages, viewMode]);

    // Touch swipe support
    useEffect(() => {
        if (viewMode === 'scroll') return; // scroll mode uses native scrolling
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

            if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && elapsed < 500) {
                if (deltaX < 0) goPage(1);
                else goPage(-1);
            }
            touchStartRef.current = null;
        };

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [pageNum, numPages, viewMode]);

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
            }, 2000);

            return () => clearTimeout(timeout);
        }
    }, [pageNum, comic.id]);

    // Periodic time sync
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
        const step = viewMode === 'book' ? 2 : 1;
        const newPage = pageNum + (offset * step);
        if (newPage >= 1 && newPage <= numPages) {
            // Book mode: trigger flip animation and sound
            if (viewMode === 'book') {
                setFlipDirection(offset > 0 ? 'forward' : 'backward');
                playFlipSound();
                setTimeout(() => setFlipDirection(null), 750);
            }
            setPageNum(newPage);
            // In scroll mode, scroll to the target page canvas
            if (viewMode === 'scroll') {
                const canvas = scrollCanvasRefs.current[newPage - 1];
                if (canvas) {
                    canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    };

    const jumpPage = (val) => {
        const num = parseInt(val);
        if (num >= 1 && num <= numPages) {
            setPageNum(num);
            if (viewMode === 'scroll') {
                const canvas = scrollCanvasRefs.current[num - 1];
                if (canvas) {
                    canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    };

    const zoom = (delta) => {
        setScale(prev => Math.max(0.5, Math.min(3.0, prev + delta)));
    };

    // ─── Bookmark Handlers ───
    const handleAddBookmark = () => {
        axios.post(route('comics.add-bookmark', comic.id), {
            page_number: pageNum,
            note: bookmarkNote,
        }).then(res => {
            const bm = res.data.bookmark;
            setBookmarksList(prev => {
                const existing = prev.findIndex(b => b.page_number === bm.page_number);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = bm;
                    return updated.sort((a, b) => a.page_number - b.page_number);
                }
                return [...prev, bm].sort((a, b) => a.page_number - b.page_number);
            });
            setShowBookmarkPopover(false);
            setBookmarkNote('');
            setShowBookmarks(true);
            toast.success(`Bookmarked page ${pageNum}`);
            generateThumbForPage(pageNum);
        }).catch(() => toast.error('Failed to save bookmark'));
    };

    const handleRemoveBookmark = (bm) => {
        axios.delete(route('comics.remove-bookmark', { comic: comic.id, bookmark: bm.id }))
            .then(() => {
                setBookmarksList(prev => prev.filter(b => b.id !== bm.id));
                toast.success('Bookmark removed');
            })
            .catch(() => toast.error('Failed to remove bookmark'));
    };

    const isCurrentPageBookmarked = bookmarksList.some(b => b.page_number === pageNum);

    // ─── Generate thumbnail for a specific page ───
    const generateThumbForPage = useCallback((pgNum) => {
        if (!pdfDoc || bookmarkThumbs[pgNum]) return;
        pdfDoc.getPage(pgNum).then(page => {
            const viewport = page.getViewport({ scale: 0.3 });
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = viewport.width;
            tmpCanvas.height = viewport.height;
            const ctx = tmpCanvas.getContext('2d');
            page.render({ canvasContext: ctx, viewport }).promise.then(() => {
                const dataUrl = tmpCanvas.toDataURL('image/jpeg', 0.6);
                setBookmarkThumbs(prev => ({ ...prev, [pgNum]: dataUrl }));
            });
        });
    }, [pdfDoc, bookmarkThumbs]);

    // Generate thumbnails for all existing bookmarks when PDF loads
    useEffect(() => {
        if (!pdfDoc || bookmarksList.length === 0) return;
        bookmarksList.forEach(bm => generateThumbForPage(bm.page_number));
    }, [pdfDoc, bookmarksList, generateThumbForPage]);

    // View mode icons
    const ViewModeButton = ({ mode, icon, title }) => (
        <button
            onClick={() => setViewMode(mode)}
            className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center transition-all ${
                viewMode === mode
                    ? 'bg-[#e8003d] text-white shadow-lg shadow-[#e8003d]/30'
                    : 'bg-white/6 border border-white/10 text-[#8888a0] hover:text-white hover:bg-white/13'
            }`}
            title={title}
        >
            {icon}
        </button>
    );

    return (
        <div ref={readerContainerRef} className="fixed inset-0 z-[200] bg-[#0a0a0f] flex flex-col animate-fadeIn font-['DM_Sans']">
            <Head title={comic.title} />
            
            {/* Top Toolbar */}
            <div className="cv-bar flex-shrink-0 bg-[#0a0a0f]/97 border-b border-white/7 backdrop-blur-md">
                {/* Row 1: Back, Title, Menu */}
                <div className="flex items-center justify-between px-3 sm:px-5 h-12 sm:h-14 gap-2">
                    <div className="cv-bar-left flex items-center gap-2 sm:gap-3.5 flex-1 min-w-0">
                        <Link 
                            href={route('comics.index')} 
                            className="cv-back flex items-center gap-1.5 sm:gap-2 bg-white/7 border border-white/10 text-[#f0f0f5] text-[12px] sm:text-[13px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg no-underline transition-colors hover:bg-white/13 flex-shrink-0"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            <span className="hidden sm:inline">Library</span>
                        </Link>
                        <span className="cv-title font-['Bebas_Neue'] text-[15px] sm:text-[18px] tracking-[2px] text-[#f0f0f5] truncate">{comic.title}</span>
                        
                        {/* Desktop-only: readers badge */}
                        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded-md text-[#8888a0] text-[11px] font-bold flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>{comic.readers_count} READS</span>
                        </div>
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
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                            <ViewModeButton 
                                mode="single" 
                                title="Single Page"
                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /></svg>}
                            />
                            <ViewModeButton 
                                mode="scroll" 
                                title="Scroll Mode (Daily)"
                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="1" width="14" height="7" rx="1" /><rect x="5" y="9" width="14" height="7" rx="1" /><rect x="5" y="17" width="14" height="6" rx="1" /></svg>}
                            />
                            <ViewModeButton 
                                mode="book" 
                                title="Book View (Two Pages)"
                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                            />
                        </div>

                        {/* Bookmark Controls */}
                        <button 
                            onClick={() => setShowBookmarks(!showBookmarks)}
                            className={`cv-nav-btn px-3 h-8.5 rounded-lg text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-1.5 ${showBookmarks ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-white/5 border border-white/10 text-[#8888a0] hover:bg-white/10 hover:text-white'}`}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill={showBookmarks ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                            {bookmarksList.length > 0 && <span>{bookmarksList.length}</span>}
                        </button>
                        <button 
                            onClick={() => {
                                if (isCurrentPageBookmarked) {
                                    const bm = bookmarksList.find(b => b.page_number === pageNum);
                                    if (bm) handleRemoveBookmark(bm);
                                } else {
                                    setBookmarkNote('');
                                    setShowBookmarkPopover(true);
                                }
                            }}
                            className={`cv-nav-btn w-8.5 h-8.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isCurrentPageBookmarked ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-white/6 border border-white/10 text-[#8888a0] hover:text-white hover:bg-white/13'}`}
                            title={isCurrentPageBookmarked ? 'Remove Bookmark' : 'Bookmark This Page'}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentPageBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                {isCurrentPageBookmarked 
                                    ? <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                    : <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/></>
                                }
                            </svg>
                        </button>
                        {personal_shelves?.length > 0 && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowShelfMenu(!showShelfMenu)}
                                    className="cv-nav-btn px-3 h-8.5 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-colors hover:bg-green-500/30 flex items-center justify-center"
                                >
                                    + Add to Shelf
                                </button>
                                {showShelfMenu && (
                                    <div className="absolute right-0 mt-2 bg-[#16161f] border border-white/10 rounded-xl shadow-2xl z-[210] min-w-[180px] py-2 animate-slideDown">
                                        {personal_shelves.map(shelf => (
                                            <button 
                                                key={shelf.id}
                                                onClick={() => {
                                                    setShowShelfMenu(false);
                                                    router.post(route('comics.add-to-shelf', comic.id), { shelf_id: shelf.id }, {
                                                        preserveScroll: true,
                                                        onSuccess: () => toast.success(`Added to ${shelf.name}`)
                                                    });
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-[13px] text-[#a0a0b8] hover:bg-white/5 hover:text-white transition-colors"
                                            >
                                                {shelf.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
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
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#f0f0f5] hover:bg-white/10 transition-colors disabled:opacity-30" onClick={() => zoom(-0.1)} disabled={scale <= 0.5} title="Zoom Out">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </button>
                            <button 
                                onClick={() => setScale(1.0)} 
                                className="text-[11px] text-[#8888a0] hover:text-white font-bold w-12 text-center transition-colors cursor-pointer"
                                title="Reset to 100%"
                            >
                                {Math.round(scale * 100)}%
                            </button>
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#f0f0f5] hover:bg-white/10 transition-colors disabled:opacity-30" onClick={() => zoom(0.1)} disabled={scale >= 3.0} title="Zoom In">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </button>
                            <button 
                                onClick={() => {
                                    const container = scrollRef.current;
                                    if (container && pdfDoc) {
                                        pdfDoc.getPage(pageNum).then(page => {
                                            const viewport = page.getViewport({ scale: 1.0 });
                                            const fitScale = (container.clientWidth - 40) / viewport.width;
                                            setScale(Math.min(3.0, Math.max(0.5, fitScale)));
                                        });
                                    }
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8888a0] hover:text-white hover:bg-white/10 transition-colors"
                                title="Fit to Width"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                            </button>
                            <div className="w-px h-5 bg-white/10" />
                            <button 
                                onClick={toggleFullscreen}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8888a0] hover:text-white hover:bg-white/10 transition-colors"
                                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            >
                                {isFullscreen ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><polyline points="21 15 21 21 15 21"/><polyline points="3 9 3 3 9 3"/></svg>
                                )}
                            </button>
                            <button 
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${soundEnabled ? 'text-amber-400 hover:bg-white/10' : 'text-[#55556a] hover:bg-white/10'}`}
                                title={soundEnabled ? 'Sound On' : 'Sound Off'}
                            >
                                {soundEnabled ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                                )}
                            </button>
                        </div>
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
                            <div className="absolute right-0 top-10 bg-[#16161f] border border-white/10 rounded-xl shadow-2xl z-[210] min-w-[200px] py-2 animate-slideDown">
                                {/* View Mode Selection */}
                                <div className="px-4 py-2 text-[10px] text-[#8888a0] font-bold uppercase tracking-wider">View Mode</div>
                                <div className="flex items-center gap-1 px-4 py-2">
                                    <ViewModeButton 
                                        mode="single" 
                                        title="Single Page"
                                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /></svg>}
                                    />
                                    <ViewModeButton 
                                        mode="scroll" 
                                        title="Scroll Mode"
                                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="1" width="14" height="7" rx="1" /><rect x="5" y="9" width="14" height="7" rx="1" /><rect x="5" y="17" width="14" height="6" rx="1" /></svg>}
                                    />
                                    <ViewModeButton 
                                        mode="book" 
                                        title="Book View"
                                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                                    />
                                </div>
                                <div className="border-t border-white/7 my-1" />

                                {/* Bookmark Controls */}
                                <button 
                                    onClick={() => { setShowBookmarks(!showBookmarks); setShowMobileMenu(false); }}
                                    className="w-full text-left px-4 py-2.5 text-[13px] text-[#a0a0b8] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={showBookmarks ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                                    Bookmarks {bookmarksList.length > 0 && `(${bookmarksList.length})`}
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowMobileMenu(false);
                                        if (isCurrentPageBookmarked) {
                                            const bm = bookmarksList.find(b => b.page_number === pageNum);
                                            if (bm) handleRemoveBookmark(bm);
                                        } else {
                                            setBookmarkNote('');
                                            setShowBookmarkPopover(true);
                                        }
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-[13px] text-[#a0a0b8] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentPageBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                                    {isCurrentPageBookmarked ? 'Remove Bookmark' : 'Bookmark Page ' + pageNum}
                                </button>
                                <div className="border-t border-white/7 my-1" />

                                {(comic.ai_summary || (comic.tags && comic.tags.length > 0)) && (
                                    <button 
                                        onClick={() => { setShowAIInfo(!showAIInfo); setShowMobileMenu(false); }}
                                        className="w-full text-left px-4 py-2.5 text-[13px] text-[#a0a0b8] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        <span>✨</span> AI Info
                                    </button>
                                )}
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(comic.share_url);
                                        toast.success('Share link copied!');
                                        setShowMobileMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-[13px] text-[#a0a0b8] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                        <polyline points="16 6 12 2 8 6"></polyline>
                                        <line x1="12" y1="2" x2="12" y2="15"></line>
                                    </svg>
                                    Share PDF
                                </button>

                                {personal_shelves?.length > 0 && (
                                    <>
                                        <div className="border-t border-white/7 my-1" />
                                        <div className="px-4 py-2 text-[10px] text-[#8888a0] font-bold uppercase tracking-wider">Save to Shelf</div>
                                        <div className="max-h-[150px] overflow-y-auto no-scrollbar">
                                            {personal_shelves.map(shelf => (
                                                <button 
                                                    key={shelf.id}
                                                    onClick={() => {
                                                        setShowMobileMenu(false);
                                                        router.post(route('comics.add-to-shelf', comic.id), { shelf_id: shelf.id }, {
                                                            preserveScroll: true,
                                                            onSuccess: () => toast.success(`Added to ${shelf.name}`)
                                                        });
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-[13px] text-[#a0a0b8] hover:bg-white/5 hover:text-white transition-colors pl-6"
                                                >
                                                    {shelf.name}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="border-t border-white/7 my-1" />
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

            {/* AI Info Panel */}
            {showAIInfo && (comic.ai_summary || comic.tags) && (
                <div className="border-b border-white/5 p-4 sm:p-5 shadow-2xl z-[150] relative bg-[#0a0a0f]/95 backdrop-blur-md">
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

            {/* View mode indicator for mobile */}
            <div className="sm:hidden text-center text-[11px] text-[#55556a] py-1.5 bg-white/3 border-b border-white/5">
                {viewMode === 'single' && '← Swipe left/right to change pages →'}
                {viewMode === 'scroll' && '↕ Scroll through all pages'}
                {viewMode === 'book' && '← Swipe to turn pages (2 at a time) →'}
            </div>

            {/* ─── MAIN CONTENT AREA WITH SIDEBAR ─── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Bookmark Sidebar */}
                <div className={`bg-[#0a0a0f] border-r border-white/7 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 ${showBookmarks ? 'w-64 sm:w-72' : 'w-0'} overflow-hidden`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/7 flex-shrink-0">
                        <h3 className="text-[11px] font-bold uppercase tracking-[2px] text-[#8888a0]">🔖 Bookmarks</h3>
                        <button onClick={() => setShowBookmarks(false)} className="text-[#55556a] hover:text-white transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
                        {bookmarksList.length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-[#333] text-3xl mb-2">🔖</div>
                                <p className="text-[#55556a] text-[11px]">No bookmarks yet</p>
                                <p className="text-[#3a3a4a] text-[10px] mt-1">Click the bookmark button to save a page</p>
                            </div>
                        )}
                        {bookmarksList.map(bm => (
                            <div 
                                key={bm.id}
                                onClick={() => { jumpPage(bm.page_number); }}
                                className={`group flex gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/5 border border-transparent hover:border-white/10 ${pageNum === bm.page_number ? 'bg-[#e8003d]/10 border-[#e8003d]/20' : ''}`}
                            >
                                {/* Thumbnail */}
                                <div className="w-12 h-16 rounded-md overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                                    {bookmarkThumbs[bm.page_number] ? (
                                        <img src={bookmarkThumbs[bm.page_number]} className="w-full h-full object-cover" alt={`Page ${bm.page_number}`} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#55556a] font-bold">{bm.page_number}</div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold text-white">Page {bm.page_number}</div>
                                    {bm.note && <p className="text-[10px] text-[#8888a0] mt-0.5 line-clamp-2 leading-relaxed">{bm.note}</p>}
                                </div>
                                {/* Delete */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRemoveBookmark(bm); }}
                                    className="opacity-0 group-hover:opacity-100 text-[#55556a] hover:text-[#e8003d] transition-all flex-shrink-0 self-start mt-1"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reading Area */}
                <div ref={scrollRef} className="cv-scroll flex-1 overflow-auto flex flex-col items-center p-2 sm:p-7 bg-[#0d0d14] scroll-smooth relative">
                    
                    {/* Bookmark popover */}
                    {showBookmarkPopover && (
                        <div className="absolute top-4 right-4 z-[220] bg-[#16161f] border border-white/10 rounded-xl shadow-2xl p-4 w-72 animate-slideDown">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[11px] font-bold uppercase tracking-[2px] text-[#8888a0]">Bookmark Page {pageNum}</h4>
                                <button onClick={() => setShowBookmarkPopover(false)} className="text-[#55556a] hover:text-white transition-colors">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>
                            <textarea
                                value={bookmarkNote}
                                onChange={e => setBookmarkNote(e.target.value)}
                                placeholder="Add a short note (optional)..."
                                className="w-full bg-[#0c0c12] border border-white/10 text-white rounded-lg p-2.5 h-20 outline-none focus:border-[#e8003d] transition-colors resize-none text-[12px]"
                                maxLength={500}
                            />
                            <div className="flex gap-2 mt-3">
                                <button 
                                    onClick={handleAddBookmark}
                                    className="flex-1 bg-[#e8003d] text-white px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#ff0044] transition-colors"
                                >
                                    Save Bookmark
                                </button>
                                <button 
                                    onClick={() => setShowBookmarkPopover(false)}
                                    className="px-4 py-2 bg-white/10 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-white/15 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Single Page Mode */}
                    {viewMode === 'single' && (
                        <canvas ref={canvasRef} className="block shadow-[0_8px_40px_rgba(0,0,0,0.7)] rounded-sm max-w-full" />
                    )}

                    {/* Scroll Mode - All pages stacked */}
                    {viewMode === 'scroll' && pdfDoc && (
                        <div className="flex flex-col items-center gap-4 w-full">
                            {Array.from({ length: numPages }, (_, i) => (
                                <div key={i} className="relative w-full flex justify-center">
                                    <canvas 
                                        ref={el => { scrollCanvasRefs.current[i] = el; }}
                                        data-page={i + 1}
                                        className="block shadow-[0_8px_40px_rgba(0,0,0,0.7)] rounded-sm max-w-full"
                                    />
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-[#8888a0] text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10 font-bold">
                                        {i + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Book Mode - Realistic page flip */}
                    {viewMode === 'book' && (
                        <div className="book-container" style={{ perspective: '1800px', perspectiveOrigin: '50% 50%' }}>
                            {/* Left page */}
                            <div className="book-page book-page-left">
                                <canvas 
                                    ref={bookCanvasLeftRef} 
                                    className="block max-h-full max-w-full" 
                                    style={{ objectFit: 'contain' }}
                                />
                                {/* Inner spine shadow */}
                                <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none" 
                                     style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.08) 40%, transparent 100%)' }} />
                                {/* Page edge highlight */}
                                <div className="absolute right-0 top-0 bottom-0 w-px bg-white/10 pointer-events-none" />
                            </div>

                            {/* Spine */}
                            <div className="book-spine" />

                            {/* Right page */}
                            <div className="book-page book-page-right">
                                <canvas 
                                    ref={bookCanvasRightRef} 
                                    className="block max-h-full max-w-full" 
                                    style={{ objectFit: 'contain' }}
                                />
                                {/* Inner spine shadow */}
                                <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none" 
                                     style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.08) 40%, transparent 100%)' }} />
                                {/* Page edge highlight */}
                                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10 pointer-events-none" />
                            </div>

                            {/* Flip overlay - appears during page turn */}
                            {flipDirection && (
                                <div className={`book-flip-overlay ${flipDirection === 'forward' ? 'flip-forward' : 'flip-backward'}`}>
                                    <div className="book-flip-page">
                                        {/* Front face - page curl gradient */}
                                        <div className="book-flip-front" />
                                        {/* Back face */}
                                        <div className="book-flip-back" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Book view styles */}
                    <style>{`
                        .book-container {
                            display: flex;
                            align-items: flex-start;
                            justify-content: center;
                            max-width: 100%;
                            height: 100%;
                            position: relative;
                        }
                        .book-page {
                            position: relative;
                            max-width: 48%;
                            box-shadow: 0 4px 30px rgba(0,0,0,0.4);
                            background: #1a1a24;
                        }
                        .book-page-left {
                            border-radius: 3px 0 0 3px;
                            transform-origin: right center;
                        }
                        .book-page-right {
                            border-radius: 0 3px 3px 0;
                            transform-origin: left center;
                        }
                        .book-spine {
                            width: 3px;
                            align-self: stretch;
                            background: linear-gradient(to right, #0a0a0f, #1a1a24 40%, #0a0a0f);
                            box-shadow: 0 0 15px rgba(0,0,0,0.8);
                            flex-shrink: 0;
                        }

                        /* ─── Flip overlay ─── */
                        .book-flip-overlay {
                            position: absolute;
                            top: 0;
                            width: 48%;
                            height: 100%;
                            z-index: 10;
                            transform-style: preserve-3d;
                        }
                        .book-flip-overlay.flip-forward {
                            right: calc(50% + 1.5px);
                            transform-origin: right center;
                            animation: pageFlipForward 0.7s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
                        }
                        .book-flip-overlay.flip-backward {
                            left: calc(50% + 1.5px);
                            transform-origin: left center;
                            animation: pageFlipBackward 0.7s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
                        }
                        .book-flip-page {
                            width: 100%;
                            height: 100%;
                            position: relative;
                            transform-style: preserve-3d;
                        }
                        .book-flip-front, .book-flip-back {
                            position: absolute;
                            inset: 0;
                            backface-visibility: hidden;
                            border-radius: 2px;
                        }
                        .book-flip-front {
                            background: linear-gradient(to left, 
                                rgba(20,20,30,0.95) 0%, 
                                rgba(26,26,36,0.9) 10%, 
                                rgba(30,30,42,0.7) 40%,
                                rgba(40,40,55,0.3) 100%);
                            box-shadow: inset -3px 0 8px rgba(0,0,0,0.3);
                        }
                        .book-flip-back {
                            transform: rotateY(180deg);
                            background: linear-gradient(to right, 
                                rgba(20,20,30,0.95) 0%, 
                                rgba(26,26,36,0.9) 10%, 
                                rgba(30,30,42,0.7) 40%,
                                rgba(40,40,55,0.3) 100%);
                            box-shadow: inset 3px 0 8px rgba(0,0,0,0.3);
                        }

                        @keyframes pageFlipForward {
                            0% { 
                                transform: rotateY(0deg); 
                                box-shadow: -5px 0 15px rgba(0,0,0,0);
                            }
                            15% { 
                                transform: rotateY(-15deg); 
                                box-shadow: -8px 0 20px rgba(0,0,0,0.2);
                            }
                            50% { 
                                transform: rotateY(-90deg); 
                                box-shadow: -15px 0 40px rgba(0,0,0,0.4);
                            }
                            85% { 
                                transform: rotateY(-160deg);
                                box-shadow: -5px 0 15px rgba(0,0,0,0.2);
                            }
                            100% { 
                                transform: rotateY(-180deg); 
                                box-shadow: 0px 0 5px rgba(0,0,0,0);
                            }
                        }
                        @keyframes pageFlipBackward {
                            0% { 
                                transform: rotateY(0deg); 
                                box-shadow: 5px 0 15px rgba(0,0,0,0);
                            }
                            15% { 
                                transform: rotateY(15deg); 
                                box-shadow: 8px 0 20px rgba(0,0,0,0.2);
                            }
                            50% { 
                                transform: rotateY(90deg); 
                                box-shadow: 15px 0 40px rgba(0,0,0,0.4);
                            }
                            85% { 
                                transform: rotateY(160deg);
                                box-shadow: 5px 0 15px rgba(0,0,0,0.2);
                            }
                            100% { 
                                transform: rotateY(180deg); 
                                box-shadow: 0px 0 5px rgba(0,0,0,0);
                            }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
}
