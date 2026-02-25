import { useState } from 'react';
import { useStore, type FinancialTransaction, type FinancialCategory, type FinancialTransactionType, type FinancialTransactionStatus } from '../store/useStore';
import { Input, Button } from '../components/ui/forms';
import { Modal } from '../components/ui/Modal';
import { format, parseISO } from 'date-fns';
import { Wallet, TrendingUp, TrendingDown, FileText, Download, CheckCircle, AlertTriangle, Clock, Ban } from 'lucide-react';

export function Financas() {
    const categories = useStore(state => state.financialCategories);
    const transactions = useStore(state => state.financialTransactions);
    const addFinancialTransaction = useStore(state => state.addFinancialTransaction);
    const updateFinancialTransaction = useStore(state => state.updateFinancialTransaction);
    const deleteFinancialTransaction = useStore(state => state.deleteFinancialTransaction);
    const profiles = useStore(state => state.profiles);
    const expeditions = useStore(state => state.expeditions);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';

    const [activeTab, setActiveTab] = useState<'receber' | 'pagar' | 'caixa'>('caixa');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null);

    const [formData, setFormData] = useState({
        type: 'ENTRADA' as FinancialTransactionType,
        description: '',
        amount: 0,
        category: 'Outros' as FinancialCategory,
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'Pendente' as FinancialTransactionStatus,
        profileId: '',
        provider: '',
        expeditionId: '',
        source: 'Avulso' as 'Mensalidade' | 'Conta a Receber' | 'Conta a Pagar' | 'Avulso',
        notes: ''
    });

    // Filtros e Derivações
    const receberTx = transactions.filter(t => t.type === 'ENTRADA');
    const pagarTx = transactions.filter(t => t.type === 'SAIDA');

    const totalEntradas = transactions.filter(t => t.type === 'ENTRADA' && t.status === 'Recebido').reduce((acc, curr) => acc + curr.amount, 0);
    const totalSaidas = transactions.filter(t => t.type === 'SAIDA' && t.status === 'Pago').reduce((acc, curr) => acc + curr.amount, 0);
    const saldoAtual = totalEntradas - totalSaidas;

    const openModalNew = (presetType?: FinancialTransactionType) => {
        setEditingTx(null);
        setFormData({
            type: presetType || (activeTab === 'receber' ? 'ENTRADA' : (activeTab === 'pagar' ? 'SAIDA' : 'ENTRADA')),
            description: '',
            amount: 0,
            category: 'Outros',
            date: format(new Date(), 'yyyy-MM-dd'),
            status: 'Pendente',
            profileId: '',
            provider: '',
            expeditionId: '',
            source: 'Avulso',
            notes: ''
        });
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const finalStatus = formData.status;
        const payload = {
            ...formData,
            paymentDate: (finalStatus === 'Pago' || finalStatus === 'Recebido') ? format(new Date(), 'yyyy-MM-dd') : undefined,
            profileId: formData.profileId || undefined,
            provider: formData.provider || undefined,
            expeditionId: formData.expeditionId || undefined,
        };

        if (editingTx) {
            updateFinancialTransaction(editingTx.id, payload);
        } else {
            addFinancialTransaction(payload);
        }

        setIsModalOpen(false);
        setEditingTx(null);
    };

    const markAsDone = (tx: FinancialTransaction) => {
        const nextStatus = tx.type === 'ENTRADA' ? 'Recebido' : 'Pago';
        updateFinancialTransaction(tx.id, {
            status: nextStatus,
            paymentDate: format(new Date(), 'yyyy-MM-dd')
        });
    };

    const StatusBadge = ({ status }: { status: FinancialTransactionStatus }) => {
        const styles = {
            'Pendente': 'bg-amber-100 text-amber-800',
            'Pago': 'bg-green-100 text-green-800',
            'Recebido': 'bg-green-100 text-green-800',
            'Atrasado': 'bg-red-100 text-red-800',
            'Cancelado': 'bg-stone-200 text-stone-600'
        };
        const icons = {
            'Pendente': <Clock size={12} />,
            'Pago': <CheckCircle size={12} />,
            'Recebido': <CheckCircle size={12} />,
            'Atrasado': <AlertTriangle size={12} />,
            'Cancelado': <Ban size={12} />
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
                {icons[status]} {status}
            </span>
        );
    };

    const renderTable = (txs: FinancialTransaction[], isExtrato: boolean = false) => {
        const sorted = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
            <div className="overflow-x-auto bg-card rounded-radius border shadow-sm mt-4">
                {sorted.length === 0 ? (
                    <div className="p-8 text-center text-stone-500">Nenhum lançamento encontrado.</div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-stone-500 bg-stone-50/50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Data</th>
                                <th className="px-4 py-3 font-medium">Descrição</th>
                                <th className="px-4 py-3 font-medium">Categoria / Origem</th>
                                {isExtrato && <th className="px-4 py-3 font-medium">Tipo</th>}
                                <th className="px-4 py-3 font-medium">Responsável / Fornecedor</th>
                                <th className="px-4 py-3 font-medium text-right">Valor (R$)</th>
                                <th className="px-4 py-3 font-medium text-center">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sorted.map(tx => {
                                const profile = profiles.find(p => p.id === tx.profileId);
                                return (
                                    <tr key={tx.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {format(parseISO(tx.date), 'dd/MM/yyyy')}
                                            {tx.paymentDate && <span className="block text-[10px] text-stone-400">Liq: {format(parseISO(tx.paymentDate), 'dd/MM')}</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-foreground">{tx.description}</p>
                                            <p className="text-xs text-stone-500">{tx.notes}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-xs">{tx.category}</span>
                                            {tx.source !== 'Avulso' && <span className="ml-1 text-[10px] text-primary">(Auto: {tx.source})</span>}
                                        </td>
                                        {isExtrato && (
                                            <td className="px-4 py-3">
                                                <span className={`font-bold text-xs ${tx.type === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.type === 'ENTRADA' ? 'ENTRADA' : 'SAÍDA'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-stone-600 truncate max-w-[150px]">
                                            {tx.type === 'ENTRADA' ? (profile?.name || '-') : (tx.provider || '-')}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${tx.type === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'ENTRADA' ? '+' : '-'} {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <StatusBadge status={tx.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            {canEdit ? (
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {tx.status === 'Pendente' && (
                                                        <button onClick={() => markAsDone(tx)} className="text-xs font-bold text-green-600 hover:underline">
                                                            Baixar
                                                        </button>
                                                    )}
                                                    <button className="text-stone-400 hover:text-primary transition-colors text-xs" onClick={() => {
                                                        setEditingTx(tx);
                                                        setFormData({
                                                            type: tx.type,
                                                            description: tx.description,
                                                            amount: tx.amount,
                                                            category: tx.category,
                                                            date: tx.date,
                                                            status: tx.status,
                                                            profileId: tx.profileId || '',
                                                            provider: tx.provider || '',
                                                            expeditionId: tx.expeditionId || '',
                                                            source: tx.source,
                                                            notes: tx.notes || ''
                                                        });
                                                        setIsModalOpen(true);
                                                    }}>📝</button>
                                                    <button className="text-stone-400 hover:text-destructive transition-colors text-xs" onClick={() => {
                                                        deleteFinancialTransaction(tx.id);
                                                    }}>🗑️</button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-stone-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Wallet className="text-primary" /> Finanças
                    </h2>
                    <p className="text-stone-500">Caixa centralizado do grupo com contas a pagar e receber.</p>
                </div>
            </div>

            <div className="flex mb-4 border-b border-stone-200">
                <button
                    className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'caixa' ? 'border-primary text-primary' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
                    onClick={() => setActiveTab('caixa')}
                >
                    Extrato de Caixa
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'receber' ? 'border-primary text-primary' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
                    onClick={() => setActiveTab('receber')}
                >
                    Contas a Receber
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'pagar' ? 'border-primary text-primary' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
                    onClick={() => setActiveTab('pagar')}
                >
                    Contas a Pagar
                </button>
            </div>

            {activeTab === 'caixa' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card border rounded-radius p-4 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 text-green-600 mb-2 font-medium">
                                <TrendingUp size={18} /> Entradas / Receitas
                            </div>
                            <span className="text-2xl font-bold">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-card border rounded-radius p-4 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 text-red-600 mb-2 font-medium">
                                <TrendingDown size={18} /> Saídas / Despesas
                            </div>
                            <span className="text-2xl font-bold">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-primary text-primary-foreground border-primary rounded-radius p-4 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2 font-medium opacity-90">
                                <Wallet size={18} /> Saldo Atual
                            </div>
                            <span className="text-3xl font-black">R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <FileText size={18} className="text-stone-500" /> Extrato Completo
                        </h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="hidden sm:flex">
                                <Download size={14} className="mr-1" /> PDF
                            </Button>
                            {canEdit && <Button size="sm" onClick={() => openModalNew()}>Novo Lançamento Avulso</Button>}
                        </div>
                    </div>
                    {renderTable(transactions, true)}
                </div>
            )}

            {activeTab === 'receber' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Valores a Receber (Previstos)</h3>
                        {canEdit && <Button size="sm" onClick={() => openModalNew('ENTRADA')}>Lançar Recebível</Button>}
                    </div>
                    {renderTable(receberTx)}
                </div>
            )}

            {activeTab === 'pagar' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Contas a Pagar (Despesas)</h3>
                        {canEdit && <Button size="sm" onClick={() => openModalNew('SAIDA')}>Lançar Conta</Button>}
                    </div>
                    {renderTable(pagarTx)}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTx ? "Editar Lançamento" : "Novo Lançamento"}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Vínculo Contábil</label>
                            <select className="flex h-10 w-full rounded-radius border px-3 text-sm" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                                <option value="ENTRADA">A Receber / Entrada 🟢</option>
                                <option value="SAIDA">A Pagar / Saída 🔴</option>
                            </select>
                        </div>
                        <div className="space-y-1 block">
                            <label className="text-sm font-medium">Data (Venc. / Emitido)</label>
                            <Input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                    </div>

                    <Input label="Descrição Curta" placeholder="Ex: Cota Bebida Refri" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />

                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Valor (R$)" type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} />
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Categoria</label>
                            <select className="flex h-10 w-full rounded-radius border px-3 text-sm" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Origem (Source)</label>
                            <select className="flex h-10 w-full rounded-radius border px-3 text-sm" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value as any })}>
                                <option value="Avulso">Avulso</option>
                                <option value="Mensalidade">Mensalidade</option>
                                <option value="Conta a Receber">Conta a Receber</option>
                                <option value="Conta a Pagar">Conta a Pagar</option>
                            </select>
                        </div>
                    </div>

                    {formData.type === 'ENTRADA' ? (
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Responsável Pagador (Sócio)</label>
                            <select className="flex h-10 w-full rounded-radius border px-3 text-sm" value={formData.profileId} onChange={e => setFormData({ ...formData, profileId: e.target.value })}>
                                <option value="">Não especificado / Cliente externo</option>
                                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <Input label="Fornecedor / Destino" placeholder="Ex: Conveniência Posto 1" value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Status Imediato</label>
                            <select className="flex h-10 w-full rounded-radius border px-3 text-sm" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                <option value="Pendente">Pendente</option>
                                <option value={formData.type === 'ENTRADA' ? 'Recebido' : 'Pago'}>{formData.type === 'ENTRADA' ? 'Recebido' : 'Pago'}</option>
                                <option value="Atrasado">Atrasado</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Vincular Expedição?</label>
                            <select className="flex h-10 w-full rounded-radius border px-3 text-sm text-stone-600" value={formData.expeditionId} onChange={e => setFormData({ ...formData, expeditionId: e.target.value })}>
                                <option value="">-- Nenhuma --</option>
                                {expeditions.map(e => <option key={e.id} value={e.id}>{e.name} ({e.year})</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button type="submit">Salvar Registro</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
