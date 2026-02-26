import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStore, type Expedition, type TShirtOrder } from '../../store/useStore';
import { Shirt, Trash2, Search, Users } from 'lucide-react';

const SIZES: TShirtOrder['size'][] = ['P', 'M', 'G', 'GG', 'G1', 'G2', 'G3', 'G4', 'G5'];

export function ExpeditionCamisetas() {
    const { expedition } = useOutletContext<{ expedition: Expedition }>();

    const allTShirtOrders = useStore(state => state.tshirtOrders);
    const tshirtOrders = useMemo(() => allTShirtOrders.filter(o => o.expeditionId === expedition.id), [allTShirtOrders, expedition.id]);
    const addTShirtOrder = useStore(state => state.addTShirtOrder);
    const updateTShirtOrder = useStore(state => state.updateTShirtOrder);
    const deleteTShirtOrder = useStore(state => state.deleteTShirtOrder);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';

    const profiles = useStore(state => state.profiles);
    const targetProfiles = useMemo(() => profiles.filter(p => p.isActive), [profiles]);

    const [search, setSearch] = useState('');

    // Agrupar pessoas e seus pedidos
    const participantOrders = targetProfiles.map(p => {
        return {
            profile: p,
            orders: tshirtOrders.filter(o => o.profileId === p.id)
        }
    }).sort((a, b) => a.profile.name.localeCompare(b.profile.name));

    const filtered = participantOrders.filter(po => po.profile.name.toLowerCase().includes(search.toLowerCase()));

    const handleAddOrder = (profileId: string) => {
        addTShirtOrder({
            expeditionId: expedition.id,
            profileId,
            size: 'G',
            quantity: 1,
            hasPaid: false
        });
    };

    // Resumo gerencial
    const totalOrders = tshirtOrders.reduce((acc, o) => acc + o.quantity, 0);
    const paidOrders = tshirtOrders.filter(o => o.hasPaid).reduce((acc, o) => acc + o.quantity, 0);
    const summaryBySize = SIZES.reduce((acc, size) => {
        acc[size] = tshirtOrders.filter(o => o.size === size).reduce((sum, o) => sum + o.quantity, 0);
        return acc;
    }, {} as Record<string, number>);

    // Resumo financeiro
    const totalReceived = tshirtOrders.filter(o => o.hasPaid).reduce((acc, o) => acc + (o.quantity * (o.price || 0)), 0);
    const totalPending = tshirtOrders.filter(o => !o.hasPaid).reduce((acc, o) => acc + (o.quantity * (o.price || 0)), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pedidos de Camisetas</h2>
                    <p className="text-stone-500">Gerencie os tamanhos e pagamentos das camisetas para a viagem.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card border rounded-radius p-4 shadow-sm">
                    <h3 className="text-stone-500 font-medium text-sm flex items-center gap-2 mb-2">
                        <Shirt size={16} /> Total de Peças
                    </h3>
                    <p className="text-3xl font-bold text-stone-800">{totalOrders}</p>
                </div>
                <div className="bg-card border rounded-radius p-4 shadow-sm md:col-span-2">
                    <h3 className="text-stone-500 font-medium text-sm flex items-center gap-2 mb-2">
                        Resumo por Tamanho e Status
                    </h3>
                    <div className="flex gap-4 sm:gap-6 overflow-x-auto text-center font-medium items-end select-none">
                        {SIZES.map(s => (
                            <div key={s} className="flex flex-col items-center min-w-[30px]">
                                <span className="text-2xl font-bold text-stone-800">{summaryBySize[s]}</span>
                                <span className={`text-xs mt-1 ${summaryBySize[s] > 0 ? 'text-primary' : 'text-stone-400'}`}>{s}</span>
                            </div>
                        ))}
                        <div className="bg-stone-200 w-px h-8 mx-2 hidden sm:block"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-green-600">{paidOrders}</span>
                            <span className="text-xs mt-1 text-green-700">Pagos</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-destructive">{totalOrders - paidOrders}</span>
                            <span className="text-xs mt-1 text-red-700">Pendentes</span>
                        </div>
                    </div>
                </div>
                <div className="bg-card border rounded-radius p-4 shadow-sm flex flex-col justify-center">
                    <h3 className="text-stone-500 font-medium text-sm mb-3">Resumo Financeiro</h3>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-stone-600">Recebido</span>
                        <span className="text-lg font-bold text-green-600">R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2 mt-1">
                        <span className="text-sm font-medium text-stone-600">Pendente</span>
                        <span className="text-lg font-bold text-destructive">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="bg-card border rounded-radius shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-stone-50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar participante..."
                            className="w-full pl-10 pr-4 py-2 rounded-md border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="divide-y max-h-[600px] overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="p-8 text-center text-stone-500 flex flex-col items-center">
                            <Users size={32} className="text-stone-300 mb-2" />
                            Nenhum participante encontrado.
                        </div>
                    ) : (
                        filtered.map(({ profile, orders }) => (
                            <div key={profile.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex justify-center items-center font-bold text-sm">
                                        {profile.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{profile.name}</h4>
                                        <div className="flex gap-2 items-center mt-1">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                                                {profile.type}
                                            </span>
                                            {!expedition.participants.includes(profile.id) && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium border border-orange-200">
                                                    Externo
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col gap-2">
                                    {orders.map(order => (
                                        <div key={order.id} className="flex flex-wrap items-center gap-2 gap-y-3 bg-white border rounded-md p-2 shadow-sm text-sm lg:ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                                            <span className="font-medium text-stone-500 hidden sm:inline">Tamanho:</span>
                                            <select
                                                className={`border rounded px-2 h-7 font-bold outline-none ${canEdit ? 'bg-stone-50 focus:border-primary' : 'bg-transparent text-stone-600 appearance-none'}`}
                                                value={order.size}
                                                onChange={(e) => canEdit && updateTShirtOrder(order.id, { size: e.target.value as any })}
                                                disabled={!canEdit}
                                            >
                                                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>

                                            <span className="mx-2 text-stone-300 hidden sm:inline">|</span>

                                            <span className="font-medium text-stone-500 hidden sm:inline">Qtd:</span>
                                            <input
                                                type="number"
                                                min={1}
                                                className={`w-16 border rounded px-2 h-7 text-center font-bold outline-none ${canEdit ? 'bg-stone-50 focus:border-primary' : 'bg-transparent text-stone-600 select-none'}`}
                                                value={order.quantity}
                                                onChange={(e) => canEdit && updateTShirtOrder(order.id, { quantity: parseInt(e.target.value) || 1 })}
                                                readOnly={!canEdit}
                                            />

                                            <span className="mx-2 text-stone-300 hidden sm:inline">|</span>

                                            <span className="font-medium text-stone-500 hidden sm:inline">R$ Unid:</span>
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                placeholder="0.00"
                                                className={`w-20 border rounded px-2 h-7 text-right font-bold outline-none ${canEdit ? 'bg-stone-50 focus:border-primary' : 'bg-transparent text-stone-600 select-none'}`}
                                                value={order.price || ''}
                                                onChange={(e) => canEdit && updateTShirtOrder(order.id, { price: parseFloat(e.target.value) || 0 })}
                                                readOnly={!canEdit}
                                            />

                                            <span className="mx-2 text-stone-300 hidden sm:inline">|</span>

                                            <label className={`flex items-center gap-1.5 font-medium min-w-[85px] ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary rounded border-stone-300 focus:ring-primary accent-primary"
                                                    checked={order.hasPaid}
                                                    onChange={(e) => canEdit && updateTShirtOrder(order.id, { hasPaid: e.target.checked })}
                                                    disabled={!canEdit}
                                                />
                                                <span className={order.hasPaid ? 'text-green-600' : 'text-stone-400'}>
                                                    {order.hasPaid ? 'Pago' : 'Pendente'}
                                                </span>
                                            </label>

                                            <span className="ml-auto sm:ml-2 font-bold text-stone-700 w-auto sm:w-[100px] text-right">
                                                R$ {((order.quantity || 0) * (order.price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>

                                            {canEdit && <button
                                                onClick={() => deleteTShirtOrder(order.id)}
                                                className="ml-2 text-stone-300 hover:text-destructive transition-colors shrink-0 p-1"
                                                title="Remover pedido"
                                            >
                                                <Trash2 size={16} />
                                            </button>}
                                        </div>
                                    ))}

                                    <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mt-2 border-t pt-2 gap-2">
                                        <div className="text-sm">
                                            {orders.length > 0 && (
                                                <span className="font-semibold text-stone-600">
                                                    Total do Participante: R$ {orders.reduce((acc, o) => acc + (o.quantity * (o.price || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            )}
                                        </div>
                                        {canEdit && <button
                                            onClick={() => handleAddOrder(profile.id)}
                                            className="text-xs font-medium text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
                                        >
                                            <Shirt size={12} /> {orders.length === 0 ? 'Registrar Pedido' : '+ Adicionar Peça Extra'}
                                        </button>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
