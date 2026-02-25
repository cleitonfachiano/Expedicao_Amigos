import { X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from './forms';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Box */}
            <div className={cn(
                "relative z-50 w-full max-w-lg rounded-radius bg-card shadow-lg p-6 animate-in fade-in zoom-in-95 duration-200",
                className
            )}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-stone-100 transition-colors"
                    >
                        <X size={20} className="text-stone-500" />
                    </button>
                </div>

                <div className="mt-2">
                    {children}
                </div>
            </div>
        </div>
    );
}
