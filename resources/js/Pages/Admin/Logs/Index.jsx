import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import Pagination from '@/Components/Pagination';

export default function Index({ auth, logs, filters }) {
    const [selectedLog, setSelectedLog] = useState(null);
    const [search, setSearch] = useState(filters.q || '');
    const [level, setLevel] = useState(filters.level || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.logs.index'), { q: search, level }, { preserveState: true });
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'error': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'warning': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        }
    };

    return (
        <ComicLayout
            auth={auth}
            header={<h2 className="font-semibold text-xl text-gray-200 leading-tight">System Activity Logs</h2>}
        >
            <Head title="System Logs" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-[#16161f] border border-white/5 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-100">
                            
                            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                                    <input 
                                        type="text" 
                                        placeholder="Search logs..." 
                                        className="bg-[#0a0a0f] border-white/10 text-gray-200 rounded-lg text-sm w-full md:w-64 focus:ring-purple-500 focus:border-purple-500"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    <select 
                                        className="bg-[#0a0a0f] border-white/10 text-gray-200 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
                                        value={level}
                                        onChange={e => {
                                            setLevel(e.target.value);
                                            router.get(route('admin.logs.index'), { q: search, level: e.target.value }, { preserveState: true });
                                        }}
                                    >
                                        <option value="">All Levels</option>
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="error">Error</option>
                                    </select>
                                    <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors font-bold uppercase tracking-wider">
                                        Filter
                                    </button>
                                </form>
                                <div className="text-sm text-gray-400">
                                    Displaying {logs.data.length} of {logs.total} logs
                                </div>
                            </div>

                            <div className="overflow-x-auto bg-[#0a0a0f] rounded-lg border border-white/5">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-[11px] uppercase bg-white/5 text-gray-400 border-b border-white/10 font-bold tracking-wider">
                                        <tr>
                                            <th className="px-5 py-4">Time</th>
                                            <th className="px-5 py-4">Level</th>
                                            <th className="px-5 py-4">Message</th>
                                            <th className="px-5 py-4">Context</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {logs.data.map(log => (
                                            <tr 
                                                key={log.id} 
                                                className="hover:bg-white/5 transition-colors cursor-pointer"
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                <td className="px-5 py-4 font-mono text-[11px] text-[#8888a0] whitespace-nowrap">
                                                    {log.created_at}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border ${getLevelColor(log.level)}`}>
                                                        {log.level}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="text-gray-200 line-clamp-2 max-w-lg">
                                                        {log.message}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {log.context ? (
                                                        <div className="text-[10px] text-gray-500 font-mono">
                                                            {JSON.stringify(log.context).substring(0, 50)}...
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))}

                                        {logs.data.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-5 py-8 text-center text-gray-500">
                                                    No activity logs found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6">
                                <Pagination links={logs.links} />
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {selectedLog && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
                    <div className="relative bg-[#111118] border border-purple-500/30 rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div>
                                <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">Log Details</h2>
                                <p className="text-sm text-[#8888a0] mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border mr-2 ${getLevelColor(selectedLog.level)}`}>
                                        {selectedLog.level}
                                    </span>
                                    {selectedLog.created_at}
                                </p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-[#8888a0] hover:text-white">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 pr-2 space-y-6">
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#8888a0] mb-2">Message</h4>
                                <div className="bg-[#0a0a0f] text-[#e2e8f0] p-4 rounded-xl border border-white/5 text-sm leading-relaxed">
                                    {selectedLog.message}
                                </div>
                            </div>
                            {selectedLog.context && (
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#8888a0] mb-2">Context (JSON)</h4>
                                    <pre className="bg-[#0a0a0f] text-purple-400 p-4 rounded-xl border border-white/5 text-[11px] whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                                        {JSON.stringify(selectedLog.context, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </ComicLayout>
    );
}
