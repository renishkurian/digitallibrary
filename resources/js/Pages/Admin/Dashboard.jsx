import { Head, Link } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';

const StatCard = ({ icon, label, value, sub, accent }) => (
    <div className="relative bg-[#16161f] border border-white/7 rounded-2xl p-6 overflow-hidden group hover:border-white/15 transition-all">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${accent || 'bg-[#e8003d]'} -translate-y-1/2 translate-x-1/2`} />
        <div className="text-3xl mb-3">{icon}</div>
        <div className="text-4xl font-['Bebas_Neue'] text-white tracking-wider mb-1">{value}</div>
        <div className="text-[12px] uppercase tracking-widest text-[#55556a] font-bold">{label}</div>
        {sub && <div className="text-[11px] text-[#8888a0] mt-1">{sub}</div>}
    </div>
);

export default function Dashboard({ auth, stats, recentComics }) {
    return (
        <ComicLayout auth={auth}>
            <Head title="Admin Dashboard" />

            <div className="max-w-7xl mx-auto flex flex-col gap-10">

                {/* Hero Welcome */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0d0d14] to-[#1a0a0f] border border-white/7 p-10">
                    <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#e8003d] rounded-full blur-[120px] opacity-10 translate-x-1/2 -translate-y-1/2" />
                    <div className="relative">
                        <p className="text-[#e8003d] text-[12px] uppercase tracking-[4px] font-black mb-2">Admin Panel</p>
                        <h1 className="font-['Bebas_Neue'] text-6xl tracking-[4px] text-white mb-3">
                            Welcome back, <span className="text-[#e8003d]">{auth?.user?.name?.split(' ')[0]}</span>
                        </h1>
                        <p className="text-[#8888a0] max-w-lg">Your library is running. Manage your comic collection, users and settings from this panel.</p>
                        <div className="flex gap-4 mt-8 flex-wrap">
                            <a href={route('admin.comics.index')} className="bg-[#e8003d] text-white px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#ff0044] transition-all shadow-lg shadow-[#e8003d]/20">
                                Manage Library
                            </a>
                            <a href={route('admin.users.index')} className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                                Manage Users
                            </a>
                            <a href={route('comics.index')} className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                                Browse Library
                            </a>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <StatCard icon="📚" label="Total Comics" value={stats.totalComics} sub="in library" accent="bg-blue-500" />
                    <StatCard icon="🔒" label="Hidden Comics" value={stats.hiddenComics} sub="not publicly visible" accent="bg-[#e8003d]" />
                    <StatCard icon="👥" label="Total Users" value={stats.totalUsers} sub="registered" accent="bg-green-500" />
                    <StatCard icon="📖" label="Read Events" value={stats.readEvents} sub="total reads" accent="bg-purple-500" />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                    {[
                        { href: route('admin.comics.index'), icon: '📚', title: 'Manage Comics', desc: 'Upload, edit, hide/show, and share comics' },
                        { href: route('admin.users.index'), icon: '👥', title: 'Manage Users', desc: 'Assign roles, edit profiles, delete accounts' },
                        { href: route('admin.settings.index'), icon: '⚙️', title: 'AI Settings', desc: 'Configure auto-tagging and integrations' },
                        { href: route('admin.ai-logs.index'), icon: '📊', title: 'AI Logs', desc: 'View API usage, prompts, and tokens' },
                        { href: route('admin.ai-playground.index'), icon: '🧪', title: 'AI Playground', desc: 'Query database and generate summaries' },
                        { href: route('admin.roles.index'), icon: '🔑', title: 'Roles & Permissions', desc: 'Define access levels and security' },
                    ].map(action => (
                        <a key={action.href} href={action.href}
                            className="group bg-[#16161f] border border-white/7 rounded-2xl p-6 hover:border-[#e8003d]/30 hover:bg-[#1a0a0f] transition-all">
                            <div className="text-3xl mb-3">{action.icon}</div>
                            <div className="font-['Bebas_Neue'] text-xl text-white tracking-wider group-hover:text-[#e8003d] transition-colors mb-1">{action.title}</div>
                            <div className="text-[13px] text-[#8888a0]">{action.desc}</div>
                        </a>
                    ))}
                </div>

                {/* Recent Comics */}
                <div className="bg-[#16161f] border border-white/7 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                        <h2 className="font-['Bebas_Neue'] text-2xl tracking-widest text-white">Recently Added</h2>
                        <a href={route('admin.comics.index')} className="text-[12px] uppercase tracking-widest text-[#e8003d] hover:text-white transition-colors font-bold">View All →</a>
                    </div>
                    <div className="divide-y divide-white/5">
                        {recentComics.length === 0 ? (
                            <div className="px-6 py-10 text-center text-[#55556a]">No comics yet. Upload or sync to get started.</div>
                        ) : recentComics.map(comic => (
                            <div key={comic.id} className="flex items-center justify-between px-6 py-4 group hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${comic.is_hidden ? 'bg-[#e8003d]' : 'bg-green-500'}`} />
                                    <div>
                                        <div className="text-white text-sm font-medium group-hover:text-[#e8003d] transition-colors">{comic.title}</div>
                                        <div className="text-[#55556a] text-[11px] mt-0.5">{comic.shelf || 'No shelf'} · {comic.added}</div>
                                    </div>
                                </div>
                                {comic.is_hidden && (
                                    <span className="text-[10px] bg-[#e8003d]/10 text-[#e8003d] border border-[#e8003d]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Hidden</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ComicLayout>
    );
}
