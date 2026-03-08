@extends('layouts.comic')

@section('styles')
<style>
    /* Hero Section */
    .hero {
        position: relative;
        height: 520px;
        display: flex;
        align-items: flex-end;
        padding: 60px;
        overflow: hidden;
        margin-top: -80px;
        /* Offset the main padding */
    }

    /* Grid and Cards from original index.php */
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 20px;
        margin-top: 30px;
    }

    .card {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        background: var(--card);
        aspect-ratio: 2/3;
        transition: transform 0.3s, box-shadow 0.3s;
        text-decoration: none;
        border: 1px solid var(--border);
    }

    .card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
    }

    .card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(10, 10, 15, 0.95) 0%, transparent 60%);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 15px;
    }

    .card-title {
        font-size: 14px;
        font-weight: 500;
        color: #fff;
        margin-bottom: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .card-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .read-status {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 2px 6px;
        border-radius: 4px;
    }

    .status-read {
        background: rgba(0, 255, 136, 0.2);
        color: #00ff88;
    }

    .status-unread {
        background: rgba(232, 0, 61, 0.2);
        color: var(--accent);
    }

    .filters {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        align-items: center;
    }

    .filter-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border);
        color: var(--muted);
        padding: 6px 16px;
        border-radius: 20px;
        text-decoration: none;
        font-size: 13px;
        transition: all 0.2s;
    }

    .filter-btn.active {
        background: var(--accent);
        color: #fff;
        border-color: var(--accent);
    }

    .pagination {
        margin-top: 40px;
        display: flex;
        justify-content: center;
    }

    .card-actions {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 5;
        display: flex;
        gap: 5px;
    }

    .action-btn {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
    }

    .action-btn:hover {
        background: var(--accent);
    }

    .action-btn.is-read {
        color: #00ff88;
    }
</style>
@endsection

@section('content')
<main>
    <div class="filters-header">
        <h2 style="font-family: var(--font-display); font-size: 32px; letter-spacing: 2px; margin-bottom: 10px;">
            ALL <span>COMICS</span>
        </h2>

        <div class="filters">
            <a href="{{ route('comics.index', array_merge(request()->all(), ['status' => null])) }}"
                class="filter-btn {{ !request('status') ? 'active' : '' }}">ALL</a>
            @auth
            <a href="{{ route('comics.index', array_merge(request()->all(), ['status' => 'unread'])) }}"
                class="filter-btn {{ request('status') === 'unread' ? 'active' : '' }}">UNREAD</a>
            <a href="{{ route('comics.index', array_merge(request()->all(), ['status' => 'read'])) }}"
                class="filter-btn {{ request('status') === 'read' ? 'active' : '' }}">READ</a>
            @endauth
        </div>
    </div>

    @if($comics->isEmpty())
    <div style="text-align: center; padding: 100px; color: var(--muted);">
        <h3>No comics found.</h3>
        @if(Auth::check() && Auth::user()->is_admin)
        <p>Try syncing your library or uploading a new PDF.</p>
        @endif
    </div>
    @else
    <div class="grid">
        @foreach($comics as $comic)
        <div class="card-wrap" style="position: relative;">
            <a href="{{ route('comics.show', $comic) }}" class="card">
                @if($comic->thumbnail)
                <img src="{{ asset('thumbs/' . $comic->thumbnail) }}" alt="{{ $comic->title }}">
                @else
                <div style="width: 100%; height: 100%; background: #1a1a26; display: flex; align-items: center; justify-content: center; color: var(--muted);">
                    📖
                </div>
                @endif

                <div class="card-overlay">
                    <div class="card-title">{{ $comic->title }}</div>
                    <div class="card-meta">
                        @auth
                        @if($comic->isReadBy(Auth::user()))
                        <span class="read-status status-read">READ</span>
                        @else
                        <span class="read-status status-unread">UNREAD</span>
                        @endif
                        @endauth
                    </div>
                </div>
            </a>

            @auth
            <div class="card-actions">
                <form action="{{ route('comics.toggle-read', $comic) }}" method="POST">
                    @csrf
                    <button type="submit" class="action-btn {{ $comic->isReadBy(Auth::user()) ? 'is-read' : '' }}" title="Toggle Read Status">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>
                </form>
                @if(Auth::user()->is_admin)
                <form action="{{ route('admin.comics.toggle-visibility', $comic) }}" method="POST">
                    @csrf
                    <button type="submit" class="action-btn" title="Toggle Visibility">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            @if($comic->is_hidden)
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                            @else
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                            @endif
                        </svg>
                    </button>
                </form>
                @endif
            </div>
            @endauth
        </div>
        @endforeach
    </div>

    <div class="pagination">
        {{ $comics->links() }}
    </div>
    @endif
</main>
@endsection