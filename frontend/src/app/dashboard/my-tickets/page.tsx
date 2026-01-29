'use client';

import { useState, useEffect } from 'react';
import { Tag, CheckCircle, Edit2, Search } from 'lucide-react';
import Toast, { ToastType } from '../../../components/Toast';
import { usePrivateFetch } from '../../../hooks/usePrivateFetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'solved';
    created_at: string;
}

export default function MyTicketsPage() {
    const authFetch = usePrivateFetch();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    const fetchMyTickets = async () => {
        setLoading(true);
        try {
            // 1. Get User ID
            const userRes = await authFetch(`${API_BASE_URL}/users/me`);
            const userData = await userRes.json();

            // 2. Fetch Tickets for this User
            const res = await authFetch(`${API_BASE_URL}/tickets?owner_id=${userData.id}`);
            const data = await res.json();
            setTickets(data);
        } catch (err: any) {
            if (err.message !== "Session expired") console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyTickets();
    }, []);

    const handleResolve = async (id: string) => {
        try {
            const res = await authFetch(`${API_BASE_URL}/tickets/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'solved' })
            });
            if (res.ok) {
                setToast({ message: "Ticket marked as Solved", type: 'success' });
                fetchMyTickets();
            }
        } catch (e) {
            setToast({ message: "Error updating ticket", type: 'error' });
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-extrabold tracking-tight mb-8 text-gray-900 dark:text-white">
                My Tickets
            </h1>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500">Loading your tickets...</div>
                ) : tickets.map((ticket) => (
                    <div key={ticket.id} className={`bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition ${ticket.status === 'solved' ? 'opacity-75' : ''}`}>

                        {/* Responsive Header: Stacks on mobile, Row on desktop */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                            <div className="flex items-start gap-3">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 leading-tight">{ticket.title}</h3>
                                    <div className="mt-1 sm:hidden">
                                        {ticket.status === 'solved' && <span className="text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-2 py-0.5 rounded font-bold border border-transparent dark:border-green-800 uppercase">SOLVED</span>}
                                        {ticket.status === 'open' && <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded font-bold border border-transparent dark:border-blue-800 uppercase">OPEN</span>}
                                    </div>
                                </div>

                                {/* Desktop Badge (Hidden on mobile to save vertical space in title) */}
                                <div className="hidden sm:block shrink-0">
                                    {ticket.status === 'solved' && <span className="text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-1 rounded font-bold border border-transparent dark:border-green-800">SOLVED</span>}
                                    {ticket.status === 'open' && <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-1 rounded font-bold border border-transparent dark:border-blue-800">OPEN</span>}
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-2 sm:shrink-0 self-end sm:self-auto">
                                {ticket.status === 'open' && (
                                    <button
                                        onClick={() => handleResolve(ticket.id)}
                                        className="whitespace-nowrap flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 transition"
                                    >
                                        <CheckCircle size={14} /> Mark Solved
                                    </button>
                                )}
                                <button className="whitespace-nowrap flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition">
                                    <Edit2 size={14} /> Edit
                                </button>
                            </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">{ticket.description}</p>

                        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono pt-4 border-t border-gray-100 dark:border-gray-800">
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                    </div>
                ))}

                {tickets.length === 0 && !loading && (
                    <div className="p-10 text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                        You haven't posted any tickets yet.
                    </div>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}