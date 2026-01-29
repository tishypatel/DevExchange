'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, User, LogOut, LayoutDashboard, Settings, List, Trophy, Menu, X, Users } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role");

        if (!token) {
            router.replace("/login");
        } else {
            setAuthorized(true);
            setRole(storedRole);
        }
    }, [router]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        router.push("/login");
    };

    if (!authorized) return null;

    const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
        const isActive = pathname === href;
        return (
            <Link href={href} className="block">
                <button className={`flex items-center gap-3 w-full p-3 rounded-lg font-medium transition ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>
                    <Icon size={20} /> {label}
                </button>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex font-sans text-black dark:text-white transition-colors duration-300">

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-lg text-indigo-700 dark:text-indigo-400 font-serif">
                    <LifeBuoy size={24} /> DevExchange
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col p-6 shadow-xl lg:shadow-sm z-30 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="hidden lg:flex items-center gap-2 mb-10 text-indigo-700 dark:text-indigo-400 font-bold text-xl px-2 font-serif">
                    <LifeBuoy size={24} /> DevExchange
                </div>

                <nav className="flex-1 space-y-2 mt-12 lg:mt-0">
                    <NavItem href="/dashboard" icon={LayoutDashboard} label="Overview" />
                    <NavItem href="/dashboard/tickets" icon={LifeBuoy} label="Solve Issues" />
                    <NavItem href="/dashboard/my-tickets" icon={List} label="My Tickets" />
                    <NavItem href="/dashboard/leaderboard" icon={Trophy} label="Leaderboard" />
                    <NavItem href="/dashboard/profile" icon={User} label="My Profile" />

                    {/* ADMIN ONLY LINK */}
                    {role === 'admin' && (
                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                            <NavItem href="/dashboard/users" icon={Users} label="User Management" />
                        </div>
                    )}
                </nav>

                <div className="mt-auto space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between px-2 gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">Preferences</span>
                        <div className="flex gap-2">
                            <NotificationBell />
                            <ThemeToggle />
                        </div>
                    </div>

                    <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 dark:text-red-400 font-medium w-full p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 lg:p-10 pt-20 lg:pt-10 overflow-y-auto w-full">
                {children}
            </main>
        </div>
    );
}