import { useState, useEffect } from 'react';
import { Link, usePage, useForm } from '@inertiajs/react';
import Toast from '@/Components/Toast';

export default function ComicLayout({ children, title }) {
    const { auth } = usePage().props;
    const [scrolled, setScrolled] = useState(false);
    const { data, setData, get } = useForm({
        q: new URLSearchParams(window.location.search).get('q') || '',
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('comics.index'), {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5] font-light">
            <header 
                id="mainHeader"
                className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-10 h-16 transition-all duration-300 ${
                    scrolled ? 'bg-[#0a0a0f]/97 border-b border-white/7 backdrop-blur-md' : 'bg-gradient-to-b from-[#0a0a0f]/98 to-transparent'
                }`}
            >
                <div className="flex items-center gap-8">
                    <Link href={route('comics.index')} className="logo flex items-center gap-2 text-[28px] tracking-[3px] font-['Bebas_Neue'] no-underline text-white">
                        Comic<span className="text-[#e8003d] drop-shadow-[0_0_8px_rgba(232,0,61,0.35)]">Vault</span>
                    </Link>

                    <nav className="flex items-center gap-6 ml-4">
                        <Link href={route('comics.index')} className={`text-[13px] tracking-widest uppercase font-medium transition-colors ${route().current('comics.index') ? 'text-[#e8003d]' : 'text-[#8888a0] hover:text-white'}`}>Library</Link>
                        <Link href={route('shelves.index')} className={`text-[13px] tracking-widest uppercase font-medium transition-colors ${route().current('shelves.*') ? 'text-[#e8003d]' : 'text-[#8888a0] hover:text-white'}`}>Shelves</Link>
                        {auth.user && (
                            <Link href={route('reading-stats')} className={`text-[13px] tracking-widest uppercase font-medium transition-colors ${route().current('reading-stats') ? 'text-[#e8003d]' : 'text-[#8888a0] hover:text-white'}`}>Stats</Link>
                        )}
                    </nav>
                </div>

                <div className="header-right flex items-center gap-4">
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
            </header>

            <main className="pt-20 px-10 pb-12">
                {children}
            </main>
            <Toast />
        </div>
    );
}
