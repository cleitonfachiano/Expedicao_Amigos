import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import * as mappers from '../lib/mappers';

export type Profile = {
    id: string;
    name: string;
    type: 'Sócio' | 'Convidado';
    phone: string;
    email?: string;
    drinksAlcohol: boolean;
    isActive: boolean;
};

export type Expedition = {
    id: string;
    name: string;
    year: number;
    startDate: string;
    endDate: string;
    location: string;
    participants: string[]; // profile ids
};

export type User = {
    id: string;
    name: string;
    username: string;
    passwordHash: string;
    forcePasswordChange: boolean;
    role: 'Admin' | 'Editor' | 'User';
};

export type AppSettings = {
    siteLogo?: string;
    favicon?: string;
};

export type TransactionCategory = string;

export type Transaction = {
    id: string;
    expeditionId: string;
    description: string;
    amount: number;
    unitPrice: number;
    totalPrice: number;
    purchaseDate: string;
    purchasedBy: string;
    category: TransactionCategory;
    isExpense: boolean;
    isForDrinkersOnly?: boolean;
    isPaid?: boolean;
};

export type MonthlyFee = {
    id: string;
    profileId: string;
    year: number;
    month: number;
    amount: number;
    status: 'Pendente' | 'Pago' | 'Atrasado';
    paymentDate?: string;
    paymentMethod?: 'Pix' | 'Dinheiro' | 'Transferência';
    notes?: string;
};

export type FinancialTransactionType = 'ENTRADA' | 'SAIDA';
export type FinancialCategory = string;
export type FinancialTransactionStatus = 'Pendente' | 'Pago' | 'Recebido' | 'Atrasado' | 'Cancelado';

export interface FinancialTransaction {
    id: string;
    type: FinancialTransactionType;
    description: string;
    amount: number;
    category: FinancialCategory;
    date: string;
    paymentDate?: string;
    status: FinancialTransactionStatus;
    profileId?: string;
    provider?: string;
    expeditionId?: string;
    source: 'Mensalidade' | 'Conta a Receber' | 'Conta a Pagar' | 'Avulso';
    notes?: string;
    attachmentUrl?: string;
    monthlyFeeId?: string;
}

export type TaskStatus = 'Fazer' | 'Em Andamento' | 'Pendente' | 'Concluído';
export type TaskPriority = 'Baixa' | 'Média' | 'Alta';
export type TaskCategory = 'Pesca' | 'Acampamento' | 'Compras' | 'Logística' | 'Financeiro' | 'Administrativo' | 'Camisetas';

export type Task = {
    id: string;
    expeditionId: string;
    title: string;
    description?: string;
    assignedTo?: string;
    status: TaskStatus;
    priority: TaskPriority;
    category: TaskCategory;
    dueDate?: string;
};

export type Boat = {
    id: string;
    expeditionId: string;
    codeName: string;
    nickname?: string;
};

export type Team = {
    id: string;
    expeditionId: string;
    boatId?: string;
    name: string;
    colorHex: string;
    members: string[];
};

export type ChecklistItem = {
    id: string;
    expeditionId: string;
    category: 'Mercado' | 'Acampamento';
    name: string;
    quantity?: number | string;
    unit?: string;
    unitPrice?: number;
    totalPrice?: number;
    transactionId?: string;
    isChecked: boolean;
};

export type ChecklistTemplate = {
    id: string;
    category: 'Mercado' | 'Acampamento';
    name: string;
    quantity?: number | string;
    unit?: string;
    unitPrice?: number;
    totalPrice?: number;
};

export type TShirtOrder = {
    id: string;
    expeditionId: string;
    profileId: string;
    size: 'P' | 'M' | 'G' | 'GG' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
    quantity: number;
    price?: number;
    hasPaid: boolean;
};

interface AppState {
    currentUser: any | null;
    users: User[];
    settings: AppSettings;
    transactionCategories: string[];
    financialCategories: string[];
    profiles: Profile[];
    expeditions: Expedition[];
    transactions: Transaction[];
    monthlyFees: MonthlyFee[];
    tasks: Task[];
    boats: Boat[];
    teams: Team[];
    checklistItems: ChecklistItem[];
    checklistTemplates: ChecklistTemplate[];
    tshirtOrders: TShirtOrder[];
    financialTransactions: FinancialTransaction[];

