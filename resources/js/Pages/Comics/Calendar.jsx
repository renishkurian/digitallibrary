import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function Calendar({ comicsByDate, month, year, auth }) {
    const [currentMonth, setCurrentMonth] = useState(parseInt(month));
    const [currentYear, setCurrentYear] = useState(parseInt(year));

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const handlePreviousMonth = () => {
        let newMonth = currentMonth - 1;
        let newYear = currentYear;
        if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }
        router.get(route('comics.calendar'), { month: newMonth, year: newYear }, { preserveScroll: true });
    };

    const handleNextMonth = () => {
        let newMonth = currentMonth + 1;
        let newYear = currentYear;
        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        }
        router.get(route('comics.calendar'), { month: newMonth, year: newYear }, { preserveScroll: true });
    };

    const handleToday = () => {
        const today = new Date();
        router.get(route('comics.calendar'), { month: today.getMonth() + 1, year: today.getFullYear() }, { preserveScroll: true });
    };

    const renderDays = () => {
        const days = [];
        // Empty slots for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-base-100/30 rounded-lg shadow-inner"></div>);
        }

        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayComics = comicsByDate[dateStr] || [];
            
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div key={d} className={`min-h-[120px] bg-base-100 rounded-lg shadow border transition-colors ${isToday ? 'border-primary ring-1 ring-primary/50' : 'border-base-300 hover:border-primary/50'}`}>
                    <div className={`p-2 font-bold text-sm ${isToday ? 'text-primary bg-primary/10 rounded-t-lg' : 'text-base-content/70'}`}>
                        {d}
                    </div>
                    <div className="p-2 pt-0 max-h-[150px] overflow-y-auto no-scrollbar flex flex-col gap-2">
                        {dayComics.map(comic => (
                            <Link 
                                href={route('comics.show', comic.id)}
                                key={comic.id} 
                                className="flex items-center gap-2 group p-1 rounded hover:bg-base-200 transition-colors"
                            >
                                <div className="w-8 h-10 flex-shrink-0 bg-base-300 rounded overflow-hidden">
                                    {comic.thumbnail ? (
                                        <img src={`/thumbs/${comic.thumbnail}`} alt={comic.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" loading="lazy" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-base-content/50">No Cover</div>
                                    )}
                                </div>
                                <span className="text-xs font-medium truncate group-hover:text-primary transition-colors">{comic.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    return (
        <ComicLayout auth={auth}>
            <Head title="Calendar" />
            
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <CalendarIcon className="w-8 h-8 text-primary" />
                            Release Calendar
                        </h1>
                        <p className="text-base-content/70 mt-1">Discover comics by the date they were added</p>
                    </div>

                    <div className="flex items-center gap-2 bg-base-200 p-1 rounded-xl shadow-sm border border-base-300">
                        <button 
                            onClick={handlePreviousMonth}
                            className="btn btn-sm btn-ghost btn-square"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <button 
                            onClick={handleToday}
                            className="btn btn-sm btn-ghost px-4 font-bold min-w-[150px]"
                        >
                            {monthNames[currentMonth - 1]} {currentYear}
                        </button>
                        
                        <button 
                            onClick={handleNextMonth}
                            className="btn btn-sm btn-ghost btn-square"
                            aria-label="Next month"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center font-bold text-sm text-base-content/50 py-2 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2 lg:gap-3">
                    {renderDays()}
                </div>
            </div>
        </ComicLayout>
    );
}
