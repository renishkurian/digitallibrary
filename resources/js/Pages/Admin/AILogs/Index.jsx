import { useState } from 'react';
import { Head } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import Pagination from '@/Components/Pagination';

export default function Index({ auth, logs }) {
    const [selectedLog, setSelectedLog] = useState(null);
    return (
        <ComicLayout
            auth={auth}
            header={<h2 className="font-semibold text-xl text-gray-200 leading-tight">AI Logs</h2>}
        >
            <Head title="AI Logs" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-[#16161f] border border-white/5 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-100">
                            
                            <div className="mb-6 flex justify-between items-center">
                                <h3 className="text-lg font-bold">API Usage & Prompts</h3>
                                <div className="text-sm text-gray-400">
                                    Displaying {logs.data.length} of {logs.total} logs
                                </div>
                            </div>

                            <div className="overflow-x-auto bg-[#0a0a0f] rounded-lg border border-white/5">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-[11px] uppercase bg-white/5 text-gray-400 border-b border-white/10 font-bold tracking-wider">
                                        <tr>
                                            <th className="px-5 py-4">Time</th>
                                            <th className="px-5 py-4">User</th>
                                            <th className="px-5 py-4">Action</th>
                                            <th className="px-5 py-4">Provider / Model</th>
                                            <th className="px-5 py-4 w-1/3">Prompt Preview</th>
                                            <th className="px-5 py-4">Tokens</th>
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
                                                    {log.user ? (
                                                        <div>
                                                            <div className="text-white">{log.user.name}</div>
                                                            <div className="text-[10px] text-gray-500">{log.user.email}</div>
                                                        </div>
                                                    ) : <span className="text-gray-500 italic">System</span>}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold tracking-wider border border-blue-500/20">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="text-purple-400 font-medium capitalize">{log.provider}</div>
                                                    <div className="text-[10px] text-gray-500">{log.model}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="text-[11px] text-gray-400 truncate max-w-xs" title={log.prompt}>
                                                        {log.prompt}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 font-mono text-[12px] text-yellow-500">
                                                        <span>{log.tokens_used.toLocaleString()}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {logs.data.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-5 py-8 text-center text-gray-500">
                                                    No AI usage logs found.
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
                    <div className="relative bg-[#111118] border border-purple-500/30 rounded-2xl p-8 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div>
                                <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">Log Details</h2>
                                <p className="text-sm text-[#8888a0] mt-1">
                                    <span className="text-purple-400 capitalize">{selectedLog.provider}</span> ({selectedLog.model}) • {selectedLog.tokens_used.toLocaleString()} tokens
                                </p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-[#8888a0] hover:text-white">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 pr-2 space-y-6">
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#8888a0] mb-2">Prompt</h4>
                                <pre className="bg-[#0a0a0f] text-[#e2e8f0] p-4 rounded-xl border border-white/5 text-[11px] whitespace-pre-wrap font-mono leading-relaxed">
                                    {selectedLog.prompt}
                                </pre>
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#8888a0] mb-2">Response</h4>
                                <pre className="bg-[#0a0a0f] text-[#4ade80] p-4 rounded-xl border border-white/5 text-[11px] whitespace-pre-wrap font-mono leading-relaxed">
                                    {selectedLog.response}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ComicLayout>
    );
}
