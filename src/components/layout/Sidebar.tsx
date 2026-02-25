import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Tent,
    Map,
    Users,
    Wallet,
    CreditCard,
    Menu,
    X,
    Settings
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStore } from '../../store/useStore';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { path: '/', icon: Map, label: 'Expedições' },
    { path: '/pessoas', icon: Users, label: 'Pessoas' },
    { path: '/mensalidades', icon: CreditCard, label: 'Mensalidades' },
    { path: '/financas', icon: Wallet, label: 'Finanças' },
];

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { currentUser, settings, logout } = useStore();

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Header (Topbar for Mobile) */}
            <div className="md:hidden flex items-center justify-between p-4 bg-primary text-primary-foreground shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    {settings.siteLogo ? (
                        <img src={settings.siteLogo} alt="Logo" className="h-6 w-auto object-contain brightness-0 invert" />
                    ) : (
                        <Tent size={24} />
                    )}
                    <span>Expedição dos Amigos</span>
                </div>
                <button onClick={toggleSidebar} className="p-2 -mr-2 rounded-full hover:bg-primary/80 transition-colors">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-primary border-r border-primary-foreground/10 text-primary-foreground flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64",
                isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="hidden md:flex h-16 items-center px-4 border-b border-primary-foreground/10 bg-primary text-primary-foreground gap-3">
                    {settings.siteLogo ? (
                        <img src={settings.siteLogo} alt="Logo" className="h-8 max-h-8 w-auto object-contain brightness-0 invert" />
                    ) : (
                        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/20">
                            <Tent size={28} className="text-white" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Expedição dos Amigos</h1>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-radius text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-white text-primary shadow-sm"
                                    : "text-primary-foreground/70 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <item.icon size={20} className={cn("transition-colors")} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-primary-foreground/10 space-y-2 bg-primary/95">
                    {currentUser?.role === 'Admin' && (
                        <NavLink
                            to="/configuracoes"
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-radius text-sm font-medium transition-all duration-200 w-full mb-3",
                                isActive
                                    ? "bg-white text-primary shadow-sm"
                                    : "text-primary-foreground/70 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <Settings size={20} /> Configurações
                        </NavLink>
                    )}
                    <div className="flex flex-col gap-3 p-3 bg-white/10 rounded-xl border border-white/10 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center font-bold overflow-hidden shadow-sm">
                                <span>{currentUser?.name.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <span className="text-sm font-semibold text-white truncate">{currentUser?.name}</span>
                                <span className="text-xs text-primary-foreground/70">{currentUser?.role}</span>
                            </div>
                        </div>
                        <button onClick={logout} className="w-full text-xs py-2 font-semibold text-primary-foreground/70 border border-transparent rounded-lg hover:text-red-200 hover:bg-red-500/20 transition-all">Sair / Logout</button>
                    </div>
                </div>
            </aside>
        </>
    );
}
