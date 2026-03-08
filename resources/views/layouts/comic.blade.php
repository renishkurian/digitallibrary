<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>{{ $title ?? 'ComicVault' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --bg: #0a0a0f;
            --surface: #111118;
            --card: #16161f;
            --accent: #e8003d;
            --accent2: #ff6b35;
            --text: #f0f0f5;
            --muted: #8888a0;
            --border: rgba(255, 255, 255, 0.07);
            --glow: rgba(232, 0, 61, 0.35);
            --font-display: 'Bebas Neue', sans-serif;
            --font-body: 'DM Sans', sans-serif;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: var(--font-body);
            font-weight: 300;
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* ── SCROLLBAR ── */
        ::-webkit-scrollbar {
            width: 4px;
        }

        ::-webkit-scrollbar-track {
            background: var(--bg);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--accent);
            border-radius: 2px;
        }

        /* ── HEADER ── */
        header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 40px;
            height: 64px;
            background: linear-gradient(180deg, rgba(10, 10, 15, 0.98) 0%, rgba(10, 10, 15, 0.0) 100%);
            backdrop-filter: blur(8px);
            transition: background 0.3s;
        }

        header.scrolled {
            background: rgba(10, 10, 15, 0.97);
            border-bottom: 1px solid var(--border);
        }

        .logo {
            font-family: var(--font-display);
            font-size: 28px;
            letter-spacing: 3px;
            color: var(--text);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .logo span {
            color: var(--accent);
            filter: drop-shadow(0 0 8px var(--glow));
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .search-wrap {
            position: relative;
            display: flex;
            align-items: center;
        }

        .search-wrap svg {
            position: absolute;
            left: 12px;
            color: var(--muted);
            pointer-events: none;
        }

        .search-wrap input {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid var(--border);
            color: var(--text);
            font-family: var(--font-body);
            font-size: 14px;
            padding: 9px 16px 9px 38px;
            border-radius: 8px;
            width: 260px;
            outline: none;
            transition: border-color 0.2s, background 0.2s, width 0.3s;
        }

        .search-wrap input::placeholder {
            color: var(--muted);
        }

        .search-wrap input:focus {
            border-color: var(--accent);
            background: rgba(255, 255, 255, 0.1);
            width: 320px;
        }

        .auth-links {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .auth-link {
            font-size: 13px;
            color: var(--muted);
            text-decoration: none;
            transition: color 0.2s;
        }

        .auth-link:hover {
            color: var(--text);
        }

        .badge {
            background: var(--accent);
            color: #fff;
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            padding: 5px 12px;
            border-radius: 5px;
            border: none;
        }

        main {
            padding: 80px 40px 60px;
        }

        /* ── PAGINATION ── */
        .pagination {
            margin-top: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            font-family: var(--font-body);
        }

        .pagination svg {
            width: 20px;
            height: 20px;
            display: inline-block;
            vertical-align: middle;
        }

        .pagination nav>div:first-child {
            display: none;
            /* Hide the 'Showing X to Y' on mobile-ish views if it's messy */
        }

        /* Standard Laravel Pagination styling for a premium look */
        .pagination a,
        .pagination span {
            color: var(--muted);
            text-decoration: none;
            transition: all 0.2s;
        }

        .pagination a:hover {
            color: var(--accent);
        }

        .pagination .active,
        .pagination span[aria-current="page"] {
            color: var(--text);
            font-weight: 500;
        }

        @yield('styles')
    </style>
</head>

<body>

    <header id="mainHeader">
        <a href="{{ route('comics.index') }}" class="logo">Comic<span>Vault</span></a>
        <div class="header-right">
            <form class="search-wrap" method="get" action="{{ route('comics.index') }}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    name="q"
                    type="search"
                    placeholder="Search comics..."
                    value="{{ request('q') }}"
                    autocomplete="off">
            </form>

            <div class="auth-links">
                @auth
                <a href="{{ route('dashboard') }}" class="auth-link">Dashboard</a>
                @if(Auth::user()->is_admin)
                <a href="{{ route('admin.comics.index') }}" class="auth-link">Admin</a>
                @endif
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="auth-link" style="background:none;border:none;cursor:pointer;">Logout</button>
                </form>
                @else
                <a href="{{ route('login') }}" class="auth-link">Login</a>
                <a href="{{ route('register') }}" class="auth-link">Register</a>
                @endauth
            </div>
        </div>
    </header>

    @yield('content')

    <script>
        const header = document.getElementById('mainHeader');
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 20);
        });
    </script>
    @yield('scripts')
</body>

</html>