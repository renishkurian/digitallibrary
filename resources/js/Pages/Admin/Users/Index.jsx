import { useState, useRef, useEffect } from 'react';
import { useForm, Head, Link, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import Pagination from '@/Components/Pagination';

const ROLE_COLORS = {
    admin:  'bg-[#e8003d] text-white shadow-[#e8003d]/20',
    viewer: 'bg-white/10 text-[#8888a0]',
};

function RoleDropdown({ user, roles, onChange, pending }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const activeRole = user.roles[0] || 'viewer';

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (role) => {
        if (role !== activeRole) onChange(role);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                onClick={() => !pending && setIsOpen(!isOpen)}
                disabled={pending}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 transition-all duration-300 font-black text-[9px] uppercase tracking-[1.5px] min-w-[110px] justify-between group/btn ${isOpen ? 'bg-white/10 border-white/20' : 'bg-white/5 hover:bg-white/10'} ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${activeRole === 'admin' ? 'bg-[#e8003d] animate-pulse' : 'bg-[#8888a0]'}`} />
                    <span className="text-white">{activeRole}</span>
                </div>
                <svg 
                    className={`w-3 h-3 transition-transform duration-500 ${isOpen ? 'rotate-180 text-[#e8003d]' : 'text-[#44445a]'}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"
                >
                    <path d="m6 9 6 6 6-6"/>
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#16161f]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-2 flex flex-col gap-1">
                        {roles.map(role => (
                            <button
                                key={role}
                                onClick={() => handleSelect(role)}
                                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all duration-200 ${role === activeRole ? 'bg-[#e8003d]/10 text-white' : 'text-[#8888a0] hover:bg-white/5 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${role === 'admin' ? 'bg-[#e8003d]' : 'bg-[#8888a0] opacity-50'} ${role === activeRole ? 'scale-125' : ''}`} />
                                    {role}
                                </div>
                                {role === activeRole && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8003d" strokeWidth="4"><path d="M20 6L9 17L4 12"/></svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Index({ users, roles, auth }) {
    const [editingUser, setEditingUser]   = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data: editData, setData: setEditData, post: postEdit, processing: editing, reset: resetEdit } = useForm({
        name: '', email: '',
    });

    const { post: postRole, processing: rolePending } = useForm();

    const handleEdit = (user) => {
        setEditingUser(user);
        setEditData({ name: user.name, email: user.email });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        postEdit(route('admin.users.update', editingUser.id), {
            onSuccess: () => { setEditingUser(null); resetEdit(); },
        });
    };

    const changeRole = (user, role) => {
        router.post(route('admin.users.role', user.id), { role }, { preserveScroll: true });
    };

    const confirmDelete = (user) => setDeleteTarget(user);

    const doDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('admin.users.destroy', deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <ComicLayout auth={auth}>
            <Head title="User Management" />

            <div className="max-w-7xl mx-auto flex flex-col gap-4 animate-in fade-in duration-700">
                {/* Header - More Compact */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-1 h-6 bg-gradient-to-b from-[#e8003d] to-transparent rounded-full" />
                            <h1 className="font-['Bebas_Neue'] text-4xl tracking-[3px] text-white leading-none">
                                USER <span className="text-[#e8003d]">MANAGEMENT</span>
                            </h1>
                        </div>
                        <p className="text-[#8888a0] text-xs tracking-wide font-medium">
                            Monitoring <span className="text-white">{users.total}</span> registered members
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link 
                            href={route('admin.comics.index')} 
                            className="group flex items-center gap-2 bg-white/5 border border-white/10 text-white px-5 py-2 rounded-xl text-[10px] uppercase tracking-[2px] font-black hover:bg-[#e8003d] hover:border-[#e8003d] transition-all duration-300 shadow-lg"
                        >
                            <span>Manage Comics</span>
                            <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { 
                            label: 'Total Users', 
                            value: users.total, 
                            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
                            color: 'text-blue-400',
                            glow: 'hover:border-blue-500/30'
                        },
                        { 
                            label: 'Admins', 
                            value: users.data.filter(u => u.is_admin).length, 
                            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
                            color: 'text-[#e8003d]',
                            glow: 'hover:border-[#e8003d]/30'
                        },
                        { 
                            label: 'Viewers', 
                            value: users.data.filter(u => !u.is_admin).length, 
                            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
                            color: 'text-emerald-400',
                            glow: 'hover:border-emerald-500/30'
                        },
                        { 
                            label: 'Recent Users', 
                            value: users.data.length, 
                            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
                            color: 'text-amber-400',
                            glow: 'hover:border-amber-500/30'
                        },
                    ].map((stat, idx) => (
                        <div 
                            key={stat.label} 
                            className={`bg-[#16161f]/40 backdrop-blur-xl border border-white/5 rounded-xl p-3 flex flex-col justify-between h-24 transition-all duration-500 overflow-hidden group ${stat.glow} hover:-translate-y-0.5 hover:shadow-2xl hover:bg-[#16161f]/60`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex justify-between items-start">
                                <div className={`p-1.5 rounded-lg bg-white/5 ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                                    {stat.icon}
                                </div>
                                <div className="text-2xl font-['Bebas_Neue'] text-white tracking-widest">{stat.value}</div>
                            </div>
                            <div>
                                <div className="text-[8px] text-[#8888a0] uppercase tracking-[1.5px] font-black">{stat.label}</div>
                                <div className="w-4 h-0.5 bg-gradient-to-r from-current to-transparent mt-1 opacity-40 transition-all group-hover:w-full" style={{ color: stat.color }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Users Table Card - Ultra Dense & Fix Clipping */}
                <div className="bg-[#16161f]/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
                    <div className="p-0.5 sm:p-1.5 overflow-visible">
                        <div className="overflow-x-auto md:overflow-visible">
                            <table className="min-w-full border-separate border-spacing-y-1.5 px-2">
                                <thead>
                                    <tr className="text-[#55556a]">
                                        {['User Profile', 'Email Address', 'Permission Level', 'Read', 'Activity', 'Created', ''].map((h, i) => (
                                            <th key={h} className={`px-3 py-2 text-left text-[8px] font-black uppercase tracking-[1.5px] ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user, idx) => (
                                        <tr 
                                            key={user.id} 
                                            className="group bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 rounded-2xl relative z-[10] hover:z-[50]"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <td className="px-3 py-2 first:rounded-l-xl">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#e8003d] to-[#ff6b35] flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-[#e8003d]/20 ring-1 ring-white/10 group-hover:ring-[#e8003d]/50 transition-all duration-500">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-xs tracking-tight">{user.name}</div>
                                                        <div className="text-[8px] text-[#55556a] uppercase tracking-wider">ID: {user.id.toString().padStart(4, '0')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-[#8888a0] text-xs font-medium">{user.email}</td>
                                            <td className="px-3 py-2">
                                                <RoleDropdown 
                                                    user={user} 
                                                    roles={roles} 
                                                    onChange={(role) => changeRole(user, role)}
                                                    pending={rolePending}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-black text-xs tabular-nums">{user.read_comics_count}</span>
                                                    <span className="text-[8px] text-[#55556a] uppercase font-black tracking-wider">Titles</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-[#8888a0] text-[9px] font-bold tracking-wide">
                                                {user.last_login_at ? (
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                        {user.last_login_at}
                                                    </div>
                                                ) : (
                                                    <span className="text-[#44445a] italic">Inactive</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-[#8888a0] text-[9px] font-bold">{user.created_at}</td>
                                            <td className="px-3 py-2 text-right last:rounded-r-xl">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={() => handleEdit(user)} 
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-[#8888a0] hover:text-white hover:bg-[#e8003d] transition-all duration-300"
                                                        title="Edit User"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => confirmDelete(user)} 
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#e8003d]/5 text-[#e8003d]/60 hover:text-white hover:bg-[#e8003d] transition-all duration-300"
                                                        title="Delete User"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 py-4 border-t border-white/5 flex justify-center">
                            <Pagination links={users.links} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals with Premium Blur */}
            {editingUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-500 animate-in fade-in">
                    <div className="absolute inset-0 bg-black/40" onClick={() => { setEditingUser(null); resetEdit(); }} />
                    <div className="relative bg-[#111118]/90 border border-white/10 rounded-[2.5rem] p-10 w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#e8003d]">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                            </div>
                            <h2 className="text-3xl font-['Bebas_Neue'] tracking-[3px] text-white">Edit <span className="text-[#e8003d]">Profile</span></h2>
                        </div>
                        
                        <form onSubmit={submitEdit} className="grid gap-8">
                            <div className="grid gap-3">
                                <label className="text-[10px] uppercase tracking-[3px] font-black text-[#55556a] ml-1">Full Name</label>
                                <input 
                                    type="text" 
                                    value={editData.name} 
                                    onChange={e => setEditData('name', e.target.value)} 
                                    className="bg-white/5 border-2 border-white/5 text-white rounded-[1.25rem] px-5 py-4 outline-none focus:border-[#e8003d] focus:bg-white/[0.08] transition-all duration-300 font-medium placeholder:text-[#3a3a4a]"
                                    placeholder="Enter user name"
                                />
                            </div>
                            <div className="grid gap-3">
                                <label className="text-[10px] uppercase tracking-[3px] font-black text-[#55556a] ml-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={editData.email} 
                                    onChange={e => setEditData('email', e.target.value)} 
                                    className="bg-white/5 border-2 border-white/5 text-white rounded-[1.25rem] px-5 py-4 outline-none focus:border-[#e8003d] focus:bg-white/[0.08] transition-all duration-300 font-medium placeholder:text-[#3a3a4a]"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button 
                                    type="submit" 
                                    disabled={editing} 
                                    className="flex-1 bg-[#e8003d] text-white py-4 rounded-[1.25rem] font-black text-[12px] uppercase tracking-[3px] hover:bg-[#ff0044] hover:shadow-2xl hover:shadow-[#e8003d]/40 transition-all duration-300 disabled:opacity-50"
                                >
                                    {editing ? 'Applying Changes...' : 'Save Settings'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => { setEditingUser(null); resetEdit(); }} 
                                    className="px-8 bg-white/5 text-white rounded-[1.25rem] font-black text-[12px] uppercase tracking-[3px] hover:bg-white/10 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation - Pro Style */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-[#111118] border-2 border-[#e8003d]/20 rounded-[3rem] p-12 w-full max-w-md shadow-[0_0_150px_rgba(232,0,61,0.15)] text-center animate-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-[#e8003d]/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 ring-8 ring-[#e8003d]/5 text-[#e8003d]">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        </div>
                        <h2 className="text-4xl font-['Bebas_Neue'] tracking-[4px] text-white mb-4">REMOVE <span className="text-[#e8003d]">USER?</span></h2>
                        <p className="text-[#8888a0] text-sm leading-relaxed mb-10 px-4">
                            You are about to permanently delete <span className="text-white font-black">{deleteTarget.name}</span>. This action is irreversible.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={doDelete} 
                                className="w-full bg-[#e8003d] text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[3px] hover:bg-[#ff0044] shadow-xl shadow-[#e8003d]/20 transition-all duration-300"
                            >
                                Confirm Deletion
                            </button>
                            <button 
                                onClick={() => setDeleteTarget(null)} 
                                className="w-full bg-white/5 text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[3px] hover:bg-white/10 transition-all duration-300"
                            >
                                Defer Removal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ComicLayout>
    );
}
