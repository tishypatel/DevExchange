'use client';

import Link from 'next/link';
import { LifeBuoy, Users, MessageSquare, ArrowRight, CheckCircle, Search, Globe, Server, Shield, Lock, Layout, Menu, X } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate, Variants } from 'framer-motion';
import { useRef, MouseEvent, useState } from 'react';

// --- 3D CARD COMPONENT ---
function HeroTicket() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      style={{
        rotateX: useTransform(mouseY, [-0.5, 0.5], [15, -15]),
        rotateY: useTransform(mouseX, [-0.5, 0.5], [-15, 15]),
      }}
      className="perspective-1000 w-full max-w-5xl mx-auto mt-12 md:mt-20 transition-all duration-200 ease-out px-4 md:px-0"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-indigo-500/20">
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="flex gap-2 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="bg-white dark:bg-gray-950 px-4 py-1 rounded-md text-xs text-gray-400 flex-1 text-center font-mono truncate">devexchange.internal/tickets/1240</div>
        </div>
        <div className="p-6 md:p-10 text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase border border-red-200 dark:border-red-800 w-fit">Critical</span>
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              #1240 opened 2 hours ago by @alex_dev
            </span>
          </div>
          {/* Font Serif Applied Here */}
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 font-serif tracking-tight leading-tight">Production Build failing on Node 18 (Memory Leak?)</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-base md:text-lg leading-relaxed">I keep getting heap out of memory errors when running the build pipeline for the new dashboard module. Has anyone seen this with Next.js 14?</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col md:flex-row items-start gap-4 text-indigo-600 dark:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800"
          >
            <CheckCircle size={24} className="mt-1 shrink-0" />
            <div>
              <span className="font-bold block text-indigo-800 dark:text-indigo-200 mb-1">Solved by @senior_sarah</span>
              "Try increasing max_old_space_size in your build command. It seems Next.js 14 caching requires more heap during static generation."
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

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
      className={`group relative border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden rounded-3xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(99, 102, 241, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 overflow-x-hidden">

      {/* Alive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <motion.div
          style={{ y: backgroundY }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-0 right-0 top-[-10%] m-auto h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]"
        />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-xl z-50 border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
        <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 font-bold text-2xl text-indigo-700 dark:text-indigo-400 tracking-tight cursor-pointer font-serif"
          >
            <LifeBuoy className="fill-indigo-700 dark:fill-indigo-400 text-white dark:text-black" size={28} />
            <span>DevExchange</span>
          </motion.div>

          <div className="hidden md:flex space-x-8 font-medium text-gray-500 dark:text-gray-400 text-sm">
            {['How it Works', 'Solutions', 'Teams'].map((item, i) => (
              <motion.a
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                href={`#${item.toLowerCase().replace(" ", "")}`}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                {item}
              </motion.a>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex gap-4 items-center"
          >
            <Link href="/login">
              <button className="text-gray-600 dark:text-gray-300 font-semibold hover:text-black dark:hover:text-white transition px-4 py-2">
                Log in
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-md shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95 duration-200">
                Join Workspace
              </button>
            </Link>
          </motion.div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-4 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-4">
              {['How it Works', 'Solutions', 'Teams'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "")}`}
                  className="font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full text-left text-gray-600 dark:text-gray-300 font-semibold hover:text-black dark:hover:text-white transition py-2">
                  Log in
                </button>
              </Link>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-md">
                  Join Workspace
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 flex flex-col items-center justify-center text-center pt-32 md:pt-40 px-4 pb-20 md:pb-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 md:mb-8 border border-indigo-100 dark:border-indigo-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Internal Beta Live
          </motion.div>

          {/* FONT SERIF APPLIED HERE */}
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-8xl font-serif font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 md:mb-8 leading-[1.1]">
            Unblock Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 animate-gradient-x bg-[length:200%_auto]">
              Engineering Team.
            </span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed px-2">
            Stop getting stuck in DMs. <strong>DevExchange</strong> is the internal knowledge hub where developers post issues, find experts, and document solutions instantly.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-200 hover:-translate-y-1 transition-all duration-200 shadow-xl dark:shadow-indigo-500/20">
                Post an Issue <ArrowRight size={20} />
              </button>
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg border-2 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-900 transition text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent backdrop-blur-sm">
              Browse Solutions
            </button>
          </motion.div>
        </motion.div>

        {/* 3D Ticket Visual */}
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="w-full"
        >
          <HeroTicket />
        </motion.div>
      </header>

      {/* Spotlight Features Section */}
      <section id="features" className="bg-white dark:bg-black py-24 md:py-32 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 md:mb-24"
          >
            {/* FONT SERIF APPLIED HERE */}
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-gray-900 dark:text-white mb-6">Break down information silos</h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Don't let knowledge get lost in private Slack messages. Make it visible, searchable, and reusable.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                color: "indigo",
                title: "Structured Discussions",
                desc: "Move beyond chaotic chat threads. Post structured tickets with priority levels, tags, and rich descriptions."
              },
              {
                icon: Search,
                color: "purple",
                title: "Searchable Knowledge",
                desc: "Every solved ticket becomes documentation. Search past issues to solve problems without asking the same question twice."
              },
              {
                icon: Users,
                color: "green",
                title: "Expert Connection",
                desc: "Identify who knows what. Our platform connects you directly with the subject matter experts in your org."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <SpotlightCard className="p-8 h-full">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 text-${feature.color}-600 dark:text-${feature.color}-400`}>
                    <feature.icon size={32} />
                  </div>
                  {/* FONT SERIF APPLIED HERE */}
                  <h3 className="font-bold text-2xl mb-4 text-gray-900 dark:text-white font-serif">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-lg">
                    {feature.desc}
                  </p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 md:py-32 bg-gray-900 dark:bg-gray-950 text-white border-y border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-12 md:gap-16 relative z-10">
          <div className="max-w-xl">
            {/* FONT SERIF APPLIED HERE */}
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight font-serif">Why Engineering Teams Love Us</h2>
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed">We reduce context switching and help junior developers unblock themselves faster, saving senior engineers hours every week.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-16">
            {[
              { val: "40%", label: "Faster Resolution" },
              { val: "10x", label: "Less Duplicate Questions" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400 mb-2 font-serif">{stat.val}</div>
                <div className="text-sm font-bold uppercase tracking-wider text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-900 dark:text-indigo-400 font-serif">
            <LifeBuoy size={24} /> DevExchange
          </div>
          <div className="text-gray-400 text-sm">
            © 2025 Internal Tools Team. All rights reserved.
          </div>
          <div className="flex gap-6 text-gray-400 text-sm">
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Guidelines</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Support</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Slack</a>
          </div>
        </div>

        {/* Branding */}
        <div className="py-6 text-center border-t border-gray-100/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50">
          <p className="text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
            Made in <span className="text-lg" title="India">🇮🇳</span> with <span className="text-yellow-500 text-base" title="Love">💛</span> by Tishy Patel
          </p>
        </div>
      </footer>
    </div>
  );
}