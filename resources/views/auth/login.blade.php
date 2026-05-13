<x-guest-layout>
    <div class="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
        <x-auth-session-status class="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100" :status="session('status')" />

        <header class="mb-8">
            <h1 class="font-['Bebas_Neue'] text-4xl tracking-[4px] text-white sm:text-[42px]">
                Sign <span class="text-[#e8003d]">in</span>
            </h1>
            <p class="mt-2 text-[15px] leading-relaxed text-[#8a8aae]">
                Enter your account email and password to access your library.
            </p>
        </header>

        <form method="POST" action="{{ route('login') }}" class="space-y-6" novalidate>
            @csrf

            {{-- Email --}}
            <div>
                <label for="email" class="block text-[13px] font-semibold tracking-wide text-[#c8c8e0]">{{ __('Email') }}</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value="{{ old('email') }}"
                    required
                    autofocus
                    autocomplete="username"
                    inputmode="email"
                    class="mt-2 block w-full min-h-[48px] rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-[16px] leading-tight text-white shadow-inner placeholder:text-[#5a5a7a] transition-colors duration-200 focus:border-[#e8003d]/60 focus:outline-none focus:ring-2 focus:ring-[#e8003d]/35 sm:text-[15px]"
                    placeholder="you@example.com"
                />
                <x-input-error :messages="$errors->get('email')" class="mt-2" />
            </div>

            {{-- Password --}}
            <div>
                <div class="flex flex-wrap items-end justify-between gap-2">
                    <label for="password" class="block text-[13px] font-semibold tracking-wide text-[#c8c8e0]">{{ __('Password') }}</label>
                    @if (Route::has('password.request'))
                        <a
                            class="text-[13px] font-medium text-[#e8003d] underline-offset-4 transition hover:text-[#ff5580] hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a10]"
                            href="{{ route('password.request') }}"
                        >
                            {{ __('Forgot password?') }}
                        </a>
                    @endif
                </div>
                <div class="relative mt-2">
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autocomplete="current-password"
                        class="block w-full min-h-[48px] rounded-xl border border-white/[0.1] bg-white/[0.05] py-3 pl-4 pr-12 text-[16px] leading-tight text-white shadow-inner placeholder:text-[#5a5a7a] transition-colors duration-200 focus:border-[#e8003d]/60 focus:outline-none focus:ring-2 focus:ring-[#e8003d]/35 sm:text-[15px]"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        id="toggle-password"
                        class="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[#8a8aae] transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d]"
                        aria-label="Show password"
                        aria-pressed="false"
                    >
                        {{-- eye --}}
                        <svg class="eye-open h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {{-- eye-off --}}
                        <svg class="eye-off hidden h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    </button>
                </div>
                <x-input-error :messages="$errors->get('password')" class="mt-2" />
            </div>

            {{-- Remember --}}
            <div class="flex items-center gap-3">
                <input
                    id="remember_me"
                    name="remember"
                    type="checkbox"
                    class="h-5 w-5 shrink-0 rounded-md border border-white/20 bg-white/[0.06] text-[#e8003d] accent-[#e8003d] focus:outline-none focus:ring-2 focus:ring-[#e8003d]/50 focus:ring-offset-2 focus:ring-offset-[#0a0a12]"
                />
                <label for="remember_me" class="cursor-pointer select-none text-[14px] text-[#a0a0c8]">
                    {{ __('Remember this device') }}
                </label>
            </div>

            <button
                type="submit"
                class="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl bg-[#e8003d] px-4 py-3 text-[14px] font-semibold uppercase tracking-[2px] text-white shadow-[0_8px_32px_rgba(232,0,61,0.35)] transition hover:bg-[#ff0a4a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12] active:scale-[0.99]"
            >
                {{ __('Log in') }}
            </button>
        </form>

        @if (Route::has('register'))
            <p class="mt-8 text-center text-[14px] text-[#7070a0]">
                Don&apos;t have an account?
                <a
                    href="{{ route('register') }}"
                    class="ml-1 font-semibold text-[#e8003d] underline-offset-4 transition hover:text-[#ff6b8a] hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12]"
                >
                    {{ __('Register') }}
                </a>
            </p>
        @endif
    </div>

    <script>
        (function () {
            var btn = document.getElementById('toggle-password');
            var input = document.getElementById('password');
            if (!btn || !input) return;
            btn.addEventListener('click', function () {
                var show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                btn.setAttribute('aria-pressed', show ? 'true' : 'false');
                btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
                btn.querySelector('.eye-open').classList.toggle('hidden', show);
                btn.querySelector('.eye-off').classList.toggle('hidden', !show);
            });
        })();
    </script>
</x-guest-layout>
