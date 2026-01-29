'use client';

import { useState, useEffect } from 'react';
import { User, Save, Loader2 } from 'lucide-react';
import Toast, { ToastType } from '../../../components/Toast';
import { usePrivateFetch } from '../../../hooks/usePrivateFetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ProfilePage() {
    const authFetch = usePrivateFetch();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        role: '',
        full_name: '',
        email: '',
        bio: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/users/me`);
                const data = await res.json();
                setFormData({
                    username: data.username,
                    role: data.role,
                    full_name: data.full_name || '',
                    email: data.email || '',
                    bio: data.bio || ''
                });
            } catch (err: any) {
                if (err.message !== "Session expired") {
                    setToast({ message: "Failed to load profile", type: 'error' });
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/users/me`, {
                method: "PATCH",
                body: JSON.stringify({
                    full_name: formData.full_name,
                    email: formData.email,
                    bio: formData.bio
                })
            });

            if (res.ok) {
                setToast({ message: "Profile updated successfully!", type: 'success' });
            } else {
                setToast({ message: "Failed to update profile.", type: 'error' });
            }

        } catch (err) {
            setToast({ message: "Network error saving profile.", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex items-center gap-2 text-gray-500 dark:text-gray-400"><Loader2 className="animate-spin" /> Loading profile...</div>;

    return (
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Profile</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences.</p>
            </header>

            <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 relative transition-colors duration-300">

                {/* Read Only Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Username</label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-mono text-sm">{formData.username}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg border border-indigo-100 dark:border-indigo-800 uppercase text-xs tracking-wider w-fit">{formData.role}</div>
                    </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="john@company.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition h-32 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}