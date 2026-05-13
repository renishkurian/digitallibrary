import { useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Sparkles,
} from 'lucide-react';

/** Shared glass surface — backdrop blur + frosted fill (ComicVault dark) */
const glassPanel = 'rounded-2xl border border-white/[0.12] bg-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl';
const glassInset = 'rounded-xl border border-white/[0.08] bg-black/25 backdrop-blur-md';
const glassInteractive =
    'transition-all duration-200 hover:border-[#e8003d]/35 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]';

export default function Calendar({ comicsByDate, month, year, auth, magazines, currentShelfId }) {
    const currentMonth = parseInt(month, 10);
    const currentYear = parseInt(year, 10);

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();

    const monthNames = useMemo(
        () => [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ],
        []
    );

    const navigate = (params) => {
        router.get(route('comics.calendar'), params, { preserveScroll: true });
    };

    const handlePreviousMonth = () => {
        let newMonth = currentMonth - 1;
        let newYear = currentYear;
        if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }
        navigate({ month: newMonth, year: newYear, shelf: currentShelfId || undefined });
    };

    const handleNextMonth = () => {
        let newMonth = currentMonth + 1;
        let newYear = currentYear;
        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        }
        navigate({ month: newMonth, year: newYear, shelf: currentShelfId || undefined });
    };

    const handleToday = () => {
        const today = new Date();
        navigate({
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            shelf: currentShelfId || undefined,
        });
    };

    const shelfChange = (value) => {
        navigate({
            month: currentMonth,
            year: currentYear,
            shelf: value || undefined,
        });
    };

    const monthChange = (value) => {
        navigate({ month: parseInt(value, 10), year: currentYear, shelf: currentShelfId || undefined });
    };

    const yearChange = (value) => {
        navigate({ month: currentMonth, year: parseInt(value, 10), shelf: currentShelfId || undefined });
    };

    const yearOptions = useMemo(() => {
        const end = new Date().getFullYear() + 2;
        const out = [];
        for (let y = 1950; y <= end; y++) out.push(y);
        return out;
    }, []);

    const renderDays = () => {
        const days = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(
                <div
                    key={`empty-${i}`}
                    className={`min-h-[104px] sm:min-h-[128px] rounded-xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm ${glassInset} opacity-50`}
                    aria-hidden
                />
            );
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayComics = comicsByDate[dateStr] || [];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div
                    key={d}
                    className={`group/cell relative flex min-h-[104px] flex-col overflow-hidden rounded-xl border transition-all duration-200 sm:min-h-[128px] ${glassPanel} ${
                        isToday
                            ? 'border-[#e8003d]/50 bg-[#e8003d]/[0.08] shadow-[0_0_0_1px_rgba(232,0,61,0.25),0_12px_40px_rgba(232,0,61,0.12)] ring-1 ring-[#e8003d]/30'
                            : 'border-white/[0.1] bg-white/[0.05] hover:border-white/[0.18] hover:bg-white/[0.07]'
                    }`}
                >
                    <div
                        className={`flex items-center justify-between gap-2 px-2.5 py-2 sm:px-3 ${
                            isToday ? 'bg-[#e8003d]/15' : 'bg-black/20'
                        }`}
                    >
                        <span
                            className={`font-['Bebas_Neue',sans-serif] text-lg leading-none tracking-wider tabular-nums sm:text-xl ${
                                isToday ? 'text-white' : 'text-[#c8c8dc]'
                            }`}
                        >
                            {d}
                        </span>
                        {isToday && (
                            <span className="rounded-md border border-[#e8003d]/40 bg-black/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#ff8aa0] backdrop-blur-sm">
                                Today
                            </span>
                        )}
                    </div>

                    <div className="flex max-h-[140px] flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-2 pt-0.5 sm:px-2.5 [scrollbar-color:rgba(232,0,61,0.35)_transparent] [scrollbar-width:thin]">
                        {dayComics.map((comic) => (
                            <Link
                                href={route('comics.show', comic.id)}
                                key={comic.id}
                                className={`flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/30 p-1.5 ${glassInteractive} motion-safe:transition-transform motion-safe:hover:scale-[1.01]`}
                            >
                                <div className="h-10 w-8 shrink-0 overflow-hidden rounded-md border border-white/10 bg-[#0a0a12] shadow-inner">
                                    {comic.thumbnail ? (
                                        <img
                                            src={`/thumbs/${comic.thumbnail}`}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[8px] font-bold uppercase text-[#4a4a5c]">
                                            —
                                        </div>
                                    )}
                                </div>
                                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight text-[#d4d4e8] motion-safe:group-hover/cell:text-white">
                                    {comic.title}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    return (
        <ComicLayout auth={auth}>
            <Head title="Release calendar" />

            <div className="relative pb-16">
                {/* Ambient backdrop for glass (blur reads against this) */}
                <div
                    className="pointer-events-none fixed inset-0 -z-10 opacity-90"
                    aria-hidden
                    style={{
                        background:
                            'radial-gradient(1200px 600px at 15% -10%, rgba(232,0,61,0.18), transparent 55%), radial-gradient(900px 500px at 95% 20%, rgba(99,102,241,0.12), transparent 50%), radial-gradient(800px 450px at 50% 110%, rgba(232,0,61,0.08), transparent 45%), #05050a',
                    }}
                />
                <div
                    className="pointer-events-none fixed inset-0 -z-10 opacity-[0.12]"
                    aria-hidden
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)`,
                        backgroundSize: '14px 14px',
                    }}
                />

                <div className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
                    {/* Masthead */}
                    <header className={`mb-6 p-5 sm:p-8 ${glassPanel}`}>
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#e8003d]/35 bg-[#e8003d]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                                    <CalendarIcon className="h-7 w-7 text-[#ff6b8a]" strokeWidth={1.75} aria-hidden />
                                </div>
                                <div>
                                    <p className="mb-1.5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#e8003d]">
                                        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                                        ComicVault
                                    </p>
                                    <h1
                                        className="text-[clamp(1.75rem,4vw,2.25rem)] leading-none tracking-[0.08em] text-white"
                                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                    >
                                        Release{' '}
                                        <span className="bg-gradient-to-r from-[#ff6b8a] to-[#e8003d] bg-clip-text text-transparent">
                                            calendar
                                        </span>
                                    </h1>
                                    <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#8888a0]">
                                        New issues by the date they landed in the vault. Filter by stack, skim the month,
                                        jump to today.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                                <label className="sr-only" htmlFor="calendar-shelf">
                                    Filter by magazine or shelf
                                </label>
                                <div className="relative min-w-[200px] flex-1 sm:flex-initial sm:min-w-[220px]">
                                    <select
                                        id="calendar-shelf"
                                        value={currentShelfId || ''}
                                        onChange={(e) => shelfChange(e.target.value)}
                                        className={`w-full min-h-[44px] cursor-pointer appearance-none rounded-xl border border-white/[0.12] bg-black/30 py-2.5 pl-4 pr-10 text-[12px] font-semibold text-white shadow-inner backdrop-blur-md transition-colors hover:border-[#e8003d]/35 focus:border-[#e8003d]/50 focus:outline-none focus:ring-2 focus:ring-[#e8003d]/40`}
                                    >
                                        <option value="">All magazines</option>
                                        {magazines.map((mag) => (
                                            <option key={mag.id} value={mag.id}>
                                                {mag.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6868a0]"
                                        strokeWidth={2}
                                        aria-hidden
                                    />
                                </div>

                                <div
                                    className={`inline-flex min-h-[44px] flex-wrap items-center gap-1 rounded-xl border border-white/[0.1] bg-black/30 p-1 backdrop-blur-md sm:flex-nowrap`}
                                >
                                    <button
                                        type="button"
                                        onClick={handlePreviousMonth}
                                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent text-[#c8c8dc] ${glassInteractive}`}
                                        aria-label="Previous month"
                                    >
                                        <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                                    </button>

                                    <label className="sr-only" htmlFor="calendar-month">
                                        Month
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="calendar-month"
                                            value={currentMonth}
                                            onChange={(e) => monthChange(e.target.value)}
                                            className="min-h-[40px] cursor-pointer appearance-none rounded-lg border border-white/[0.08] bg-transparent py-2 pl-3 pr-8 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-[#e8003d]/50"
                                        >
                                            {monthNames.map((name, i) => (
                                                <option key={name} value={i + 1} className="bg-[#12121a] text-white">
                                                    {name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6868a0]"
                                            strokeWidth={2}
                                            aria-hidden
                                        />
                                    </div>

                                    <label className="sr-only" htmlFor="calendar-year">
                                        Year
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="calendar-year"
                                            value={currentYear}
                                            onChange={(e) => yearChange(e.target.value)}
                                            className="min-h-[40px] w-[4.5rem] cursor-pointer appearance-none rounded-lg border border-white/[0.08] bg-transparent py-2 pl-2 pr-7 text-[11px] font-black uppercase tracking-widest text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#e8003d]/50"
                                        >
                                            {yearOptions.map((y) => (
                                                <option key={y} value={y} className="bg-[#12121a] text-white">
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6868a0]"
                                            strokeWidth={2}
                                            aria-hidden
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleNextMonth}
                                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent text-[#c8c8dc] ${glassInteractive}`}
                                        aria-label="Next month"
                                    >
                                        <ChevronRight className="h-5 w-5" strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Weekday strip */}
                    <div className={`mb-3 grid grid-cols-7 gap-2 sm:gap-3 ${glassPanel} px-2 py-3 sm:px-4`}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div
                                key={day}
                                className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#6a6a82] sm:text-[11px]"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-2 sm:gap-3">{renderDays()}</div>

                    <div className="mt-8 flex justify-center">
                        <button
                            type="button"
                            onClick={handleToday}
                            className="min-h-[44px] rounded-xl border border-[#e8003d]/35 bg-[#e8003d]/15 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#ffc8d4] backdrop-blur-sm transition-all hover:bg-[#e8003d]/25 hover:shadow-[0_8px_32px_rgba(232,0,61,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]"
                        >
                            Jump to today
                        </button>
                    </div>
                </div>
            </div>
        </ComicLayout>
    );
}
