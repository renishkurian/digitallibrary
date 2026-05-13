<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#05050a">

    <title>{{ config('app.name', 'ComicVault') }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet">

    @vite(['resources/js/guest.js'])
</head>
<body class="min-h-dvh bg-[#05050a] text-[#f0f0f5] antialiased selection:bg-[#e8003d]/25 selection:text-white">
    <a href="#auth-main" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-[#e8003d] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg">
        Skip to form
    </a>

    <div class="relative flex min-h-dvh flex-col lg:grid lg:min-h-0 lg:grid-cols-[1fr_minmax(320px,440px)] lg:grid-rows-1">
        {{-- Ambient background --}}
        <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
            <div class="absolute -left-[20%] top-[-10%] h-[50vmin] w-[50vmin] rounded-full bg-[#e8003d]/[0.07] blur-[100px]"></div>
            <div class="absolute -right-[15%] bottom-[10%] h-[45vmin] w-[45vmin] rounded-full bg-indigo-600/[0.06] blur-[90px]"></div>
            <div class="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_24px] opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"></div>
        </div>

        {{-- Brand column --}}
        <aside class="relative hidden flex-col justify-between border-b border-white/[0.06] bg-gradient-to-br from-[#0c0c14] via-[#07070f] to-[#05050a] px-10 py-12 lg:flex lg:border-b-0 lg:border-r lg:py-14 lg:pl-14 lg:pr-10">
            <div>
                <a href="{{ url('/') }}" class="inline-flex items-center gap-3 no-underline outline-none ring-offset-2 ring-offset-[#07070f] focus-visible:ring-2 focus-visible:ring-[#e8003d] rounded-lg">
                    <span class="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#e8003d] shadow-[0_4px_24px_rgba(232,0,61,0.35)]">
                        <svg class="h-[18px] w-[18px] text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M21 4H3C1.9 4 1 4.9 1 6v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-10 3h8v2h-8V7zm0 4h8v2h-8v-2zm0 4h5v2h-5v-2zM5 7h3v9H5V7z"/>
                        </svg>
                    </span>
                    <span class="font-['Bebas_Neue'] text-[32px] tracking-[3px] text-white">
                        Comic<span class="text-[#e8003d] drop-shadow-[0_0_10px_rgba(232,0,61,0.35)]">Vault</span>
                    </span>
                </a>
                <p class="mt-10 max-w-[340px] text-[15px] leading-relaxed text-[#8a8aae]">
                    Your personal digital library for comics and magazines. Sign in to continue reading, sync shelves, and track your progress.
                </p>
            </div>
            <p class="text-[12px] text-[#4a4a6a]">
                &copy; {{ date('Y') }} {{ config('app.name', 'ComicVault') }}
            </p>
        </aside>

        {{-- Mobile logo strip --}}
        <div class="relative flex shrink-0 items-center justify-center border-b border-white/[0.06] bg-[#07070f]/80 px-6 py-5 backdrop-blur-md lg:hidden">
            <a href="{{ url('/') }}" class="inline-flex items-center gap-2.5 no-underline">
                <span class="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#e8003d] shadow-[0_2px_16px_rgba(232,0,61,0.35)]">
                    <svg class="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M21 4H3C1.9 4 1 4.9 1 6v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-10 3h8v2h-8V7zm0 4h8v2h-8v-2zm0 4h5v2h-5v-2zM5 7h3v9H5V7z"/>
                    </svg>
                </span>
                <span class="font-['Bebas_Neue'] text-[28px] tracking-[2px] text-white">
                    Comic<span class="text-[#e8003d]">Vault</span>
                </span>
            </a>
        </div>

        {{-- Form column --}}
        <main id="auth-main" class="relative flex flex-1 flex-col justify-center px-5 py-10 sm:px-10 lg:py-14">
            <div class="mx-auto w-full max-w-[400px]">
                {{ $slot }}
            </div>
        </main>
    </div>
</body>
</html>
