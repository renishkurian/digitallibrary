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

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('comics.index'), {
            preserveState: true,
            replace: true,
        });
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5] font-light">
            <header 
                id="mainHeader"
                className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-10 h-14 sm:h-16 transition-all duration-300 ${
                    scrolled ? 'bg-[#0a0a0f]/97 border-b border-white/7 backdrop-blur-md' : 'bg-gradient-to-b from-[#0a0a0f]/98 to-transparent'
                }`}
            >
                <div className="flex items-center gap-4 sm:gap-8">
                    <Link href={route('comics.index')} className="logo flex items-center gap-2 text-[24px] sm:text-[28px] tracking-[3px] font-['Bebas_Neue'] no-underline text-white">
                        Comic<span className="text-[#e8003d] drop-shadow-[0_0_8px_rgba(232,0,61,0.35)]">Vault</span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-6 ml-4">
                        <Link href={route('comics.index')} className={`text-[13px] tracking-widest uppercase font-medium transition-colors ${route().current('comics.index') ? 'text-[#e8003d]' : 'text-[#8888a0] hover:text-white'}`}>Library</Link>
                        <Link href={route('shelves.index')} className={`text-[13px] tracking-widest uppercase font-medium transition-colors ${route().current('shelves.*') ? 'text-[#e8003d]' : 'text-[#8888a0] hover:text-white'}`}>Shelves</Link>
                        <Link href={route('comics.calendar')} className={`text-[13px] tracking-widest uppercase font-medium transition-colors ${route().current('comics.calendar') ? 'text-[#e8003d]' : 'text-[#8888a0] hover:text-white'}`}>Calendar</Link>
                        {auth.user && (
                            <Link href={route('reading-stats')} className={`text-[13px] tracking-widest uppercase font-medium transition-colors ${route().current('reading-stats') ? 'text-[#e8003d]' : 'text-[#8888a0] hover:text-white'}`}>Stats</Link>
                        )}
                    </nav>
                </div>

                {/* Desktop search + auth */}
                <div className="header-right hidden md:flex items-center gap-4">
                    <form onSubmit={handleSearch} className="search-wrap relative flex items-center">
                        <svg className="absolute left-3 text-[#8888a0] pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="search"
                            placeholder="Search comics..."
                            value={data.q}
                            onChange={(e) => setData('q', e.target.value)}
                            className="bg-white/6 border border-white/7 text-[#f0f0f5] font-['DM_Sans'] text-sm py-2 pl-10 pr-4 rounded-lg w-[260px] outline-none transition-all duration-300 focus:border-[#e8003d] focus:bg-white/10 focus:w-[320px]"
                        />
                    </form>

                    <div className="auth-links flex items-center gap-3">
                        {auth.user ? (
                            <>
                                <a href={route('dashboard')} className="auth-link text-[13px] text-[#8888a0] hover:text-white transition-colors">Dashboard</a>
                                {auth.user.is_admin && (
                                    <a href={route('admin.comics.index')} className="auth-link text-[13px] text-[#8888a0] hover:text-white transition-colors">Admin</a>
                                )}
                                <Link 
                                    href={route('logout')} 
                                    method="post" 
                                    as="button" 
                                    className="auth-link text-[13px] text-[#8888a0] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                                >
                                    Logout
                                </Link>
                            </>
                        ) : (
                            <>
                                <a href={route('login')} className="auth-link text-[13px] text-[#8888a0] hover:text-white transition-colors">Login</a>
                                <a href={route('register')} className="auth-link text-[13px] text-[#8888a0] hover:text-white transition-colors">Register</a>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile hamburger button */}
                <button 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden flex items-center justify-center w-10 h-10 text-white/80 hover:text-white transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    )}
                </button>
            </header>

            {/* Mobile menu drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-x-0 top-14 z-[99] md:hidden bg-[#0a0a0f]/98 backdrop-blur-lg border-b border-white/7 animate-slideDown">
                    <div className="flex flex-col gap-1 px-4 py-4">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative flex items-center mb-3">
                            <svg className="absolute left-3 text-[#8888a0] pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="search"
                                placeholder="Search comics..."
                                value={data.q}
                                onChange={(e) => setData('q', e.target.value)}
                                className="w-full bg-white/6 border border-white/7 text-[#f0f0f5] font-['DM_Sans'] text-sm py-2.5 pl-10 pr-4 rounded-lg outline-none focus:border-[#e8003d] focus:bg-white/10"
                            />
                        </form>

                        {/* Nav links */}
                        <Link href={route('comics.index')} onClick={() => setMobileMenuOpen(false)} className={`text-[14px] tracking-widest uppercase font-medium py-2.5 px-3 rounded-lg transition-colors ${route().current('comics.index') ? 'text-[#e8003d] bg-[#e8003d]/10' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}>Library</Link>
                        <Link href={route('shelves.index')} onClick={() => setMobileMenuOpen(false)} className={`text-[14px] tracking-widest uppercase font-medium py-2.5 px-3 rounded-lg transition-colors ${route().current('shelves.*') ? 'text-[#e8003d] bg-[#e8003d]/10' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}>Shelves</Link>
                        <Link href={route('comics.calendar')} onClick={() => setMobileMenuOpen(false)} className={`text-[14px] tracking-widest uppercase font-medium py-2.5 px-3 rounded-lg transition-colors ${route().current('comics.calendar') ? 'text-[#e8003d] bg-[#e8003d]/10' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}>Calendar</Link>
                        {auth.user && (
                            <Link href={route('reading-stats')} onClick={() => setMobileMenuOpen(false)} className={`text-[14px] tracking-widest uppercase font-medium py-2.5 px-3 rounded-lg transition-colors ${route().current('reading-stats') ? 'text-[#e8003d] bg-[#e8003d]/10' : 'text-[#8888a0] hover:text-white hover:bg-white/5'}`}>Stats</Link>
                        )}

                        {/* Divider */}
                        <div className="border-t border-white/7 my-2" />

                        {/* Auth links */}
                        {auth.user ? (
                            <>
                                <a href={route('dashboard')} className="text-[14px] text-[#8888a0] hover:text-white py-2.5 px-3 rounded-lg transition-colors hover:bg-white/5">Dashboard</a>
                                {auth.user.is_admin && (
                                    <a href={route('admin.comics.index')} className="text-[14px] text-[#8888a0] hover:text-white py-2.5 px-3 rounded-lg transition-colors hover:bg-white/5">Admin</a>
                                )}
                                <Link 
                                    href={route('logout')} 
                                    method="post" 
                                    as="button" 
                                    className="text-left text-[14px] text-[#8888a0] hover:text-white py-2.5 px-3 rounded-lg transition-colors hover:bg-white/5 border-none bg-transparent cursor-pointer"
                                >
                                    Logout
                                </Link>
                            </>
                        ) : (
                            <>
                                <a href={route('login')} className="text-[14px] text-[#8888a0] hover:text-white py-2.5 px-3 rounded-lg transition-colors hover:bg-white/5">Login</a>
                                <a href={route('register')} className="text-[14px] text-[#8888a0] hover:text-white py-2.5 px-3 rounded-lg transition-colors hover:bg-white/5">Register</a>
                            </>
                        )}
                    </div>
                </div>
            )}

            <main className="pt-16 sm:pt-20 px-4 sm:px-10 pb-12">
                {children}
            </main>
            <Toast />
        </div>
    );
}