    fetchData: () => Promise<void>;
    setSessionUser: (user: any | null) => void;
    logout: () => void;
    updateUser: (id: string, user: Partial<User>) => void;
    addUser: (user: Omit<User, 'id'>) => void;
    deleteUser: (id: string) => void;
    updateSettings: (settings: Partial<AppSettings>) => void;

    addTransactionCategory: (category: string) => void;
    deleteTransactionCategory: (category: string) => void;
    addFinancialCategory: (category: string) => void;
    deleteFinancialCategory: (category: string) => void;

    addProfile: (profile: Omit<Profile, 'id'>) => void;
    updateProfile: (id: string, profile: Partial<Profile>) => void;
    deleteProfile: (id: string) => void;

    addExpedition: (exp: Omit<Expedition, 'id'>) => void;
    updateExpedition: (id: string, exp: Partial<Expedition>) => void;
    deleteExpedition: (id: string) => void;

    addTransaction: (trans: Omit<Transaction, 'id'> & { id?: string }) => void;
    updateTransaction: (id: string, trans: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;

    updateMonthlyFee: (id: string, fee: Partial<MonthlyFee>) => void;
    deleteMonthlyFee: (id: string) => void;
    clearMonthlyFeesByYear: (year: number) => void;
    generateMonthlyFees: (year: number, amount: number, months?: number[]) => void;
    payMonthlyFee: (feeId: string, amount: number, paymentDate: string, paymentMethod: 'Pix' | 'Dinheiro' | 'Transferência', notes?: string) => void;
    undoMonthlyFeePayment: (feeId: string) => void;

    addFinancialTransaction: (trans: Omit<FinancialTransaction, 'id'>) => void;
    updateFinancialTransaction: (id: string, trans: Partial<FinancialTransaction>) => void;
    deleteFinancialTransaction: (id: string) => void;

    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (id: string, task: Partial<Task>) => void;
    deleteTask: (id: string) => void;

    addBoat: (boat: Omit<Boat, 'id'>) => void;
    addTeam: (team: Omit<Team, 'id'>) => void;
    deleteBoat: (id: string) => void;
    deleteTeam: (id: string) => void;
    addMemberToTeam: (teamId: string, profileId: string) => void;
    removeMemberFromTeam: (teamId: string, profileId: string) => void;

    addChecklistItem: (item: Omit<ChecklistItem, 'id'>) => void;
    updateChecklistItem: (id: string, item: Partial<ChecklistItem>) => void;
    deleteChecklistItem: (id: string) => void;
    toggleChecklistItem: (id: string) => void;

    addChecklistTemplate: (template: Omit<ChecklistTemplate, 'id'>) => void;
    updateChecklistTemplate: (id: string, template: Partial<ChecklistTemplate>) => void;
    deleteChecklistTemplate: (id: string) => void;
    saveCurrentAsTemplates: (expeditionId: string) => void;
    copyTemplatesToExpedition: (expeditionId: string) => void;

    addTShirtOrder: (order: Omit<TShirtOrder, 'id'>) => void;
    updateTShirtOrder: (id: string, order: Partial<TShirtOrder>) => void;
    deleteTShirtOrder: (id: string) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            users: [],
            settings: {},
            transactionCategories: ['Mercado', 'Investimento', 'Isca/Pesca', 'Combustível', 'Camping', 'Bebida Alcoólica', 'Outros'],
            financialCategories: ['Mensalidade', 'Cota de Expedição', 'Camiseta', 'Rateio', 'Acampamento', 'Alimentação', 'Equipamento', 'Combustível', 'Taxa/Licença', 'Outros'],
            profiles: [],
            expeditions: [],
            transactions: [],
            monthlyFees: [],
            tasks: [],
            boats: [],
            teams: [],
            checklistItems: [],
            checklistTemplates: [],
            tshirtOrders: [],
            financialTransactions: [],

            fetchData: async () => {
                const [
                    { data: profiles },
                    { data: expeditions },
                    { data: transactions },
                    { data: monthlyFees },
                    { data: financialTransactions },
                    { data: tasks },
                    { data: boats },
                    { data: teams },
                    { data: checklistItems },
                    { data: tshirtOrders },
                    { data: teamMembers },
                    { data: expParts },
                    { data: dbUsers }
                ] = await Promise.all([
                    supabase.from('profiles').select('*'),
                    supabase.from('expeditions').select('*'),
                    supabase.from('transactions').select('*'),
                    supabase.from('monthly_fees').select('*'),
                    supabase.from('financial_transactions').select('*'),
                    supabase.from('tasks').select('*'),
                    supabase.from('boats').select('*'),
                    supabase.from('teams').select('*'),
                    supabase.from('checklist_items').select('*'),
                    supabase.from('tshirt_orders').select('*'),
                    supabase.from('team_members').select('*'),
                    supabase.from('expedition_participants').select('*'),
                    supabase.from('users').select('*')
                ]);

                // Buscar templates separadamente (tabela pode não existir ainda)
                let checklistTemplates: any[] = [];
                try {
                    const { data } = await supabase.from('checklist_templates').select('*');
                    checklistTemplates = data || [];
                } catch { /* tabela ainda não criada */ }

                const mappedProfiles = (profiles || []).map(mappers.mapProfile);

                const mappedExpeditions = (expeditions || []).map(e => {
                    const exp = mappers.mapExpedition(e);
                    exp.participants = (expParts || []).filter(ep => ep.expedition_id === exp.id).map(ep => ep.profile_id);
                    return exp;
                });

                const mappedTeams = (teams || []).map(t => {
                    const team = mappers.mapTeam(t);
                    team.members = (teamMembers || []).filter(tm => tm.team_id === team.id).map(tm => tm.profile_id);
                    return team;
                });

                set({
                    users: (dbUsers || []).map(mappers.mapUser),
                    profiles: mappedProfiles,
                    expeditions: mappedExpeditions,
                    teams: mappedTeams,
                    transactions: (transactions || []).map(mappers.mapTransaction),
                    monthlyFees: (monthlyFees || []).map(mappers.mapMonthlyFee),
                    financialTransactions: (financialTransactions || []).map(mappers.mapFinancialTransaction),
                    tasks: (tasks || []).map(mappers.mapTask),
                    boats: (boats || []).map(mappers.mapBoat),
                    checklistItems: (checklistItems || []).map(mappers.mapChecklistItem),
                    checklistTemplates: checklistTemplates.map(mappers.mapChecklistTemplate),
                    tshirtOrders: (tshirtOrders || []).map(mappers.mapTShirtOrder)
                });
            },

            setSessionUser: (user) => {
                if (!user) {
                    set({ currentUser: null });
                    return;
                }
                const mappedUser = {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.name || user.user_metadata?.username || user.email?.split('@')[0] || 'Usuário',
                    role: user.user_metadata?.role || 'User',
                };
                set({ currentUser: mappedUser });
            },
            logout: async () => {
                await supabase.auth.signOut();
                set({ currentUser: null });
            },
            addUser: async () => {
                alert('Para adicionar um novo usuário, peça para ele se cadastrar na tela de Login. Gerenciamento manual da senha transferido para o backend por motivos de segurança.');
            },
            updateUser: async (id, updated) => {
                set((state) => {
                    const newUsers = state.users.map(u => u.id === id ? { ...u, ...updated } : u);
                    const isCurrent = state.currentUser?.id === id;
                    return {
                        users: newUsers,
                        ...(isCurrent && { currentUser: newUsers.find(u => u.id === id) || null })
                    };
                });

                // Atualiza a role na tabela pública
                if (updated.role) {
                    await supabase.from('users').update({ role: updated.role }).eq('id', id);
                }
            },
            deleteUser: async (id) => {
                set((state) => ({ users: state.users.filter(u => u.id !== id) }));
                await supabase.from('users').delete().eq('id', id);
            },
            updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),

