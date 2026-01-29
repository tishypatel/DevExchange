'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, MessageCircle, LayoutGrid, List as ListIcon, CheckCircle2, Pin, X, Filter } from 'lucide-react';
import Toast, { ToastType } from '../../../components/Toast';
import { usePrivateFetch } from '../../../hooks/usePrivateFetch';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomSelect } from '../../../components/CustomSelect';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Ticket {
    id: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'solved';
    tags: string;
    owner_name: string;
    owner_email?: string;
    created_at: string;
}

const PRIORITY_OPTIONS = [
    { label: "Critical", value: "critical" },
    { label: "High Priority", value: "high" },
    { label: "Medium Priority", value: "medium" },
    { label: "Low Priority", value: "low" },
];

const STATUS_OPTIONS = [
    { label: "All Status", value: "" },
    { label: "Open Issues", value: "open" },
    { label: "Solved Issues", value: "solved" },
];

export default function TicketsPage() {
    const router = useRouter();
    const authFetch = usePrivateFetch();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    const [filters, setFilters] = useState({ q: '', status: '', priority: '' });
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium', tags: '' });

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.q) params.append("q", filters.q);
            if (filters.status) params.append("status", filters.status);
            if (filters.priority) params.append("priority", filters.priority);

            const res = await authFetch(`${API_BASE_URL}/tickets?${params.toString()}`);
            const data = await res.json();
            setTickets(data);
        } catch (err: any) {
            if (err.message !== "Session expired") console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { fetchTickets(); }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await authFetch(`${API_BASE_URL}/tickets`, {
                method: "POST",
                body: JSON.stringify(newTicket)
            });
            if (res.ok) {
                setToast({ message: "Ticket Created!", type: 'success' });
                setIsCreating(false);
                fetchTickets();
                setNewTicket({ title: '', description: '', priority: 'medium', tags: '' });
            }
        } catch (err) {
            setToast({ message: "Failed to create ticket", type: 'error' });
        }
    };

    const handleConnect = (e: React.MouseEvent, ticket: Ticket) => {
        e.stopPropagation();
        if (!ticket.owner_email) {
            setToast({ message: "No email listed for this user.", type: 'info' });
            return;
        }
        const subject = encodeURIComponent(`Re: DevExchange Issue - ${ticket.title}`);
        const body = encodeURIComponent(`Hi ${ticket.owner_name},\n\nI saw your ticket regarding "${ticket.title}" on DevExchange...\n`);
        window.location.href = `mailto:${ticket.owner_email}?subject=${subject}&body=${body}`;
    };

    const getPriorityBadgeStyles = (p: string, isBoard: boolean) => {
        if (isBoard) {
            switch (p) {
                case 'critical': return 'bg-red-600 text-white border-transparent shadow-sm';
                case 'high': return 'bg-orange-500 text-white border-transparent shadow-sm';
                case 'medium': return 'bg-amber-500 text-white border-transparent shadow-sm';
                case 'low': return 'bg-blue-500 text-white border-transparent shadow-sm';
                default: return 'bg-gray-500 text-white border-transparent shadow-sm';
            }
        } else {
            switch (p) {
                case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
                case 'high': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
                case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
                default: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            }
        }
    };

    const sortOpenTickets = (ticketList: Ticket[]) => {
        const priorityWeight = { critical: 3, high: 2, medium: 1, low: 0 };
        return [...ticketList].sort((a, b) => {
            const weightDiff = priorityWeight[b.priority as keyof typeof priorityWeight] - priorityWeight[a.priority as keyof typeof priorityWeight];
            if (weightDiff !== 0) return weightDiff;
            return 0;
        });
    };

    const TicketCard = ({ ticket, index }: { ticket: Ticket, index: number }) => {
        const isBoard = viewMode === 'board';
        const rotation = index % 2 === 0 ? 'rotate-1' : '-rotate-1';

        const boardStyles = ticket.status === 'solved'
            ? `bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 shadow-md ${rotation} text-green-900 dark:text-green-100`
            : `bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-700 dark:to-yellow-800 shadow-md ${rotation} text-yellow-900 dark:text-yellow-100`;

        const listStyles = ticket.status === 'solved'
            ? 'bg-green-50/30 border border-green-200 dark:bg-green-900/10 dark:border-green-800'
            : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700';

        const baseClasses = isBoard
            ? "p-5 rounded-sm h-64 flex flex-col hover:scale-105 hover:rotate-0 hover:z-10 hover:shadow-xl duration-200 transition-all cursor-pointer relative"
            : "p-5 rounded-xl border hover:shadow-md transition cursor-pointer group flex flex-col h-full";

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                className={`${baseClasses} ${isBoard ? boardStyles : listStyles}`}
            >
                {isBoard && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 shadow-sm border border-red-500 z-20"></div>}

                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${getPriorityBadgeStyles(ticket.priority, isBoard)}`}>
                            {ticket.priority}
                        </span>
                        {ticket.status === 'solved' && <span className="text-[10px] font-bold text-green-800 bg-green-200/50 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-200">SOLVED</span>}
                    </div>
                    <span className={`text-[10px] font-mono whitespace-nowrap ${isBoard ? 'opacity-60' : 'text-gray-400 dark:text-gray-500'}`}>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>

                <h3 className={`font-bold text-lg mb-2 line-clamp-2 ${isBoard ? 'font-sans leading-tight' : 'text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                    {ticket.title}
                </h3>

                <p className={`text-sm mb-4 line-clamp-4 flex-1 ${isBoard ? 'opacity-90 leading-relaxed font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                    {ticket.description}
                </p>

                <div className={`flex items-center justify-between pt-3 mt-auto ${isBoard ? 'border-t border-black/10 dark:border-white/10' : 'border-t border-gray-50 dark:border-gray-700'}`}>
                    <div className="flex items-center gap-2 text-xs">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isBoard ? 'bg-black/10 text-black dark:bg-white/20 dark:text-white' : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700'}`}>
                            {ticket.owner_name[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="truncate max-w-[80px] opacity-75">{ticket.owner_name}</span>
                    </div>

                    <button
                        onClick={(e) => handleConnect(e, ticket)}
                        className={`${isBoard ? 'hover:bg-black/10 dark:hover:bg-white/10 p-1.5 rounded-full' : 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300'} transition`}
                        title="Email this user"
                    >
                        <MessageCircle size={18} />
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Solve Issues
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">Find issues to help with or post your own.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-gray-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-indigo-700 transition shadow-lg"
                >
                    <Plus size={20} /> New Discussion
                </button>
            </div>

            {/* FILTER BAR - Responsive Stack */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="flex-1 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-2 relative z-10">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 p-2.5 bg-transparent outline-none text-sm dark:text-white dark:placeholder-gray-500"
                            value={filters.q}
                            onChange={e => setFilters({ ...filters, q: e.target.value })}
                        />
                    </div>
                    <div className="h-px w-full md:h-8 md:w-px bg-gray-200 dark:bg-gray-700"></div>

                    <div className="w-full md:w-48">
                        <CustomSelect
                            value={filters.status}
                            onChange={(val) => setFilters({ ...filters, status: val })}
                            options={STATUS_OPTIONS}
                            placeholder="All Status"
                            icon={Filter}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <CustomSelect
                            value={filters.priority}
                            onChange={(val) => setFilters({ ...filters, priority: val })}
                            options={[{ label: "All Priorities", value: "" }, ...PRIORITY_OPTIONS]}
                            placeholder="All Priorities"
                            align="right"
                        />
                    </div>
                </div>

                {/* View Toggle - Responsive Tabs */}
                <div className="w-full lg:w-auto bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`
              flex-1 lg:flex-none flex items-center justify-center gap-2 p-2 px-4 rounded-lg transition-all duration-200
              ${viewMode === 'list'
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}
            `}
                        title="List View"
                    >
                        <ListIcon size={20} />
                        <span className="lg:hidden text-sm font-medium">List</span>
                    </button>
                    <button
                        onClick={() => setViewMode('board')}
                        className={`
              flex-1 lg:flex-none flex items-center justify-center gap-2 p-2 px-4 rounded-lg transition-all duration-200
              ${viewMode === 'board'
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}
            `}
                        title="Board View"
                    >
                        <LayoutGrid size={20} />
                        <span className="lg:hidden text-sm font-medium">Board</span>
                    </button>
                </div>
            </div>

            {/* CREATE MODAL */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-800"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                <h3 className="font-bold text-xl text-gray-800 dark:text-white">Start a new discussion</h3>
                                <button onClick={() => setIsCreating(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Topic Title</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Production Build failing on Node 18"
                                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white transition font-medium"
                                            value={newTicket.title}
                                            onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                                            required autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                        <textarea
                                            placeholder="Describe the issue..."
                                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg h-40 outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white transition resize-none"
                                            value={newTicket.description}
                                            onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                            <CustomSelect
                                                value={newTicket.priority}
                                                onChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                                                options={PRIORITY_OPTIONS}
                                                placeholder="Select Priority"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                                            <input
                                                type="text"
                                                placeholder="Tags"
                                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white transition"
                                                value={newTicket.tags}
                                                onChange={e => setNewTicket({ ...newTicket, tags: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                                        <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">Cancel</button>
                                        <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg">Post</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONTENT AREA */}
            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading discussions...</div>
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <motion.div layout className="space-y-4">
                            <AnimatePresence>
                                {tickets.map((ticket, index) => <TicketCard key={ticket.id} ticket={ticket} index={index} />)}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start h-full">
                            {/* OPEN Column */}
                            <div className="bg-gray-100/50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-200/60 dark:border-gray-700/60 min-h-[600px] shadow-inner">
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-3 text-lg">
                                        <div className="w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-100 dark:ring-orange-900"></div> Open Issues
                                    </h3>
                                    <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full text-sm font-bold text-gray-600 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-600">
                                        {tickets.filter(t => t.status === 'open').length}
                                    </span>
                                </div>

                                <motion.div layout className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <AnimatePresence>
                                        {sortOpenTickets(tickets.filter(t => t.status === 'open')).map((ticket, i) => <TicketCard key={ticket.id} ticket={ticket} index={i} />)}
                                    </AnimatePresence>
                                </motion.div>

                                {tickets.filter(t => t.status === 'open').length === 0 && <div className="text-center py-20 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl mt-4">No open issues. Great job!</div>}
                            </div>

                            {/* SOLVED Column */}
                            <div className="bg-gray-100/50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-200/60 dark:border-gray-700/60 min-h-[600px] shadow-inner">
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-3 text-lg">
                                        <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900"></div> Solved
                                    </h3>
                                    <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full text-sm font-bold text-gray-600 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-600">
                                        {tickets.filter(t => t.status === 'solved').length}
                                    </span>
                                </div>

                                <motion.div layout className="grid grid-cols-1 xl:grid-cols-2 gap-4 opacity-80">
                                    <AnimatePresence>
                                        {tickets.filter(t => t.status === 'solved').map((ticket, i) => <TicketCard key={ticket.id} ticket={ticket} index={i} />)}
                                    </AnimatePresence>
                                </motion.div>

                                {tickets.filter(t => t.status === 'solved').length === 0 && <div className="text-center py-20 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl mt-4">No solved issues yet.</div>}
                            </div>
                        </div>
                    )}
                </>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}