import { useState, useMemo } from 'react';
import { useStore, type MonthlyFee } from '../store/useStore';
import { Input, Button } from '../components/ui/forms';
import { Modal } from '../components/ui/Modal';
import { format, parseISO } from 'date-fns';
import { CreditCard, AlertTriangle, TrendingUp, CheckCircle, Clock, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const monthsNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function Mensalidades() {
    const profiles = useStore(state => state.profiles);
    const monthlyFees = useStore(state => state.monthlyFees);
    const generateMonthlyFees = useStore(state => state.generateMonthlyFees);
    const payMonthlyFee = useStore(state => state.payMonthlyFee);
    const undoMonthlyFeePayment = useStore(state => state.undoMonthlyFeePayment);
    const deleteMonthlyFee = useStore(state => state.deleteMonthlyFee);
    const clearMonthlyFeesByYear = useStore(state => state.clearMonthlyFeesByYear);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [feeAmount, setFeeAmount] = useState(100);

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedFee, setSelectedFee] = useState<MonthlyFee | null>(null);
    const [actionFee, setActionFee] = useState<MonthlyFee | null>(null);
    const [clearYearModalOpen, setClearYearModalOpen] = useState(false);
    const [undoModalOpen, setUndoModalOpen] = useState(false);
    const [deleteFeeModalOpen, setDeleteFeeModalOpen] = useState(false);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    const [payData, setPayData] = useState({
        amount: 0,
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'Pix' as 'Pix' | 'Dinheiro' | 'Transferência',
        notes: ''
    });

    const partners = useMemo(() => profiles.filter(p => p.type === 'Sócio' && p.isActive), [profiles]);

    const handleGenerate = () => {
        setGenerateModalOpen(true);
    };

    const confirmGenerate = () => {
        generateMonthlyFees(selectedYear, feeAmount, selectedMonths);
        setGenerateModalOpen(false);
    };

    const handleOpenPayment = (fee: MonthlyFee) => {
        if (fee.status === 'Pago') return; // Cannot pay twice from this screen simply, would need to edit from Extrato
        setSelectedFee(fee);
        setPayData({
            amount: fee.amount,
            paymentDate: format(new Date(), 'yyyy-MM-dd'),
            paymentMethod: 'Pix',
            notes: ''
        });
        setPaymentModalOpen(true);
    };

    const confirmPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFee) return;

        payMonthlyFee(
            selectedFee.id,
            payData.amount,
            payData.paymentDate,
            payData.paymentMethod,
            payData.notes
        );

        setPaymentModalOpen(false);
        setSelectedFee(null);
    };

    const getCellColor = (status: string) => {
        switch (status) {
            case 'Pago': return 'bg-green-100 border-green-200 text-green-800';
            case 'Atrasado': return 'bg-red-100 border-red-200 text-red-800';
            case 'Pendente': return 'bg-amber-100 border-amber-200 text-amber-800';
            default: return 'bg-stone-100 text-stone-500';
        }
    };

    const getCellIcon = (status: string) => {
        switch (status) {
            case 'Pago': return <CheckCircle size={14} className="text-green-600" />;
            case 'Atrasado': return <AlertTriangle size={14} className="text-red-600" />;
            case 'Pendente': return <Clock size={14} className="text-amber-600" />;
            default: return null;
        }
    };

    // Calculate Summary
    const yearFees = monthlyFees.filter(f => f.year === selectedYear);
    // Simplification based on generic feeAmount

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const getDerivedStatus = (fee: MonthlyFee): string => {
        if (fee.status === 'Pago') return 'Pago';
        if (fee.year < currentYear || (fee.year === currentYear && fee.month < currentMonth)) {
            return 'Atrasado';
        }
        return 'Pendente';
    };

    const actualExpected = yearFees.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCollected = yearFees.filter(f => getDerivedStatus(f) === 'Pago').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalPending = yearFees.filter(f => getDerivedStatus(f) !== 'Pago').reduce((acc, curr) => acc + curr.amount, 0);

    const adimplencia = actualExpected > 0 ? ((totalCollected / actualExpected) * 100).toFixed(1) : 0;

    const delayedPartnersIds = [...new Set(yearFees.filter(f => getDerivedStatus(f) === 'Atrasado').map(f => f.profileId))];
    const delayedPartners = partners.filter(p => delayedPartnersIds.includes(p.id));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <CreditCard className="text-primary" /> Mensalidades
                    </h2>
                    <p className="text-stone-500">Controle de pagamentos anuais dos sócios.</p>
                </div>
            </div>

            <div className="bg-card border rounded-radius shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Configuração Anual</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                    <div className="flex gap-4 items-end">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setSelectedYear(y => y - 1)} className="px-2">
                                <ChevronLeft size={20} />
                            </Button>
                            <Input
                                label="Ano Vigente"
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-[100px] text-center"
                            />
                            <Button variant="outline" onClick={() => setSelectedYear(y => y + 1)} className="px-2">
                                <ChevronRight size={20} />
                            </Button>
                        </div>
                        <Input
                            label="Valor Padrão/Mês (R$)"
                            type="number"
                            step="0.01"
                            value={feeAmount}
                            onChange={(e) => setFeeAmount(Number(e.target.value))}
                            className="md:max-w-[150px]"
                        />
                        {canEdit && <Button onClick={handleGenerate}>
                            Gerar Lançamentos
                        </Button>}
                    </div>
                    {canEdit && yearFees.length > 0 && (
                        <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-white" onClick={() => setClearYearModalOpen(true)}>
                            <Trash2 size={16} className="mr-2" /> Limpar {selectedYear}
                        </Button>
                    )}
                </div>
                <p className="text-xs text-stone-500 mt-2">
                    Cria 12 cobranças para cada Sócio Ativo.
                </p>
            </div>

            <div className="bg-card border rounded-radius shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 border-b bg-stone-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-foreground">Acompanhamento {selectedYear}</h3>
                    <div className="text-xs flex gap-4 text-stone-600 font-medium">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Pago</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Pendente</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Atrasado</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {partners.length === 0 ? (
                        <div className="p-8 text-center text-stone-500">Nenhum sócio ativo cadastrado.</div>
                    ) : (
                        <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
                            <thead className="text-xs text-stone-500 bg-stone-50/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r font-medium sticky left-0 bg-stone-50 z-10 w-[180px]">Sócio / Mês</th>
                                    {monthsNames.map((m) => (
                                        <th key={m} className="px-2 py-3 text-center border-r font-medium min-w-[70px]">
                                            {m}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {partners.map(partner => (
                                    <tr key={partner.id} className="border-b last:border-0 hover:bg-stone-50/50">
                                        <td className="px-4 py-3 border-r font-medium sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                            {partner.name}
                                        </td>

                                        {Array.from({ length: 12 }).map((_, i) => {
                                            const month = i + 1;
                                            const fee = monthlyFees.find(f => f.profileId === partner.id && f.year === selectedYear && f.month === month);

                                            return (
                                                <td key={month} className="p-1 border-r text-center align-middle">
                                                    {fee ? (
                                                        <button
                                                            onClick={e => {
                                                                if (!canEdit) return;
                                                                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                                                    setActionFee(fee);
                                                                    setDeleteFeeModalOpen(true);
                                                                } else if (getDerivedStatus(fee) !== 'Pago') {
                                                                    handleOpenPayment(fee);
                                                                } else {
                                                                    setActionFee(fee);
                                                                    setUndoModalOpen(true);
                                                                }
                                                            }}
                                                            className={`w-full h-full min-h-[48px] p-2 flex flex-col items-center justify-center rounded border transition-colors ${canEdit ? 'cursor-pointer hover:brightness-95' : 'cursor-default opacity-80'} ${getCellColor(getDerivedStatus(fee))}`}
                                                            title={!canEdit ? 'Acesso apenas leitura.' : getDerivedStatus(fee) === 'Pago' ? `Pago em ${fee.paymentDate ? format(parseISO(fee.paymentDate), 'dd/MM/yyyy') : '?'}. Clique para DESFAZER. Crtl+Click p/ isentar mensalidade.` : 'Clique p/ pagar. Crtl+Click p/ Isentar(Apagar)'}
                                                        >
                                                            <div className="flex items-center gap-1 font-semibold mb-1">
                                                                {getCellIcon(getDerivedStatus(fee))}
                                                                {getDerivedStatus(fee) === 'Pago' && typeof fee.amount === 'number' && <span className="text-xs">R$ {fee.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                                                            </div>
                                                            {getDerivedStatus(fee) !== 'Pago' && <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">{getDerivedStatus(fee)}</span>}
                                                            {getDerivedStatus(fee) === 'Pago' && fee.paymentDate && <span className="text-[10px] opacity-70 block">{format(parseISO(fee.paymentDate), 'dd/MM')}</span>}
                                                        </button>
                                                    ) : (
                                                        <div className="w-full h-full min-h-[48px] bg-stone-50 rounded border border-stone-100 flex items-center justify-center">
                                                            <span className="text-stone-300">-</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Resumo Financeiro da Mensalidade */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-radius p-4 shadow-sm flex flex-col">
                    <span className="text-sm text-stone-500 font-medium mb-1">Total Esperado ({selectedYear})</span>
                    <span className="text-2xl font-bold text-stone-800">R$ {actualExpected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-card border rounded-radius p-4 shadow-sm flex flex-col">
                    <span className="text-sm text-stone-500 font-medium mb-1">Total Arrecadado</span>
                    <span className="text-2xl font-bold text-green-600 inline-flex items-center gap-2">
                        <TrendingUp size={20} />
                        R$ {totalCollected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="bg-card border rounded-radius p-4 shadow-sm flex flex-col">
                    <span className="text-sm text-stone-500 font-medium mb-1">Total Pendente</span>
                    <span className="text-2xl font-bold text-amber-600">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-primary border-primary rounded-radius p-4 shadow-sm flex flex-col text-primary-foreground">
                    <span className="text-sm font-medium mb-1 opacity-90">Adimplência</span>
                    <span className="text-3xl font-black">{adimplencia}%</span>
                </div>
            </div>

            {/* Lista de Sócios em Atraso */}
            {
                delayedPartners.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-radius p-4 shadow-sm">
                        <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2">
                            <AlertTriangle size={18} /> Sócios com Mensalidades Atrasadas
                        </h3>
                        <ul className="list-disc list-inside text-sm text-red-700">
                            {delayedPartners.map(p => (
                                <li key={p.id}>{p.name}</li>
                            ))}
                        </ul>
                    </div>
                )
            }

            {/* Modal de Pagamento */}
            <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Registrar Pagamento">
                {selectedFee && (() => {
                    const profile = profiles.find(p => p.id === selectedFee.profileId);
                    return (
                        <form onSubmit={confirmPayment} className="space-y-4">
                            <div className="bg-stone-50 p-3 rounded-md border text-sm mb-4">
                                <p><strong>Sócio:</strong> {profile?.name}</p>
                                <p><strong>Referência:</strong> {monthsNames[selectedFee.month - 1]} / {selectedFee.year}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 block">
                                    <label className="text-sm font-medium block">Data do Pagamento</label>
                                    <Input
                                        type="date"
                                        required
                                        value={payData.paymentDate}
                                        onChange={e => setPayData({ ...payData, paymentDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium block">Valor Pago (R$)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={payData.amount}
                                        onChange={e => setPayData({ ...payData, amount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium block">Forma de Pagamento</label>
                                <select
                                    className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    value={payData.paymentMethod}
                                    onChange={e => setPayData({ ...payData, paymentMethod: e.target.value as any })}
                                >
                                    <option value="Pix">Pix</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Transferência">Transferência</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium block">Observações (Opcional)</label>
                                <Input
                                    type="text"
                                    placeholder="Ex: Depositou na conta do tesoureiro..."
                                    value={payData.notes}
                                    onChange={e => setPayData({ ...payData, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="w-full">
                                    Confirmar Pagamento
                                </Button>
                            </div>
                        </form>
                    )
                })()}
            </Modal>

            {/* Modais de Confirmação */}
            <Modal isOpen={clearYearModalOpen} onClose={() => setClearYearModalOpen(false)} title="Limpar Mensalidades">
                <div className="space-y-4">
                    <p className="text-sm text-stone-600">
                        Tem certeza que deseja <strong>APAGAR todas as mensalidades</strong> geradas para o ano de {selectedYear}?
                    </p>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100 font-medium">
                        ATENÇÃO: Caso algum sócio já tenha pago alguma mensalidade deste ano, o registro financeiro de entrada no Caixa Geral também será excluído sumariamente.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setClearYearModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => {
                            clearMonthlyFeesByYear(selectedYear);
                            setClearYearModalOpen(false);
                        }}>Sim, Excluir Ano</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={undoModalOpen} onClose={() => setUndoModalOpen(false)} title="Desfazer Pagamento">
                <div className="space-y-4">
                    <p className="text-sm text-stone-600">
                        Deseja realmente <strong>desfazer este pagamento?</strong>
                    </p>
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-100 font-medium">
                        O lançamento de entrada ({actionFee?.amount ? `R$ ${actionFee.amount}` : ''}) será <strong>apagado do Extrato (Caixa Geral)</strong> e a mensalidade voltará a ficar como Pendente.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setUndoModalOpen(false)}>Cancelar</Button>
                        <Button variant="default" onClick={() => {
                            if (actionFee) undoMonthlyFeePayment(actionFee.id);
                            setUndoModalOpen(false);
                        }}>Confirmar Estorno</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={deleteFeeModalOpen} onClose={() => setDeleteFeeModalOpen(false)} title="Excluir Mensalidade">
                <div className="space-y-4">
                    <p className="text-sm text-stone-600">
                        Você está isentando/apagando manualmente o acompanhamento desta mensalidade (Mês {actionFee?.month}).
                    </p>
                    <p className="text-sm text-stone-500 bg-stone-50 p-3 rounded border">
                        A célula ficará vazia para este mês. Você poderá recriá-la posteriormente se clicar em "Gerar Lançamentos" novamente.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setDeleteFeeModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => {
                            if (actionFee) deleteMonthlyFee(actionFee.id);
                            setDeleteFeeModalOpen(false);
                        }}>Apagar Mensalidade</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={generateModalOpen} onClose={() => setGenerateModalOpen(false)} title={`Gerar Lançamentos de ${selectedYear}`}>
                <div className="space-y-4">
                    <p className="text-sm text-stone-600">
                        Selecione os meses que deseja gerar no ano de {selectedYear} com o valor padrão de <strong>R$ {feeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>. Sócios já com aquele mês gerado não serão recriados.
                    </p>
                    <div className="flex justify-between mb-2">
                        <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}>Selecionar Todos</button>
                        <button type="button" className="text-sm font-semibold text-stone-500 hover:underline" onClick={() => setSelectedMonths([])}>Limpar Seleção</button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {monthsNames.map((monthName, index) => {
                            const monthNum = index + 1;
                            const isSelected = selectedMonths.includes(monthNum);
                            return (
                                <button
                                    key={monthNum}
                                    onClick={() => {
                                        if (isSelected) {
                                            setSelectedMonths(selectedMonths.filter(m => m !== monthNum));
                                        } else {
                                            setSelectedMonths([...selectedMonths, monthNum].sort((a, b) => a - b));
                                        }
                                    }}
                                    className={`py-2 px-3 border rounded text-sm font-medium transition-colors ${isSelected ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50' : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'}`}
                                >
                                    {monthName}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setGenerateModalOpen(false)}>Cancelar</Button>
                        <Button variant="default" onClick={confirmGenerate} disabled={selectedMonths.length === 0}>Gerar Meses Selecionados</Button>
                    </div>
                </div>
            </Modal>

        </div >
    );
}
