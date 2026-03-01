import { useState } from 'react';
import { useParams, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { MapPin, Calendar, Users, Wallet, CheckSquare, Anchor, Shirt, KanbanSquare, Pencil, Trash2 } from 'lucide-react';
import { Input, Button, cn } from '../components/ui/forms';
import { Modal } from '../components/ui/Modal';

const expTabs = [
    { id: 'geral', label: 'Visão Geral', icon: MapPin },
    { id: 'participantes', label: 'Participantes', icon: Users },
    { id: 'financeiro', label: 'Financeiro', icon: Wallet },
    { id: 'kanban', label: 'Tarefas', icon: KanbanSquare },
    { id: 'acampamento', label: 'Acampamento', icon: CheckSquare },
    { id: 'equipes', label: 'Equipes', icon: Anchor },
    { id: 'camisetas', label: 'Camisetas', icon: Shirt },
];

export function ExpeditionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const expeditions = useStore(state => state.expeditions);
    const updateExpedition = useStore(state => state.updateExpedition);
    const deleteExpedition = useStore(state => state.deleteExpedition);
    const currentUser = useStore(state => state.currentUser);
    const expedition = expeditions.find(e => e.id === id);
    const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        year: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        location: ''
    });

    if (!expedition) {
        return <div className="p-8 text-center text-stone-500">Expedição não encontrada.</div>;
    }

    const openEditModal = () => {
        setEditForm({
            name: expedition.name,
            year: expedition.year,
            startDate: expedition.startDate,
            endDate: expedition.endDate,
            location: expedition.location
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateExpedition(expedition.id, editForm);
        setEditModalOpen(false);
    };

    const handleConfirmDelete = async () => {
        await deleteExpedition(expedition.id);
        navigate('/');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Cabeçalho */}
            <div className="bg-primary text-primary-foreground p-6 md:p-8 rounded-radius shadow-md relative overflow-hidden">
                {/* Decorativo */}
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
                    <Anchor size={200} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-primary-foreground/20 px-3 py-1 rounded-full text-sm font-bold tracking-wide">
                            {expedition.year}
                        </span>
                        <span className="text-primary-foreground/80 flex items-center gap-1 text-sm">
                            <Calendar size={16} />
                            {expedition.startDate ? format(parseISO(expedition.startDate), 'dd-MM-yyyy') : '?'} a {expedition.endDate ? format(parseISO(expedition.endDate), 'dd-MM-yyyy') : '?'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            {expedition.name}
                        </h1>
                        <button
                            onClick={openEditModal}
                            className="p-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground rounded-full transition-colors flex items-center justify-center"
                            title="Editar Expedição"
                        >
                            <Pencil size={18} />
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-full transition-colors flex items-center justify-center"
                                title="Excluir Expedição"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                    <p className="text-primary-foreground/90 flex items-center gap-1.5 font-medium">
                        <MapPin size={18} /> {expedition.location || 'Local a definir'}
                    </p>
                </div>
            </div>

            {/* Abas */}
            <div className="bg-card border rounded-radius shadow-sm p-1 overflow-x-auto scroolbar-hide">
                <nav className="flex min-w-max gap-1">
                    {expTabs.map(tab => (
                        <NavLink
                            key={tab.id}
                            to={`/expedition/${id}/${tab.id === 'geral' ? '' : tab.id}`}
                            end={tab.id === 'geral'}
                            className={({ isActive }) => cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                                isActive
                                    ? "bg-stone-100 text-stone-900 shadow-sm"
                                    : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Conteúdo da Aba */}
            <div className="bg-card border rounded-radius shadow-sm p-6 min-h-[400px]">
                <Outlet context={{ expedition }} />
            </div>

            {/* Modal de Edição */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Expedição">
                <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                    <Input
                        label="Nome da Expedição"
                        value={editForm.name}
                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Data de Início"
                            type="date"
                            value={editForm.startDate}
                            onChange={e => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                            required
                        />
                        <Input
                            label="Data de Término"
                            type="date"
                            value={editForm.endDate}
                            onChange={e => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <Input
                                label="Local/Destino"
                                placeholder="Rio Araguaia - TO"
                                value={editForm.location}
                                onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="col-span-1">
                            <Input
                                label="Ano/Edição"
                                type="number"
                                value={editForm.year.toString()}
                                onChange={e => setEditForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Atualizar</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Confirmação de Exclusão */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Excluir Expedição">
                <div className="space-y-4 pt-2">
                    <p className="text-stone-600">
                        Tem certeza que deseja excluir a expedição <strong>"{expedition.name}"</strong>?
                    </p>
                    <p className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md">
                        ⚠️ TODOS os dados relacionados (transações, checklist, participantes, equipes, tarefas e camisetas) serão excluídos permanentemente.
                    </p>
                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                        <Button type="button" onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir Permanentemente</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
