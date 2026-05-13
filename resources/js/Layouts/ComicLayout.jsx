import { useState, useEffect } from 'react';
import { Link, usePage, useForm } from '@inertiajs/react';
import Toast from '@/Components/Toast';

export default function ComicLayout({ children, title }) {
    const { auth } = usePage().props;
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { data, setData, get } = useForm({
        q: new URLSearchParams(window.location.search).get('q') || '',
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('comics.index'), { preserveState: true, replace: true });
        setMobileMenuOpen(false);
    };

    const userInitial = auth.user?.name?.charAt(0).toUpperCase() || '?';

    const navLinks = [
        { label: 'Library', r: 'comics.index', match: 'comics.index' },
        { label: 'Shelves', r: 'shelves.index', match: 'shelves.*' },
        { label: 'Calendar', r: 'comics.calendar', match: 'comics.calendar' },
        ...(auth.user ? [{ label: 'Stats', r: 'reading-stats', match: 'reading-stats' }] : []),
    ];

    return (
        <div className="min-h-screen bg-[#05050a] text-[#f0f0f5]" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>

            {/* ── HEADER ── */}
            <header
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
                    scrolled
                        ? 'bg-[#07070f]/95 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_32px_rgba(0,0,0,0.5)]'
                        : 'bg-gradient-to-b from-[#07070f]/90 to-transparent backdrop-blur-sm'
                }`}
            >
                <div className="flex items-center justify-between px-4 sm:px-8 lg:px-14 h-[62px] max-w-[1680px] mx-auto">

                    {/* Logo */}
                    <Link href={route('comics.index')} className="flex items-center gap-2.5 no-underline group shrink-0">
                        <div className="w-8 h-8 rounded-[10px] bg-[#e8003d] flex items-center justify-center shadow-[0_2px_18px_rgba(232,0,61,0.4)] group-hover:shadow-[0_2px_28px_rgba(232,0,61,0.6)] group-hover:scale-[1.08] transition-all duration-250">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                                <path d="M21 4H3C1.9 4 1 4.9 1 6v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-10 3h8v2h-8V7zm0 4h8v2h-8v-2zm0 4h5v2h-5v-2zM5 7h3v9H5V7z"/>
                            </svg>
                        </div>
                        <span className="text-[24px] sm:text-[27px] tracking-[2px] font-['Bebas_Neue'] text-white leading-none">
                            Comic<span className="text-[#e8003d] drop-shadow-[0_0_10px_rgba(232,0,61,0.4)]">Vault</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1 mx-6 lg:mx-10">
                        {navLinks.map(({ label, r, match }) => {
                            const active = route().current(match);
                            return (
                                <Link
                                    key={label}
                                    href={route(r)}
                                    className={`relative text-[11.5px] font-semibold tracking-[1.8px] uppercase px-3 py-2 rounded-lg transition-all duration-200 ${
                                        active
                                            ? 'text-white bg-white/[0.08]'
                                            : 'text-[#6868a0] hover:text-[#c8c8e8] hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {label}
                                    {active && (
                                        <span className="absolute bottom-[5px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#e8003d] shadow-[0_0_5px_rgba(232,0,61,0.9)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Desktop search + auth */}
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="group relative">
                            <svg
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6868a0] group-focus-within:text-[#e8003d] transition-colors pointer-events-none"
                                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="search"
                                placeholder="Search comics..."
                                value={data.q}
                                onChange={(e) => setData('q', e.target.value)}
                                className="bg-white/[0.05] border border-white/[0.08] text-[#f0f0f5] text-[13px] py-[7px] pl-9 pr-4 rounded-full w-[200px] outline-none transition-all duration-300 focus:border-[#e8003d]/50 focus:bg-white/[0.08] focus:w-[270px] focus:shadow-[0_0_0_3px_rgba(232,0,61,0.1)] placeholder:text-[#4a4a6a]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                            />
                        </form>

                        {/* Divider */}
                        <div className="w-px h-5 bg-white/[0.1]" />

                        {/* Auth */}
                        {auth.user ? (
                            <div className="flex items-center gap-1.5">
                                {auth.user.is_admin && (
                                    <a href={route('admin.comics.index')} className="text-[12px] text-[#6868a0] hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05]">Admin</a>
                                )}
                                <a href={route('dashboard')} className="text-[12px] text-[#6868a0] hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05]">Dashboard</a>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="text-[12px] text-[#6868a0] hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] border-none bg-transparent cursor-pointer"
                                >
                                    Logout
                                </Link>
                                <a
                                    href={route('profile.edit')}
                                    className="w-[30px] h-[30px] rounded-full bg-[#e8003d]/15 border border-[#e8003d]/40 flex items-center justify-center text-[#ff3355] text-[12px] font-bold hover:bg-[#e8003d]/25 hover:border-[#e8003d]/70 hover:scale-105 transition-all ml-1"
                                    title={auth.user.name}
                                >
                                    {userInitial}
                                </a>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <a href={route('login')} className="text-[12px] text-[#6868a0] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]">Login</a>
                                <a href={route('register')} className="text-[12px] bg-[#e8003d] hover:bg-[#ff1050] text-white px-3.5 py-1.5 rounded-lg transition-all font-semibold hover:shadow-[0_2px_16px_rgba(232,0,61,0.35)]">
                                    Register
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-[5px] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                        aria-label="Toggle menu"
                    >
                        <span className={`w-[18px] h-[1.5px] bg-current origin-center transition-all duration-250 ${mobileMenuOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`} />
                        <span className={`w-[18px] h-[1.5px] bg-current transition-all duration-250 ${mobileMenuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                        <span className={`w-[18px] h-[1.5px] bg-current origin-center transition-all duration-250 ${mobileMenuOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`} />
                    </button>
                </div>
            </header>

            {/* ── MOBILE DRAWER ── */}
            {mobileMenuOpen && (
                <div className="fixed inset-x-0 top-[62px] z-[99] md:hidden animate-slideDown">
                    <div className="bg-[#08080f]/98 backdrop-blur-2xl border-b border-white/[0.07] shadow-[0_16px_40px_rgba(0,0,0,0.7)]">
                        <div className="px-4 py-4 space-y-0.5">
                            {/* Mobile search */}
                            <form onSubmit={handleSearch} className="relative mb-3">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6868a0] pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <input
                                    type="search"
                                    placeholder="Search comics..."
                                    value={data.q}
                                    onChange={(e) => setData('q', e.target.value)}
                                    className="w-full bg-white/[0.06] border border-white/[0.09] text-[#f0f0f5] text-[13px] py-2.5 pl-9 pr-4 rounded-xl outline-none focus:border-[#e8003d]/50 focus:bg-white/[0.09] placeholder:text-[#4a4a6a]"
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                />
                            </form>

                            {/* Nav links */}
                            {navLinks.map(({ label, r, match }) => {
                                const active = route().current(match);
                                return (
                                    <Link
                                        key={label}
                                        href={route(r)}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 text-[14px] font-medium py-2.5 px-3 rounded-xl transition-all ${
                                            active
                                                ? 'text-[#ff3355] bg-[#e8003d]/10'
                                                : 'text-[#8888a0] hover:text-white hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        {active && <span className="w-1.5 h-1.5 rounded-full bg-[#e8003d] shadow-[0_0_6px_rgba(232,0,61,0.8)] shrink-0" />}
                                        {label}
                                    </Link>
                                );
                            })}

                            {/* Auth section */}
                            <div className="border-t border-white/[0.07] pt-3 mt-3">
                                {auth.user ? (
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
                                            <div className="w-8 h-8 rounded-full bg-[#e8003d]/15 border border-[#e8003d]/40 flex items-center justify-center text-[#ff3355] text-[13px] font-bold shrink-0">
                                                {userInitial}
                                            </div>
                                            <div>
                                                <div className="text-[14px] text-white font-medium truncate">{auth.user.name}</div>
                                                {auth.user.is_admin && <div className="text-[10px] text-[#e8003d] uppercase tracking-wider">Admin</div>}
                                            </div>
                                        </div>
                                        <a href={route('profile.edit')} className="block text-[13px] text-[#8888a0] hover:text-white py-2 px-3 rounded-xl hover:bg-white/[0.05] transition-colors">Profile settings</a>
                                        <a href={route('dashboard')} className="block text-[13px] text-[#8888a0] hover:text-white py-2 px-3 rounded-xl hover:bg-white/[0.05] transition-colors">Dashboard</a>
                                        {auth.user.is_admin && (
                                            <a href={route('admin.comics.index')} className="block text-[13px] text-[#8888a0] hover:text-white py-2 px-3 rounded-xl hover:bg-white/[0.05] transition-colors">Admin panel</a>
                                        )}
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="block w-full text-left text-[13px] text-[#8888a0] hover:text-[#ff3355] py-2 px-3 rounded-xl hover:bg-[#e8003d]/[0.06] transition-colors border-none bg-transparent cursor-pointer mt-1"
                                        >
                                            Sign out
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 pt-1">
                                        <a href={route('login')} className="flex-1 text-center text-[13px] text-white py-2.5 px-4 rounded-xl border border-white/[0.12] hover:border-white/[0.22] transition-colors">Login</a>
                                        <a href={route('register')} className="flex-1 text-center text-[13px] bg-[#e8003d] hover:bg-[#ff1050] text-white py-2.5 px-4 rounded-xl transition-colors font-semibold">Register</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MAIN CONTENT ── */}
            <main className="pt-[62px] px-4 sm:px-8 lg:px-14 pb-20 max-w-[1680px] mx-auto">
                {children}
            </main>

            <Toast />
        </div>
    );
}