            addTransactionCategory: (cat) => set((state) => ({ transactionCategories: [...state.transactionCategories, cat] })),
            deleteTransactionCategory: (cat) => set((state) => ({ transactionCategories: state.transactionCategories.filter(c => c !== cat) })),
            addFinancialCategory: (cat) => set((state) => ({ financialCategories: [...state.financialCategories, cat] })),
            deleteFinancialCategory: (cat) => set((state) => ({ financialCategories: state.financialCategories.filter(c => c !== cat) })),

            // --- PROFILES ---
            addProfile: async (profile) => {
                const newId = uuidv4();
                const newProfile = { ...profile, id: newId };
                set((state) => ({ profiles: [...state.profiles, newProfile] }));
                const { error } = await supabase.from('profiles').insert({ id: newId, ...mappers.unmapProfile(profile) });
                if (error) console.error(error);
            },
            updateProfile: async (id, updated) => {
                set((state) => ({ profiles: state.profiles.map(p => p.id === id ? { ...p, ...updated } : p) }));
                const { error } = await supabase.from('profiles').update(mappers.cleanUpdate(mappers.unmapProfile(updated))).eq('id', id);
                if (error) console.error(error);
            },
            deleteProfile: async (id) => {
                set((state) => ({ profiles: state.profiles.filter(p => p.id !== id) }));
                const { error } = await supabase.from('profiles').delete().eq('id', id);
                if (error) console.error(error);
            },

