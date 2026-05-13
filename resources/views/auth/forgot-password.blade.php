<x-guest-layout>
    <div class="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
        <header class="mb-6">
            <h1 class="font-['Bebas_Neue'] text-4xl tracking-[4px] text-white sm:text-[42px]">
                Reset <span class="text-[#e8003d]">password</span>
            </h1>
            <p class="mt-3 text-[15px] leading-relaxed text-[#8a8aae]">
                {{ __('Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.') }}
            </p>
        </header>

        <x-auth-session-status class="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100" :status="session('status')" />

        <form method="POST" action="{{ route('password.email') }}" class="space-y-6" novalidate>
            @csrf

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
                    class="mt-2 block w-full min-h-[48px] rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-[16px] text-white placeholder:text-[#5a5a7a] focus:border-[#e8003d]/60 focus:outline-none focus:ring-2 focus:ring-[#e8003d]/35 sm:text-[15px]"
                />
                <x-input-error :messages="$errors->get('email')" class="mt-2" />
            </div>

            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <a
                    href="{{ route('login') }}"
                    class="text-center text-[14px] font-medium text-[#7070a0] transition hover:text-white focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#e8003d] sm:text-left"
                >
                    ← {{ __('Log in') }}
                </a>
                <button
                    type="submit"
                    class="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl bg-[#e8003d] px-4 py-3 text-[13px] font-semibold uppercase tracking-[1.5px] text-white shadow-[0_8px_32px_rgba(232,0,61,0.35)] transition hover:bg-[#ff0a4a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12] sm:w-auto"
                >
                    {{ __('Email Password Reset Link') }}
                </button>
            </div>
        </form>
    </div>
</x-guest-layout>
