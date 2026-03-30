import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

const SearchableSelect = ({ 
    value, 
    options, 
    onChange, 
    placeholder = "Select an option...", 
    emptyMessage = "No results found.",
    className = "" 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    // Flatten options if they have children (for hierarchical support)
    const flattenedOptions = React.useMemo(() => {
        const result = [];
        options.forEach(opt => {
            result.push({ ...opt, isGroup: !!opt.children });
            if (opt.children) {
                opt.children.forEach(child => {
                    result.push({ ...child, parentId: opt.id, isChild: true });
                });
            }
        });
        return result;
    }, [options]);

    const filteredOptions = flattenedOptions.filter(opt => 
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = flattenedOptions.find(opt => opt.id == value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toTitleCase = (str) => {
        return str.replace(/[-_]/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`bg-white/5 border border-white/8 text-white text-[12px] py-1.5 pl-3 pr-8 rounded-lg outline-none cursor-pointer flex items-center justify-between min-w-[160px] hover:bg-white/10 transition-all ${isOpen ? 'border-[#e8003d]/50 ring-1 ring-[#e8003d]/20' : ''}`}
            >
                <span className={!selectedOption ? 'text-[#44445a]' : ''}>
                    {selectedOption ? toTitleCase(selectedOption.name) : placeholder}
                </span>
                <ChevronDown size={14} className={`text-[#44445a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0e0e16] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 border-b border-white/5 relative">
                        <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#44445a]" />
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-[11px] text-white outline-none focus:border-[#e8003d]/40 transition-all"
                        />
                    </div>
                    
                    <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1">
                        <div 
                            onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer text-[11px] transition-all hover:bg-white/5 ${!value ? 'text-[#e8003d] font-bold bg-[#e8003d]/5' : 'text-[#8888a0]'}`}
                        >
                            <span>Clear Selection (All)</span>
                            {!value && <Check size={10} />}
                        </div>
                        
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div 
                                    key={`${opt.id}-${opt.isChild}`}
                                    onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(''); }}
                                    className={`
                                        flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer text-[11px] transition-all
                                        ${opt.isGroup ? 'mt-1 mb-0.5 pointer-events-none opacity-40 uppercase tracking-widest font-black text-[9px]' : 'hover:bg-white/5'}
                                        ${opt.isChild ? 'pl-6' : ''}
                                        ${value == opt.id ? 'text-[#e8003d] font-bold bg-[#e8003d]/5' : 'text-[#8888a0]'}
                                    `}
                                >
                                    <span>{toTitleCase(opt.name)}</span>
                                    {value == opt.id && <Check size={10} />}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-[#44445a] text-[11px] italic">
                                {emptyMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
