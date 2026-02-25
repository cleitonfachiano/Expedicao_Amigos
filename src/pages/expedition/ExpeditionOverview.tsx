import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStore, type Expedition } from '../../store/useStore';
import { Users, Wallet, CheckSquare, Tent, Clock } from 'lucide-react';

export function ExpeditionOverview() {
    const { expedition } = useOutletContext<{ expedition: Expedition }>();

    // Puxar dados da Store (traz tudo para não causar loop no selector)
    const allTransactions = useStore(state => state.transactions);
    const allChecklistItems = useStore(state => state.checklistItems);
    const allTasks = useStore(state => state.tasks);

    // Filtrar usando useMemo
    const transactions = useMemo(() => allTransactions.filter(t => t.expeditionId === expedition.id), [allTransactions, expedition.id]);
    const checklistItems = useMemo(() => allChecklistItems.filter(c => c.expeditionId === expedition.id), [allChecklistItems, expedition.id]);
    const tasks = useMemo(() => allTasks.filter(t => t.expeditionId === expedition.id), [allTasks, expedition.id]);

    // Cálculos
    const totalDespesas = transactions
        .filter(t => t.isExpense)
        .reduce((acc, curr) => acc + curr.totalPrice, 0);

    const custoPorPessoa = expedition.participants.length > 0
        ? totalDespesas / expedition.participants.length
        : 0;

    const checklistConcluidos = checklistItems.filter(c => c.isChecked).length;
    const checklistProgress = checklistItems.length === 0
        ? 0
        : Math.round((checklistConcluidos / checklistItems.length) * 100);

    const pendingTasks = tasks.filter(t => t.status !== 'Concluído').slice(0, 4);
    const lastTransactions = [...transactions].reverse().slice(0, 4);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card: Participantes */}
                <div className="bg-stone-50 border p-4 rounded-radius flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-stone-500 font-medium">Participantes</p>
                        <p className="text-2xl font-bold">{expedition.participants.length}</p>
                    </div>
                </div>

                {/* Card: Total Gasto */}
                <div className="bg-stone-50 border p-4 rounded-radius flex items-center gap-4">
                    <div className="bg-red-100 text-destructive p-3 rounded-full">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-stone-500 font-medium">Custo Total</p>
                        <p className="text-2xl font-bold text-stone-900">
                            R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Card: Custo por Pessoa */}
                <div className="bg-stone-50 border p-4 rounded-radius flex items-center gap-4">
                    <div className="bg-green-100 text-green-700 p-3 rounded-full">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-stone-500 font-medium">Por Pessoa (aprox)</p>
                        <p className="text-2xl font-bold text-stone-900">
                            R$ {custoPorPessoa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Card: Acampamento */}
                <div className="bg-stone-50 border p-4 rounded-radius flex items-center gap-4">
                    <div className="bg-amber-100 text-amber-600 p-3 rounded-full">
                        <Tent size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-stone-500 font-medium">Checklist</p>
                        <p className="text-2xl font-bold text-stone-900">{checklistProgress}%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-radius p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <CheckSquare size={18} className="text-primary" />
                        Próximas Tarefas
                    </h3>
                    {pendingTasks.length > 0 ? (
                        <ul className="space-y-3">
                            {pendingTasks.map(t => (
                                <li key={t.id} className="flex gap-3 p-3 bg-stone-50 border rounded text-sm">
                                    <Clock size={16} className="text-stone-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-stone-800">{t.title}</p>
                                        <p className="text-xs text-stone-500 uppercase mt-1">{t.status}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-stone-500 text-center py-6">Nenhuma tarefa pendente no Kanban.</p>
                    )}
                </div>

                <div className="border rounded-radius p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Wallet size={18} className="text-destructive" />
                        Últimos Gastos
                    </h3>
                    {lastTransactions.length > 0 ? (
                        <ul className="space-y-3">
                            {lastTransactions.map(t => (
                                <li key={t.id} className="flex justify-between items-center p-3 bg-stone-50 border rounded text-sm">
                                    <div className="flex-1 truncate pr-2">
                                        <p className="font-medium text-stone-800 truncate">{t.description}</p>
                                        <p className="text-xs text-stone-500 uppercase mt-1">{t.category}</p>
                                    </div>
                                    <span className="font-semibold text-destructive shrink-0">
                                        R$ {t.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-stone-500 text-center py-6">Nenhum gasto lançado ainda.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
