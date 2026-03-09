import { useState } from 'react';
import { useForm, Head, router } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';

export default function Index({ auth, roles, permissions }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
    });

    const [editingRole, setEditingRole] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    const submitRole = (e) => {
        e.preventDefault();
        post(route('admin.roles.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleEditPermissions = (role) => {
        setEditingRole(role);
        setSelectedPermissions(role.permissions.map(p => p.name));
    };

    const togglePermission = (permissionName) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionName)
                ? prev.filter(p => p !== permissionName)
                : [...prev, permissionName]
        );
    };

    const savePermissions = () => {
        router.put(route('admin.roles.update', editingRole.id), {
            permissions: selectedPermissions
        }, {
            onSuccess: () => setEditingRole(null),
        });
    };

    const deleteRole = (role) => {
        if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            router.delete(route('admin.roles.destroy', role.id));
        }
    };

    return (
        <ComicLayout auth={auth}>
            <Head title="Manage Roles & Permissions" />

            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-['Bebas_Neue'] text-5xl tracking-[4px] text-white">Roles & <span className="text-[#e8003d]">Permissions</span></h1>
                        <p className="text-[#8888a0] text-sm mt-1 uppercase tracking-widest font-bold">Access Control Management</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Role Creation Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#16161f] border border-white/7 rounded-2xl p-6 h-fit">
                            <h2 className="text-xl font-['Bebas_Neue'] tracking-widest text-white mb-6 uppercase">Create New Role</h2>
                            <form onSubmit={submitRole} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] uppercase tracking-widest font-bold text-[#8888a0]">Role Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="e.g. Moderator"
                                        className="bg-[#0c0c12] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#e8003d] transition-colors text-sm"
                                    />
                                    {errors.name && <span className="text-xs text-[#e8003d]">{errors.name}</span>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#e8003d] text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-[#ff0044] transition-all disabled:opacity-50 mt-2 shadow-lg shadow-[#e8003d]/20"
                                >
                                    {processing ? 'Creating...' : 'Create Role'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Roles List */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#16161f] border border-white/7 rounded-2xl overflow-hidden">
                            <table className="min-w-full divide-y divide-white/5">
                                <thead>
                                    <tr className="border-b border-white/7">
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-[#a0a0b8] uppercase tracking-widest">Role Name</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-[#a0a0b8] uppercase tracking-widest">Permissions</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-black text-[#a0a0b8] uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {roles.map(role => (
                                        <tr key={role.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold group-hover:text-[#e8003d] transition-colors uppercase tracking-widest">{role.name}</span>
                                                    <span className="text-[10px] text-[#55556a] uppercase font-bold mt-0.5">ID: {role.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {role.permissions.length === 0 ? (
                                                        <span className="text-[10px] text-[#44445a] uppercase font-bold italic tracking-wider">No specific permissions</span>
                                                    ) : (
                                                        role.permissions.map(p => (
                                                            <span key={p.id} className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                {p.name}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    <button
                                                        onClick={() => handleEditPermissions(role)}
                                                        className="text-[11px] uppercase tracking-widest font-bold text-blue-400 hover:text-white transition-colors"
                                                    >
                                                        Edit Perms
                                                    </button>
                                                    {role.name !== 'admin' && (
                                                        <button
                                                            onClick={() => deleteRole(role)}
                                                            className="text-[11px] uppercase tracking-widest font-bold text-[#55556a] hover:text-[#e8003d] transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Permissions Modal */}
            {editingRole && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingRole(null)} />
                    <div className="relative bg-[#111118] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
                        <h2 className="text-2xl font-['Bebas_Neue'] tracking-widest text-white mb-2">Manage Permissions</h2>
                        <p className="text-[#8888a0] text-sm mb-6 uppercase tracking-widest font-bold">Role: <span className="text-[#e8003d]">{editingRole.name}</span></p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {permissions.map(permission => (
                                <button
                                    key={permission.id}
                                    onClick={() => togglePermission(permission.name)}
                                    className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                                        selectedPermissions.includes(permission.name)
                                            ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                            : 'bg-white/5 border-white/10 text-[#55556a] hover:border-white/20'
                                    }`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPermissions.includes(permission.name) ? 'text-blue-400' : 'text-[#8888a0]'}`}>
                                        {permission.name.split('.').length > 1 ? permission.name.split('.')[0] : 'General'}
                                    </span>
                                    <span className="text-xs font-bold">{permission.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={savePermissions}
                                className="flex-1 bg-[#e8003d] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#ff0044] transition-all"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => setEditingRole(null)}
                                className="px-8 bg-white/5 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(232,0,61,0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(232,0,61,0.4); }
            `}} />
        </ComicLayout>
    );
}
