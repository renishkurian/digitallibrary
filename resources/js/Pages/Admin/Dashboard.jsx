import { Head, Link } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import DashboardBackground from '@/Components/DashboardBackground';
import { motion } from 'framer-motion';
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
    ArrowRight
} from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100
        }
    }
};

const StatCard = ({ icon: Icon, label, value, sub, accentColor }) => (
    <motion.div 
        variants={itemVariants}
        whileHover={{ y: -5, scale: 1.02 }}
        className="relative bg-[#16161f]/60 backdrop-blur-xl border border-white/7 rounded-2xl p-6 overflow-hidden group hover:border-white/15 transition-all shadow-2xl"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${accentColor} -translate-y-1/2 translate-x-1/2`} />
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform`}>
                <Icon size={24} className="text-white" />
            </div>
            <div className="text-4xl font-['Bebas_Neue'] text-white tracking-wider">{value}</div>
        </div>
        <div className="text-[12px] uppercase tracking-widest text-[#55556a] font-bold">{label}</div>
        {sub && <div className="text-[11px] text-[#8888a0] mt-1">{sub}</div>}
    </motion.div>
);

const QuickActionCard = ({ action }) => (
    <motion.a 
        key={action.href} 
        href={action.href}
        variants={itemVariants}
        whileHover={{ y: -5, scale: 1.05 }}
        className="group relative bg-[#16161f]/60 backdrop-blur-xl border border-white/7 rounded-2xl p-6 hover:border-[#e8003d]/30 overflow-hidden transition-all"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8003d]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 w-fit mb-4 group-hover:bg-[#e8003d]/10 group-hover:border-[#e8003d]/20 transition-all">
                <action.icon size={24} className="group-hover:text-[#e8003d] transition-colors" />
            </div>
            <div className="font-['Bebas_Neue'] text-xl text-white tracking-wider group-hover:text-[#e8003d] transition-colors mb-1">{action.title}</div>
            <div className="text-[13px] text-[#8888a0] group-hover:text-[#aaaaee] transition-colors">{action.desc}</div>
        </div>
    </motion.a>
);

