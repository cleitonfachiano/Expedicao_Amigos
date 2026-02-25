import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStore, type Expedition } from '../../store/useStore';
import { Users, Search, Beer, UserMinus, Trash2, UserPlus } from 'lucide-react';

export function ExpeditionParticipantes() {
    const { expedition } = useOutletContext<{ expedition: Expedition }>();

    const profiles = useStore(state => state.profiles);
    const updateExpedition = useStore(state => state.updateExpedition);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';

    const [search, setSearch] = useState('');

    const handleToggleParticipant = (profileId: string) => {
        const isParticipating = expedition.participants.includes(profileId);
        let newParticipants = [];

        if (isParticipating) {
            newParticipants = expedition.participants.filter(id => id !== profileId);
        } else {
            newParticipants = [...expedition.participants, profileId];
        }

        updateExpedition(expedition.id, { participants: newParticipants });
    };

    const filteredProfiles = profiles
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            const aPart = expedition.participants.includes(a.id);
            const bPart = expedition.participants.includes(b.id);
            // Confirmados no topo
            if (aPart && !bPart) return -1;
            if (!aPart && bPart) return 1;
            return a.name.localeCompare(b.name);
        });

    const participantsCount = expedition.participants.length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Participantes Confirmados</h2>
                    <p className="text-stone-500">Selecione quem irá viajar nesta expedição.</p>
                </div>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-radius font-bold flex items-center gap-2">
                    <Users size={18} /> {participantsCount} na viagem
                </div>
            </div>

            <div className="bg-card border rounded-radius shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-stone-50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar pessoa cadastrada..."
                            className="w-full pl-10 pr-4 py-2 rounded-md border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="divide-y max-h-[600px] overflow-y-auto">
                    {filteredProfiles.length === 0 ? (
                        <div className="p-8 text-center text-stone-500">
                            Nenhuma pessoa encontrada. Cadastre novos integrantes no Módulo "Pessoas".
                        </div>
                    ) : (
                        filteredProfiles.map(profile => {
                            const isParticipating = expedition.participants.includes(profile.id);

                            return (
                                <div
                                    key={profile.id}
                                    className={`p-4 flex items-center justify-between gap-4 transition-colors ${isParticipating ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-stone-50 border-l-4 border-transparent'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold shrink-0">
                                            {profile.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${isParticipating ? 'text-primary' : 'text-foreground'}`}>
                                                {profile.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                                                    {profile.type}
                                                </span>
                                                <span className="text-xs text-stone-500">{profile.phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-2 mr-2">
                                            {profile.drinksAlcohol && (
                                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600" title="Consome Bebida Alcoólica">
                                                    <Beer size={16} />
                                                </span>
                                            )}
                                            {!profile.isActive && (
                                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600" title="Inativo">
                                                    <UserMinus size={16} />
                                                </span>
                                            )}
                                        </div>

                                        {canEdit && (isParticipating ? (
                                            <button
                                                onClick={() => handleToggleParticipant(profile.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-medium text-sm transition-colors border border-red-200"
                                            >
                                                <Trash2 size={16} /> Remover
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleToggleParticipant(profile.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md font-medium text-sm transition-colors border border-primary/20"
                                            >
                                                <UserPlus size={16} /> Adicionar
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
