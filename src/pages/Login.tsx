import React, { useState } from 'react';
import { Tent, Lock, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    // Poderíamos passar meta_data como role padrão aqui com options: { data: { role: 'Admin' } }
                });

                if (signUpError) throw signUpError;

                setMessage('Conta criada! Faça login para continuar ou verifique seu e-mail (se necessário).');
                setIsSignUp(false);
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;
                // O estado de App.tsx cuidará da navegação
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro na autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
            {/* Left Panel - Branding (Desktop Only) */}
            <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-primary overflow-y-hidden">
                {/* Abstract Waves & Gradient over Primary */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary/90 z-0"></div>
                <div className="absolute inset-x-0 bottom-0 h-full opacity-30 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/40 via-transparent to-transparent z-0"></div>

                {/* Decorative circles */}
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl z-0"></div>
                <div className="absolute bottom-12 -right-12 w-64 h-64 rounded-full bg-secondary/20 blur-2xl z-0"></div>

                <div className="relative z-10 flex items-center gap-3 text-white">
                    <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/20">
                        <Tent size={28} className="text-white" />
                    </div>
                    <span className="font-bold text-2xl tracking-tight">Expedição dos Amigos</span>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg mb-12">
                    <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
                        Planejamento de <br /><span className="text-amber-300">Excelência</span> para nossa Expedição.
                    </h1>
                    <p className="text-lg text-primary-foreground/90 font-medium leading-relaxed">
                        Gerencie finanças, participantes, acampamentos e relatórios em um único lugar, de forma moderna e conectada à nuvem.
                    </p>
                </div>

                <div className="relative z-10 text-primary-foreground/60 text-sm font-medium">
                    &copy; {new Date().getFullYear()} Expedição dos Amigos
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center p-6 md:p-12 relative bg-card">
                <div className="w-full max-w-sm space-y-8 relative z-10">
                    {/* Mobile Branding inside form area */}
                    <div className="md:hidden flex flex-col items-center space-y-4 mb-8">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                            <Tent size={32} />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Expedição dos Amigos</h2>
                            <p className="text-sm text-slate-500 mt-1">Nuvem Segura Ativada</p>
                        </div>
                    </div>

                    <div className="hidden md:block space-y-2 text-center md:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{isSignUp ? 'Criar Nova Conta' : 'Bem-vindo(a)'}</h2>
                        <p className="text-slate-500 font-medium">
                            {isSignUp ? 'Preencha os dados de acesso seguros' : 'Insira seu e-mail e senha para acessar o painel'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm flex items-center gap-2 border border-green-200 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={16} />
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-1 block">
                            <label className="text-sm font-semibold text-slate-700 block">E-mail</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-12 pl-10 rounded-radius border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1 block">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-700 block">Senha</label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 pl-10 rounded-radius border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 inline-flex items-center justify-center rounded-radius text-sm font-semibold transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md mt-4 active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? 'Aguarde...' : (isSignUp ? 'Criar Conta' : 'Entrar no Sistema')}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            {isSignUp ? 'Já tenho uma conta. Fazer Login' : 'Ainda não tem conta? Criar acesso seguro.'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
