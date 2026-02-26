import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStore, type Expedition } from '../../store/useStore';
import { Input, Button } from '../../components/ui/forms';
import { ShoppingCart, Tent, CheckSquare, Square, Trash2, Wand2, DollarSign, Pencil } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { v4 as uuidv4 } from 'uuid';

export function ExpeditionAcampamento() {
    const { expedition } = useOutletContext<{ expedition: Expedition }>();

    const allChecklistItems = useStore(state => state.checklistItems);
    const checklistItems = useMemo(() => allChecklistItems.filter(i => i.expeditionId === expedition.id), [allChecklistItems, expedition.id]);
    const addChecklistItem = useStore(state => state.addChecklistItem);
    const updateChecklistItem = useStore(state => state.updateChecklistItem);
    const toggleChecklistItem = useStore(state => state.toggleChecklistItem);
    const deleteChecklistItem = useStore(state => state.deleteChecklistItem);
    const addTransaction = useStore(state => state.addTransaction);
    const addFinancialTransaction = useStore(state => state.addFinancialTransaction);
    const profiles = useStore((state) => state.profiles);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';

    const [newItemName, setNewItemName] = useState('');
    const [newItemQtd, setNewItemQtd] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('UN');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [activeTab, setActiveTab] = useState<'Mercado' | 'Acampamento'>('Mercado');

    // Estado do Modal de Lançamento Financeiro
    const [financeModalOpen, setFinanceModalOpen] = useState(false);
    const [itemToLaunch, setItemToLaunch] = useState<any>(null);
    const [payerId, setPayerId] = useState('');
    const [isForDrinkersOnly, setIsForDrinkersOnly] = useState(false);

    // Estado do Modal de Edição
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any>(null);
    const [editItemName, setEditItemName] = useState('');
    const [editItemQtd, setEditItemQtd] = useState('');
    const [editItemUnit, setEditItemUnit] = useState('UN');
    const [editItemPrice, setEditItemPrice] = useState('');

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName) return;

        const qtd = newItemQtd ? Number(newItemQtd.replace(',', '.')) : undefined;
        const price = newItemPrice ? Number(newItemPrice.replace(',', '.')) : undefined;
        const total = (qtd && price) ? (qtd * price) : undefined;

        addChecklistItem({
            expeditionId: expedition.id,
            category: activeTab,
            name: newItemName,
            quantity: qtd,
            unit: newItemUnit,
            unitPrice: price,
            totalPrice: total,
            isChecked: false
        });

        setNewItemName('');
        setNewItemQtd('');
        setNewItemPrice('');
        setNewItemUnit('UN');
    };

    const handleAutoGenerate = () => {
        if (confirm('Isso vai adicionar itens padrões sugeridos. Continuar?')) {
            const participantsCount = expedition.participants.length;
            const drinkersCount = profiles.filter(p => expedition.participants.includes(p.id) && p.drinksAlcohol).length;

            if (activeTab === 'Mercado') {
                addChecklistItem({ expeditionId: expedition.id, category: 'Mercado', name: 'Carne para CHurrasco', quantity: participantsCount * 0.5, unit: 'KG', isChecked: false });
                addChecklistItem({ expeditionId: expedition.id, category: 'Mercado', name: 'Carvão', quantity: 2, unit: 'PCT', isChecked: false });
                addChecklistItem({ expeditionId: expedition.id, category: 'Mercado', name: 'Cerveja', quantity: drinkersCount * 2, unit: 'CX', isChecked: false });
                addChecklistItem({ expeditionId: expedition.id, category: 'Mercado', name: 'Refrigerante / Suco', quantity: participantsCount, unit: 'UN', isChecked: false });
                addChecklistItem({ expeditionId: expedition.id, category: 'Mercado', name: 'Arroz', quantity: 5, unit: 'KG', isChecked: false });
                addChecklistItem({ expeditionId: expedition.id, category: 'Mercado', name: 'Sal e Temperos', quantity: 1, unit: 'UN', isChecked: false });
            } else {
                addChecklistItem({ expeditionId: expedition.id, category: 'Acampamento', name: 'Barracas', quantity: Math.ceil(participantsCount / 2), unit: 'UN', isChecked: false });
                addChecklistItem({ expeditionId: expedition.id, category: 'Acampamento', name: 'Gerador de Energia', quantity: 1, unit: 'UN', isChecked: false });
                addChecklistItem({ expeditionId: expedition.id, category: 'Acampamento', name: 'Gasolina p/ Gerador', quantity: 20, unit: 'L', isChecked: false });
                addChecklistItem({ expeditionId: expedition.id, category: 'Acampamento', name: 'Freezer / Caixas Térmicas', quantity: 2, unit: 'UN', isChecked: false });
                addChecklistItem({ expeditionId: expedition.id, category: 'Acampamento', name: 'Panela de Ferro', quantity: 1, unit: 'UN', isChecked: false });
            }
        }
    };

    const handleLaunchFinance = (item: any) => {
        setItemToLaunch(item);
        if (expedition.participants.length > 0) {
            setPayerId(expedition.participants[0]);
        }
        setIsForDrinkersOnly(false); // Reset
        setFinanceModalOpen(true);
    };

    const confirmLaunchFinance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemToLaunch || !payerId || !itemToLaunch.totalPrice) return;

        const transId = uuidv4();
        addTransaction({
            id: transId,
            expeditionId: expedition.id,
            description: `[${activeTab}] ${itemToLaunch.name} (${itemToLaunch.quantity} ${itemToLaunch.unit})`,
            amount: 1, // Lança o total direto
            unitPrice: itemToLaunch.totalPrice,
            totalPrice: itemToLaunch.totalPrice,
            purchaseDate: new Date().toISOString().split('T')[0],
            purchasedBy: payerId,
            category: activeTab === 'Mercado' ? 'Mercado' : 'Camping',
            isExpense: true,
            isForDrinkersOnly: isForDrinkersOnly
        });

        // Se pago pelo caixa, gera SAÍDA no financeiro global
        if (payerId === 'caixa') {
            addFinancialTransaction({
                type: 'SAIDA',
                description: `Despesa Expedição ${expedition.name} - ${itemToLaunch.name}`,
                amount: itemToLaunch.totalPrice,
                category: activeTab === 'Mercado' ? 'Mercado' : 'Camping',
                date: new Date().toISOString().split('T')[0],
                status: 'Pago',
                paymentDate: new Date().toISOString().split('T')[0],
                provider: 'Caixa da Expedição',
                expeditionId: expedition.id,
                source: 'Conta a Pagar',
                notes: `Ref: Checklist ${activeTab} (Gerado via Expedição) [ID:${transId}]`
            });
        }

        // Marca o item como lançado
        updateChecklistItem(itemToLaunch.id, { transactionId: transId });

        setFinanceModalOpen(false);
        setItemToLaunch(null);
    };

    const handleEditClick = (item: any) => {
        setItemToEdit(item);
        setEditItemName(item.name);
        setEditItemQtd(item.quantity ? Number(item.quantity).toFixed(2).replace('.', ',') : '');
        setEditItemUnit(item.unit || 'UN');
        setEditItemPrice(item.unitPrice ? Number(item.unitPrice).toFixed(2).replace('.', ',') : '');
        setEditModalOpen(true);
    };

    const confirmEditChecklistItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemToEdit || !editItemName) return;

        const qtd = editItemQtd ? Number(editItemQtd.replace(',', '.')) : undefined;
        const price = editItemPrice ? Number(editItemPrice.replace(',', '.')) : undefined;
        const total = (qtd && price) ? (qtd * price) : undefined;

        updateChecklistItem(itemToEdit.id, {
            name: editItemName,
            quantity: qtd,
            unit: editItemUnit,
            unitPrice: price,
            totalPrice: total
        });
        setEditModalOpen(false);
        setItemToEdit(null);
    };

    const currentItems = checklistItems.filter(i => i.category === activeTab);
    const checkedCount = currentItems.filter(i => i.isChecked).length;
    const progressPercent = currentItems.length === 0 ? 0 : Math.round((checkedCount / currentItems.length) * 100);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Suprimentos e Checklist</h2>
                <div className="flex flex-col sm:flex-row bg-stone-100 p-1 w-full md:w-fit rounded-radius border">
                    <button
                        className={`px-4 py-2 text-sm font-medium rounded-md flex justify-center items-center gap-2 transition-colors w-full sm:w-auto ${activeTab === 'Mercado' ? 'bg-white shadow-sm text-primary' : 'text-stone-500 hover:text-stone-700'}`}
                        onClick={() => setActiveTab('Mercado')}
                    >
                        <ShoppingCart size={16} /> Lista de Mercado
                    </button>
                    <button
                        className={`px-4 py-2 mt-1 sm:mt-0 text-sm font-medium rounded-md flex justify-center items-center gap-2 transition-colors w-full sm:w-auto ${activeTab === 'Acampamento' ? 'bg-white shadow-sm text-primary' : 'text-stone-500 hover:text-stone-700'}`}
                        onClick={() => setActiveTab('Acampamento')}
                    >
                        <Tent size={16} /> Acampamento
                    </button>
                </div>
            </div>

            <div className="bg-card border rounded-radius shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-stone-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-foreground">
                            {activeTab === 'Mercado' ? 'Compras de Mercado' : 'Itens de Acampamento'}
                        </h3>
                        <p className="text-sm text-stone-500 mt-1">
                            {checkedCount} de {currentItems.length} itens marcados ({progressPercent}%)
                        </p>
                    </div>
                    {canEdit && <Button variant="outline" size="sm" onClick={handleAutoGenerate} className="gap-2">
                        <Wand2 size={16} /> Gerar Sugestão
                    </Button>}
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-stone-100">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>

                {canEdit && (
                    <div className="p-4 bg-white border-b">
                        <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-3 items-end">
                            <div className="flex-1 w-full">
                                <Input
                                    label="Novo Item"
                                    placeholder="Ex: Cerveja, Barraca..."
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <div className="w-20">
                                    <Input
                                        label="Qtd."
                                        placeholder="Ex: 5"
                                        type="text"
                                        value={newItemQtd}
                                        onChange={e => setNewItemQtd(e.target.value.replace(/[^0-9.,]/g, ''))}
                                        onBlur={e => {
                                            const num = parseFloat(e.target.value.replace(',', '.'));
                                            if (!isNaN(num)) setNewItemQtd(num.toFixed(2).replace('.', ','));
                                        }}
                                    />
                                </div>
                                <div className="w-24 flex flex-col space-y-1">
                                    <label className="text-sm font-medium text-foreground">Unid.</label>
                                    <select
                                        className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={newItemUnit}
                                        onChange={e => setNewItemUnit(e.target.value)}
                                    >
                                        <option value="UN">UN</option>
                                        <option value="PCT">PCT</option>
                                        <option value="KG">KG</option>
                                        <option value="CX">CX</option>
                                        <option value="L">L</option>
                                    </select>
                                </div>
                                <div className="w-24">
                                    <Input
                                        label="P. Unit."
                                        placeholder="Ex: 15,50"
                                        type="text"
                                        value={newItemPrice}
                                        onChange={e => setNewItemPrice(e.target.value.replace(/[^0-9.,]/g, ''))}
                                        onBlur={e => {
                                            const num = parseFloat(e.target.value.replace(',', '.'));
                                            if (!isNaN(num)) setNewItemPrice(num.toFixed(2).replace('.', ','));
                                        }}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full md:w-auto mb-0.5 whitespace-nowrap">Adicionar</Button>
                        </form>
                    </div>
                )}

                {currentItems.length > 0 && (
                    <div className="px-4 py-2 bg-stone-50 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:flex border-b">
                        <div className="w-10"></div>
                        <div className="flex-1">Produto</div>
                        <div className="w-24 text-center">Quantidade</div>
                        <div className="w-24 text-right">P. Unitário</div>
                        <div className="w-24 text-right">Total</div>
                        <div className="w-20 text-center ml-4">Lançado?</div>
                        <div className="w-12"></div>
                    </div>
                )}

                <ul className="divide-y max-h-[500px] overflow-y-auto">
                    {currentItems.length === 0 ? (
                        <li className="p-8 text-center text-stone-500">
                            A lista está vazia. Adicione itens manualmente ou gere uma sugestão.
                        </li>
                    ) : (
                        currentItems.map(item => (
                            <li key={item.id} className={`flex flex-col md:flex-row md:items-center p-4 transition-colors hover:bg-stone-50 ${item.isChecked ? 'opacity-60 bg-stone-50/50' : ''}`}>
                                <div className="flex flex-wrap md:flex-nowrap items-start md:items-center gap-3 w-full">
                                    <button
                                        onClick={() => { if (canEdit) toggleChecklistItem(item.id) }}
                                        className={`transition-colors ${canEdit ? (item.isChecked ? 'text-primary' : 'text-stone-300 hover:text-stone-400') : (item.isChecked ? 'text-primary cursor-default' : 'text-stone-300 cursor-default')} shrink-0`}
                                    >
                                        {item.isChecked ? <CheckSquare size={24} /> : <Square size={24} />}
                                    </button>

                                    <div className={`flex-1 flex flex-col md:flex-row md:items-center min-w-0 ${canEdit ? 'cursor-pointer' : ''}`} onClick={() => { if (canEdit) toggleChecklistItem(item.id) }}>
                                        <span className={`font-medium break-words w-full md:flex-1 ${item.isChecked ? 'line-through text-stone-500' : 'text-stone-800'}`}>
                                            {item.name}
                                        </span>

                                        <div className="flex flex-row flex-wrap items-center gap-3 md:gap-0 mt-2 md:mt-0 text-sm w-full md:w-auto">
                                            <div className="md:w-24 md:text-center text-stone-600">
                                                {item.quantity ? `${item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${item.unit || ''}` : '-'}
                                            </div>
                                            <div className="md:w-24 md:text-right text-stone-500">
                                                {item.unitPrice ? <><span className="md:hidden text-stone-400 text-xs mr-1">R$</span>{item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</> : '-'}
                                            </div>
                                            <div className="md:w-24 md:text-right font-semibold text-stone-700 shrink-0">
                                                {item.totalPrice ? `R$ ${item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto md:ml-4 mt-2 md:mt-0 justify-end md:justify-start">
                                        {canEdit && item.totalPrice && item.totalPrice > 0 ? (
                                            item.transactionId ? (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1.5 rounded w-20 text-center font-medium" title="Já lançado no financeiro">
                                                    Rateado
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleLaunchFinance(item); }}
                                                    className="text-xs bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-2 py-1.5 rounded w-20 text-center flex items-center justify-center gap-1 transition-colors"
                                                    title="Lançar no Financeiro da Expedição"
                                                >
                                                    <DollarSign size={12} /> Lançar
                                                </button>
                                            )
                                        ) : (
                                            <span className="w-20 hidden md:inline-block"></span>
                                        )}

                                        {canEdit && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteChecklistItem(item.id); }}
                                                    className="p-2 text-stone-300 hover:text-destructive transition-colors rounded-full hover:bg-red-50"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                    className="p-2 text-stone-300 hover:text-primary transition-colors rounded-full hover:bg-primary/5"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            <Modal isOpen={financeModalOpen} onClose={() => setFinanceModalOpen(false)} title="Lançar Despesa no Rateio">
                {itemToLaunch && (
                    <form onSubmit={confirmLaunchFinance} className="space-y-4">
                        <div className="bg-stone-50 border p-3 rounded-md mb-4 text-sm">
                            <p className="font-semibold text-stone-800">{itemToLaunch?.name}</p>
                            <p className="text-stone-500">Valor Total: <span className="font-bold text-destructive">R$ {itemToLaunch?.totalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Quem pagou?</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={payerId}
                                onChange={e => setPayerId(e.target.value)}
                            >
                                <option value="caixa">Caixa da Expedição / Finanças (Sairá do montante geral)</option>
                                <optgroup label="Sócio Pagante">
                                    {profiles.filter(p => expedition.participants.includes(p.id)).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {activeTab === 'Mercado' && (
                            <div className="flex items-start gap-2 pt-2 border-t mt-2">
                                <input
                                    type="checkbox"
                                    id="modalIsForDrinkersOnly"
                                    className="mt-1 w-4 h-4 text-primary rounded border-stone-300 focus:ring-primary accent-primary"
                                    checked={isForDrinkersOnly}
                                    onChange={e => setIsForDrinkersOnly(e.target.checked)}
                                />
                                <label htmlFor="modalIsForDrinkersOnly" className="text-sm text-stone-600 cursor-pointer">
                                    <span className="font-medium text-amber-700">Despesa exclusiva para Bebedores</span>
                                    <span className="block text-xs text-stone-500">Marque se este item será rateado apenas entre quem consome álcool.</span>
                                </label>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                            <Button type="button" variant="ghost" onClick={() => setFinanceModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Confirmar Despesa</Button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Item">
                {itemToEdit && (
                    <form onSubmit={confirmEditChecklistItem} className="space-y-4">
                        <Input
                            label="Nome do Item"
                            placeholder="Ex: Cerveja, Barraca..."
                            value={editItemName}
                            onChange={e => setEditItemName(e.target.value)}
                            required
                        />
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    label="Quantidade"
                                    type="text"
                                    value={editItemQtd}
                                    onChange={e => setEditItemQtd(e.target.value.replace(/[^0-9.,]/g, ''))}
                                    onBlur={e => {
                                        const num = parseFloat(e.target.value.replace(',', '.'));
                                        if (!isNaN(num)) setEditItemQtd(num.toFixed(2).replace('.', ','));
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium text-foreground block mb-1.5">Unidade</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={editItemUnit}
                                    onChange={e => setEditItemUnit(e.target.value)}
                                >
                                    <option value="UN">UN</option>
                                    <option value="PCT">PCT</option>
                                    <option value="KG">KG</option>
                                    <option value="CX">CX</option>
                                    <option value="L">L</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <Input
                                    label="Preço Un."
                                    type="text"
                                    value={editItemPrice}
                                    onChange={e => setEditItemPrice(e.target.value.replace(/[^0-9.,]/g, ''))}
                                    onBlur={e => {
                                        const num = parseFloat(e.target.value.replace(',', '.'));
                                        if (!isNaN(num)) setEditItemPrice(num.toFixed(2).replace('.', ','));
                                    }}
                                />
                            </div>
                        </div>

                        {itemToEdit.transactionId && (
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                                <b>Aviso:</b> Este item já está rateado no Financeiro. Mudanças de valor serão aplicadas automaticamente no Extrato!
                            </p>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                            <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar Alterações</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div >
    );
}
