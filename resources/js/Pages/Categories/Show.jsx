import { Head, Link } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import ComicCard from '@/Components/ComicCard';
import Pagination from '@/Components/Pagination';

export default function Show({ category, comics, breadcrumbs, auth }) {
    return (
        <ComicLayout auth={auth} title={category.name}>
            <Head title={`${category.name} - Category`} />
            
            <div className="flex flex-col gap-8">
                <div className="category-header">
                    <nav className="flex items-center gap-2 mb-4">
                        <Link href={route('comics.index')} className="text-[11px] tracking-widest uppercase font-bold text-[#8888a0] hover:text-white transition-colors">Library</Link>
                        {breadcrumbs.map((crumb, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-[#333345] text-[10px] mt-0.5">/</span>
                                <Link 
                                    href={route('categories.show', crumb.slug)}
                                    className={`text-[11px] tracking-widest uppercase font-bold transition-colors ${index === breadcrumbs.length - 1 ? 'text-[#e8003d]' : 'text-[#8888a0] hover:text-white'}`}
                                >
                                    {crumb.name}
                                </Link>
                            </div>
                        ))}
                    </nav>
                    
                    <h1 className="text-4xl font-['Bebas_Neue'] tracking-[3px] text-white">
                        Category: {category.name}
                    </h1>
                    {category.description && (
                        <p className="text-[#8888a0] text-sm mt-3 max-w-2xl leading-relaxed">
                            {category.description}
                        </p>
                    )}
                </div>

                <div className="comic-grid flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-white/7 pb-4">
                        <h2 className="text-[11px] tracking-[3px] uppercase font-black text-[#55556a]">Comics in this category</h2>
                        <span className="text-[11px] tracking-wider text-[#8888a0] font-medium">{comics.total} items</span>
                    </div>

                    {comics.data.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-5">
                                {comics.data.map((comic) => (
                                    <ComicCard key={comic.id} comic={comic} auth={auth} />
                                ))}
                            </div>
                            <div className="mt-10">
                                <Pagination links={comics.links} />
                            </div>
                        </>
                    ) : (
                        <div className="py-20 flex flex-col items-center text-[#8888a0]">
                            <p>No comics found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </ComicLayout>
    );
}
