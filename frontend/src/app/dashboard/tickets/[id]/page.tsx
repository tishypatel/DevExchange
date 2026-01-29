'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivateFetch } from '../../../../hooks/usePrivateFetch';
import { ArrowLeft, Send, User, CheckCircle2, Clock, MessageSquare, AlertCircle, Paperclip, Loader2, X } from 'lucide-react';
import Toast, { ToastType } from '../../../../components/Toast'; // Added Toast import

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

interface TicketDetail {
    id: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'solved';
    tags: string;
    owner_name: string;
    owner_id: string; // Needed for permission check
    owner_email?: string;
    created_at: string;
}

interface Comment {
    id: string;
    content: string;
    attachment_url?: string;
    created_at: string;
    author_name: string;
    author_role: string;
}

export default function TicketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const authFetch = usePrivateFetch();

    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null); // To store "My" info
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    const [attachment, setAttachment] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const commentsEndRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        try {
            // 1. Fetch Ticket, Comments, AND Current User
            const [ticketRes, commentRes, userRes] = await Promise.all([
                authFetch(`${API_BASE_URL}/tickets/${id}`),
                authFetch(`${API_BASE_URL}/tickets/${id}/comments`),
                authFetch(`${API_BASE_URL}/users/me`)
            ]);

            if (!ticketRes.ok) throw new Error("Ticket not found");

            setTicket(await ticketRes.json());
            setComments(await commentRes.json());
            setCurrentUser(await userRes.json());

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const ws = new WebSocket(`${WS_BASE_URL}/ws/ticket/${id}`);

        ws.onmessage = (event) => {
            const newMsg = JSON.parse(event.data);
            if (newMsg.type === 'chat') {
                setComments(prev => {
                    if (prev.some(c => c.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
            }
        };
        return () => ws.close();
    }, [id]);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() && !attachment) return;

        const tempContent = newComment;
        setNewComment("");

        try {
            let attachmentUrl = null;

            if (attachment) {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', attachment);
                const uploadRes = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: formData });
                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    attachmentUrl = data.url;
                }
                setUploading(false);
            }

            const res = await authFetch(`${API_BASE_URL}/tickets/${id}/comments`, {
                method: "POST",
                body: JSON.stringify({
                    content: tempContent,
                    attachment_url: attachmentUrl
                })
            });

            if (res.ok) {
                const savedComment = await res.json();
                setAttachment(null);
                setComments(prev => [...prev, savedComment]);
            }
        } catch (err) {
            setToast({ message: "Failed to post comment", type: 'error' });
            setNewComment(tempContent);
        }
    };

    const handleResolve = async () => {
        if (!confirm("Are you sure you want to close this ticket?")) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/tickets/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: 'solved' })
            });

            if (res.ok) {
                setTicket(prev => prev ? { ...prev, status: 'solved' } : null);
                setToast({ message: "Ticket Solved!", type: 'success' });
            } else {
                const errData = await res.json();
                setToast({ message: errData.detail || "Unauthorized", type: 'error' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getPriorityBadgeStyles = (p: string) => {
        switch (p) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
            default: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading discussion...</div>;
    if (!ticket) return <div className="p-10 text-center text-gray-500 dark:text-gray-400">Ticket not found</div>;

    // PERMISSION CHECK
    const canManage = currentUser?.role === 'admin' || currentUser?.id === ticket.owner_id;

    return (
        <div className="max-w-4xl mx-auto pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 mb-6 transition font-medium">
                <ArrowLeft size={18} /> Back to Board
            </button>

            <div className={`bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border mb-8 relative overflow-hidden transition-colors duration-300 ${ticket.status === 'solved' ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-800'}`}>
                {ticket.status === 'solved' && <div className="absolute top-0 left-0 w-full bg-green-500 h-1"></div>}

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getPriorityBadgeStyles(ticket.priority)}`}>
                                {ticket.priority}
                            </span>
                            {ticket.status === 'solved' && <span className="flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full text-xs font-bold border border-green-200 dark:border-green-800"><CheckCircle2 size={14} /> Solved</span>}
                            {ticket.status === 'open' && <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800"><AlertCircle size={14} /> Open</span>}
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{ticket.title}</h1>
                    </div>

                    {/* Only Show Button if Authorized */}
                    {ticket.status === 'open' && canManage && (
                        <button onClick={handleResolve} className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition shadow-sm flex items-center gap-2">
                            <CheckCircle2 size={18} /> Mark Solved
                        </button>
                    )}
                </div>

                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6 border-l-4 border-indigo-100 dark:border-indigo-900 pl-4 py-1">{ticket.description}</p>

                <div className="flex items-center gap-6 text-sm text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-gray-800 pt-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            {ticket.owner_name[0]?.toUpperCase()}
                        </div>
                        <span>Posted by <span className="font-bold text-gray-700 dark:text-gray-300">{ticket.owner_name}</span></span>
                    </div>
                    <div className="flex items-center gap-2"><Clock size={16} /> {new Date(ticket.created_at).toLocaleString()}</div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                    Discussion <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">{comments.length}</span>
                </h3>

                <div className="space-y-6">
                    {comments.length === 0 && (
                        <div className="text-center py-10 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-400">
                            <MessageSquare className="mx-auto mb-2 opacity-50" size={32} />
                            <p>No comments yet. Start the conversation!</p>
                        </div>
                    )}

                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <div className="shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-gray-100 dark:border-gray-800 ${comment.author_role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                    {comment.author_name[0].toUpperCase()}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-800 shadow-sm relative hover:border-indigo-100 dark:hover:border-indigo-900 transition duration-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{comment.author_name}</span>
                                            {comment.author_role === 'admin' && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 uppercase tracking-wider font-bold">Admin</span>}
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>

                                    {comment.attachment_url && (
                                        <div className="mt-3">
                                            <img
                                                src={comment.attachment_url}
                                                alt="Attachment"
                                                className="max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:scale-[1.02] transition duration-300 cursor-pointer"
                                                onClick={() => window.open(comment.attachment_url, '_blank')}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={commentsEndRef} />
                </div>
            </div>

            {ticket.status === 'open' ? (
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg sticky bottom-6 z-10 transition-colors duration-300">
                    {attachment && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-700 dark:text-indigo-300 w-fit">
                            <Paperclip size={14} />
                            <span className="truncate max-w-[200px]">{attachment.name}</span>
                            <button onClick={() => setAttachment(null)} className="hover:text-red-500"><X size={14} /></button>
                        </div>
                    )}

                    <form onSubmit={handlePostComment} className="flex gap-4 items-end">
                        <div className="relative flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Type your solution or follow-up question..."
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition resize-none h-14 min-h-[56px] max-h-32 pr-12"
                            />
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute right-3 bottom-3 text-gray-400 hover:text-indigo-500 transition"
                                title="Attach Image"
                            >
                                <Paperclip size={20} />
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={(!newComment.trim() && !attachment) || uploading}
                            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md h-14 w-14 flex items-center justify-center shrink-0"
                        >
                            {uploading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-200 dark:border-gray-700">
                    This ticket is marked as solved. Re-open it to continue the discussion.
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}