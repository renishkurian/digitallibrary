<x-guest-layout>
    <div class="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
        <header class="mb-8">
            <h1 class="font-['Bebas_Neue'] text-4xl tracking-[4px] text-white sm:text-[42px]">
                Join <span class="text-[#e8003d]">ComicVault</span>
            </h1>
            <p class="mt-2 text-[15px] leading-relaxed text-[#8a8aae]">
                Create an account to sync your library, shelves, and reading progress.
            </p>
        </header>

        <form method="POST" action="{{ route('register') }}" class="space-y-5" novalidate>
            @csrf

            <div>
                <label for="name" class="block text-[13px] font-semibold tracking-wide text-[#c8c8e0]">{{ __('Name') }}</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    value="{{ old('name') }}"
                    required
                    autofocus
                    autocomplete="name"
                    class="mt-2 block w-full min-h-[48px] rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-[16px] text-white placeholder:text-[#5a5a7a] focus:border-[#e8003d]/60 focus:outline-none focus:ring-2 focus:ring-[#e8003d]/35 sm:text-[15px]"
                />
                <x-input-error :messages="$errors->get('name')" class="mt-2" />
            </div>

            <div>
                <label for="email" class="block text-[13px] font-semibold tracking-wide text-[#c8c8e0]">{{ __('Email') }}</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value="{{ old('email') }}"
                    required
                    autocomplete="username"
                    inputmode="email"
                    class="mt-2 block w-full min-h-[48px] rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-[16px] text-white placeholder:text-[#5a5a7a] focus:border-[#e8003d]/60 focus:outline-none focus:ring-2 focus:ring-[#e8003d]/35 sm:text-[15px]"
                />
                <x-input-error :messages="$errors->get('email')" class="mt-2" />
            </div>

            <div>
                <label for="password" class="block text-[13px] font-semibold tracking-wide text-[#c8c8e0]">{{ __('Password') }}</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autocomplete="new-password"
                    class="mt-2 block w-full min-h-[48px] rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-[16px] text-white placeholder:text-[#5a5a7a] focus:border-[#e8003d]/60 focus:outline-none focus:ring-2 focus:ring-[#e8003d]/35 sm:text-[15px]"
                />
                <x-input-error :messages="$errors->get('password')" class="mt-2" />
            </div>

            <div>
                <label for="password_confirmation" class="block text-[13px] font-semibold tracking-wide text-[#c8c8e0]">{{ __('Confirm Password') }}</label>
                <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    required
                    autocomplete="new-password"
                    class="mt-2 block w-full min-h-[48px] rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-[16px] text-white placeholder:text-[#5a5a7a] focus:border-[#e8003d]/60 focus:outline-none focus:ring-2 focus:ring-[#e8003d]/35 sm:text-[15px]"
                />
                <x-input-error :messages="$errors->get('password_confirmation')" class="mt-2" />
            </div>

            <div class="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <a
                    href="{{ route('login') }}"
                    class="text-center text-[14px] font-medium text-[#7070a0] transition hover:text-white focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12] sm:text-left"
                >
                    {{ __('Already registered?') }}
                </a>
                <button
                    type="submit"
                    class="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl bg-[#e8003d] px-6 py-3 text-[14px] font-semibold uppercase tracking-[2px] text-white shadow-[0_8px_32px_rgba(232,0,61,0.35)] transition hover:bg-[#ff0a4a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12] active:scale-[0.99] sm:w-auto"
                >
                    {{ __('Register') }}
                </button>
            </div>
        </form>
    </div>
</x-guest-layout>
