import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useStore, type Expedition } from '../../store/useStore';
import { Users, Search, Beer, UserMinus, Trash2, UserPlus, Pencil, X, Check } from 'lucide-react';

export function ExpeditionParticipantes() {
    const { expedition } = useOutletContext<{ expedition: Expedition }>();

    const profiles = useStore(state => state.profiles);
    const updateExpedition = useStore(state => state.updateExpedition);
    const updateProfile = useStore(state => state.updateProfile);

    const currentUser = useStore(state => state.currentUser);
    const canEdit = currentUser?.role !== 'User';

    const [search, setSearch] = useState('');

    // Estado para edição inline da marca de cerveja
    const [editingBeerFor, setEditingBeerFor] = useState<string | null>(null);
    const [editingBeerValue, setEditingBeerValue] = useState('');

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

    const startEditBeer = (profileId: string, currentBeer: string | undefined) => {
        setEditingBeerFor(profileId);
        setEditingBeerValue(currentBeer || '');
    };

    const saveBeer = (profileId: string) => {
        const beerVal = editingBeerValue.trim();
        updateProfile(profileId, {
            drinkGroup: beerVal || undefined,
            drinksAlcohol: !!beerVal,
        });
        setEditingBeerFor(null);
        setEditingBeerValue('');
    };

    const cancelEditBeer = () => {
        setEditingBeerFor(null);
        setEditingBeerValue('');
    };

    const filteredProfiles = profiles
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            const aPart = expedition.participants.includes(a.id);
            const bPart = expedition.participants.includes(b.id);
            if (aPart && !bPart) return -1;
            if (!aPart && bPart) return 1;
            return a.name.localeCompare(b.name);
        });

    const participantsCount = expedition.participants.length;

    // Grupos de cerveja configurados entre os participantes
    const drinkGroupsConfigured = [...new Set(
        profiles
            .filter(p => expedition.participants.includes(p.id) && p.drinkGroup)
            .map(p => p.drinkGroup!)
    )].sort();

    const participantsSemCerveja = profiles.filter(
        p => expedition.participants.includes(p.id) && !p.drinkGroup
    );

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

            {/* Resumo dos grupos de cerveja */}
            {participantsCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-radius p-4">
                    <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-3">
                        <Beer size={16} /> Grupos de Cerveja para Rateio
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {drinkGroupsConfigured.length === 0 ? (
                            <p className="text-xs text-amber-600">Nenhum grupo configurado ainda. Clique no ícone 🍺 ao lado de cada participante para definir a marca.</p>
                        ) : (
                            <>
                                {drinkGroupsConfigured.map(group => {
                                    const count = profiles.filter(p => expedition.participants.includes(p.id) && p.drinkGroup === group).length;
                                    return (
                                        <span key={group} className="text-xs bg-amber-200 text-amber-900 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                            🍺 {group} <span className="opacity-70">({count}p)</span>
                                        </span>
                                    );
                                })}
                                {participantsSemCerveja.length > 0 && (
                                    <span className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full font-medium">
                                        🚫 Sem cerveja: {participantsSemCerveja.length}p
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

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
                            const isEditingBeer = editingBeerFor === profile.id;

                            return (
                                <div
                                    key={profile.id}
                                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${isParticipating ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-stone-50 border-l-4 border-transparent'}`}
                                >
                                    {/* Info do participante */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold shrink-0">
                                            {profile.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className={`font-bold truncate ${isParticipating ? 'text-primary' : 'text-foreground'}`}>
                                                {profile.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">{profile.type}</span>
                                                {profile.phone && <span className="text-xs text-stone-500">{profile.phone}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Marca de cerveja — editável inline */}
                                    <div className="flex items-center gap-2 sm:justify-end w-full sm:w-auto">
                                        {isParticipating && canEdit && (
                                            <div className="flex items-center gap-1.5">
                                                {isEditingBeer ? (
                                                    // Modo edição
                                                    <div className="flex items-center gap-1.5">
                                                        <Beer size={14} className="text-amber-500 shrink-0" />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={editingBeerValue}
                                                            onChange={e => setEditingBeerValue(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') saveBeer(profile.id);
                                                                if (e.key === 'Escape') cancelEditBeer();
                                                            }}
                                                            placeholder="Ex: Brahma, Antarctica..."
                                                            className="w-36 px-2 py-1 text-xs border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-200"
                                                        />
                                                        <button
                                                            onClick={() => saveBeer(profile.id)}
                                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                            title="Salvar"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEditBeer}
                                                            className="p-1 text-stone-400 hover:bg-stone-100 rounded"
                                                            title="Cancelar"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    // Modo visualização
                                                    <button
                                                        onClick={() => startEditBeer(profile.id, profile.drinkGroup)}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${profile.drinkGroup
                                                            ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                                                            : 'bg-stone-50 text-stone-400 border-stone-200 hover:bg-stone-100 hover:text-stone-600'
                                                            }`}
                                                        title="Clique para definir a cerveja do rateio"
                                                    >
                                                        <Beer size={12} />
                                                        {profile.drinkGroup ? profile.drinkGroup : <span className="italic">Definir cerveja</span>}
                                                        <Pencil size={10} className="opacity-50" />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Participante sem edição (apenas visualização) */}
                                        {isParticipating && !canEdit && profile.drinkGroup && (
                                            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                                <Beer size={12} /> {profile.drinkGroup}
                                            </span>
                                        )}

                                        {!profile.isActive && (
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600" title="Inativo">
                                                <UserMinus size={16} />
                                            </span>
                                        )}

                                        {canEdit && (isParticipating ? (
                                            <button
                                                onClick={() => handleToggleParticipant(profile.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-medium text-sm transition-colors border border-red-200 shrink-0"
                                            >
                                                <Trash2 size={16} /> Remover
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleToggleParticipant(profile.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md font-medium text-sm transition-colors border border-primary/20 shrink-0"
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
