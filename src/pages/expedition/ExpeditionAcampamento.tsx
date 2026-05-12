import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStore, type Expedition } from '../../store/useStore';
import { Input, Button } from '../../components/ui/forms';
import {
    ShoppingCart, Tent, CheckSquare, Square, Trash2, Wand2, DollarSign,
    Pencil, Save, Search, ArrowUpAZ, ArrowDownAZ, Beer, Zap, FileDown,
    FileText, FileSpreadsheet, ShoppingBag, BarChart2
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { v4 as uuidv4 } from 'uuid';
import {
    exportListToPdf, exportListToXlsx,
    exportFinancialToPdf, exportFinancialToXlsx
} from '../../lib/reports';

export function ExpeditionAcampamento() {
    const { expedition } = useOutletContext<{ expedition: Expedition }>();

    const allChecklistItems = useStore(state => state.checklistItems);
    const checklistItems = useMemo(
        () => allChecklistItems.filter(i => i.expeditionId === expedition.id),
        [allChecklistItems, expedition.id]
    );
    const addChecklistItem = useStore(state => state.addChecklistItem);
    const updateChecklistItem = useStore(state => state.updateChecklistItem);
    const toggleChecklistItem = useStore(state => state.toggleChecklistItem);
    const deleteChecklistItem = useStore(state => state.deleteChecklistItem);
    const addTransaction = useStore(state => state.addTransaction);
    const addFinancialTransaction = useStore(state => state.addFinancialTransaction);
    const saveCurrentAsTemplates = useStore(state => state.saveCurrentAsTemplates);
    const profiles = useStore(state => state.profiles);
    const allTransactions = useStore(state => state.transactions);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';

    const [activeTab, setActiveTab] = useState<'Mercado' | 'Acampamento'>('Mercado');

    // Estado do formulário de novo item
    const [newItemName, setNewItemName] = useState('');
    const [newItemQtd, setNewItemQtd] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('UN');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemTotal, setNewItemTotal] = useState('');
    const [newItemDrinkGroup, setNewItemDrinkGroup] = useState('');
    const [drinkGroupHint, setDrinkGroupHint] = useState('');

    // Busca e ordenação da lista de mercado
    const [searchTerm, setSearchTerm] = useState('');
    const [sortAsc, setSortAsc] = useState<boolean | null>(null);

    // Modal de lançamento financeiro
    const [financeModalOpen, setFinanceModalOpen] = useState(false);
    const [itemToLaunch, setItemToLaunch] = useState<any>(null);
    const [payerId, setPayerId] = useState('');
    const [launchDrinkGroup, setLaunchDrinkGroup] = useState('');

    // Modal de exportação de relatórios
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportType, setReportType] = useState<'lista' | 'financeiro'>('lista');
    const [reportGenerating, setReportGenerating] = useState(false);

    // Modal de edição
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any>(null);
    const [editItemName, setEditItemName] = useState('');
    const [editItemQtd, setEditItemQtd] = useState('');
    const [editItemUnit, setEditItemUnit] = useState('UN');
    const [editItemPrice, setEditItemPrice] = useState('');
    const [editItemTotal, setEditItemTotal] = useState('');
    const [editItemDrinkGroup, setEditItemDrinkGroup] = useState('');

    // Participantes e grupos de cerveja
    const expeditionParticipants = useMemo(
        () => profiles.filter(p => expedition.participants.includes(p.id)),
        [profiles, expedition.participants]
    );

    const drinkGroups = useMemo(() => {
        const groups = new Set<string>();
        expeditionParticipants.forEach(p => { if (p.drinkGroup) groups.add(p.drinkGroup); });
        return Array.from(groups).sort();
    }, [expeditionParticipants]);

    // ---------------------------------------------------------------
    // Auto-detecção: verifica se o nome do item contém uma marca conhecida
    // ---------------------------------------------------------------
    const autoDetect = (name: string): string => {
        if (!name || drinkGroups.length === 0) return '';
        const lower = name.toLowerCase();
        for (const group of drinkGroups) {
            if (lower.includes(group.toLowerCase())) return group;
        }
        return '';
    };

    // Handle mudança no nome do novo item → auto-detecta a marca
    const handleNewNameChange = (val: string) => {
        setNewItemName(val);
        const detected = autoDetect(val);
        if (detected) {
            setNewItemDrinkGroup(detected);
            setDrinkGroupHint(detected);
        } else {
            setDrinkGroupHint('');
            if (!newItemDrinkGroup) setNewItemDrinkGroup('');
        }
    };

    // Badge de grupo de bebida em cada item da lista (por auto-detecção ou campo salvo)
    const itemGroupMap = useMemo(() => {
        const map: Record<string, string> = {};
        checklistItems.forEach(item => {
            const group = item.drinkGroup || autoDetect(item.name);
            if (group) map[item.id] = group;
        });
        return map;
    }, [checklistItems, drinkGroups]);

    // Parse robusto de números no formato pt-BR (ex: "1.200,577" → 1200.577)
    const parsePtBR = (val: string): number => {
        // Remove separadores de milhar (pontos) e troca vírgula decimal por ponto
        const clean = val.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean);
    };

    // Handlers bidirecionais P. Unit. ↔ Total (novo item)
    const handleNewPriceChange = (val: string) => {
        setNewItemPrice(val);
        const qtd = parsePtBR(newItemQtd);
        const price = parsePtBR(val);
        if (!isNaN(qtd) && !isNaN(price) && qtd > 0) {
            setNewItemTotal((qtd * price).toFixed(2).replace('.', ','));
        } else {
            setNewItemTotal('');
        }
    };

    const handleNewTotalChange = (val: string) => {
        setNewItemTotal(val);
        const qtd = parsePtBR(newItemQtd);
        const total = parsePtBR(val);
        if (!isNaN(qtd) && !isNaN(total) && qtd > 0) {
            setNewItemPrice((total / qtd).toFixed(2).replace('.', ','));
        } else {
            setNewItemPrice('');
        }
    };

    // Handlers bidirecionais P. Unit. ↔ Total (edição)
    const handleEditPriceChange = (val: string) => {
        setEditItemPrice(val);
        const qtd = parsePtBR(editItemQtd);
        const price = parsePtBR(val);
        if (!isNaN(qtd) && !isNaN(price) && qtd > 0) {
            setEditItemTotal((qtd * price).toFixed(2).replace('.', ','));
        } else {
            setEditItemTotal('');
        }
    };

    const handleEditTotalChange = (val: string) => {
        setEditItemTotal(val);
        const qtd = parsePtBR(editItemQtd);
        const total = parsePtBR(val);
        if (!isNaN(qtd) && !isNaN(total) && qtd > 0) {
            setEditItemPrice((total / qtd).toFixed(2).replace('.', ','));
        } else {
            setEditItemPrice('');
        }
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName) return;

        const qtd = newItemQtd ? parsePtBR(newItemQtd) : undefined;
        const price = newItemPrice ? parsePtBR(newItemPrice) : undefined;
        const total = newItemTotal
            ? parsePtBR(newItemTotal)
            : (qtd && price) ? qtd * price : undefined;
        const detectedGroup = newItemDrinkGroup || autoDetect(newItemName);

        addChecklistItem({
            expeditionId: expedition.id,
            category: activeTab,
            name: newItemName,
            quantity: qtd,
            unit: newItemUnit,
            unitPrice: price,
            totalPrice: total,
            isChecked: false,
            drinkGroup: detectedGroup || undefined,
        });

        setNewItemName('');
        setNewItemQtd('');
        setNewItemPrice('');
        setNewItemTotal('');
        setNewItemUnit('UN');
        setNewItemDrinkGroup('');
        setDrinkGroupHint('');
    };

    const handleAutoGenerate = () => {
        if (confirm('Isso vai adicionar itens padrões sugeridos. Continuar?')) {
            const participantsCount = expedition.participants.length;
            const drinkersCount = expeditionParticipants.filter(p => p.drinksAlcohol || p.drinkGroup).length;

            if (activeTab === 'Mercado') {
                addChecklistItem({ expeditionId: expedition.id, category: 'Mercado', name: 'Carne para Churrasco', quantity: participantsCount * 0.5, unit: 'KG', isChecked: false });
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

    // Abre modal de lançamento com o drinkGroup já pré-preenchido
    const handleLaunchFinance = (item: any) => {
        setItemToLaunch(item);
        if (expedition.participants.length > 0) setPayerId(expedition.participants[0]);

        // Prioridade: campo salvo no item → auto-detecção pelo nome
        const preSelected = item.drinkGroup || autoDetect(item.name);
        setLaunchDrinkGroup(preSelected);
        setFinanceModalOpen(true);
    };

    const confirmLaunchFinance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemToLaunch || !payerId || !itemToLaunch.totalPrice) return;

        const drinkGroupValue = launchDrinkGroup || undefined;
        const isForDrinkersOnly = !!drinkGroupValue;

        const transId = uuidv4();
        await addTransaction({
            id: transId,
            expeditionId: expedition.id,
            description: `[${activeTab}] ${itemToLaunch.name}${itemToLaunch.quantity ? ` (${itemToLaunch.quantity} ${itemToLaunch.unit || ''})` : ''}`,
            amount: 1,
            unitPrice: itemToLaunch.totalPrice,
            totalPrice: itemToLaunch.totalPrice,
            purchaseDate: new Date().toISOString().split('T')[0],
            purchasedBy: payerId,
            category: activeTab === 'Mercado' ? 'Mercado' : 'Camping',
            isExpense: true,
            isForDrinkersOnly,
            drinkGroup: drinkGroupValue,
        });

        if (payerId === 'caixa') {
            await addFinancialTransaction({
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
                notes: `Ref: Checklist ${activeTab} [ID:${transId}]`
            });
        }

        // Salva o drinkGroup no item da lista também para persistência
        await updateChecklistItem(itemToLaunch.id, {
            transactionId: transId,
            drinkGroup: drinkGroupValue,
        });

        setFinanceModalOpen(false);
        setItemToLaunch(null);
    };

    const handleEditClick = (item: any) => {
        setItemToEdit(item);
        setEditItemName(item.name);
        setEditItemQtd(item.quantity ? Number(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }) : '');
        setEditItemUnit(item.unit || 'UN');
        setEditItemPrice(item.unitPrice ? Number(item.unitPrice).toFixed(2).replace('.', ',') : '');
        setEditItemTotal(item.totalPrice ? Number(item.totalPrice).toFixed(2).replace('.', ',') : '');
        setEditItemDrinkGroup(item.drinkGroup || autoDetect(item.name));
        setEditModalOpen(true);
    };

    const confirmEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemToEdit || !editItemName) return;

        const qtd = editItemQtd ? parsePtBR(editItemQtd) : undefined;
        const price = editItemPrice ? parsePtBR(editItemPrice) : undefined;
        const total = editItemTotal
            ? parsePtBR(editItemTotal)
            : (qtd && price) ? qtd * price : undefined;

        updateChecklistItem(itemToEdit.id, {
            name: editItemName,
            quantity: qtd,
            unit: editItemUnit,
            unitPrice: price,
            totalPrice: total,
            drinkGroup: editItemDrinkGroup || undefined,
        });

        setEditModalOpen(false);
        setItemToEdit(null);
    };

    // Lista filtrada e ordenada
    const rawItems = checklistItems.filter(i => i.category === activeTab);
    const currentItems = useMemo(() => {
        let items = rawItems;
        if (activeTab === 'Mercado' && searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            items = items.filter(i => i.name.toLowerCase().includes(lower));
        }
        if (activeTab === 'Mercado' && sortAsc !== null) {
            items = [...items].sort((a, b) =>
                sortAsc ? a.name.localeCompare(b.name, 'pt-BR') : b.name.localeCompare(a.name, 'pt-BR')
            );
        }
        return items;
    }, [rawItems, activeTab, searchTerm, sortAsc]);

    const checkedCount = rawItems.filter(i => i.isChecked).length;
    const progressPercent = rawItems.length === 0 ? 0 : Math.round((checkedCount / rawItems.length) * 100);

    // Componente de select de grupo de bebida reutilizável
    const DrinkGroupSelect = ({
        value, onChange, label = 'Rateio de Bebida', showInfo = true
    }: { value: string; onChange: (v: string) => void; label?: string; showInfo?: boolean }) => (
        <div className="space-y-1">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Beer size={14} className="text-amber-500" />
                {label}
            </label>
            <select
                className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={value}
                onChange={e => onChange(e.target.value)}
            >
                <option value="">🌐 Geral — todos os participantes pagam</option>
                {drinkGroups.length > 0 ? (
                    <>
                        <option value="todos">🍺 Todos os Bebedores (qualquer marca)</option>
                        <optgroup label="— Por Marca Específica:">
                            {drinkGroups.map(g => {
                                const count = expeditionParticipants.filter(p => p.drinkGroup === g).length;
                                return (
                                    <option key={g} value={g}>🍺 {g} ({count} pessoa{count !== 1 ? 's' : ''})</option>
                                );
                            })}
                        </optgroup>
                    </>
                ) : (
                    <option value="todos">🍺 Todos os Bebedores</option>
                )}
            </select>
            {showInfo && value && value !== '' && (
                <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                    <Beer size={11} />
                    {value === 'todos'
                        ? 'Custo dividido entre todos que bebem.'
                        : `Custo dividido apenas entre participantes que bebem ${value}.`}
                </p>
            )}
            {showInfo && !value && (
                <p className="text-xs text-stone-400 mt-0.5">Custo dividido igualmente entre todos os participantes.</p>
            )}
        </div>
    );

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
                {/* Cabeçalho */}
                <div className="p-4 border-b bg-stone-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-foreground">
                            {activeTab === 'Mercado' ? 'Compras de Mercado' : 'Itens de Acampamento'}
                        </h3>
                        <p className="text-sm text-stone-500 mt-0.5">
                            {checkedCount} de {rawItems.length} itens marcados ({progressPercent}%)
                        </p>
                    </div>
                    {canEdit && (
                        <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => {
                                if (confirm('Salvar os itens atuais como lista base para futuras expedições? Isso substituirá a lista base anterior.')) {
                                    saveCurrentAsTemplates(expedition.id);
                                    alert('Lista base salva! Os itens serão copiados automaticamente para toda nova expedição.');
                                }
                            }} className="gap-2">
                                <Save size={16} /> Salvar como Lista Base
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleAutoGenerate} className="gap-2">
                                <Wand2 size={16} /> Gerar Sugestão
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setReportModalOpen(true)} className="gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                                <FileDown size={16} /> Exportar
                            </Button>
                        </div>
                    )}
                </div>

                {/* Barra de progresso */}
                <div className="h-1.5 w-full bg-stone-100">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>

                {/* Formulário de novo item */}
                {canEdit && (
                    <div className="p-4 bg-white border-b">
                        <form onSubmit={handleAddItem} className="space-y-3">
                            <div className="flex flex-col md:flex-row gap-3 items-end">
                                <div className="flex-1 w-full">
                                    <Input
                                        label="Novo Item"
                                        placeholder="Ex: Cerveja Brahma, Carne..."
                                        value={newItemName}
                                        onChange={e => handleNewNameChange(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <div className="w-20">
                                        <Input
                                            label="Qtd."
                                            type="text"
                                            value={newItemQtd}
                                            onChange={e => setNewItemQtd(e.target.value.replace(/[^0-9.,]/g, ''))}
                                            onBlur={e => {
                                                const n = parsePtBR(e.target.value);
                                                if (!isNaN(n)) {
                                                    setNewItemQtd(n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }));
                                                    const price = parsePtBR(newItemPrice);
                                                    const tot = parsePtBR(newItemTotal);
                                                    if (!isNaN(tot) && tot > 0) setNewItemPrice((tot / n).toFixed(2).replace('.', ','));
                                                    else if (!isNaN(price) && price > 0) setNewItemTotal((n * price).toFixed(2).replace('.', ','));
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="w-24 flex flex-col space-y-1">
                                        <label className="text-sm font-medium text-foreground">Unid.</label>
                                        <select
                                            className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm"
                                            value={newItemUnit}
                                            onChange={e => setNewItemUnit(e.target.value)}
                                        >
                                            <option value="UN">UN</option>
                                            <option value="PCT">PCT</option>
                                            <option value="KG">KG</option>
                                            <option value="CX">CX</option>
                                            <option value="L">L</option>
                                            <option value="GF">GF</option>
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            label="P. Unit. (R$)"
                                            type="text"
                                            value={newItemPrice}
                                            onChange={e => handleNewPriceChange(e.target.value.replace(/[^0-9.,]/g, ''))}
                                            onBlur={e => {
                                                const n = parseFloat(e.target.value.replace(',', '.'));
                                                if (!isNaN(n)) handleNewPriceChange(n.toFixed(2).replace('.', ','));
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-end pb-2.5 shrink-0 text-stone-400 select-none" title="Calculado automaticamente">
                                        <span className="text-base leading-none">⟷</span>
                                    </div>
                                    <div className="w-28">
                                        <Input
                                            label="Total (R$)"
                                            type="text"
                                            value={newItemTotal}
                                            onChange={e => handleNewTotalChange(e.target.value.replace(/[^0-9.,]/g, ''))}
                                            onBlur={e => {
                                                const n = parseFloat(e.target.value.replace(',', '.'));
                                                if (!isNaN(n)) handleNewTotalChange(n.toFixed(2).replace('.', ','));
                                            }}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full md:w-auto mb-0.5 whitespace-nowrap">Adicionar</Button>
                            </div>

                            {/* Sugestão de marca detectada — aparece apenas quando há grupos e algo detectado */}
                            {activeTab === 'Mercado' && drinkGroups.length > 0 && (
                                <div className="flex flex-col sm:flex-row gap-3 items-end border-t border-dashed pt-3">
                                    <div className="flex-1">
                                        <DrinkGroupSelect
                                            value={newItemDrinkGroup}
                                            onChange={setNewItemDrinkGroup}
                                            label="Marca de Cerveja (para rateio automático)"
                                            showInfo={false}
                                        />
                                    </div>
                                    {drinkGroupHint && (
                                        <p className="text-xs text-amber-600 flex items-center gap-1 pb-2 shrink-0">
                                            <Zap size={11} /> Detectado automaticamente pelo nome
                                        </p>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {/* Barra de busca e ordenação */}
                {activeTab === 'Mercado' && rawItems.length > 0 && (
                    <div className="px-4 py-2 bg-stone-50/70 border-b flex items-center gap-2">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                placeholder="Buscar produto..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-sm border border-input rounded-md bg-white w-full focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <button
                            onClick={() => setSortAsc(prev => prev === null ? true : prev === true ? false : null)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${sortAsc !== null ? 'bg-primary text-white border-primary' : 'bg-white border-input text-stone-500 hover:bg-stone-50'}`}
                        >
                            {sortAsc === false ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />}
                            {sortAsc === null ? 'A→Z' : sortAsc ? 'Z→A' : 'A→Z ✓'}
                        </button>
                        {(searchTerm || sortAsc !== null) && (
                            <button onClick={() => { setSearchTerm(''); setSortAsc(null); }} className="text-xs text-stone-400 hover:text-destructive px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                Limpar
                            </button>
                        )}
                        {searchTerm && <span className="text-xs text-stone-500">{currentItems.length} resultado(s)</span>}
                    </div>
                )}

                {/* Header da tabela */}
                {rawItems.length > 0 && (
                    <div className="px-4 py-2 bg-stone-50 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:flex border-b">
                        <div className="w-10"></div>
                        <div className="flex-1">Produto</div>
                        <div className="w-24 text-center">Quantidade</div>
                        <div className="w-24 text-right">P. Unitário</div>
                        <div className="w-24 text-right">Total</div>
                        <div className="w-20 text-center ml-4">Lançado?</div>
                        <div className="w-16"></div>
                    </div>
                )}

                {/* Lista */}
                <ul className="divide-y max-h-[500px] overflow-y-auto">
                    {currentItems.length === 0 ? (
                        <li className="p-8 text-center text-stone-500">
                            {searchTerm
                                ? `Nenhum produto encontrado para "${searchTerm}".`
                                : 'A lista está vazia. Adicione itens ou gere uma sugestão.'}
                        </li>
                    ) : (
                        currentItems.map(item => {
                            const detectedGroup = itemGroupMap[item.id];
                            return (
                                <li key={item.id} className={`flex flex-col md:flex-row md:items-center p-4 transition-colors hover:bg-stone-50 ${item.isChecked ? 'opacity-60 bg-stone-50/50' : ''}`}>
                                    <div className="flex flex-wrap md:flex-nowrap items-start md:items-center gap-3 w-full">
                                        <button
                                            onClick={() => { if (canEdit) toggleChecklistItem(item.id); }}
                                            className={`transition-colors shrink-0 ${canEdit ? (item.isChecked ? 'text-primary' : 'text-stone-300 hover:text-stone-400') : (item.isChecked ? 'text-primary cursor-default' : 'text-stone-300 cursor-default')}`}
                                        >
                                            {item.isChecked ? <CheckSquare size={24} /> : <Square size={24} />}
                                        </button>

                                        <div
                                            className={`flex-1 flex flex-col md:flex-row md:items-center min-w-0 ${canEdit ? 'cursor-pointer' : ''}`}
                                            onClick={() => { if (canEdit) toggleChecklistItem(item.id); }}
                                        >
                                            <div className="flex items-center gap-2 w-full md:flex-1">
                                                <span className={`font-medium break-words ${item.isChecked ? 'line-through text-stone-500' : 'text-stone-800'}`}>
                                                    {item.name}
                                                </span>
                                                {/* Badge do grupo de cerveja */}
                                                {detectedGroup && (
                                                    <span
                                                        className="shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"
                                                        title={`Rateio: grupo ${detectedGroup}`}
                                                    >
                                                        <Beer size={9} /> {detectedGroup}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-row flex-wrap items-center gap-3 md:gap-0 mt-2 md:mt-0 text-sm">
                                                <div className="md:w-24 md:text-center text-stone-600">
                                                    {item.quantity ? `${Number(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${item.unit || ''}` : '-'}
                                                </div>
                                                <div className="md:w-24 md:text-right text-stone-500">
                                                    {item.unitPrice
                                                        ? `R$ ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                        : '-'}
                                                </div>
                                                <div className="md:w-24 md:text-right font-semibold text-stone-700 shrink-0">
                                                    {item.totalPrice
                                                        ? `R$ ${item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                        : '-'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ações */}
                                        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto md:ml-4 mt-2 md:mt-0 justify-end">
                                            {canEdit && item.totalPrice && item.totalPrice > 0 ? (
                                                item.transactionId ? (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1.5 rounded w-20 text-center font-medium">Rateado</span>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleLaunchFinance(item); }}
                                                        className="text-xs bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-2 py-1.5 rounded w-20 text-center flex items-center justify-center gap-1 transition-colors"
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
                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                        className="p-2 text-stone-300 hover:text-primary transition-colors rounded-full hover:bg-primary/5"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteChecklistItem(item.id); }}
                                                        className="p-2 text-stone-300 hover:text-destructive transition-colors rounded-full hover:bg-red-50"
                                                        title="Remover"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>

            {/* ===== MODAL DE LANÇAMENTO FINANCEIRO ===== */}
            <Modal isOpen={financeModalOpen} onClose={() => setFinanceModalOpen(false)} title="Lançar Despesa no Rateio">
                {itemToLaunch && (
                    <form onSubmit={confirmLaunchFinance} className="space-y-4">
                        {/* Resumo do item */}
                        <div className="bg-stone-50 border p-3 rounded-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-stone-800">{itemToLaunch?.name}</p>
                                    <p className="text-xs text-stone-500 mt-0.5">
                                        {itemToLaunch?.quantity ? `${itemToLaunch.quantity} ${itemToLaunch.unit || ''} × R$ ${itemToLaunch.unitPrice?.toFixed(2).replace('.', ',')}` : ''}
                                    </p>
                                </div>
                                <p className="font-bold text-lg text-destructive">
                                    R$ {itemToLaunch?.totalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {/* Quem pagou */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Quem pagou este item?</label>
                            <select
                                className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm"
                                value={payerId}
                                onChange={e => setPayerId(e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                <option value="caixa">💰 Caixa da Expedição (sairá do montante geral)</option>
                                <optgroup label="Pago por um participante:">
                                    {expeditionParticipants.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* Seleção de grupo de bebida */}
                        {activeTab === 'Mercado' && (
                            <div className="border-t pt-3 mt-1">
                                <DrinkGroupSelect
                                    value={launchDrinkGroup}
                                    onChange={setLaunchDrinkGroup}
                                />
                                {launchDrinkGroup && launchDrinkGroup !== 'todos' && launchDrinkGroup !== '' && (
                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                        <strong>Participantes no grupo {launchDrinkGroup}:</strong>{' '}
                                        {expeditionParticipants
                                            .filter(p => p.drinkGroup === launchDrinkGroup)
                                            .map(p => p.name)
                                            .join(', ') || 'Nenhum cadastrado ainda.'}
                                    </div>
                                )}
                                {launchDrinkGroup === 'todos' && (
                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                        <strong>Todos os bebedores:</strong>{' '}
                                        {expeditionParticipants
                                            .filter(p => p.drinksAlcohol || p.drinkGroup)
                                            .map(p => p.name)
                                            .join(', ') || 'Nenhum bebedor cadastrado.'}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setFinanceModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Confirmar Lançamento</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* ===== MODAL DE EDIÇÃO ===== */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Item">
                {itemToEdit && (
                    <form onSubmit={confirmEdit} className="space-y-4">
                        <Input
                            label="Nome do Item"
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
                                        const n = parsePtBR(e.target.value);
                                        if (!isNaN(n)) setEditItemQtd(n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }));
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium text-foreground block mb-1.5">Unidade</label>
                                <select
                                    className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm"
                                    value={editItemUnit}
                                    onChange={e => setEditItemUnit(e.target.value)}
                                >
                                    <option value="UN">UN</option>
                                    <option value="PCT">PCT</option>
                                    <option value="KG">KG</option>
                                    <option value="CX">CX</option>
                                    <option value="L">L</option>
                                    <option value="GF">GF</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <Input
                                    label="Preço Un. (R$)"
                                    type="text"
                                    value={editItemPrice}
                                    onChange={e => handleEditPriceChange(e.target.value.replace(/[^0-9.,]/g, ''))}
                                    onBlur={e => {
                                        const n = parseFloat(e.target.value.replace(',', '.'));
                                        if (!isNaN(n)) handleEditPriceChange(n.toFixed(2).replace('.', ','));
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 text-stone-400 text-xs font-medium pt-1">⟷ Total calculado automaticamente</div>
                        </div>
                        <div>
                            <Input
                                label="Total (R$)"
                                type="text"
                                value={editItemTotal}
                                onChange={e => handleEditTotalChange(e.target.value.replace(/[^0-9.,]/g, ''))}
                                onBlur={e => {
                                    const n = parseFloat(e.target.value.replace(',', '.'));
                                    if (!isNaN(n)) handleEditTotalChange(n.toFixed(2).replace('.', ','));
                                }}
                            />
                        </div>

                        {/* Grupo de cerveja no edit */}
                        {activeTab === 'Mercado' && drinkGroups.length > 0 && (
                            <DrinkGroupSelect
                                value={editItemDrinkGroup}
                                onChange={setEditItemDrinkGroup}
                                label="Marca de Cerveja"
                            />
                        )}

                        {itemToEdit.transactionId && (
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                ⚠️ Este item já foi lançado no Financeiro. Alterações de valor não atualizam automaticamente a transação já criada.
                            </p>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar Alterações</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* ===== MODAL DE EXPORTAÇÃO DE RELATÓRIOS ===== */}
            <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Exportar Relatório">
                <div className="space-y-5">
                    {/* Tipo de relatório */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-stone-700">Tipo de Relatório</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => setReportType('lista')}
                                className={`flex flex-col items-start gap-1.5 p-4 rounded-lg border-2 transition-all text-left ${
                                    reportType === 'lista'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-stone-200 hover:border-stone-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <ShoppingBag size={18} className={reportType === 'lista' ? 'text-primary' : 'text-stone-400'} />
                                    <span className="font-semibold text-sm">Lista de Itens</span>
                                </div>
                                <p className="text-xs text-stone-500 leading-relaxed">
                                    Exporta a aba atual ({activeTab}) com produtos, quantidades, preços e status.
                                </p>
                            </button>

                            <button
                                onClick={() => setReportType('financeiro')}
                                className={`flex flex-col items-start gap-1.5 p-4 rounded-lg border-2 transition-all text-left ${
                                    reportType === 'financeiro'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-stone-200 hover:border-stone-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <BarChart2 size={18} className={reportType === 'financeiro' ? 'text-emerald-600' : 'text-stone-400'} />
                                    <span className="font-semibold text-sm">Resumo Financeiro</span>
                                </div>
                                <p className="text-xs text-stone-500 leading-relaxed">
                                    Todas as listas + detalhes de lançamentos, gastos por participante e por categoria.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Formato */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-stone-700">Formato de Exportação</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                disabled={reportGenerating}
                                onClick={async () => {
                                    setReportGenerating(true);
                                    try {
                                        if (reportType === 'lista') {
                                            exportListToPdf(checklistItems, expedition, activeTab);
                                        } else {
                                            exportFinancialToPdf(checklistItems, allTransactions, expeditionParticipants, expedition);
                                        }
                                    } finally {
                                        setReportGenerating(false);
                                        setReportModalOpen(false);
                                    }
                                }}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors font-semibold text-sm disabled:opacity-50"
                            >
                                <FileText size={20} />
                                {reportGenerating ? 'Gerando...' : 'Baixar PDF'}
                            </button>

                            <button
                                disabled={reportGenerating}
                                onClick={async () => {
                                    setReportGenerating(true);
                                    try {
                                        if (reportType === 'lista') {
                                            exportListToXlsx(checklistItems, expedition, activeTab);
                                        } else {
                                            exportFinancialToXlsx(checklistItems, allTransactions, expeditionParticipants, expedition);
                                        }
                                    } finally {
                                        setReportGenerating(false);
                                        setReportModalOpen(false);
                                    }
                                }}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors font-semibold text-sm disabled:opacity-50"
                            >
                                <FileSpreadsheet size={20} />
                                {reportGenerating ? 'Gerando...' : 'Baixar XLSX'}
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-stone-400 text-center">
                        O arquivo será baixado automaticamente pelo navegador.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
