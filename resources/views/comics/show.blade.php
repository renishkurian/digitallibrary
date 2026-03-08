@extends('layouts.comic')

@section('styles')
<style>
    .cv-viewer {
        position: fixed;
        inset: 0;
        z-index: 200;
        background: #0a0a0f;
        display: flex;
        flex-direction: column;
        animation: fadeIn 0.25s ease;
    }

    .cv-bar {
        flex-shrink: 0;
        height: 56px;
        background: rgba(10, 10, 15, 0.97);
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        gap: 12px;
        backdrop-filter: blur(10px);
    }

    .cv-bar-left {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1;
        min-width: 0;
    }

    .cv-back {
        display: flex;
        align-items: center;
        gap: 7px;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #f0f0f5;
        font-family: 'DM Sans', sans-serif;
        font-size: 13px;
        padding: 7px 14px;
        border-radius: 7px;
        cursor: pointer;
        text-decoration: none;
        white-space: nowrap;
        transition: background 0.2s;
        flex-shrink: 0;
    }

    .cv-back:hover {
        background: rgba(255, 255, 255, 0.13);
    }

    .cv-title {
        font-family: 'Bebas Neue', sans-serif;
        font-size: 18px;
        letter-spacing: 2px;
        color: #f0f0f5;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .cv-scroll {
        flex: 1;
        overflow-y: auto;
        overflow-x: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 28px 20px 60px;
        scroll-behavior: smooth;
        background: #0d0d14;
    }

    .cv-scroll::-webkit-scrollbar {
        width: 4px;
    }

    .cv-scroll::-webkit-scrollbar-track {
        background: #0a0a0f;
    }

    .cv-scroll::-webkit-scrollbar-thumb {
        background: #e8003d;
        border-radius: 2px;
    }

    canvas {
        display: block;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.7);
        border-radius: 4px;
        max-width: 100%;
    }

    .cv-loading {
        position: fixed;
        inset: 56px 0 0 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        z-index: 5;
        pointer-events: none;
    }

    .cv-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(232, 0, 61, 0.2);
        border-top-color: #e8003d;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .cv-nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 7px;
        color: #f0f0f5;
        cursor: pointer;
        transition: background 0.2s;
    }

    .cv-nav-btn:hover {
        background: rgba(255, 255, 255, 0.13);
    }

    .cv-nav-btn:disabled {
        opacity: 0.3;
        cursor: default;
    }

    .cv-page-input {
        width: 48px;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #f0f0f5;
        font-family: 'DM Sans', sans-serif;
        font-size: 13px;
        text-align: center;
        padding: 5px 6px;
        border-radius: 6px;
        outline: none;
    }
</style>
@endsection

@section('content')
<div class="cv-viewer" id="cvViewer">
    <div class="cv-bar">
        <div class="cv-bar-left">
            <a href="{{ route('comics.index') }}" class="cv-back">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Library
            </a>
            <span class="cv-title">{{ $comic->title }}</span>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
            <button class="cv-nav-btn" onclick="goPage(-1)" id="prevBtn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>
            <div style="color:var(--muted); font-size:13px;">
                <input class="cv-page-input" id="pageInput" type="number" min="1" value="1" onchange="jumpPage(this.value)">
                / <span id="pageCount">?</span>
            </div>
            <button class="cv-nav-btn" onclick="goPage(1)" id="nextBtn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
        </div>

        <div style="display:flex; gap:10px;">
            <button class="cv-nav-btn" onclick="zoom(-0.1)">-</button>
            <button class="cv-nav-btn" onclick="zoom(0.1)">+</button>
        </div>
    </div>

    <div class="cv-loading" id="loader">
        <div class="cv-spinner"></div>
        <div style="color: var(--muted); font-size: 13px;">Loading comic...</div>
    </div>

    <div class="cv-scroll" id="scrollArea">
        <canvas id="pdfCanvas"></canvas>
    </div>
</div>
@endsection

@section('scripts')
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
<script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    const url = "{{ route('comics.serve', $comic) }}";
    let pdfDoc = null,
        pageNum = 1,
        pageRendering = false,
        pageNumPending = null,
        scale = 1.0,
        canvas = document.getElementById('pdfCanvas'),
        ctx = canvas.getContext('2d');

    function renderPage(num) {
        pageRendering = true;
        pdfDoc.getPage(num).then(function(page) {
            const viewport = page.getViewport({
                scale: scale
            });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            const renderTask = page.render(renderContext);

            renderTask.promise.then(function() {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });
        document.getElementById('pageInput').value = num;
        document.getElementById('prevBtn').disabled = (num <= 1);
        document.getElementById('nextBtn').disabled = (num >= pdfDoc.numPages);
    }

    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    window.goPage = function(dir) {
        if (pdfDoc && pageNum + dir >= 1 && pageNum + dir <= pdfDoc.numPages) {
            pageNum += dir;
            queueRenderPage(pageNum);
        }
    };

    window.jumpPage = function(val) {
        const num = parseInt(val);
        if (pdfDoc && num >= 1 && num <= pdfDoc.numPages) {
            pageNum = num;
            queueRenderPage(pageNum);
        }
    };

    window.zoom = function(delta) {
        scale = Math.max(0.5, Math.min(3.0, scale + delta));
        queueRenderPage(pageNum);
    };

    pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
        pdfDoc = pdfDoc_;
        document.getElementById('pageCount').textContent = pdfDoc.numPages;
        document.getElementById('loader').style.display = 'none';
        renderPage(pageNum);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') goPage(-1);
        if (e.key === 'ArrowRight') goPage(1);
    });
</script>
@endsection