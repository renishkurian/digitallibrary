import { useState, useRef, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function Index({ auth, provider, model }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `Hello! I am connected to your database. You can ask me to fetch the top read comics, search for a specific title, or update a comic's summary. What would you like to do?` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post(route('admin.ai-playground.query'), { prompt: userMsg.content });
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.answer
            }]);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to communicate with AI');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${error.response?.data?.error || 'Failed to process request. Ensure you are using OpenAI and have an API key configured.'}`,
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComicLayout
            auth={auth}
            header={<h2 className="font-semibold text-xl text-gray-200 leading-tight">AI Playground</h2>}
        >
            <Head title="AI Playground" />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="mb-4 flex items-center gap-3">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-[11px] font-bold tracking-wider uppercase">
                            Provider: {provider}
                        </span>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[11px] font-bold tracking-wider uppercase">
                            Model: {model}
                        </span>
                        {provider !== 'openai' && provider !== 'custom' && (
                            <span className="px-3 py-1 bg-[#e8003d]/20 text-[#e8003d] border border-[#e8003d]/30 rounded-full text-[11px] font-bold tracking-wider uppercase">
                                Warning: Tool calling may fail
                            </span>
                        )}
                    </div>

                    <div className="bg-[#16161f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
                        
                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl p-4 shadow-lg ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-sm' 
                                            : msg.isError 
                                                ? 'bg-[#e8003d]/20 border border-[#e8003d]/30 text-[#e8003d] rounded-bl-sm'
                                                : 'bg-[#21212c] border border-white/5 text-gray-200 rounded-bl-sm'
                                    }`}>
                                        <div className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-1">
                                            {msg.role === 'user' ? 'You' : 'AI Assistant'}
                                        </div>
                                        <div className="text-[14px] leading-relaxed whitespace-pre-wrap font-['DM_Sans']">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#21212c] border border-white/5 rounded-2xl rounded-bl-sm p-4 w-20 flex justify-center shadow-lg">
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#0a0a0f] border-t border-white/5">
                            <form onSubmit={handleSubmit} className="flex gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="e.g. Give me a summary of the most read comic."
                                    className="flex-1 bg-[#16161f] border border-white/10 rounded-xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="px-6 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(37,99,235,0.3)]"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </form>
                        </div>

                    </div>
                    
                </div>
            </div>
        </ComicLayout>
    );
}
