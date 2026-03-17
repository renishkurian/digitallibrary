import { useState, useEffect } from 'react';
import { Link, usePage, useForm, router } from '@inertiajs/react';
import Toast from '@/Components/Toast';

// ─── Icons ───────────────────────────────────────────────────────────────────
const IconDashboard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const IconLibrary = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V21H3V8"/><path d="M23 3H1V8H23V3Z"/><path d="M10 12H14"/></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconReports = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IconModeration = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconSettings = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export default function AdminLayout({ children, leftPanel, rightPanel, auth, filters, syncStatus, runSync, syncProcessing }) {
    const { url } = usePage();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const navItems = [
        { name: 'Dashboard', icon: <IconDashboard />, href: route('admin.comics.index'), active: url.startsWith('/admin/dashboard') },
        { name: 'Media Library', icon: <IconLibrary />, href: route('admin.comics.index'), active: url.startsWith('/admin/comics') },
        { name: 'Users', icon: <IconUsers />, href: route('admin.users.index'), active: url.startsWith('/admin/users') },
        { name: 'Reports', icon: <IconReports />, href: '#', active: false },
        { name: 'Moderation', icon: <IconModeration />, href: '#', active: false },
    ];

    const bottomItems = [
        { name: 'Settings', icon: <IconSettings />, href: route('admin.settings.index'), active: url.startsWith('/admin/settings') },
        { name: 'Logout', icon: <IconLogout />, href: route('logout'), method: 'post', as: 'button' },
    ];

    return (
        <div className="flex h-screen bg-[#0a0b0d] text-white font-['Inter',sans-serif] overflow-hidden">
            {/* Sidebar */}
            <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-[80px]' : 'w-[240px]'} bg-[#111214] border-r border-white/5 flex flex-col flex-shrink-0 z-[100]`}>
                <div className={`p-6 flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-[#ff2442] flex items-center justify-center flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    </div>
                    {!isSidebarCollapsed && <span className="font-['Bebas_Neue'] text-xl tracking-wider uppercase whitespace-nowrap">Comic Vault</span>}
                </div>

                <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto custom-scrollbar">
                    <div>
                        {!isSidebarCollapsed && <div className="px-3 mb-4 text-[10px] font-bold text-white/30 uppercase tracking-[2px]">Main Menu</div>}
                        <ul className="space-y-1">
                            {navItems.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                                            item.active 
                                                ? 'bg-[#ff2442] text-white shadow-lg shadow-[#ff2442]/20' 
                                                : 'text-white/50 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span className={`${item.active ? 'text-white' : 'text-white/30 group-hover:text-white'} flex-shrink-0`}>
                                            {item.icon}
                                        </span>
                                        {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                <div className="px-4 py-6 border-t border-white/5 space-y-1">
                    {bottomItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            method={item.method}
                            as={item.as}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}
                        >
                            <span className="text-white/30 flex-shrink-0">{item.icon}</span>
                            {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                        </Link>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="h-[72px] bg-[#0a0b0d]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 flex-shrink-0 z-[90]">
                    <div className="flex items-center gap-6 flex-1">
                        <button 
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                        </button>
                        <div className="max-w-xl flex-1">
                        <div className="relative group">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#ff2442] transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            <input 
                                type="text" 
                                placeholder="Search the archive..." 
                                className="w-full bg-[#111214] border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white placeholder-white/20 outline-none focus:border-[#ff2442]/50 focus:ring-4 focus:ring-[#ff2442]/10 transition-all"
                            />
                        </div>
                    </div>
                </div>

                    <div className="flex items-center gap-4">
                        {/* Sync Status Button (Integrated) */}
                        <button 
                            onClick={runSync}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 text-sm font-bold transition-all ${
                                syncStatus?.status === 'running' 
                                    ? 'bg-[#ff2442]/10 text-[#ff2442] border-[#ff2442]/20 animate-pulse' 
                                    : 'bg-[#111214] text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M21 3v9h-9"/><path d="M12 12l9-7"/></svg>
                            {syncStatus?.status === 'running' ? 'Ingesting...' : 'Ingest'}
                        </button>

                        <div className="h-8 w-px bg-white/5 mx-2" />

                        <button className="p-2 text-white/30 hover:text-white transition-colors relative">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff2442] rounded-full border-2 border-[#0a0b0d]" />
                        </button>

                        <button className="p-2 text-white/30 hover:text-white transition-colors">
                            <IconSettings />
                        </button>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-bold leading-none">{auth?.user?.name || 'Administrator'}</div>
                                <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-1">{auth?.user?.roles?.[0]?.name || 'Admin'}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-white/10 p-0.5">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#ff2442] to-[#ff6b24] flex items-center justify-center text-xs font-bold text-white uppercase overflow-hidden">
                                    {auth?.user?.thumbnail ? (
                                        <img src={auth.user.thumbnail} className="w-full h-full object-cover" />
                                    ) : (
                                        auth?.user?.name?.substring(0, 2) || 'AD'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Progress / Notifications Bar */}
                {syncStatus?.status === 'running' && (
                    <div className="px-8 mt-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="bg-[#ff2442]/5 border border-[#ff2442]/10 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#ff2442]/20 flex items-center justify-center text-[#ff2442]">
                                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#ff2442]">Asset Ingestion Active</span>
                                    <span className="text-xs font-bold text-[#ff2442]">62%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#ff2442] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,36,66,0.5)]" style={{ width: '62%' }} />
                                </div>
                                <div className="text-[10px] text-white/30 mt-2 font-medium uppercase tracking-wider">{syncStatus.progress || 'Syncing cloud and physical libraries...'}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {/* Retro-compatibility with left/right panels if needed, 
                        but primarily renders as children in the new layout */}
                    {children}
                    {leftPanel && rightPanel && (
                        <div className="flex gap-8 h-full">
                            <div className="flex-1 min-w-0">{leftPanel}</div>
                            <div className="w-[400px] flex-shrink-0">{rightPanel}</div>
                        </div>
                    )}
                </main>
            </div>
            <Toast />
        </div>
    );
}
