'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        // Auto-dismiss after 3 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const icons = {
        success: <CheckCircle size={20} className="text-green-600" />,
        error: <AlertCircle size={20} className="text-red-600" />,
        info: <Info size={20} className="text-blue-600" />
    };

    return (
        // UPDATED: 
        // 1. Position: top-4 right-4 (Top Right)
        // 2. Animation: slide-in-from-top-5 + zoom-in-95 (The "Pop" effect)
        // 3. Shadow: shadow-xl (Higher elevation)
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl border shadow-xl animate-in slide-in-from-top-5 fade-in zoom-in-95 duration-300 ${styles[type]}`}>
            <div className="shrink-0">
                {icons[type]}
            </div>
            <span className="font-bold text-sm">{message}</span>
            <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition p-1 hover:bg-black/5 rounded-full">
                <X size={16} />
            </button>
        </div>
    );
}