            // --- EXPEDITIONS ---
            addExpedition: async (exp) => {
                const newId = uuidv4();
                const newExp = { ...exp, id: newId };
                set((state) => ({ expeditions: [...state.expeditions, newExp] }));

                const { error } = await supabase.from('expeditions').insert({ id: newId, ...mappers.unmapExpedition(exp) });
                if (error) { console.error(error); return; }

                // insert participants
                if (exp.participants && exp.participants.length > 0) {
                    const inserts = exp.participants.map(pId => ({ expedition_id: newId, profile_id: pId }));
                    await supabase.from('expedition_participants').insert(inserts);
                }

                // Copiar templates para a nova expedição
                get().copyTemplatesToExpedition(newId);
            },
            updateExpedition: async (id, updated) => {
                set((state) => ({ expeditions: state.expeditions.map(e => e.id === id ? { ...e, ...updated } : e) }));

                // Update basic fields
                const dbExp = mappers.cleanUpdate(mappers.unmapExpedition(updated));
                if (Object.keys(dbExp).length > 0) {
                    await supabase.from('expeditions').update(dbExp).eq('id', id);
                }

                // Update participants if provided
                if (updated.participants !== undefined) {
                    await supabase.from('expedition_participants').delete().eq('expedition_id', id);
                    if (updated.participants.length > 0) {
                        const inserts = updated.participants.map(pId => ({ expedition_id: id, profile_id: pId }));
                        await supabase.from('expedition_participants').insert(inserts);
                    }
                }
            },
            deleteExpedition: async (id) => {
                // Limpar dados relacionados da memória
                set((state) => ({
                    expeditions: state.expeditions.filter(e => e.id !== id),
                    transactions: state.transactions.filter(t => t.expeditionId !== id),
                    checklistItems: state.checklistItems.filter(i => i.expeditionId !== id),
                    tshirtOrders: state.tshirtOrders.filter(o => o.expeditionId !== id),
                    tasks: state.tasks.filter(t => t.expeditionId !== id),
                }));

                // Deletar dependências explicitamente (caso RLS bloqueie cascade)
                await supabase.from('expedition_participants').delete().eq('expedition_id', id);
                await supabase.from('checklist_items').delete().eq('expedition_id', id);
                await supabase.from('transactions').delete().eq('expedition_id', id);
                await supabase.from('tshirt_orders').delete().eq('expedition_id', id);
                await supabase.from('tasks').delete().eq('expedition_id', id);
                await supabase.from('teams').delete().eq('expedition_id', id);
                await supabase.from('boats').delete().eq('expedition_id', id);
                const { error } = await supabase.from('expeditions').delete().eq('id', id);
                if (error) console.error('Erro ao deletar expedição:', error);
            },

