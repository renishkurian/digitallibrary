import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    if (links.length <= 3) return null;

    return (
        <div className="pagination">
            <nav className="flex items-center gap-2">
                {links.map((link, index) => (
                    link.url ? (
                        <Link
                            key={index}
                            href={link.url}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${
                                link.active 
                                    ? 'text-white font-medium bg-[#e8003d]/20' 
                                    : 'text-[#8888a0] hover:text-[#e8003d]'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={index}
                            className="px-3 py-1 text-sm text-[#8888a0]/40 cursor-default"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    )
                ))}
            </nav>
        </div>
    );
}
