import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export default function Toast() {
    const { flash } = usePage().props;
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (flash?.success) addMessage(flash.success, 'success');
        if (flash?.error)   addMessage(flash.error, 'error');
    }, [flash]);

    const addMessage = (text, type) => {
        const id = Date.now();
        setMessages(prev => [...prev, { id, text, type }]);
        setTimeout(() => removeMessage(id), 5000);
    };

    const removeMessage = (id) => {
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    if (messages.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-3">
            {messages.map(msg => (
                <div 
                    key={msg.id} 
                    className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right-8 fade-in duration-300 border ${
                        msg.type === 'success' ? 'bg-[#111118] border-green-500/20 text-white' : 'bg-[#e8003d] border-[#ff0044] text-white shadow-red-500/20'
                    }`}
                >
                    {msg.type === 'success' ? (
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </div>
                    )}
                    <span className="text-[13px] font-medium tracking-wide leading-tight max-w-[300px]">{msg.text}</span>
                    <button onClick={() => removeMessage(msg.id)} className="ml-2 text-white/50 hover:text-white transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            ))}
        </div>
    );
}
