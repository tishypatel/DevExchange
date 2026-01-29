'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User as UserIcon, Mail, Loader2, Search, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import { usePrivateFetch } from '../../../hooks/usePrivateFetch';
import Toast, { ToastType } from '../../../components/Toast';
import { CustomSelect } from '../../../components/CustomSelect';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface User {
    id: string;
    username: string;
    full_name: string;
    email: string;
    role: string;
    bio: string;
}

export default function UsersPage() {
    const authFetch = usePrivateFetch();
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("q", search);
            if (roleFilter) params.append("role", roleFilter);

            const res = await authFetch(`${API_BASE_URL}/users?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const role = localStorage.getItem("role");
        if (role !== "admin") {
            router.push("/dashboard");
            return;
        }
        setIsAdmin(true);

        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, roleFilter]);

    const handleSort = (key: keyof User) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = [...users].sort((a, b) => {
        if (!sortConfig) return 0;
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const toggleSelectAll = () => {
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(users.map(u => u.id)));
        }
    };

    const toggleSelectUser = (id: string) => {
        const newSet = new Set(selectedUsers);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedUsers(newSet);
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedUsers.size} users?`)) return;

        try {
            const res = await authFetch(`${API_BASE_URL}/users/bulk-delete`, {
                method: "POST",
                body: JSON.stringify({ ids: Array.from(selectedUsers) })
            });

            if (res.ok) {
                setToast({ message: "Users deleted successfully", type: 'success' });
                setSelectedUsers(new Set());
                fetchUsers();
            } else {
                setToast({ message: "Failed to delete users", type: 'error' });
            }
        } catch (err) {
            setToast({ message: "Network error", type: 'error' });
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">User Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage access and permissions for your organization.</p>
                </div>

                {selectedUsers.size > 0 && (
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition shadow-lg animate-in fade-in slide-in-from-right-4"
                    >
                        <Trash2 size={18} /> Delete ({selectedUsers.size})
                    </button>
                )}
            </div>

            {/* TOOLBAR */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 flex flex-col md:flex-row gap-4 shadow-sm relative z-20">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="w-full pl-10 p-2.5 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-56">
                    <CustomSelect
                        value={roleFilter}
                        onChange={setRoleFilter}
                        icon={Filter}
                        placeholder="All Roles"
                        align="right"
                        options={[
                            { label: "All Roles", value: "" },
                            { label: "Admin", value: "admin" },
                            { label: "Manager", value: "manager" },
                            { label: "User", value: "user" },
                        ]}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400 dark:text-gray-500 flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin" /> Loading users...
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden z-10 relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={users.length > 0 && selectedUsers.size === users.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition select-none group" onClick={() => handleSort('username')}>
                                        <div className="flex items-center gap-2">Member <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" /></div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition select-none group" onClick={() => handleSort('role')}>
                                        <div className="flex items-center gap-2">Role <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" /></div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Email</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Bio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {sortedUsers.map((user) => (
                                    <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${selectedUsers.has(user.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={selectedUsers.has(user.id)}
                                                onChange={() => toggleSelectUser(user.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                                                    {user.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{user.full_name || user.username}</div>
                                                    <div className="text-xs text-gray-400">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${user.role === 'admin'
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                {user.email ? <><Mail size={14} className="text-gray-400" /> {user.email}</> : <span className="text-gray-400 italic">No email</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500 max-w-xs truncate">
                                            {user.bio || "No bio available"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}