            // --- TRANSACTIONS (COMPRAS) ---
            addTransaction: async (trans) => {
                const newId = trans.id || uuidv4();
                set((state) => ({ transactions: [...state.transactions, { id: newId, ...trans } as Transaction] }));
                await supabase.from('transactions').insert({ id: newId, ...mappers.unmapTransaction(trans) });
            },
            updateTransaction: async (id, updated) => {
                set((state) => {
                    const newTransactions = state.transactions.map(t => t.id === id ? { ...t, ...updated } : t);
                    let newChecklists = state.checklistItems.map(c => {
                        if (c.transactionId === id) {
                            return {
                                ...c,
                                name: updated.description ?? c.name,
                                quantity: updated.amount ?? c.quantity,
                                unitPrice: updated.unitPrice ?? c.unitPrice,
                                totalPrice: updated.totalPrice ?? c.totalPrice,
                                isChecked: updated.isPaid ?? c.isChecked
                            };
                        }
                        return c;
                    });
                    return { transactions: newTransactions, checklistItems: newChecklists };
                });

                await supabase.from('transactions').update(mappers.cleanUpdate(mappers.unmapTransaction(updated))).eq('id', id);
            },
            deleteTransaction: async (id) => {
                set((state) => ({
                    transactions: state.transactions.filter(t => t.id !== id),
                    checklistItems: state.checklistItems.map(c => c.transactionId === id ? { ...c, transactionId: undefined, isChecked: false } : c)
                }));
                await supabase.from('transactions').delete().eq('id', id);
            },

            // --- MONTHLY FEES ---
            updateMonthlyFee: async (id, updated) => {
                set((state) => ({ monthlyFees: state.monthlyFees.map(f => f.id === id ? { ...f, ...updated } : f) }));
                await supabase.from('monthly_fees').update(mappers.cleanUpdate(mappers.unmapMonthlyFee(updated))).eq('id', id);
            },
            deleteMonthlyFee: async (id) => {
                set((state) => {
                    const txs = state.financialTransactions.filter(t => t.monthlyFeeId !== id);
                    return { monthlyFees: state.monthlyFees.filter(f => f.id !== id), financialTransactions: txs };
                });
                await supabase.from('monthly_fees').delete().eq('id', id);
            },
            clearMonthlyFeesByYear: async (year) => {
                set((state) => {
                    const feesToDelete = state.monthlyFees.filter(f => f.year === year);
                    const feeIdsToDelete = feesToDelete.map(f => f.id);
                    const txs = state.financialTransactions.filter(t => !t.monthlyFeeId || !feeIdsToDelete.includes(t.monthlyFeeId));
                    return { monthlyFees: state.monthlyFees.filter(f => f.year !== year), financialTransactions: txs };
                });
                await supabase.from('monthly_fees').delete().eq('year', year);
            },
            generateMonthlyFees: async (year, amount, months) => {
                const { profiles, monthlyFees } = get();
                const partners = profiles.filter(p => p.type === 'Sócio' && p.isActive);
                const newFees: MonthlyFee[] = [];
                const monthsToGenerate = months || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

                partners.forEach(partner => {
                    for (const month of monthsToGenerate) {
                        const exists = monthlyFees.some(f => f.profileId === partner.id && f.year === year && f.month === month);
                        if (!exists) {
                            newFees.push({ id: uuidv4(), profileId: partner.id, year, month, amount, status: 'Pendente' });
                        }
                    }
                });

                if (newFees.length > 0) {
                    set((state) => ({ monthlyFees: [...state.monthlyFees, ...newFees] }));
                    const inserts = newFees.map(f => ({ id: f.id, ...mappers.unmapMonthlyFee(f) }));
                    await supabase.from('monthly_fees').insert(inserts);
                }
            },
            payMonthlyFee: async (feeId, amount, paymentDate, paymentMethod, notes) => {
                const { monthlyFees, profiles } = get();
                const fee = monthlyFees.find(f => f.id === feeId);
                if (!fee) return;

                const profile = profiles.find(p => p.id === fee.profileId);
                const profileName = profile ? profile.name : 'Sócio';
                const monthStr = new Date(fee.year, fee.month - 1).toLocaleString('pt-BR', { month: 'long' });
                const monthName = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);

