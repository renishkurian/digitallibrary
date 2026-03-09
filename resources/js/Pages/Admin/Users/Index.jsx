import { useState } from 'react';
import { useForm, Head, Link, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import Pagination from '@/Components/Pagination';

const ROLE_COLORS = {
    admin:  'text-[#e8003d] border-[#e8003d]/40 focus:border-[#e8003d]',
    viewer: 'text-[#8888a0] border-white/10 focus:border-white/40',
};

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

            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-['Bebas_Neue'] text-4xl tracking-[3px] text-white">
                            User <span className="text-[#e8003d]">Management</span>
                        </h1>
                        <p className="text-[#8888a0] text-sm mt-1">{users.total} registered users</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href={route('admin.comics.index')} className="bg-[#e8003d] text-white px-6 py-2.5 rounded-xl text-[11px] uppercase tracking-widest font-black hover:bg-[#ff0044] transition-all shadow-lg shadow-[#e8003d]/20">
                            Manage Comics
                        </Link>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Users', value: users.total, icon: '👥', glow: 'bg-blue-500/10' },
                        { label: 'Admins', value: users.data.filter(u => u.is_admin).length, icon: '🛡️', glow: 'bg-[#e8003d]/10' },
                        { label: 'Viewers', value: users.data.filter(u => !u.is_admin).length, icon: '👁️', glow: 'bg-green-500/10' },
                        { label: 'This Page', value: users.data.length, icon: '📄', glow: 'bg-purple-500/10' },
                    ].map(stat => (
                        <div key={stat.label} className="relative bg-[#16161f] border border-white/7 rounded-2xl p-5 flex items-center gap-4 overflow-hidden group">
                            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl transition-opacity opacity-0 group-hover:opacity-100 ${stat.glow}`} />
                            <span className="text-3xl relative">{stat.icon}</span>
                            <div className="relative">
                                <div className="text-2xl font-['Bebas_Neue'] text-white tracking-wider">{stat.value}</div>
                                <div className="text-[10px] text-[#8888a0] uppercase tracking-widest font-bold">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Users Table */}
                <div className="bg-[#16161f] border border-white/7 rounded-2xl overflow-hidden">
                    <div className="p-6 overflow-x-auto">
                        <table className="min-w-full" style={{ minWidth: '700px' }}>
                            <thead>
                                <tr className="border-b border-white/7">
                                    {['User', 'Email', 'Role', 'Read', 'Last Login', 'Joined', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-4 text-left text-[11px] font-black text-[#a0a0b8] uppercase tracking-widest whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.data.map(user => (
                                    <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e8003d] to-[#ff6b35] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-white font-medium text-sm">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-[#8888a0] text-sm">{user.email}</td>
                                        <td className="px-4 py-4">
                                            <div className="relative inline-block group/select">
                                                <select
                                                    value={user.roles[0] || 'viewer'}
                                                    onChange={e => changeRole(user, e.target.value)}
                                                    disabled={rolePending}
                                                    className={`appearance-none text-[10px] font-black uppercase tracking-[2px] pr-8 pl-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all bg-[#111118]/50 ${ROLE_COLORS[user.roles[0]] || ROLE_COLORS.viewer}`}
                                                >
                                                    {roles.map(role => (
                                                        <option key={role} value={role} className="bg-[#111118] text-white">
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#55556a] group-hover/select:text-white transition-colors">
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-[#8888a0] text-sm tabular-nums">{user.read_comics_count}</td>
                                        <td className="px-4 py-4 text-[#8888a0] text-[11px] font-medium whitespace-nowrap">
                                            {user.last_login_at || <span className="text-[#44445a]">Never Logged In</span>}
                                        </td>
                                        <td className="px-4 py-4 text-[#8888a0] text-[11px] font-medium whitespace-nowrap">{user.created_at}</td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(user)} 
                                                    className="p-2 rounded-lg bg-white/5 text-[#8888a0] hover:text-white hover:bg-white/10 transition-all"
                                                    title="Edit User"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button 
                                                    onClick={() => confirmDelete(user)} 
                                                    className="p-2 rounded-lg bg-[#e8003d]/5 text-[#e8003d]/60 hover:text-[#e8003d] hover:bg-[#e8003d]/10 transition-all"
                                                    title="Delete User"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-8 flex justify-center">
                            <Pagination links={users.links} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setEditingUser(null); resetEdit(); }} />
                    <div className="relative bg-[#111118] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-['Bebas_Neue'] tracking-widest text-white mb-6">Edit User</h2>
                        <form onSubmit={submitEdit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-[#8888a0]">Name</label>
                                <input type="text" value={editData.name} onChange={e => setEditData('name', e.target.value)} className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-[#8888a0]">Email</label>
                                <input type="email" value={editData.email} onChange={e => setEditData('email', e.target.value)} className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors" />
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button type="submit" disabled={editing} className="bg-[#e8003d] text-white px-8 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-[#ff0044] transition disabled:opacity-50">
                                    {editing ? 'Saving...' : 'Save'}
                                </button>
                                <button type="button" onClick={() => { setEditingUser(null); resetEdit(); }} className="bg-white/5 text-white px-8 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-[#111118] border border-[#e8003d]/30 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h2 className="text-xl font-['Bebas_Neue'] tracking-widest text-white mb-2">Delete User?</h2>
                        <p className="text-[#8888a0] text-sm mb-6">
                            Are you sure you want to permanently delete <span className="text-white font-semibold">{deleteTarget.name}</span>? This cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={doDelete} className="bg-[#e8003d] text-white px-8 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-[#ff0044] transition">
                                Delete
                            </button>
                            <button onClick={() => setDeleteTarget(null)} className="bg-white/5 text-white px-8 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ComicLayout>
    );
}
