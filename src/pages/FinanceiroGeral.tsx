import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Input, Button } from '../components/ui/forms';

const monthsNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function FinanceiroGeral() {
    const profiles = useStore(state => state.profiles);
    const monthlyFees = useStore(state => state.monthlyFees);
    const generateMonthlyFees = useStore(state => state.generateMonthlyFees);
    const updateMonthlyFee = useStore(state => state.updateMonthlyFee);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [feeAmount, setFeeAmount] = useState(100);

    const partners = useMemo(() => profiles.filter(p => p.type === 'Sócio' && p.isActive), [profiles]);

    const handleGenerate = () => {
        if (confirm(`Deseja gerar as mensalidades de ${selectedYear} para todos os Sócios no valor de R$ ${feeAmount}?`)) {
            generateMonthlyFees(selectedYear, feeAmount);
        }
    };

    const getLabelColor = (status: string) => {
        switch (status) {
            case 'Pago': return 'bg-green-100 text-green-800';
            case 'Atrasado': return 'bg-red-100 text-red-800';
            default: return 'bg-amber-100 text-amber-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Financeiro Geral</h2>
                    <p className="text-stone-500">Controle de mensalidades dos sócios e caixa geral do grupo.</p>
                </div>
            </div>

            <div className="bg-card border rounded-radius shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Gerar Mensalidades (Anual)</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <Input
                        label="Ano Base"
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="md:max-w-[150px]"
                    />
                    <Input
                        label="Valor Mensal/Sócio (R$)"
                        type="number"
                        value={feeAmount}
                        onChange={(e) => setFeeAmount(Number(e.target.value))}
                        className="md:max-w-[200px]"
                    />
                    {canEdit && <Button onClick={handleGenerate}>
                        Gerar Lançamentos
                    </Button>}
                </div>
                <p className="text-xs text-stone-500 mt-2">
                    Gera 12 cobranças para cada Sócio Ativo que ainda não tenha lançamento neste ano.
                </p>
            </div>

            <div className="bg-card border rounded-radius shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-stone-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-foreground">Acompanhamento {selectedYear}</h3>
                </div>
                <div className="overflow-x-auto">
                    {partners.length === 0 ? (
                        <div className="p-8 text-center text-stone-500">Nenhum sócio ativo cadastrado.</div>
                    ) : (
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-stone-500 bg-stone-50/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r font-medium">Sócio</th>
                                    {monthsNames.map((m) => (
                                        <th key={m} className="px-2 py-3 text-center border-r font-medium min-w-[100px] whitespace-nowrap">
                                            {m.substring(0, 3)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {partners.map(partner => (
                                    <tr key={partner.id} className="border-b last:border-0 hover:bg-stone-50/50">
                                        <td className="px-4 py-3 border-r font-medium min-w-[150px]">{partner.name}</td>

                                        {Array.from({ length: 12 }).map((_, i) => {
                                            const month = i + 1;
                                            const fee = monthlyFees.find(f => f.profileId === partner.id && f.year === selectedYear && f.month === month);

                                            return (
                                                <td key={month} className="px-2 py-3 border-r text-center">
                                                    {fee ? (
                                                        <button
                                                            onClick={() => {
                                                                if (!canEdit) return;
                                                                const nextStatus = fee.status === 'Pendente' ? 'Pago' : (fee.status === 'Pago' ? 'Atrasado' : 'Pendente');
                                                                updateMonthlyFee(fee.id, {
                                                                    status: nextStatus,
                                                                    paymentDate: nextStatus === 'Pago' ? new Date().toISOString().split('T')[0] : undefined
                                                                });
                                                            }}
                                                            className={`text-xs px-2 py-1 flex items-center justify-center rounded w-full h-[24px] font-medium transition-colors ${canEdit ? 'hover:brightness-95 cursor-pointer' : 'cursor-default'} ${getLabelColor(fee.status)}`}
                                                            disabled={!canEdit}
                                                        >
                                                            {fee.status}
                                                        </button>
                                                    ) : (
                                                        <span className="text-stone-300">-</span>
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
        </div>
    );
}
