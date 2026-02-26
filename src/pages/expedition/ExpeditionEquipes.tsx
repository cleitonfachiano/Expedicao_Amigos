import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStore, type Expedition } from '../../store/useStore';
import { Modal } from '../../components/ui/Modal';
import { Input, Button } from '../../components/ui/forms';
import { Anchor, Users } from 'lucide-react';

export function ExpeditionEquipes() {
    const { expedition } = useOutletContext<{ expedition: Expedition }>();

    const allBoats = useStore(state => state.boats);
    const allTeams = useStore(state => state.teams);
    const boats = useMemo(() => allBoats.filter(b => b.expeditionId === expedition.id), [allBoats, expedition.id]);
    const teams = useMemo(() => allTeams.filter(t => t.expeditionId === expedition.id), [allTeams, expedition.id]);
    const profiles = useStore(state => state.profiles);

    const addBoat = useStore(state => state.addBoat);
    const deleteBoat = useStore(state => state.deleteBoat);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';
    const addTeam = useStore(state => state.addTeam);
    const deleteTeam = useStore(state => state.deleteTeam);
    const addMemberToTeam = useStore(state => state.addMemberToTeam);
    const removeMemberFromTeam = useStore(state => state.removeMemberFromTeam);

    const [isBoatModalOpen, setIsBoatModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

    const [boatData, setBoatData] = useState({ codeName: '', nickname: '' });
    const [teamData, setTeamData] = useState({ name: '', boatId: '', colorHex: '#0ea5e9' });
    const [selectedMember, setSelectedMember] = useState<string>('');

    const participants = useMemo(() => profiles.filter(p => expedition.participants.includes(p.id)), [profiles, expedition.participants]);

    const handleCreateBoat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!boatData.codeName) return;
        addBoat({ ...boatData, expeditionId: expedition.id });
        setIsBoatModalOpen(false);
        setBoatData({ codeName: '', nickname: '' });
    };

    const handleCreateTeam = (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamData.name) return;
        addTeam({ ...teamData, expeditionId: expedition.id, members: [] });
        setIsTeamModalOpen(false);
        setTeamData({ name: '', boatId: '', colorHex: '#0ea5e9' });
    };

    // Pessoas já alocadas (para não selecionar de novo)
    const allocatedIds = teams.flatMap(t => t.members);
    const availableParticipants = participants.filter(p => !allocatedIds.includes(p.id));

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Equipes e Barcos</h2>
                    <p className="text-stone-500">Organize os barcos, pilotos e as equipes de pesca.</p>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsBoatModalOpen(true)}>Adicionar Barco</Button>
                        <Button onClick={() => setIsTeamModalOpen(true)}>Criar Equipe</Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {teams.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-stone-500 border-dashed border-2 rounded-radius">
                        Nenhuma equipe montada nesta expedição.
                    </div>
                ) : (
                    teams.map(team => {
                        const boat = boats.find(b => b.id === team.boatId);
                        return (
                            <div key={team.id} className="bg-card border rounded-radius shadow-sm overflow-hidden flex flex-col">
                                <div
                                    className="p-4 border-b flex flex-wrap gap-2 justify-between items-center"
                                    style={{ borderTop: `4px solid ${team.colorHex}` }}
                                >
                                    <h3 className="font-bold text-lg break-all">{team.name}</h3>
                                    {canEdit && <button onClick={() => { if (confirm('Apagar equipe?')) deleteTeam(team.id) }} className="text-stone-400 hover:text-destructive">Excluir</button>}
                                </div>

                                <div className="p-4 bg-stone-50 border-b flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm text-stone-600 font-medium">
                                        <Anchor size={16} className="text-stone-400" />
                                        Barco: {boat ? `${boat.codeName} (${boat.nickname})` : 'Nenhum barco associado'}
                                    </span>
                                </div>

                                <div className="p-4 flex-1">
                                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                        <Users size={14} /> Integrantes ({team.members.length})
                                    </h4>
                                    <ul className="space-y-2 mb-4">
                                        {team.members.map(mId => {
                                            const person = profiles.find(p => p.id === mId);
                                            return (
                                                <li key={mId} className="flex justify-between items-center bg-white p-2 border rounded-md shadow-sm">
                                                    <span className="text-sm font-medium">{person?.name}</span>
                                                    {canEdit && <button onClick={() => removeMemberFromTeam(team.id, mId)} className="text-xs text-destructive hover:underline">Revogar</button>}
                                                </li>
                                            )
                                        })}
                                        {team.members.length === 0 && <span className="text-sm text-stone-400">Vazia</span>}
                                    </ul>

                                    {canEdit && (
                                        <div className="flex gap-2 mt-auto">
                                            <select
                                                className="flex-1 h-8 text-xs rounded-md border-input bg-card px-2 border outline-none"
                                                onChange={(e) => setSelectedMember(e.target.value)}
                                                value={selectedMember}
                                            >
                                                <option value="">Adicionar integrante...</option>
                                                {availableParticipants.map(av => <option key={av.id} value={av.id}>{av.name}</option>)}
                                            </select>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    if (selectedMember) {
                                                        addMemberToTeam(team.id, selectedMember);
                                                        setSelectedMember('');
                                                    }
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="pt-8 mt-8 border-t">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Anchor size={20} className="text-primary" /> Frota de Barcos Cadastrados
                </h3>
                <div className="flex gap-4 flex-wrap">
                    {boats.map(b => (
                        <div key={b.id} className="bg-stone-50 border px-4 py-3 rounded-radius shadow-sm flex items-center justify-between w-64">
                            <div>
                                <p className="font-bold text-stone-800">{b.codeName}</p>
                                <p className="text-xs text-stone-500">{b.nickname || 'Sem apelido'}</p>
                            </div>
                            {canEdit && <button onClick={() => deleteBoat(b.id)} className="text-stone-400 hover:text-destructive text-sm font-medium">X</button>}
                        </div>
                    ))}
                    {boats.length === 0 && <p className="text-stone-500 text-sm">Nenhum barco na frota.</p>}
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isBoatModalOpen} onClose={() => setIsBoatModalOpen(false)} title="Cadastrar Barco">
                <form onSubmit={handleCreateBoat} className="space-y-4">
                    <Input label="Código (Ex: B1, B2)" required value={boatData.codeName} onChange={e => setBoatData({ ...boatData, codeName: e.target.value })} />
                    <Input label="Apelido / Piloto (Opcional)" placeholder="Ex: Zezinho" value={boatData.nickname} onChange={e => setBoatData({ ...boatData, nickname: e.target.value })} />
                    <div className="flex justify-end gap-2 pt-4"><Button type="submit">Cadastrar</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Montar Equipe">
                <form onSubmit={handleCreateTeam} className="space-y-4">
                    <Input label="Nome da Equipe" required placeholder="Ex: Os Traíras" value={teamData.name} onChange={e => setTeamData({ ...teamData, name: e.target.value })} />
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Barco Associado</label>
                        <select className="flex h-10 w-full rounded-radius border px-3" value={teamData.boatId} onChange={e => setTeamData({ ...teamData, boatId: e.target.value })}>
                            <option value="">Selecione o barco...</option>
                            {boats.map(b => <option key={b.id} value={b.id}>{b.codeName} ({b.nickname})</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Cor de Identificação</label>
                        <input type="color" className="w-full h-10 cursor-pointer" value={teamData.colorHex} onChange={e => setTeamData({ ...teamData, colorHex: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2 pt-4"><Button type="submit">Criar Equipe</Button></div>
                </form>
            </Modal>
        </div>
    );
}
