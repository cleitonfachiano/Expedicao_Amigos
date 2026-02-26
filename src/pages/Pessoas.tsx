import { useState, useMemo } from 'react';
import { useStore, type Profile } from '../store/useStore';
import { Modal } from '../components/ui/Modal';
import { Input, Button } from '../components/ui/forms';

export function Pessoas() {
    const profiles = useStore(state => state.profiles);
    const addProfile = useStore(state => state.addProfile);
    const updateProfile = useStore(state => state.updateProfile);
    const deleteProfile = useStore(state => state.deleteProfile);

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';

    const [formData, setFormData] = useState({
        name: '',
        type: 'Sócio' as 'Sócio' | 'Convidado',
        phone: '',
        email: '',
        drinksAlcohol: false,
        isActive: true
    });

    const filteredProfiles = useMemo(() => {
        return profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [profiles, searchTerm]);

    const openNewModal = () => {
        setEditingId(null);
        setFormData({ name: '', type: 'Sócio', phone: '', email: '', drinksAlcohol: false, isActive: true });
        setIsModalOpen(true);
    };

    const openEditModal = (p: Profile) => {
        setEditingId(p.id);
        setFormData({
            name: p.name,
            type: p.type,
            phone: p.phone,
            email: p.email || '',
            drinksAlcohol: p.drinksAlcohol,
            isActive: p.isActive
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        if (editingId) {
            updateProfile(editingId, formData);
        } else {
            addProfile(formData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        // Confirm bloqueador de JS Engine estava causando problemas em sub-rotas
        deleteProfile(id);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Pessoas</h2>
                    <p className="text-stone-500">Gerencie os sócios e convidados do grupo.</p>
                </div>
                {canEdit && <Button onClick={openNewModal}>Adicionar Pessoa</Button>}
            </div>

            <div className="bg-card border rounded-radius shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-stone-50/50 flex gap-4">
                    <Input
                        placeholder="Buscar integrante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="md:max-w-xs"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-stone-500 uppercase bg-stone-50/50 border-b">
                            <tr>
                                <th className="px-6 py-3">Nome</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3 hidden md:table-cell">Telefone</th>
                                <th className="px-6 py-3 text-center hidden xl:table-cell">Bebe Álcool?</th>
                                <th className="px-6 py-3 text-center hidden sm:table-cell">Status</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-stone-500">
                                        Nenhuma pessoa encontrada.
                                    </td>
                                </tr>
                            ) : (
                                filteredProfiles.map(person => (
                                    <tr key={person.id} className="border-b last:border-0 hover:bg-stone-50/80 transition-colors">
                                        <td className="px-6 py-4 font-medium">{person.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${person.type === 'Sócio' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-800'
                                                }`}>
                                                {person.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">{person.phone || '-'}</td>
                                        <td className="px-6 py-4 text-center hidden xl:table-cell">
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${person.drinksAlcohol ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {person.drinksAlcohol ? 'Sim' : 'Não'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center hidden sm:table-cell">
                                            <span className={person.isActive ? "text-green-600 font-medium" : "text-stone-400"}>
                                                {person.isActive ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            {canEdit ? (
                                                <>
                                                    <button onClick={() => openEditModal(person)} className="text-primary hover:underline font-medium">Editar</button>
                                                    <button onClick={() => handleDelete(person.id)} className="text-destructive hover:underline font-medium">Excluir</button>
                                                </>
                                            ) : (
                                                <span className="text-stone-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Editar Pessoa' : 'Nova Pessoa'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nome Completo"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Tipo de Vínculo</label>
                            <select
                                className="flex h-10 w-full rounded-radius border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as 'Sócio' | 'Convidado' })}
                            >
                                <option value="Sócio">Sócio (Paga Mensalidade)</option>
                                <option value="Convidado">Convidado</option>
                            </select>
                        </div>
                        <Input
                            label="Telefone/WhatsApp"
                            placeholder="(11) 99999-9999"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <Input
                        label="E-mail (opcional)"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />

                    <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.drinksAlcohol}
                                onChange={e => setFormData({ ...formData, drinksAlcohol: e.target.checked })}
                                className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <span className="font-medium">Consome Bebida Alcoólica?</span>
                        </label>

                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <span className="font-medium animate-in">Membro Ativo</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editingId ? 'Salvar Alterações' : 'Cadastrar'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