                const newTx: FinancialTransaction = {
                    id: uuidv4(),
                    type: 'ENTRADA',
                    description: `Mensalidade ${profileName} - ${monthName}/${fee.year}`,
                    amount,
                    category: 'Mensalidade',
                    date: paymentDate,
                    paymentDate,
                    status: 'Recebido',
                    profileId: fee.profileId,
                    source: 'Mensalidade',
                    notes,
                    monthlyFeeId: feeId
                };

                set((state) => ({
                    monthlyFees: state.monthlyFees.map(f => f.id === feeId ? { ...f, status: 'Pago', amount, paymentDate, paymentMethod, notes } : f),
                    financialTransactions: [...state.financialTransactions, newTx]
                }));

                // DB Updates
                await supabase.from('monthly_fees').update({ status: 'Pago', amount, payment_date: paymentDate, payment_method: paymentMethod, notes }).eq('id', feeId);
                await supabase.from('financial_transactions').insert({ id: newTx.id, ...mappers.unmapFinancialTransaction(newTx) });
            },
            undoMonthlyFeePayment: async (feeId) => {
                const { monthlyFees } = get();
                const fee = monthlyFees.find(f => f.id === feeId);
                if (!fee || fee.status !== 'Pago') return;

                set((state) => {
                    const txs = state.financialTransactions.filter(t => t.monthlyFeeId !== feeId);
                    const fees = state.monthlyFees.map(f => {
                        if (f.id === feeId) return { ...f, status: 'Pendente', paymentDate: undefined, paymentMethod: undefined, notes: undefined } as const;
                        return f;
                    });
                    return { financialTransactions: txs, monthlyFees: fees };
                });

                await supabase.from('financial_transactions').delete().eq('monthly_fee_id', feeId);
                await supabase.from('monthly_fees').update({ status: 'Pendente', payment_date: null, payment_method: null, notes: null }).eq('id', feeId);
            },

            // --- FINANCIAL TRANSACTIONS ---
            addFinancialTransaction: async (trans) => {
                const newId = uuidv4();
                set((state) => ({ financialTransactions: [...state.financialTransactions, { ...trans, id: newId }] }));
                await supabase.from('financial_transactions').insert({ id: newId, ...mappers.unmapFinancialTransaction(trans) });
            },
            updateFinancialTransaction: async (id, updated) => {
                set((state) => ({ financialTransactions: state.financialTransactions.map(t => t.id === id ? { ...t, ...updated } : t) }));
                await supabase.from('financial_transactions').update(mappers.cleanUpdate(mappers.unmapFinancialTransaction(updated))).eq('id', id);
            },
            deleteFinancialTransaction: async (id) => {
                set((state) => {
                    const tx = state.financialTransactions.find(t => t.id === id);
                    let newMonthlyFees = state.monthlyFees;
                    if (tx && tx.monthlyFeeId) {
                        newMonthlyFees = state.monthlyFees.map(f => f.id === tx.monthlyFeeId ? { ...f, status: 'Pendente', paymentDate: undefined, paymentMethod: undefined, notes: undefined } as const : f);
                    }
                    return { financialTransactions: state.financialTransactions.filter(t => t.id !== id), monthlyFees: newMonthlyFees };
                });

                const { data: tx } = await supabase.from('financial_transactions').select('monthly_fee_id').eq('id', id).single();
                await supabase.from('financial_transactions').delete().eq('id', id);
                if (tx && tx.monthly_fee_id) {
                    await supabase.from('monthly_fees').update({ status: 'Pendente', payment_date: null, payment_method: null, notes: null }).eq('id', tx.monthly_fee_id);
                }
            },

            // --- TASKS ---
            addTask: async (task) => {
                const newId = uuidv4();
                set((state) => ({ tasks: [...state.tasks, { ...task, id: newId }] }));
                await supabase.from('tasks').insert({ id: newId, ...mappers.unmapTask(task) });
            },
            updateTask: async (id, updated) => {
                set((state) => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, ...updated } : t) }));
                await supabase.from('tasks').update(mappers.cleanUpdate(mappers.unmapTask(updated))).eq('id', id);
            },
            deleteTask: async (id) => {
                set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) }));
                await supabase.from('tasks').delete().eq('id', id);
            },

            // --- BOATS & TEAMS ---
            addBoat: async (boat) => {
                const newId = uuidv4();
                set((state) => ({ boats: [...state.boats, { ...boat, id: newId }] }));
                await supabase.from('boats').insert({ id: newId, ...mappers.unmapBoat(boat) });
            },
            addTeam: async (team) => {
                const newId = uuidv4();
                set((state) => ({ teams: [...state.teams, { ...team, id: newId }] }));
                await supabase.from('teams').insert({ id: newId, ...mappers.unmapTeam(team) });
            },
            deleteBoat: async (id) => {
                set((state) => ({ boats: state.boats.filter(b => b.id !== id) }));
                await supabase.from('boats').delete().eq('id', id);
            },
            deleteTeam: async (id) => {
                set((state) => ({ teams: state.teams.filter(t => t.id !== id) }));
                await supabase.from('teams').delete().eq('id', id);
            },
            addMemberToTeam: async (teamId, profileId) => {
                set((state) => ({ teams: state.teams.map(t => t.id === teamId ? { ...t, members: [...t.members, profileId] } : t) }));
                await supabase.from('team_members').insert({ team_id: teamId, profile_id: profileId });
            },
            removeMemberFromTeam: async (teamId, profileId) => {
                set((state) => ({ teams: state.teams.map(t => t.id === teamId ? { ...t, members: t.members.filter(m => m !== profileId) } : t) }));
                await supabase.from('team_members').delete().match({ team_id: teamId, profile_id: profileId });
            },

            // --- CHECKLIST ---
            addChecklistItem: async (item) => {
                const newId = uuidv4();
                set((state) => ({ checklistItems: [...state.checklistItems, { ...item, id: newId }] }));
                await supabase.from('checklist_items').insert({ id: newId, ...mappers.unmapChecklistItem(item) });
            },
            updateChecklistItem: async (id, updated) => {
                set((state) => {
                    const newChecklists = state.checklistItems.map(i => i.id === id ? { ...i, ...updated } : i);
                    const item = state.checklistItems.find(i => i.id === id);
                    let newTransactions = state.transactions;

                    if (item?.transactionId) {
                        newTransactions = state.transactions.map(t => {
                            if (t.id === item.transactionId) {
                                return { ...t, description: updated.name ?? t.description, amount: updated.quantity ? Number(updated.quantity) : t.amount, unitPrice: updated.unitPrice ?? t.unitPrice, totalPrice: updated.totalPrice ?? t.totalPrice, isPaid: updated.isChecked ?? t.isPaid };
                            }
                            return t;
                        });
                    }
                    return { checklistItems: newChecklists, transactions: newTransactions };
                });

                await supabase.from('checklist_items').update(mappers.cleanUpdate(mappers.unmapChecklistItem(updated))).eq('id', id);
                const { checklistItems } = get();
                const updatedItem = checklistItems.find(i => i.id === id);
                if (updatedItem && updatedItem.transactionId) {
                    await supabase.from('transactions').update({
                        description: updatedItem.name, amount: updatedItem.quantity, unit_price: updatedItem.unitPrice, total_price: updatedItem.totalPrice, is_paid: updatedItem.isChecked
                    }).eq('id', updatedItem.transactionId);
                }
            },
            deleteChecklistItem: async (id) => {
                set((state) => {
                    const item = state.checklistItems.find(i => i.id === id);
                    let newTransactions = state.transactions;
                    if (item?.transactionId) {
                        newTransactions = state.transactions.filter(t => t.id !== item.transactionId);
                    }
                    return { checklistItems: state.checklistItems.filter(i => i.id !== id), transactions: newTransactions };
                });

                const { data: item } = await supabase.from('checklist_items').select('transaction_id').eq('id', id).single();
                await supabase.from('checklist_items').delete().eq('id', id);
                if (item && item.transaction_id) {
                    await supabase.from('transactions').delete().eq('id', item.transaction_id);
                }
            },
            toggleChecklistItem: async (id) => {
                const { checklistItems } = get();
                const item = checklistItems.find(i => i.id === id);
                if (!item) return;
                const newStatus = !item.isChecked;

                set((state) => {
                    let newTransactions = state.transactions;
                    if (item.transactionId) {
                        newTransactions = state.transactions.map(t => t.id === item.transactionId ? { ...t, isPaid: newStatus } : t);
                    }
                    return { checklistItems: state.checklistItems.map(i => i.id === id ? { ...i, isChecked: newStatus } : i), transactions: newTransactions };
                });

                await supabase.from('checklist_items').update({ is_checked: newStatus }).eq('id', id);
                if (item.transactionId) {
                    await supabase.from('transactions').update({ is_paid: newStatus }).eq('id', item.transactionId);
                }
            },

            // --- CHECKLIST TEMPLATES ---
            addChecklistTemplate: async (template) => {
                const newId = uuidv4();
                set((state) => ({ checklistTemplates: [...state.checklistTemplates, { ...template, id: newId }] }));
                await supabase.from('checklist_templates').insert({ id: newId, ...mappers.unmapChecklistTemplate(template) });
            },
            updateChecklistTemplate: async (id, updated) => {
                set((state) => ({ checklistTemplates: state.checklistTemplates.map(t => t.id === id ? { ...t, ...updated } : t) }));
                await supabase.from('checklist_templates').update(mappers.cleanUpdate(mappers.unmapChecklistTemplate(updated))).eq('id', id);
            },
            deleteChecklistTemplate: async (id) => {
                set((state) => ({ checklistTemplates: state.checklistTemplates.filter(t => t.id !== id) }));
                await supabase.from('checklist_templates').delete().eq('id', id);
            },
            saveCurrentAsTemplates: async (expeditionId) => {
                const { checklistItems } = get();
                const expItems = checklistItems.filter(i => i.expeditionId === expeditionId);

                // Limpar templates antigos
                await supabase.from('checklist_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');

                // Criar novos templates a partir dos itens da expedição
                const newTemplates: ChecklistTemplate[] = expItems.map(item => ({
                    id: uuidv4(),
                    category: item.category as 'Mercado' | 'Acampamento',
                    name: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                }));

                set({ checklistTemplates: newTemplates });

                if (newTemplates.length > 0) {
                    const inserts = newTemplates.map(t => ({ id: t.id, ...mappers.unmapChecklistTemplate(t) }));
                    await supabase.from('checklist_templates').insert(inserts);
                }
            },
            copyTemplatesToExpedition: async (expeditionId) => {
                const { checklistTemplates } = get();
                if (checklistTemplates.length === 0) return;

                const newItems: ChecklistItem[] = checklistTemplates.map(t => ({
                    id: uuidv4(),
                    expeditionId,
                    category: t.category,
                    name: t.name,
                    quantity: t.quantity,
                    unit: t.unit,
                    unitPrice: t.unitPrice,
                    totalPrice: t.totalPrice,
                    isChecked: false,
                }));

                set((state) => ({ checklistItems: [...state.checklistItems, ...newItems] }));

                const inserts = newItems.map(item => ({ id: item.id, ...mappers.unmapChecklistItem(item) }));
                await supabase.from('checklist_items').insert(inserts);
            },

            // --- T-SHIRTS ---
            addTShirtOrder: async (order) => {
                const newId = uuidv4();
                set((state) => ({ tshirtOrders: [...state.tshirtOrders, { ...order, id: newId }] }));
                await supabase.from('tshirt_orders').insert({ id: newId, ...mappers.unmapTShirtOrder(order) });
            },
            updateTShirtOrder: async (id, updated) => {
                set((state) => ({ tshirtOrders: state.tshirtOrders.map(o => o.id === id ? { ...o, ...updated } : o) }));
                await supabase.from('tshirt_orders').update(mappers.cleanUpdate(mappers.unmapTShirtOrder(updated))).eq('id', id);
            },
            deleteTShirtOrder: async (id) => {
                set((state) => ({ tshirtOrders: state.tshirtOrders.filter(o => o.id !== id) }));
                await supabase.from('tshirt_orders').delete().eq('id', id);
            },
        }),
        {
            name: 'expedicao-storage-v2', // Change key so old mock data is dropped
        }
    )
);
