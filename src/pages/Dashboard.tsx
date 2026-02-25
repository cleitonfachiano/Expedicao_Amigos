import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Modal } from '../components/ui/Modal';
import { Input, Button } from '../components/ui/forms';

export function Dashboard() {
    const expeditions = useStore((state) => state.expeditions);
    const addExpedition = useStore((state) => state.addExpedition);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        year: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        location: ''
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.startDate || !formData.endDate) return;

        addExpedition({
            name: formData.name,
            year: Number(formData.year),
            startDate: formData.startDate,
            endDate: formData.endDate,
            location: formData.location,
            participants: [] // começa vazio
        });

        setIsModalOpen(false);
        setFormData({ name: '', year: new Date().getFullYear(), startDate: '', endDate: '', location: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Expedições</h2>
                    <p className="text-stone-500">Gerencie todas as edições anuais do seu grupo de pesca.</p>
                </div>
                {canEdit && <Button onClick={() => setIsModalOpen(true)}>Nova Expedição</Button>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expeditions.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-stone-500 bg-stone-50 border rounded-radius border-dashed">
                        Nenhuma expedição criada. Clique em "Nova Expedição" para começar.
                    </div>
                ) : (
                    expeditions.map(exp => (
                        <div
                            key={exp.id}
                            onClick={() => navigate(`/expedition/${exp.id}`)}
                            className="bg-card text-card-foreground p-6 rounded-radius border shadow-sm hover:shadow-md transition-all hover:border-primary/50 cursor-pointer group flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-semibold text-xl group-hover:text-primary transition-colors">{exp.name}</h3>
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                                    {exp.year}
                                </span>
                            </div>
                            <p className="text-sm text-stone-600 mb-1 flex-1">📍 {exp.location || 'Local não definido'}</p>

                            <div className="text-sm text-stone-500 mb-4 bg-stone-50 p-2 rounded inline-block w-fit">
                                📅 {exp.startDate ? format(parseISO(exp.startDate), "dd 'de' MMM", { locale: ptBR }) : '?'} até {exp.endDate ? format(parseISO(exp.endDate), "dd 'de' MMM", { locale: ptBR }) : '?'}
                            </div>

                            <div className="flex justify-between items-center text-sm pt-4 border-t mt-auto">
                                <span className="text-stone-600 font-medium">👥 {exp.participants.length} Participantes</span>
                                <span className="text-primary font-medium hover:underline">Abrir Painel &rarr;</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Expedição">
                <form onSubmit={handleCreate} className="space-y-4">
                    <Input
                        label="Nome da Expedição"
                        placeholder="Ex: Retiro no Pantanal"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Ano"
                            type="number"
                            value={formData.year}
                            onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                            required
                        />
                        <Input
                            label="Local"
                            placeholder="Ex: Rio Manso - MT"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Data de Início"
                            type="date"
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                        <Input
                            label="Data de Fim"
                            type="date"
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Criar Expedição</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
