import { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export default function Show({ comic }) {
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);

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

                <div className="flex gap-2.5">
                    <button className="cv-nav-btn w-8.5 h-8.5 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] cursor-pointer hover:bg-white/13" onClick={() => zoom(-0.1)}>-</button>
                    <button className="cv-nav-btn w-8.5 h-8.5 bg-white/6 border border-white/10 rounded-lg text-[#f0f0f5] cursor-pointer hover:bg-white/13" onClick={() => zoom(0.1)}>+</button>
                </div>
            </div>

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
