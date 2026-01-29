'use client';

import { useEffect, useState } from 'react';
import { Shield, Ticket, CheckCircle, AlertCircle, TrendingUp, Clock, ArrowUpRight, Plus, Activity, Star } from 'lucide-react';
import { usePrivateFetch } from '../../hooks/usePrivateFetch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function DashboardPage() {
    const authFetch = usePrivateFetch();
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Derived Stats
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        solved: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        myTotal: 0
    });

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // 1. Fetch User Profile
                const userRes = await authFetch(`${API_BASE_URL}/users/me`);
                const userData = await userRes.json();
                setUser(userData);

                // 2. Fetch All Tickets
                const ticketRes = await authFetch(`${API_BASE_URL}/tickets`);
                const ticketData = await ticketRes.json();
                setTickets(ticketData);

                // 3. Calculate Stats
                // Admin sees global stats, Users see their own stats primarily
                const relevantTickets = userData.role === 'admin' ? ticketData : ticketData.filter((t: any) => t.owner_id === userData.id);

                const open = relevantTickets.filter((t: any) => t.status === 'open').length;
                const solved = relevantTickets.filter((t: any) => t.status === 'solved').length;
                const myTickets = ticketData.filter((t: any) => t.owner_id === userData.id).length; // Always count "my tickets" globally

                // Priority Breakdown (Global for Admin, Personal for User)
                const critical = relevantTickets.filter((t: any) => t.priority === 'critical').length;
                const high = relevantTickets.filter((t: any) => t.priority === 'high').length;
                const medium = relevantTickets.filter((t: any) => t.priority === 'medium').length;
                const low = relevantTickets.filter((t: any) => t.priority === 'low').length;

                setStats({
                    total: relevantTickets.length,
                    open, solved, critical, high, medium, low, myTotal: myTickets
                });

            } catch (err) {
                console.error("Dashboard Load Error", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    // Time-based Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center text-gray-400 animate-pulse">
            <Activity className="animate-spin mr-2" /> Initializing Command Center...
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

            {/* 1. WELCOME HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                        {getGreeting()}, {user?.full_name?.split(' ')[0] || user?.username}.
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {user?.role === 'admin'
                            ? "Here's what's happening in your engineering team today."
                            : "Here's a summary of your contributions and active discussions."}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/tickets">
                        <button className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm">
                            <Ticket size={18} /> View Board
                        </button>
                    </Link>
                    <Link href="/dashboard/tickets">
                        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200 dark:shadow-none">
                            <Plus size={18} /> New Issue
                        </button>
                    </Link>
                </div>
            </div>

            {/* 2. STATS GRID (Glassmorphism) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Card 1: Total Activity (Role Context Aware) */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Activity size={20} className="text-white" />
                            </div>
                            {user?.role === 'admin' && <span className="text-indigo-100 text-xs font-medium bg-indigo-600/30 px-2 py-1 rounded-full">+12% this week</span>}
                        </div>
                        <div className="text-4xl font-black mb-1">{stats.total}</div>
                        <div className="text-indigo-100 text-sm font-medium opacity-80">
                            {user?.role === 'admin' ? "Total Discussions" : "My Discussions"}
                        </div>
                    </div>
                </div>

                {/* Card 2: Open Issues */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.open}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Needs Attention</div>
                </div>

                {/* Card 3: Solved */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.solved}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Solutions Found</div>
                </div>

                {/* Card 4: Personal Impact or System Health */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                            {user?.role === 'admin' ? <TrendingUp size={20} /> : <Star size={20} />}
                        </div>
                    </div>
                    {user?.role === 'admin' ? (
                        <>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">99.9%</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">System Uptime</div>
                        </>
                    ) : (
                        <>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.myTotal}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Your Contributions</div>
                        </>
                    )}
                </div>
            </div>

            {/* 3. MAIN CONTENT SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Activity Feed (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Recent Activity</h2>
                        <Link href="/dashboard/tickets" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                            View All <ArrowUpRight size={16} />
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        {tickets.slice(0, 5).map((ticket, i) => (
                            <div
                                key={ticket.id}
                                onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                                className={`p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer ${i !== tickets.slice(0, 5).length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                            >
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${ticket.status === 'open' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">{ticket.title}</h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                                            <Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{ticket.description}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${ticket.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' :
                                                ticket.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30' :
                                                    'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                        <span className="text-xs text-gray-400">by {ticket.owner_name}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {tickets.length === 0 && (
                            <div className="p-8 text-center text-gray-400">No activity yet. Be the first to create a ticket!</div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Analytics & Tools (1/3 width) */}
                <div className="space-y-6">

                    {/* Priority Distribution Chart */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-6">Issue Priority</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-red-600 dark:text-red-400">Critical</span>
                                    <span className="text-gray-500">{stats.critical}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: stats.total > 0 ? `${(stats.critical / stats.total) * 100}%` : '0%' }}></div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-orange-600 dark:text-orange-400">High</span>
                                    <span className="text-gray-500">{stats.high}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: stats.total > 0 ? `${(stats.high / stats.total) * 100}%` : '0%' }}></div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-blue-600 dark:text-blue-400">Medium / Low</span>
                                    <span className="text-gray-500">{stats.medium + stats.low}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: stats.total > 0 ? `${((stats.medium + stats.low) / stats.total) * 100}%` : '0%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Tools Widget (Only for Admins) */}
                    {user?.role === 'admin' && (
                        <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full filter blur-3xl opacity-20"></div>
                            <div className="flex items-center gap-2 mb-4 text-indigo-300 font-bold">
                                <Shield size={18} /> Admin Console
                            </div>
                            <p className="text-gray-400 text-sm mb-6">Manage system users, view audit logs, and configure security policies.</p>
                            <Link href="/dashboard/users">
                                <button className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white py-2 rounded-lg text-sm font-medium transition backdrop-blur-sm">
                                    Open User Management
                                </button>
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}