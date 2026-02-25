import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStore, type Expedition, type TaskStatus, type TaskPriority, type TaskCategory } from '../../store/useStore';
import { Modal } from '../../components/ui/Modal';
import { Input, Button } from '../../components/ui/forms';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const COLUMNS: TaskStatus[] = ['Fazer', 'Em Andamento', 'Pendente', 'Concluído'];
const PRIORITIES: TaskPriority[] = ['Baixa', 'Média', 'Alta'];
const CATEGORIES: TaskCategory[] = ['Pesca', 'Acampamento', 'Compras', 'Logística', 'Financeiro', 'Administrativo', 'Camisetas'];

export function ExpeditionKanban() {
    const { expedition } = useOutletContext<{ expedition: Expedition }>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const allTasks = useStore(state => state.tasks);
    const tasks = useMemo(() => allTasks.filter(t => t.expeditionId === expedition.id), [allTasks, expedition.id]);
    const addTask = useStore(state => state.addTask);
    const updateTask = useStore(state => state.updateTask);
    const deleteTask = useStore(state => state.deleteTask);

    const profiles = useStore(state => state.profiles);
    const participants = useMemo(() => profiles.filter(p => expedition.participants.includes(p.id)), [profiles, expedition.participants]);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = true; // Liberado para todos os perfis colaborarem nas Tarefas
    const canDelete = currentUser?.role !== 'User';

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Fazer' as TaskStatus,
        priority: 'Média' as TaskPriority,
        category: 'Administrativo' as TaskCategory,
        assignedTo: '',
        dueDate: ''
    });

    const handleNewTask = () => {
        setEditingTaskId(null);
        setFormData({
            title: '',
            description: '',
            status: 'Fazer',
            priority: 'Média',
            category: 'Administrativo',
            assignedTo: '',
            dueDate: ''
        });
        setIsModalOpen(true);
    };

    const handleEditTask = (task: any) => {
        setEditingTaskId(task.id);
        setFormData({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            category: task.category,
            assignedTo: task.assignedTo || '',
            dueDate: task.dueDate || ''
        });
        setIsModalOpen(true);
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            updateTask(taskId, { status });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return;

        if (editingTaskId) {
            updateTask(editingTaskId, formData);
        } else {
            addTask({
                ...formData,
                expeditionId: expedition.id,
            });
        }

        setIsModalOpen(false);
        setEditingTaskId(null);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold tracking-tight">Kanban</h2>
                {canEdit && <Button onClick={handleNewTask} className="gap-2">
                    <Plus size={16} /> Nova Tarefa
                </Button>}
            </div>

            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {COLUMNS.map(column => (
                    <div
                        key={column}
                        className="flex-shrink-0 w-80 bg-stone-100 rounded-radius border flex flex-col max-h-[70vh]"
                        onDrop={(e) => { if (canEdit) handleDrop(e, column) }}
                        onDragOver={handleDragOver}
                    >
                        <div className="p-3 border-b border-stone-200 bg-stone-50 rounded-t-radius flex justify-between items-center">
                            <h3 className="font-semibold text-stone-700">{column}</h3>
                            <span className="bg-stone-200 text-stone-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                {tasks.filter(t => t.status === column).length}
                            </span>
                        </div>

                        <div className="flex-1 p-3 overflow-y-auto space-y-3">
                            {tasks.filter(t => t.status === column).map(task => (
                                <div
                                    key={task.id}
                                    draggable={canEdit}
                                    onDragStart={(e) => { if (canEdit) handleDragStart(e, task.id) }}
                                    className={`bg-card border rounded-md shadow-sm p-3 hover:border-primary/50 transition-colors group relative ${canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${task.priority === 'Alta' ? 'bg-red-100 text-red-700' :
                                            task.priority === 'Média' ? 'bg-amber-100 text-amber-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {task.priority}
                                        </span>
                                        {canEdit && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                                                    className="p-1 rounded text-stone-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Deletar tarefa?')) deleteTask(task.id);
                                                        }}
                                                        className="p-1 rounded text-stone-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                        title="Deletar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="font-medium text-foreground mb-1 leading-tight">{task.title}</h4>

                                    <div className="flex items-center gap-2 mt-4">
                                        <span className="bg-stone-100 text-stone-500 text-[10px] px-2 py-0.5 rounded-full">
                                            {task.category}
                                        </span>
                                        {task.dueDate && (
                                            <span className="text-stone-400 text-[10px]">
                                                📅 {format(parseISO(task.dueDate), 'dd/MM')}
                                            </span>
                                        )}
                                    </div>

                                    {task.assignedTo && (
                                        <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold" title={profiles.find(p => p.id === task.assignedTo)?.name}>
                                            {profiles.find(p => p.id === task.assignedTo)?.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTaskId ? "Editar Tarefa" : "Nova Tarefa"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Título da Tarefa"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                        autoFocus
                    />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
                        <textarea
                            className="flex w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Status Incial</label>
                            <select
                                className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                            >
                                {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Prioridade</label>
                            <select
                                className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                            >
                                {PRIORITIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Categoria</label>
                            <select
                                className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <Input
                            label="Data Limite"
                            type="date"
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Responsável (opcional)</label>
                        <select
                            className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={formData.assignedTo}
                            onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                        >
                            <option value="">Nenhum / Atribuir depois</option>
                            {participants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editingTaskId ? "Salvar Alterações" : "Criar Tarefa"}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
