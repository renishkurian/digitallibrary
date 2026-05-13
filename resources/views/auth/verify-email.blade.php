<x-guest-layout>
    <div class="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
        <header class="mb-6">
            <h1 class="font-['Bebas_Neue'] text-4xl tracking-[4px] text-white sm:text-[42px]">
                Verify <span class="text-[#e8003d]">email</span>
            </h1>
            <p class="mt-3 text-[15px] leading-relaxed text-[#8a8aae]">
                {{ __('Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn\'t receive the email, we will gladly send you another.') }}
            </p>
        </header>

        @if (session('status') == 'verification-link-sent')
            <div class="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {{ __('A new verification link has been sent to the email address you provided during registration.') }}
            </div>
        @endif

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <form method="POST" action="{{ route('verification.send') }}">
                @csrf
                <button
                    type="submit"
                    class="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl bg-[#e8003d] px-6 py-3 text-[13px] font-semibold uppercase tracking-[1.5px] text-white shadow-[0_8px_32px_rgba(232,0,61,0.35)] transition hover:bg-[#ff0a4a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:w-auto"
                >
                    {{ __('Resend Verification Email') }}
                </button>
            </form>

            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button
                    type="submit"
                    class="w-full rounded-lg px-4 py-3 text-[14px] font-medium text-[#7070a0] transition hover:bg-white/[0.05] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] sm:w-auto"
                >
                    {{ __('Log Out') }}
                </button>
            </form>
        </div>
    </div>
</x-guest-layout>
