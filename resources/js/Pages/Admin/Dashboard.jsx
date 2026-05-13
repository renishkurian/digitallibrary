import { Head, Link } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import DashboardBackground from '@/Components/DashboardBackground';
import { motion, useReducedMotion } from 'framer-motion';
import {
    Library,
    Lock,
    Users,
    BookOpen,
    Settings,
    Activity,
    FlaskConical,
    Key,
    ChevronRight,
    LayoutDashboard,
    ArrowRight,
    Calendar,
    BarChart3,
    Sparkles,
    BookMarked,
    Eye,
    EyeOff,
    Layers,
    Newspaper,
} from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1];

function useMotionVariants() {
    const reduce = useReducedMotion();
    if (reduce) {
        return {
            container: { hidden: { opacity: 1 }, visible: { opacity: 1 } },
            item: { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } },
        };
    }
    return {
        container: {
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: { staggerChildren: 0.07, delayChildren: 0.05 },
            },
        },
        item: {
            hidden: { opacity: 0, y: 18 },
            visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.38, ease: easeOut },
            },
        },
    };
}

function ComicPanel({ className = '', children }) {
    return (
        <div
            className={`relative overflow-hidden rounded-xl border-2 border-white/[0.12] bg-[#0c0c14]/85 shadow-[0_4px_0_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md ${className}`}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at center, rgba(255,255,255,0.12) 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                }}
            />
            <div className="relative">{children}</div>
        </div>
    );
}

function StatBadge({ icon: Icon, label, value, hint, accent }) {
    return (
        <ComicPanel className="p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] ${accent}`}
                >
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
                </div>
                <span
                    className="font-['Bebas_Neue'] text-[2.75rem] leading-none tracking-[0.02em] text-white tabular-nums"
                    aria-label={`${label}: ${value}`}
                >
                    {value}
                </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#5a5a7a]">{label}</p>
            {hint ? <p className="mt-1.5 text-[12px] leading-snug text-[#8a8aae]">{hint}</p> : null}
        </ComicPanel>
    );
}

function ActionTile({ href, icon: Icon, title, subtitle, variant = 'default' }) {
    const borderHover =
        variant === 'accent'
            ? 'hover:border-[#e8003d]/50 hover:shadow-[0_0_28px_rgba(232,0,61,0.12)]'
            : 'hover:border-white/20';
    return (
        <Link
            href={href}
            className={`group relative flex min-h-[100px] flex-col justify-between rounded-xl border-2 border-white/[0.1] bg-gradient-to-br from-white/[0.05] to-transparent p-4 transition-all duration-200 sm:min-h-[112px] sm:p-5 ${borderHover} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a]`}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-[#e8003d] transition-colors group-hover:bg-[#e8003d]/15">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
                </span>
                <ChevronRight
                    className="h-4 w-4 shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-[#e8003d]"
                    aria-hidden
                />
            </div>
            <div>
                <h3 className="font-['Bebas_Neue'] text-[17px] tracking-[0.12em] text-white transition-colors group-hover:text-[#ff6b8a] sm:text-lg">
                    {title}
                </h3>
                <p className="mt-0.5 text-[12px] leading-snug text-[#7070a0]">{subtitle}</p>
            </div>
        </Link>
    );
}

function ThumbPlaceholder() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#14141f] to-[#0a0a12] text-[#3a3a5a]">
            <BookMarked className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            <span className="text-[8px] font-bold uppercase tracking-wider">No art</span>
        </div>
    );
}

/** Shelf visibility — icon + text so status is never color-only (a11y). */
function VisibilityPill({ hidden }) {
    if (hidden) {
        return (
            <span className="inline-flex items-center gap-1 rounded-md border border-[#e8003d]/35 bg-[#e8003d]/12 px-2 py-1">
                <EyeOff className="h-3.5 w-3.5 shrink-0 text-[#ff9db8]" strokeWidth={2.2} aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#ffb8c8]">Hidden</span>
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2 py-1">
            <Eye className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.2} aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-200">Public</span>
        </span>
    );
}

