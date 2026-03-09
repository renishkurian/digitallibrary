import { useEffect } from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', confirmStyle = 'danger' }) {
    if (!isOpen) return null;

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onCancel]);

    const getConfirmClass = () => {
        if (confirmStyle === 'danger') return "bg-[#e8003d] text-white hover:bg-[#ff0044] shadow-lg shadow-[#e8003d]/20";
        if (confirmStyle === 'primary') return "bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20";
        return "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20";
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-[#111118] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white">{title}</h3>
                    {confirmStyle === 'danger' && (
                        <div className="w-8 h-8 rounded-full bg-[#e8003d]/10 flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8003d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </div>
                    )}
                </div>
                <p className="text-[#8888a0] text-sm mb-8 leading-relaxed">
                    {message}
                </p>
                <div className="flex gap-3 justify-end items-center">
                    <button 
                        onClick={onCancel} 
                        className="px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest text-[#8888a0] hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }} 
                        className={`px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${getConfirmClass()}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
