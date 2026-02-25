import { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-1">
                {label && <label className="text-sm font-medium leading-none text-foreground">{label}</label>}
                <input
                    ref={ref}
                    className={cn(
                        "flex h-11 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-all duration-200",
                        "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
                        "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive",
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-radius text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
                    {
                        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow': variant === 'default',
                        'border border-input bg-card hover:bg-slate-50 hover:text-slate-900 shadow-sm': variant === 'outline',
                        'hover:bg-slate-100 text-slate-700': variant === 'ghost',
                        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm': variant === 'destructive',
                        'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm hover:shadow': variant === 'secondary',
                        'h-11 px-4 py-2': size === 'default',
                        'h-9 rounded-md px-3': size === 'sm',
                        'h-12 justify-center rounded-md px-8 text-base': size === 'lg',
                        'h-11 w-11': size === 'icon',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
