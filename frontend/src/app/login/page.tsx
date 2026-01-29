'use client';

import { useState, useEffect, useRef, MouseEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LifeBuoy, User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';

// --- SPOTLIGHT CARD COMPONENT ---
function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`group relative border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden rounded-3xl ${className}`}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(99, 102, 241, 0.1),
              transparent 80%
            )
          `,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
}

// --- 3D TILT CARD ---
function TiltCard({ children }: { children: React.ReactNode }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [30, -30]);
    const rotateY = useTransform(x, [-100, 100], [-30, 30]);

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct * 100);
        y.set(yPct * 100);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="perspective-1000"
        >
            {children}
        </motion.div>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const isExpired = searchParams.get("expired");
        if (isExpired === "true") {
            setError("Your session has expired. Please log in again.");
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error("Invalid credentials");
            }

            const data = await response.json();
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("role", data.role);
            document.cookie = `token=${data.access_token}; path=/; max-age=86400`;
            router.push("/dashboard");

        } catch (err) {
            setError("Invalid username or password");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-300 overflow-hidden">

            {/* Animated Background Grid (Shared with Landing) */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-50 dark:bg-gray-900/50 relative flex-col justify-between p-12 text-white border-r border-gray-200 dark:border-gray-800">
                <div className="absolute inset-0 bg-indigo-900/5 dark:bg-indigo-900/20 backdrop-blur-3xl"></div>

                {/* Animated Orbs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[120px] pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/30 rounded-full blur-[100px] pointer-events-none"
                />

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10"
                >
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tight mb-2 text-indigo-900 dark:text-white font-serif">
                        <LifeBuoy className="text-indigo-600 dark:text-indigo-400" size={28} /> DevExchange
                    </div>
                    <p className="text-indigo-900/60 dark:text-indigo-200/60 text-sm font-medium">Engineering Knowledge Platform</p>
                </motion.div>

                <div className="relative z-10 flex flex-col justify-center flex-1 max-w-md">
                    <TiltCard>
                        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-xl dark:shadow-indigo-500/10">
                            <div className="flex gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="text-yellow-400">★</div>)}
                            </div>
                            <blockquote className="text-xl font-medium leading-relaxed mb-6 text-gray-900 dark:text-white font-serif italic">
                                "The RBAC granularity is exactly what our compliance team needed. We passed our SOC2 audit in record time thanks to the audit logs."
                            </blockquote>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">JD</div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">Jane Doe</div>
                                    <div className="text-indigo-600 dark:text-indigo-400 text-sm">CTO, Acme Corp</div>
                                </div>
                            </div>
                        </div>
                    </TiltCard>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="relative z-10 text-gray-500 dark:text-gray-400 text-sm"
                >
                    © 2025 DevExchange Inc.
                </motion.div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10 text-center">
                        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3 font-serif">Welcome back</h2>
                        <p className="text-gray-500 dark:text-gray-400">Enter your credentials to access the workspace.</p>
                    </div>

                    <SpotlightCard className="p-8 shadow-2xl dark:shadow-none">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="e.g. admin"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Password</label>
                                    <a href="#" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline">Forgot password?</a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/30 flex items-center gap-2"
                                >
                                    <span>⚠️</span> {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-bold py-3.5 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Sign In <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Don't have an account?{' '}
                                <Link href="/" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline">
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </SpotlightCard>

                    <div className="mt-12 text-center">
                        <p className="text-gray-400 dark:text-gray-600 text-xs font-medium flex items-center justify-center gap-2">
                            Made in <span className="text-lg" title="India">🇮🇳</span> with <span className="text-yellow-500 text-base" title="Love">💛</span> by Tishy Patel
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}