export default function Dashboard({ auth, stats, recentComics }) {
    const v = useMotionVariants();
    const isAdmin = Boolean(auth?.user?.is_admin);
    const firstName = auth?.user?.name?.split(' ')[0] ?? 'Reader';

    const readerTiles = [
        {
            href: route('comics.index'),
            icon: Library,
            title: 'Library',
            subtitle: 'Browse every issue',
        },
        {
            href: route('shelves.index'),
            icon: BookOpen,
            title: 'Shelves',
            subtitle: 'Your curated stacks',
        },
        {
            href: route('comics.calendar'),
            icon: Calendar,
            title: 'Calendar',
            subtitle: 'Release timeline',
        },
        {
            href: route('reading-stats'),
            icon: BarChart3,
            title: 'Stats',
            subtitle: 'Reading analytics',
        },
    ];

    const adminTiles = [
        {
            href: route('admin.comics.index'),
            icon: Library,
            title: 'Archive',
            subtitle: 'Manage comics & PDFs',
        },
        {
            href: route('admin.users.index'),
            icon: Users,
            title: 'Readers',
            subtitle: 'Users & roles',
        },
        {
            href: route('admin.settings.index'),
            icon: Settings,
            title: 'Engine',
            subtitle: 'AI & system',
        },
        {
            href: route('admin.ai-logs.index'),
            icon: Activity,
            title: 'Logs',
            subtitle: 'Telemetry',
        },
        {
            href: route('admin.ai-playground.index'),
            icon: FlaskConical,
            title: 'Lab',
            subtitle: 'AI playground',
        },
        {
            href: route('admin.roles.index'),
            icon: Key,
            title: 'Access',
            subtitle: 'Roles & permissions',
        },
    ];

    return (
        <ComicLayout auth={auth}>
            <Head title={isAdmin ? 'Command desk' : 'Your desk'} />
            <DashboardBackground />

            <motion.div
                variants={v.container}
                initial="hidden"
                animate="visible"
                className="relative z-10 mx-auto flex max-w-[1360px] flex-col gap-8 pb-6 sm:gap-10 sm:pb-10"
            >
                {/* Masthead */}
                <motion.section variants={v.item}>
                    <ComicPanel className="p-6 sm:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e8003d]/30 bg-[#e8003d]/10 px-3 py-1">
                                    <Sparkles className="h-3.5 w-3.5 text-[#ff6b8a]" aria-hidden />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#ff8fab]">
                                        {isAdmin ? 'Publisher desk' : 'Reader desk'}
                                    </span>
                                </div>
                                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.35em] text-[#5a5a7a]">
                                    Vol. 01 — {new Date().getFullYear()} · Digital edition
                                </p>
                                <h1 className="font-['Bebas_Neue'] text-4xl tracking-[0.06em] text-white sm:text-5xl md:text-6xl">
                                    Hey, <span className="text-[#e8003d]">{firstName}</span>
                                </h1>
                                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#9a9ab8]">
                                    {isAdmin
                                        ? 'Command center for your vault — catalog health, readers, and the machinery behind the scenes.'
                                        : 'Your pull-list HQ — jump into the library, shelves, calendar, and your reading stats.'}
                                </p>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link
                                        href={route('comics.index')}
                                        className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#e8003d] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_8px_32px_rgba(232,0,61,0.35)] transition hover:bg-[#ff0a4a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                    >
                                        <Library className="h-4 w-4" aria-hidden />
                                        Open library
                                    </Link>
                                    {isAdmin ? (
                                        <Link
                                            href={route('admin.comics.index')}
                                            className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-white transition hover:border-white/25 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d]"
                                        >
                                            <LayoutDashboard className="h-4 w-4" aria-hidden />
                                            Admin archive
                                        </Link>
                                    ) : null}
                                </div>
                            </div>

                            <div className="shrink-0 lg:pl-6">
                                <div className="relative mx-auto w-[140px] rotate-2 sm:w-[168px]">
                                    <div className="absolute inset-0 rounded-lg border-2 border-dashed border-[#e8003d]/40" />
                                    <div className="relative rounded-lg border-2 border-white/20 bg-[#12121a] p-4 text-center shadow-xl">
                                        <p className="font-['Bebas_Neue'] text-2xl text-white">APPROVED</p>
                                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#e8003d]">
                                            Quality pass
                                        </p>
                                        <div className="mt-3 flex justify-center border-t border-white/10 pt-3">
                                            <div className="h-10 w-10 rounded-md border border-white/10 bg-[#e8003d]/20" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ComicPanel>
                </motion.section>

                {/* Pull list */}
                <motion.section variants={v.item} aria-labelledby="desk-section-reader">
                    <div className="mb-4 flex items-center gap-3 sm:mb-5">
                        <div className="h-1 w-8 rounded-full bg-[#e8003d]" />
                        <h2
                            id="desk-section-reader"
                            className="font-['Bebas_Neue'] text-xl tracking-[0.2em] text-white sm:text-2xl"
                        >
                            On your pull list
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {readerTiles.map((t) => (
                            <ActionTile key={t.href} {...t} variant="accent" />
                        ))}
                    </div>
                </motion.section>

                {/* Metrics */}
                <motion.section variants={v.item} aria-labelledby="desk-section-metrics">
                    <div className="mb-4 flex items-center gap-3 sm:mb-5">
                        <div className="h-1 w-8 rounded-full bg-amber-500/80" />
                        <h2
                            id="desk-section-metrics"
                            className="font-['Bebas_Neue'] text-xl tracking-[0.2em] text-white sm:text-2xl"
                        >
                            The numbers
                        </h2>
                    </div>
                    <div
                        className={`grid gap-4 ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}
                    >
                        <StatBadge
                            icon={Library}
                            label="Total issues"
                            value={stats.totalComics}
                            hint="Indexed in the vault"
                            accent="text-sky-400"
                        />
                        <StatBadge
                            icon={Lock}
                            label="Hidden bin"
                            value={stats.hiddenComics}
                            hint="Off public racks"
                            accent="text-[#ff6b8a]"
                        />
                        {isAdmin ? (
                            <StatBadge
                                icon={Users}
                                label="Readers"
                                value={stats.totalUsers}
                                hint="Accounts on file"
                                accent="text-emerald-400"
                            />
                        ) : null}
                        <StatBadge
                            icon={Activity}
                            label="Shelf talk"
                            value={stats.readEvents}
                            hint="Read events logged"
                            accent="text-violet-400"
                        />
                    </div>
                </motion.section>

                {/* Admin tools */}
                {isAdmin ? (
                    <motion.section variants={v.item} aria-labelledby="desk-section-admin">
                        <div className="mb-4 flex items-center gap-3 sm:mb-5">
                            <div className="h-1 w-8 rounded-full bg-violet-500/90" />
                            <h2
                                id="desk-section-admin"
                                className="font-['Bebas_Neue'] text-xl tracking-[0.2em] text-white sm:text-2xl"
                            >
                                Publisher tools
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                            {adminTiles.map((t) => (
                                <ActionTile key={t.href} {...t} />
                            ))}
                        </div>
                    </motion.section>
                ) : null}

                {/* Fresh on the stands — newsstand rack */}
                <motion.section variants={v.item} aria-labelledby="desk-section-recent">
                    <ComicPanel className="overflow-hidden">
                        {/* Masthead: comic-strip header + amber “print” accent */}
                        <div className="relative border-b-2 border-white/10">
                            <div
                                className="pointer-events-none absolute inset-0 opacity-25"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(circle at center, rgba(251,191,36,0.15) 1px, transparent 1px)',
                                    backgroundSize: '6px 6px',
                                }}
                            />
                            <div className="relative bg-gradient-to-r from-[#14100c]/95 via-[#0e0e18]/98 to-[#14100c]/95">
                                <div className="flex flex-col gap-6 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                                        {/* “Issue” badge */}
                                        <div className="relative shrink-0 self-start sm:self-center">
                                            <div
                                                className="absolute -inset-1 rotate-[-3deg] rounded-lg border-2 border-dashed border-amber-500/35"
                                                aria-hidden
                                            />
                                            <div className="relative flex h-[88px] w-[88px] flex-col items-center justify-center rounded-lg border-2 border-white/15 bg-[#12121a] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                                                <Newspaper
                                                    className="h-8 w-8 text-amber-400/90"
                                                    strokeWidth={1.8}
                                                    aria-hidden
                                                />
                                                <span className="mt-1 font-['Bebas_Neue'] text-[10px] tracking-[0.2em] text-amber-200/80">
                                                    NEW
                                                </span>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-amber-500/90">
                                                Newsstand · latest drops
                                            </p>
                                            <h2
                                                id="desk-section-recent"
                                                className="mt-1.5 font-['Bebas_Neue'] text-3xl leading-none tracking-[0.14em] text-white sm:text-4xl"
                                            >
                                                Fresh on the stands
                                            </h2>
                                            <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-[#8a8aae]">
                                                New covers hitting the vault—tap a row to open the issue or jump into
                                                editing from the archive.
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={isAdmin ? route('admin.comics.index') : route('comics.index')}
                                        className="inline-flex min-h-[48px] shrink-0 cursor-pointer items-center justify-center gap-2 self-stretch rounded-xl border border-[#e8003d]/40 bg-[#e8003d]/15 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffb8c8] transition hover:border-[#e8003d]/60 hover:bg-[#e8003d]/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8003d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a10] sm:self-center"
                                    >
                                        {isAdmin ? 'Full archive' : 'Browse all'}
                                        <ArrowRight className="h-4 w-4" aria-hidden />
                                    </Link>
                                </div>
                                <div
                                    className="h-[3px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
                                    aria-hidden
                                />
                            </div>
                        </div>

                        {recentComics.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-6 px-6 py-16 text-center sm:px-10">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                                    <BookMarked
                                        className="h-7 w-7 text-[#4a4a6a]"
                                        strokeWidth={1.5}
                                        aria-hidden
                                    />
                                </div>
                                <div>
                                    <p className="text-[16px] font-semibold text-[#a0a0c0]">Rack&apos;s empty (for now)</p>
                                    <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[#5a5a7a]">
                                        {isAdmin
                                            ? 'Upload or import titles in the admin archive to populate this row.'
                                            : 'New issues will appear here after they are added to the library.'}
                                    </p>
                                </div>
                                <Link
                                    href={isAdmin ? route('admin.comics.index') : route('comics.index')}
                                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#e8003d] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_8px_28px_rgba(232,0,61,0.3)] transition hover:bg-[#ff0a4a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                                >
                                    {isAdmin ? 'Open archive' : 'Go to library'}
                                    <ArrowRight className="h-4 w-4" aria-hidden />
                                </Link>
                            </div>
                        ) : (
                            <ul className="divide-y divide-white/[0.07]">
                                {recentComics.map((comic, index) => {
                                    const shelf =
                                        comic.shelf && String(comic.shelf).trim()
                                            ? comic.shelf
                                            : 'Unshelved';
                                    const href = isAdmin
                                        ? route('admin.comics.index', { edit: comic.id })
                                        : route('comics.show', comic.id);
                                    const label = `${comic.title}. ${comic.is_hidden ? 'Hidden' : 'Public'} on shelves. ${shelf}. Added ${comic.added}.`;
                                    return (
                                        <li key={comic.id}>
                                            <Link
                                                href={href}
                                                aria-label={label}
                                                className="group flex min-h-[72px] gap-3 px-4 py-4 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e8003d] sm:gap-5 sm:px-8 sm:py-5"
                                            >
                                                {/* Row index — comic strip panel number */}
                                                <span
                                                    className="hidden w-8 shrink-0 pt-1 font-mono text-[11px] font-bold tabular-nums text-white/25 sm:block"
                                                    aria-hidden
                                                >
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>

                                                {/* Cover frame */}
                                                <div className="relative h-[76px] w-[54px] shrink-0 sm:h-[84px] sm:w-[60px]">
                                                    <div
                                                        className="absolute -inset-0.5 rounded-md bg-gradient-to-br from-white/15 to-white/[0.04]"
                                                        aria-hidden
                                                    />
                                                    <div className="relative h-full w-full overflow-hidden rounded-md border-2 border-white/15 bg-[#0a0a10] shadow-[4px_4px_0_rgba(0,0,0,0.45)] ring-1 ring-black/50">
                                                        {comic.thumbnail ? (
                                                            <img
                                                                src={`/thumbs/${comic.thumbnail}`}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                                loading="lazy"
                                                                decoding="async"
                                                            />
                                                        ) : (
                                                            <ThumbPlaceholder />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-[16px] font-semibold leading-snug text-white transition-colors group-hover:text-[#ff8fab] sm:text-[17px]">
                                                        {comic.title}
                                                    </h3>
                                                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] py-1 pl-2 pr-2.5 text-[12px] text-[#a8a8c8]">
                                                            <Layers
                                                                className="h-3.5 w-3.5 shrink-0 text-[#7070a0]"
                                                                aria-hidden
                                                            />
                                                            <span className="truncate">{shelf}</span>
                                                        </span>
                                                        <span
                                                            className="inline-flex items-center rounded-md border border-transparent py-1 font-mono text-[11px] tabular-nums text-[#6a6a8a]"
                                                        >
                                                            {comic.added}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:flex-row sm:items-center">
                                                    <VisibilityPill hidden={comic.is_hidden} />
                                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/25 transition-all group-hover:border-[#e8003d]/40 group-hover:bg-[#e8003d]/10 group-hover:text-[#e8003d]">
                                                        <ChevronRight
                                                            className="h-5 w-5"
                                                            aria-hidden
                                                        />
                                                    </span>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </ComicPanel>
                </motion.section>

                <motion.p variants={v.item} className="text-center text-[11px] text-[#4a4a6a]">
                    ComicVault — stories on the shelf, readers in the know.
                </motion.p>
            </motion.div>
        </ComicLayout>
    );
}
