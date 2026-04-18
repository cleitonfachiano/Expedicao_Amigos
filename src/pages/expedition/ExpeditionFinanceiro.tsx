import { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useStore, type Expedition, type TransactionCategory } from '../../store/useStore';
import { Input, Button } from '../../components/ui/forms';
import { Modal } from '../../components/ui/Modal';
import { format, parseISO } from 'date-fns';
import { Receipt, UserMinus, Beer, CheckSquare, Square, Trash2, Pencil, Info, Users } from 'lucide-react';

import { v4 as uuidv4 } from 'uuid';

export function ExpeditionFinanceiro() {
    const categories = useStore(state => state.transactionCategories);
    const { expedition } = useOutletContext<{ expedition: Expedition }>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const allTransactions = useStore(state => state.transactions);
    const transactions = useMemo(() => allTransactions.filter(t => t.expeditionId === expedition.id), [allTransactions, expedition.id]);
    const financialTransactions = useStore(state => state.financialTransactions);
    const addTransaction = useStore(state => state.addTransaction);
    const updateTransaction = useStore(state => state.updateTransaction);
    const deleteTransaction = useStore(state => state.deleteTransaction);
    const addFinancialTransaction = useStore(state => state.addFinancialTransaction);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';

    const profiles = useStore(state => state.profiles);
    const expeditionParticipants = useMemo(() => {
        return profiles.filter(p => expedition.participants.includes(p.id));
    }, [profiles, expedition.participants]);

    // Grupos únicos de cerveja entre os participantes da expedição
    const drinkGroups = useMemo(() => {
        const groups = new Set<string>();
        expeditionParticipants.forEach(p => {
            if (p.drinkGroup) groups.add(p.drinkGroup);
        });
        return Array.from(groups).sort();
    }, [expeditionParticipants]);

    const [formData, setFormData] = useState({
        description: '',
        amount: '1,00',
        unitPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasedBy: '',
        category: 'Mercado' as TransactionCategory,
        isExpense: true,
        isForDrinkersOnly: false,
        drinkGroup: '' // '' = geral, 'todos' = todos bebedores, '<nome>' = grupo específico
    });

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any>(null);
    const [editFormData, setEditFormData] = useState({
        description: '',
        amount: '1,00',
        unitPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasedBy: '',
        category: 'Mercado' as TransactionCategory,
        isExpense: true,
        isForDrinkersOnly: false,
        drinkGroup: ''
    });

    const totalGasto = transactions.reduce((acc, curr) => acc + (curr.isExpense ? curr.totalPrice : 0), 0);

    // Rateio com suporte a múltiplos grupos de cerveja
    const splitCalculations = useMemo(() => {
        const totalParticipants = expeditionParticipants.length;
        let totalGeral = 0;

        // Acumula gastos por grupo de bebida
        const groupTotals: Record<string, number> = {};
        // gastos para "todos os bebedores" sem grupo específico
        let totalTodosBebedores = 0;

        transactions.forEach(t => {
            if (!t.isExpense) return;

            if (t.drinkGroup && t.drinkGroup !== 'todos') {
                // Gasto específico de um grupo de marca
                groupTotals[t.drinkGroup] = (groupTotals[t.drinkGroup] || 0) + t.totalPrice;
            } else if (t.drinkGroup === 'todos' || t.isForDrinkersOnly || t.category === 'Bebida Alcoólica') {
                // Gasto para todos os bebedores
                totalTodosBebedores += t.totalPrice;
            } else {
                // Gasto geral
                totalGeral += t.totalPrice;
            }
        });

        const valPerPersonGeneral = totalParticipants > 0 ? totalGeral / totalParticipants : 0;

        // Para "todos bebedores": divide entre quem tem drinkGroup definido (bebedores)
        const allDrinkers = expeditionParticipants.filter(p => p.drinksAlcohol || p.drinkGroup);
        const valPerAllDrinkers = allDrinkers.length > 0 ? totalTodosBebedores / allDrinkers.length : 0;

        // Por grupo específico: divide entre os membros daquele grupo
        const groupPerPerson: Record<string, number> = {};
        for (const [group, total] of Object.entries(groupTotals)) {
            const membersOfGroup = expeditionParticipants.filter(p => p.drinkGroup === group);
            groupPerPerson[group] = membersOfGroup.length > 0 ? total / membersOfGroup.length : 0;
        }

        return {
            valPerPersonGeneral,
            valPerAllDrinkers,
            totalTodosBebedores,
            groupTotals,
            groupPerPerson,
            totalGeral,
        };
    }, [transactions, expeditionParticipants]);

    const participantBalances = useMemo(() => {
        return expeditionParticipants.map(profile => {
            const isDrinker = profile.drinksAlcohol || !!profile.drinkGroup;

            // Cota geral (todos pagam)
            let debt = splitCalculations.valPerPersonGeneral;

            // Cota de todos-os-bebedores
            if (isDrinker) {
                debt += splitCalculations.valPerAllDrinkers;
            }

            // Cota do grupo de marca específica
            if (profile.drinkGroup && splitCalculations.groupPerPerson[profile.drinkGroup]) {
                debt += splitCalculations.groupPerPerson[profile.drinkGroup];
            }

            // Valores pagos nas finanças principais (caixa geral)
            const paidInFinances = financialTransactions
                .filter(ft => ft.expeditionId === expedition.id && ft.profileId === profile.id && ft.type === 'ENTRADA' && ft.status === 'Recebido')
                .reduce((acc, curr) => acc + curr.amount, 0);

            // Valores que a própria pessoa pagou pelo grupo no mercado
            const paidAsBuyer = transactions
                .filter(t => t.purchasedBy === profile.id && t.isExpense)
                .reduce((acc, curr) => acc + curr.totalPrice, 0);

            const totalPaid = paidInFinances + paidAsBuyer;
            const balance = totalPaid - debt;

            return {
                profile,
                debt,
                totalPaid,
                paidInFinances,
                paidAsBuyer,
                balance
            };
        });
    }, [expeditionParticipants, splitCalculations, financialTransactions, transactions, expedition.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description) return;

        const parsedAmount = parseFloat(formData.amount.replace(',', '.'));
        const parsedPrice = parseFloat(formData.unitPrice.replace(',', '.'));

        if (isNaN(parsedAmount) || isNaN(parsedPrice)) return;

        const drinkGroupValue = formData.drinkGroup || undefined;
        const isForDrinkersOnly = !!drinkGroupValue;

        const transId = uuidv4();
        addTransaction({
            id: transId,
            expeditionId: expedition.id,
            description: formData.description,
            amount: parsedAmount,
            unitPrice: parsedPrice,
            totalPrice: parsedAmount * parsedPrice,
            purchaseDate: formData.purchaseDate,
            purchasedBy: formData.purchasedBy,
            category: formData.category,
            isExpense: formData.isExpense,
            isForDrinkersOnly,
            drinkGroup: drinkGroupValue,
        });

        // Se a origem pagadora for o caixa da expedição, o dinheiro precisa sair do saldo geral
        if (formData.purchasedBy === 'caixa') {
            addFinancialTransaction({
                type: 'SAIDA',
                description: `Despesa Expedição ${expedition.name} - ${formData.description}`,
                amount: parsedAmount * parsedPrice,
                category: formData.category as any,
                date: formData.purchaseDate,
                status: 'Pago',
                paymentDate: formData.purchaseDate,
                provider: 'Caixa da Expedição',
                expeditionId: expedition.id,
                source: 'Conta a Pagar',
                notes: `Ref: Despesa Lançada Direto do Rateio [ID:${transId}]`
            });
        }

        setIsModalOpen(false);
        setFormData({ ...formData, description: '', amount: '1,00', unitPrice: '', isForDrinkersOnly: false, drinkGroup: '' });
    };

    const handleEditClick = (trans: any) => {
        setItemToEdit(trans);
        setEditFormData({
            ...trans,
            amount: trans.amount ? trans.amount.toFixed(2).replace('.', ',') : '1,00',
            unitPrice: trans.unitPrice ? trans.unitPrice.toFixed(2).replace('.', ',') : '0,00',
            purchaseDate: trans.purchaseDate || new Date().toISOString().split('T')[0],
            drinkGroup: trans.drinkGroup || '',
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editFormData.description || !itemToEdit) return;

        const parsedAmount = parseFloat(editFormData.amount.replace(',', '.'));
        const parsedPrice = parseFloat(editFormData.unitPrice.replace(',', '.'));

        if (isNaN(parsedAmount) || isNaN(parsedPrice)) return;

        const drinkGroupValue = editFormData.drinkGroup || undefined;

        updateTransaction(itemToEdit.id, {
            description: editFormData.description,
            amount: parsedAmount,
            unitPrice: parsedPrice,
            totalPrice: parsedAmount * parsedPrice,
            purchaseDate: editFormData.purchaseDate,
            purchasedBy: editFormData.purchasedBy,
            category: editFormData.category,
            isExpense: editFormData.isExpense,
            isForDrinkersOnly: !!drinkGroupValue,
            drinkGroup: drinkGroupValue,
        });

        setEditModalOpen(false);
        setItemToEdit(null);
    };

    // Helper para montar o select de grupos de bebida
    const DrinkGroupSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
        <div className="space-y-1">
            <label className="text-sm font-medium text-foreground flex items-center gap-1"><Beer size={14} className="text-amber-500" /> Rateio de Bebida</label>
            <select
                className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={value}
                onChange={e => onChange(e.target.value)}
            >
                <option value="">🌐 Geral (todos os participantes)</option>
                {drinkGroups.length > 0 && (
                    <>
                        <option value="todos">🍺 Todos os Bebedores</option>
                        <optgroup label="Grupo por Marca:">
                            {drinkGroups.map(g => (
                                <option key={g} value={g}>🍺 {g}</option>
                            ))}
                        </optgroup>
                    </>
                )}
                {drinkGroups.length === 0 && (
                    <option value="todos">🍺 Todos os Bebedores</option>
                )}
            </select>
            {value && value !== '' && (
                <p className="text-xs text-amber-600 mt-0.5">
                    {value === 'todos'
                        ? 'Será rateado entre todos que bebem.'
                        : `Será rateado apenas entre quem bebe ${value}.`}
                </p>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Painel Financeiro</h2>
                {canEdit && <Button onClick={() => setIsModalOpen(true)}>Lançar Gasto</Button>}
            </div>

            {/* ============================================================
                PAINEL DE RATEIO POR GRUPO DE CERVEJA
                Exibe: Geral + por marca + aviso se nenhuma marca configurada
            ============================================================ */}

            {/* Aviso quando não há grupos configurados */}
            {drinkGroups.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-radius p-4 flex items-start gap-3">
                    <Info size={18} className="text-blue-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-blue-800">Rateio por marca de cerveja não configurado</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                            Para ativar o rateio de bebidas por marca (ex: Brahma, Antarctica), vá em{' '}
                            <Link to="../participantes" relative="path" className="font-semibold underline">Participantes</Link>{' '}
                            e defina a marca de cerveja de cada pessoa.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">

                {/* Card 1 — Total Geral */}
                <div className="bg-stone-50 border p-4 rounded-radius col-span-1 sm:col-span-2 xl:col-span-1">
                    <div className="flex items-center gap-2 text-stone-500 mb-1">
                        <Receipt size={18} />
                        <span className="text-sm font-medium">Total Geral de Gastos</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">{expeditionParticipants.length} participante(s)</p>
                </div>

                {/* Card 2 — Custo Geral por pessoa (gastos divididos entre todos) */}
                <div className="bg-white border-2 border-primary/20 p-4 rounded-radius">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <UserMinus size={18} />
                        <span className="text-sm font-medium">Custo Geral / Pessoa</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        R$ {splitCalculations.valPerPersonGeneral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                        Total geral dos gastos comuns: R$ {splitCalculations.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>

                {/* Card 3 — Extra para todos os bebedores (gastos sem marca específica) */}
                {splitCalculations.totalTodosBebedores > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-radius">
                        <div className="flex items-center gap-2 text-amber-700 mb-1">
                            <Beer size={18} />
                            <span className="text-sm font-medium">Extra p/ Todos os Bebedores</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-900">
                            + R$ {splitCalculations.valPerAllDrinkers.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                            Total: R$ {splitCalculations.totalTodosBebedores.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                )}

                {/* Cards dinâmicos — um por marca de cerveja */}
                {Object.entries(splitCalculations.groupTotals).map(([group, total]) => {
                    const membersOfGroup = expeditionParticipants.filter(p => p.drinkGroup === group);
                    const perPerson = splitCalculations.groupPerPerson[group] || 0;
                    return (
                        <div key={group} className="bg-amber-50 border-2 border-amber-300 p-4 rounded-radius">
                            <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-1.5 text-amber-800">
                                    <Beer size={16} />
                                    <span className="text-sm font-semibold">Custo p/ {group}</span>
                                </div>
                                <span className="text-xs bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 font-medium">
                                    {membersOfGroup.length} pessoa{membersOfGroup.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-amber-900">
                                + R$ {perPerson.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-amber-600 mt-1">Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            {membersOfGroup.length > 0 && (
                                <p className="text-[11px] text-amber-700 mt-1 truncate" title={membersOfGroup.map(m => m.name).join(', ')}>
                                    {membersOfGroup.map(m => m.name.split(' ')[0]).join(', ')}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Painel de Acerto de Contas */}
            <div className="bg-card border rounded-radius shadow-sm overflow-hidden mb-8">
                <div className="p-4 border-b bg-stone-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-foreground">Acerto de Contas (Participantes)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-stone-500 bg-stone-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Participante</th>
                                <th className="px-4 py-3 font-medium text-right">Cota Devida</th>
                                <th className="px-4 py-3 font-medium text-right">Total Pago</th>
                                <th className="px-4 py-3 font-medium text-right">Saldo Restante</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {participantBalances.map(pb => (
                                <tr key={pb.profile.id} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {pb.profile.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span>{pb.profile.name}</span>
                                            {pb.profile.drinkGroup && (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                                                    🍺 {pb.profile.drinkGroup}
                                                </span>
                                            )}
                                            {!pb.profile.drinkGroup && pb.profile.drinksAlcohol && (
                                                <Beer size={12} className="text-amber-500" title="Bebedor" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        R$ {pb.debt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right text-stone-600">
                                        R$ {pb.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        {(pb.paidAsBuyer > 0 || pb.paidInFinances > 0) && (
                                            <div className="text-[10px] text-stone-400 mt-0.5" title="Pago no Caixa + Gastos assumidos pela pessoa">
                                                (Cx: R$ {pb.paidInFinances.toFixed(0)} | Pessoal: R$ {pb.paidAsBuyer.toFixed(0)})
                                            </div>
                                        )}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold ${pb.balance === 0 ? 'text-stone-400' : pb.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {pb.balance === 0 ? 'Quitado' : pb.balance > 0 ? `A Receber: R$ ${pb.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `Falta: R$ ${Math.abs(pb.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-card border rounded-radius shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-stone-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-foreground">Extrato de Gastos da Expedição</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-stone-500 bg-stone-50/50 border-b">
                            <tr>
                                <th className="px-4 py-3 w-10"></th>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Categoria</th>
                                <th className="px-4 py-3">Comprado Por</th>
                                <th className="px-4 py-3 text-right">Valor Total</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                                        Nenhum gasto registrado nesta expedição.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((trans) => {
                                    const buyer = profiles.find(p => p.id === trans.purchasedBy);
                                    return (
                                        <tr key={trans.id} className={`border-b last:border-0 hover:bg-stone-50/50 transition-colors ${trans.isPaid ? 'opacity-60 bg-stone-50/30' : ''}`}>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (canEdit) updateTransaction(trans.id, { isPaid: !trans.isPaid })
                                                    }}
                                                    className={`transition-colors ${canEdit ? (trans.isPaid ? 'text-primary' : 'text-stone-300 hover:text-stone-400') : (trans.isPaid ? 'text-primary' : 'text-stone-300')} ${!canEdit && 'cursor-default'}`}
                                                    title={!canEdit ? 'Somente leitura' : trans.isPaid ? 'Marcar como pendente' : 'Marcar como resolvido'}
                                                    disabled={!canEdit}
                                                >
                                                    {trans.isPaid ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">{trans.purchaseDate ? format(parseISO(trans.purchaseDate), 'dd/MM/yyyy') : '-'}</td>
                                            <td className={`px-4 py-3 font-medium ${trans.isPaid ? 'line-through text-stone-500' : ''}`}>{trans.description}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="bg-stone-100 text-stone-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        {trans.category}
                                                    </span>
                                                    {trans.drinkGroup && (
                                                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1" title={`Rateio p/ grupo ${trans.drinkGroup}`}>
                                                            <Beer size={10} />
                                                            {trans.drinkGroup === 'todos' ? 'Bebedores' : trans.drinkGroup}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{buyer?.name || 'Não inf.'}</td>
                                            <td className="px-4 py-3 text-right font-medium text-destructive">
                                                R$ {trans.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {canEdit ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditClick(trans);
                                                            }}
                                                            className="p-1.5 text-stone-400 hover:text-primary transition-colors rounded hover:bg-primary/5"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteTransaction(trans.id);
                                                            }}
                                                            className="p-1.5 text-stone-400 hover:text-destructive transition-colors rounded hover:bg-red-50"
                                                            title="Remover"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-stone-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Novo Lançamento */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lançar Transação">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Descrição do Gasto (ex: Compras no Fort)"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        required
                        autoFocus
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Categoria</label>
                            <select
                                className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <Input
                            label="Data da Compra"
                            type="date"
                            value={formData.purchaseDate}
                            onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Valor ou Preço Unitário (R$)"
                            type="text"
                            value={formData.unitPrice}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.,]/g, '');
                                setFormData({ ...formData, unitPrice: val });
                            }}
                            onBlur={(e) => {
                                const num = parseFloat(e.target.value.replace(',', '.'));
                                if (!isNaN(num)) {
                                    setFormData({ ...formData, unitPrice: num.toFixed(2).replace('.', ',') });
                                }
                            }}
                            required
                        />
                        <Input
                            label="Quantidade (se aplicável)"
                            type="text"
                            value={formData.amount}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.,]/g, '');
                                setFormData({ ...formData, amount: val });
                            }}
                            onBlur={(e) => {
                                const num = parseFloat(e.target.value.replace(',', '.'));
                                if (!isNaN(num)) {
                                    setFormData({ ...formData, amount: num.toFixed(2).replace('.', ',') });
                                }
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Quem comprou? (Para abater na dívida)</label>
                        <select
                            className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={formData.purchasedBy}
                            onChange={e => setFormData({ ...formData, purchasedBy: e.target.value })}
                        >
                            <option value="">Selecione um participante...</option>
                            <option value="caixa">Caixa da Expedição / Fundo do Cofre</option>
                            <optgroup label="Pago por um participante:">
                                {expeditionParticipants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </optgroup>
                        </select>
                    </div>

                    <DrinkGroupSelect
                        value={formData.drinkGroup}
                        onChange={v => setFormData({ ...formData, drinkGroup: v })}
                    />

                    <div className="flex justify-between items-center bg-stone-50 border p-3 rounded-radius mt-2">
                        <span className="font-medium text-sm text-stone-600">Valor Final:</span>
                        <span className="font-bold text-lg text-foreground">
                            R$ {(!isNaN(parseFloat(formData.amount.replace(',', '.'))) && !isNaN(parseFloat(formData.unitPrice.replace(',', '.')))
                                ? (parseFloat(formData.amount.replace(',', '.')) * parseFloat(formData.unitPrice.replace(',', '.')))
                                : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar Gasto</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Edição */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Transação">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <Input
                        label="Descrição do Gasto"
                        value={editFormData.description}
                        onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                        required
                        autoFocus
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Categoria</label>
                            <select
                                className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={editFormData.category}
                                onChange={e => setEditFormData({ ...editFormData, category: e.target.value as TransactionCategory })}
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <Input
                            label="Data da Compra"
                            type="date"
                            value={editFormData.purchaseDate}
                            onChange={e => setEditFormData({ ...editFormData, purchaseDate: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Valor ou Preço Unitário (R$)"
                            type="text"
                            value={editFormData.unitPrice}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.,]/g, '');
                                setEditFormData({ ...editFormData, unitPrice: val });
                            }}
                            onBlur={(e) => {
                                const num = parseFloat(e.target.value.replace(',', '.'));
                                if (!isNaN(num)) {
                                    setEditFormData({ ...editFormData, unitPrice: num.toFixed(2).replace('.', ',') });
                                }
                            }}
                            required
                        />
                        <Input
                            label="Quantidade (se aplicável)"
                            type="text"
                            value={editFormData.amount}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.,]/g, '');
                                setEditFormData({ ...editFormData, amount: val });
                            }}
                            onBlur={(e) => {
                                const num = parseFloat(e.target.value.replace(',', '.'));
                                if (!isNaN(num)) {
                                    setEditFormData({ ...editFormData, amount: num.toFixed(2).replace('.', ',') });
                                }
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Quem comprou?</label>
                        <select
                            className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={editFormData.purchasedBy}
                            onChange={e => setEditFormData({ ...editFormData, purchasedBy: e.target.value })}
                        >
                            <option value="">Selecione um participante...</option>
                            <option value="caixa">Caixa da Expedição / Fundo do Cofre</option>
                            <optgroup label="Pago por um participante:">
                                {expeditionParticipants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </optgroup>
                        </select>
                    </div>

                    <DrinkGroupSelect
                        value={editFormData.drinkGroup}
                        onChange={v => setEditFormData({ ...editFormData, drinkGroup: v })}
                    />

                    <div className="flex justify-between items-center bg-stone-50 border p-3 rounded-radius mt-2">
                        <span className="font-medium text-sm text-stone-600">Valor Final:</span>
                        <span className="font-bold text-lg text-foreground">
                            R$ {(!isNaN(parseFloat(editFormData.amount.replace(',', '.'))) && !isNaN(parseFloat(editFormData.unitPrice.replace(',', '.')))
                                ? (parseFloat(editFormData.amount.replace(',', '.')) * parseFloat(editFormData.unitPrice.replace(',', '.')))
                                : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                        <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar Alterações</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
