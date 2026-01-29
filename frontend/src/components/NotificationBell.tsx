'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { usePrivateFetch } from '../hooks/usePrivateFetch';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

interface Notification {
    id: string;
    content: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

export function NotificationBell() {
    const authFetch = usePrivateFetch();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 1. Fetch initial notifications & user ID
    useEffect(() => {
        const init = async () => {
            try {
                const userRes = await authFetch(`${API_BASE_URL}/users/me`);
                const user = await userRes.json();
                setUserId(user.id);

                const notifRes = await authFetch(`${API_BASE_URL}/notifications`);
                setNotifications(await notifRes.json());
            } catch (e) {
                console.error(e);
            }
        };
        init();

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 2. WebSocket for Real-Time Alerts
    useEffect(() => {
        if (!userId) return;

        const ws = new WebSocket(`${WS_BASE_URL}/ws/user/${userId}`);

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'notification') {
                // Add new notification to top of list
                setNotifications(prev => [
                    { id: Date.now().toString(), content: msg.content, link: msg.link, is_read: false, created_at: new Date().toISOString() },
                    ...prev
                ]);
                // Optional: Play a sound here
            }
        };

        return () => ws.close();
    }, [userId]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleClickNotification = async (n: Notification) => {
        setIsOpen(false);
        router.push(n.link);

        if (!n.is_read) {
            // Mark as read in background
            await authFetch(`${API_BASE_URL}/notifications/${n.id}/read`, { method: 'POST' });
            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50 origin-bottom-left"
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-bold text-gray-900 dark:text-white flex justify-between items-center">
                            <span>Notifications</span>
                            {unreadCount > 0 && <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">No notifications yet.</div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleClickNotification(n)}
                                        className={`p-4 border-b border-gray-50 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${!n.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                                    >
                                        <p className={`text-sm mb-1 ${!n.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {n.content}
                                        </p>
                                        <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}