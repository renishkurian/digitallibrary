import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';

export default function ReadingStats({ auth, comicStats, dailyLogs }) {
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        let parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0 || parts.length === 0) parts.push(`${s}s`);
        
        return parts.join(' ');
    };

    const totalSeconds = comicStats.reduce((sum, c) => sum + c.total_seconds, 0);

    return (
        <ComicLayout auth={auth}>
            <Head title="Reading Stats & Logs" />

            <div className="max-w-6xl mx-auto py-10 px-6">
                <header className="mb-12 border-b border-white/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="font-['Bebas_Neue'] text-[48px] tracking-[3px] uppercase text-white leading-none mb-2">
                            Reading <span className="text-[#e8003d]">Analytics</span>
                        </h1>
                        <p className="text-[#8888a0] text-[14px] font-medium tracking-wide">
                            Track your journey through the digital archives
                        </p>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-black text-[#55556a] uppercase tracking-[2px] mb-1">Total Time Spent</span>
                            <span className="text-[24px] font-['Bebas_Neue'] text-white tracking-[1px]">{formatTime(totalSeconds)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-black text-[#55556a] uppercase tracking-[2px] mb-1">Comics Read</span>
                            <span className="text-[24px] font-['Bebas_Neue'] text-[#e8003d] tracking-[1px]">{comicStats.length}</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Comic Breakdown */}
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <section>
                            <h3 className="text-[14px] font-['Bebas_Neue'] tracking-[3px] uppercase text-white/90 mb-6 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-[#e8003d] rounded-full"></div>
                                Time Per Book
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {comicStats.map(comic => (
                                    <div key={comic.id} className="bg-white/4 border border-white/7 rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-white/6 hover:border-white/12">
                                        <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden border border-white/10 shrink-0 shadow-lg">
                                            <img 
                                                src={comic.thumbnail ? `/thumbs/${comic.thumbnail}` : '/img/no-thumb.jpg'} 
                                                alt={comic.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link href={route('comics.show', comic.id)} className="text-[15px] font-bold text-white hover:text-[#e8003d] transition-colors truncate block mb-1">
                                                {comic.title}
                                            </Link>
                                            <div className="flex items-center gap-3 text-[12px] text-[#8888a0]">
                                                <span className="flex items-center gap-1.5">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                    {formatTime(comic.total_seconds)}
                                                </span>
                                                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                                <span>PAGE {comic.last_page}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-[10px] font-black text-[#55556a] uppercase tracking-wider mb-0.5">Last Active</div>
                                            <div className="text-[12px] text-white/70 font-medium">{comic.last_read}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Daily Log */}
                    <div className="flex flex-col gap-8">
                        <section>
                            <h3 className="text-[14px] font-['Bebas_Neue'] tracking-[3px] uppercase text-white/90 mb-6 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                Daily Activity
                            </h3>
                            <div className="flex flex-col gap-4">
                                {dailyLogs.length === 0 ? (
                                    <div className="text-center py-12 bg-white/3 border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-[#66667a] text-[13px] font-medium">No activity recorded for the last 30 days.</p>
                                    </div>
                                ) : (
                                    dailyLogs.map(log => (
                                        <div key={log.date} className="bg-white/3 border border-white/7 rounded-2xl overflow-hidden">
                                            <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/5">
                                                <span className="text-[12px] font-bold text-white">{log.date}</span>
                                                <span className="text-[11px] font-black text-[#e8003d] tracking-widest uppercase">{formatTime(log.total_seconds)}</span>
                                            </div>
                                            <div className="p-3 flex flex-col gap-2">
                                                {log.comics.map(c => (
                                                    <div key={c.id} className="flex items-center justify-between text-[11px]">
                                                        <span className="text-[#a0a0b8] truncate flex-1 min-w-0">{c.title}</span>
                                                        <span className="text-white/40 ml-2 shrink-0">{formatTime(c.seconds)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </ComicLayout>
    );
}