export default function Dashboard({ auth, stats, recentComics }) {
    return (
        <ComicLayout auth={auth}>
            <Head title="Admin Dashboard" />
            <DashboardBackground />

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto flex flex-col gap-10 relative z-10"
            >
                {/* Hero Welcome */}
                <motion.div 
                    variants={itemVariants}
                    className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-[#0d0d14]/80 to-[#1a0a0f]/80 backdrop-blur-2xl border border-white/10 p-5 sm:p-10 shadow-2xl"
                >
                    <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#e8003d] rounded-full blur-[120px] opacity-15 translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    
                    <div className="relative">
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2 mb-4"
                        >
                            <LayoutDashboard size={14} className="text-[#e8003d]" />
                            <p className="text-[#e8003d] text-[12px] uppercase tracking-[4px] font-black">Admin Nexus</p>
                        </motion.div>
                        
                        <h1 className="font-['Bebas_Neue'] text-3xl sm:text-6xl tracking-[2px] sm:tracking-[4px] text-white mb-4">
                            Welcome Back, <span className="text-[#e8003d]">{auth?.user?.name?.split(' ')[0]}</span>
                        </h1>
                        <p className="text-[#8888a0] max-w-lg text-lg font-['DM_Sans'] leading-relaxed">
                            Your digital library is fully operational. Manage your expansive comic collection, oversee user activity, and fine-tune system settings.
                        </p>
                        
                        <div className="flex gap-4 mt-10 flex-wrap">
                            <motion.a 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href={route('admin.comics.index')} 
                                className="bg-[#e8003d] text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#ff0044] transition-all shadow-xl shadow-[#e8003d]/30 flex items-center gap-2"
                            >
                                <Library size={18} />
                                Manage Library
                            </motion.a>
                            <motion.a 
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.95 }}
                                href={route('admin.users.index')} 
                                className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                <Users size={18} />
                                User Control
                            </motion.a>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatCard icon={Library} label="Total Comics" value={stats.totalComics} sub="in core library" accentColor="bg-blue-500" />
                    <StatCard icon={Lock} label="Hidden Vault" value={stats.hiddenComics} sub="private assets" accentColor="bg-[#e8003d]" />
                    <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub="active members" accentColor="bg-emerald-500" />
                    <StatCard icon={BookOpen} label="Reading Pulse" value={stats.readEvents} sub="total interactions" accentColor="bg-violet-500" />
                </div>

                {/* Quick Actions Header */}
                <motion.div variants={itemVariants} className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h2 className="font-['Bebas_Neue'] text-2xl tracking-[4px] text-[#55556a]">Rapid Access</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </motion.div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
                    {[
                        { href: route('admin.comics.index'), icon: Library, title: 'Archive', desc: 'Centralized management' },
                        { href: route('admin.users.index'), icon: Users, title: 'Users', desc: 'Permission control' },
                        { href: route('admin.settings.index'), icon: Settings, title: 'Engine', desc: 'AI Configuration' },
                        { href: route('admin.ai-logs.index'), icon: Activity, title: 'Telemetry', desc: 'System monitoring' },
                        { href: route('admin.ai-playground.index'), icon: FlaskConical, title: 'Forge', desc: 'AI experimentation' },
                        { href: route('admin.roles.index'), icon: Key, title: 'Security', desc: 'Access management' },
                    ].map(action => (
                        <QuickActionCard key={action.href} action={action} />
                    ))}
                </div>

                {/* Recent Activity */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-[#16161f]/60 backdrop-blur-xl border border-white/7 rounded-2xl overflow-hidden shadow-2xl hover:border-white/15 transition-all"
                >
                    <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <Activity size={20} className="text-[#e8003d]" />
                            <h2 className="font-['Bebas_Neue'] text-2xl tracking-widest text-white">Latest Acquisitions</h2>
                        </div>
                        <Link href={route('admin.comics.index')} className="group flex items-center gap-2 text-[12px] uppercase tracking-widest text-[#e8003d] hover:text-white transition-colors font-bold">
                            Archive View
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="divide-y divide-white/5">
                        {recentComics.length === 0 ? (
                            <div className="px-8 py-12 text-center text-[#55556a] font-['DM_Sans'] italic">
                                No recent entries detected.
                            </div>
                        ) : recentComics.map(comic => (
                            <motion.div 
                                key={comic.id} 
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                className="flex items-center justify-between px-8 py-5 group transition-colors"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-lg group-hover:border-[#e8003d]/40 transition-colors bg-[#1a1a26]">
                                        {comic.thumbnail ? (
                                            <img src={`/thumbs/${comic.thumbnail}`} alt={comic.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-lg">
                                                📖
                                            </div>
                                        )}
                                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full blur-[1px] animate-pulse ${comic.is_hidden ? 'bg-[#e8003d]' : 'bg-green-500'}`} />
                                    </div>
                                    <div>
                                        <div className="text-white text-base font-semibold group-hover:text-[#e8003d] transition-colors line-clamp-1">{comic.title}</div>
                                        <div className="text-[#55556a] text-[12px] mt-1 tracking-wider uppercase font-bold">
                                            {comic.shelf || 'Loose Stock'} <span className="mx-2">·</span> <span className="text-[#8888a0]">{comic.added}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {comic.is_hidden && (
                                        <span className="text-[10px] bg-[#e8003d]/10 text-[#e8003d] border border-[#e8003d]/20 px-3 py-1 rounded-full font-bold uppercase tracking-[2px]">Encrypted</span>
                                    )}
                                    <ChevronRight size={18} className="text-white/10 group-hover:text-[#e8003d] group-hover:translate-x-1 transition-all" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </ComicLayout>
    );
}
