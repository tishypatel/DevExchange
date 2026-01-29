'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, User } from 'lucide-react';
import { usePrivateFetch } from '../../../hooks/usePrivateFetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface LeaderboardUser {
    id: string;
    username: string;
    full_name: string;
    reputation: number;
    role: string;
}

export default function LeaderboardPage() {
    const authFetch = usePrivateFetch();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/leaderboard`);
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Trophy className="text-yellow-500" size={24} />;
            case 1: return <Medal className="text-gray-400" size={24} />;
            case 2: return <Medal className="text-amber-600" size={24} />;
            default: return <span className="font-bold text-gray-400 w-6 text-center">{index + 1}</span>;
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Top Contributors</h1>
                <p className="text-gray-500 dark:text-gray-400">Earn reputation by helping others and solving complex issues.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-400">Loading rankings...</div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {users.map((user, index) => (
                            <div key={user.id} className={`flex items-center p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${index < 3 ? 'bg-indigo-50/10 dark:bg-indigo-900/5' : ''}`}>
                                <div className="mr-6 flex items-center justify-center w-10">
                                    {getRankIcon(index)}
                                </div>

                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                            {user.full_name || user.username}
                                            {index === 0 && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">CHAMPION</span>}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1 justify-end">
                                        {user.reputation} <Star size={16} className="fill-indigo-600 dark:fill-indigo-400" />
                                    </div>
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Reputation</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}