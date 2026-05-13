<x-guest-layout>
    <div class="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
        <header class="mb-8">
            <h1 class="font-['Bebas_Neue'] text-4xl tracking-[4px] text-white sm:text-[42px]">
                Confirm <span class="text-[#e8003d]">access</span>
            </h1>
            <p class="mt-3 text-[15px] leading-relaxed text-[#8a8aae]">
                {{ __('This is a secure area of the application. Please confirm your password before continuing.') }}
            </p>
        </header>

        <form method="POST" action="{{ route('password.confirm') }}" class="space-y-6" novalidate>
            @csrf

            <div>
                <label for="password" class="block text-[13px] font-semibold tracking-wide text-[#c8c8e0]">{{ __('Password') }}</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autocomplete="current-password"
                    class="mt-2 block w-full min-h-[48px] rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-[16px] text-white placeholder:text-[#5a5a7a] focus:border-[#e8003d]/60 focus:outline-none focus:ring-2 focus:ring-[#e8003d]/35 sm:text-[15px]"
                />
                <x-input-error :messages="$errors->get('password')" class="mt-2" />
            </div>

            <div class="flex justify-end">
                <button
                    type="submit"
                    class="flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl bg-[#e8003d] px-8 py-3 text-[14px] font-semibold uppercase tracking-[2px] text-white shadow-[0_8px_32px_rgba(232,0,61,0.35)] transition hover:bg-[#ff0a4a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12]"
                >
                    {{ __('Confirm') }}
                </button>
            </div>
        </form>
    </div>
</x-guest-layout>
