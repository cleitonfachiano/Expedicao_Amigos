import { useState } from 'react';
import { Settings, Users, Palette, ListTree, Save, Trash2, KeyRound, Pencil } from 'lucide-react';
import type { User } from '../store/useStore';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/ui/Modal';
import { Button, Input } from '../components/ui/forms';

export function Configuracoes() {
    const { currentUser, users, addUser, updateUser, deleteUser, settings, updateSettings, transactionCategories, financialCategories, addTransactionCategory, deleteTransactionCategory, addFinancialCategory, deleteFinancialCategory } = useStore();
    const [activeTab, setActiveTab] = useState<'Usuarios' | 'Aparencia' | 'Categorias'>('Usuarios');

    // Estado local para form de adição/edição de usuário
    const [newUserModal, setNewUserModal] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [newUserData, setNewUserData] = useState({ name: '', username: '', role: 'User' as 'Admin' | 'Editor' | 'User' });

    // Estado do AppSettings
    const [tempSettings, setTempSettings] = useState(settings);

    // Estado e modals p Categorias
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryType, setCategoryType] = useState<'financas' | 'expedicao'>('financas');

    if (currentUser?.role !== 'Admin') {
        return (
            <div className="p-8 text-center text-stone-500">
                Você não tem permissão para acessar esta área. Contate um Administrador.
            </div>
        );
    }

    const handleCreateOrUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (userToEdit) {
            updateUser(userToEdit.id, {
                name: newUserData.name,
                username: newUserData.username.toLowerCase(),
                role: newUserData.role
            });
        } else {
            addUser({
                name: newUserData.name,
                username: newUserData.username.toLowerCase(),
                passwordHash: 'mudar123', // Senha padrão
                forcePasswordChange: true,
                role: newUserData.role
            });
        }
        setNewUserModal(false);
        setUserToEdit(null);
        setNewUserData({ name: '', username: '', role: 'User' });
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };

    const handleResetPassword = async (user: User) => {
        const email = user.username.includes('@') ? user.username : null; // o username foi mapeado com o email original

        if (!email) {
            alert('Não foi possível identificar o e-mail deste usuário no banco de dados.');
            return;
        }

        if (confirm(`Deseja enviar um link de redefinição de senha para o e-mail ${email} (${user.name})?`)) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/`,
            });

            if (error) {
                alert(`Erro ao tentar enviar o email: ${error.message}`);
            } else {
                alert(`E-mail com instruções enviado com sucesso para ${email}!`);
            }
        }
    };

    const handleSaveSettings = () => {
        updateSettings(tempSettings);
        alert('Configurações salvas!');
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        if (categoryType === 'financas') addFinancialCategory(newCategoryName);
        else addTransactionCategory(newCategoryName);
        setNewCategoryName('');
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 border-b pb-4">
                <Settings className="text-primary" size={28} />
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Configurações do Sistema</h2>
                    <p className="text-stone-500 text-sm">Gerencie o time, as categorias e a aparência base do ExpediçãoPro</p>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Horizontal Modern Tabs */}
                <div className="flex overflow-x-auto gap-2 pb-2 border-b border-slate-200 hide-scrollbar w-full">
                    <button onClick={() => setActiveTab('Usuarios')} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === 'Usuarios' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Users size={16} /> Perfis de Acesso
                    </button>
                    <button onClick={() => setActiveTab('Aparencia')} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === 'Aparencia' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Palette size={16} /> Aparência do Site
                    </button>
                    <button onClick={() => setActiveTab('Categorias')} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === 'Categorias' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <ListTree size={16} /> Classificações / Extrato
                    </button>
                </div>

                <main className="w-full bg-card border rounded-2xl p-6 md:p-8 shadow-sm min-h-[500px]">
                    {/* ABAS USUARIOS */}
                    {activeTab === 'Usuarios' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">Gestão de Usuários</h3>
                                <Button onClick={() => setNewUserModal(true)}>+ Novo Usuário</Button>
                            </div>

                            <div className="border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b">
                                        <tr className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                                            <th className="p-4">Nome</th>
                                            <th className="p-4">Username (Login)</th>
                                            <th className="p-4">Permissão</th>
                                            <th className="p-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-semibold text-foreground flex items-center gap-3 whitespace-nowrap">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs border border-primary/20">
                                                        {u.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {u.name}
                                                </td>
                                                <td className="p-4 whitespace-nowrap text-slate-500">@{u.username}</td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 ${u.role === 'Admin' ? 'bg-amber-100 text-amber-700 border border-amber-200/50' : 'bg-slate-100 text-slate-600 border border-slate-200/50'}`}>
                                                        {u.role === 'Admin' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                                        {u.role !== 'Admin' && <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            title="Resetar Senha"
                                                            onClick={() => handleResetPassword(u)}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                                        >
                                                            <KeyRound size={16} />
                                                        </button>
                                                        <button
                                                            title="Editar Usuário"
                                                            onClick={() => {
                                                                setUserToEdit(u);
                                                                setNewUserData({ name: u.name, username: u.username, role: u.role });
                                                                setNewUserModal(true);
                                                            }}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        {u.id !== currentUser.id && (
                                                            <button
                                                                title="Excluir Usuário"
                                                                onClick={() => setUserToDelete(u)}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ABAS APARENCIA */}
                    {activeTab === 'Aparencia' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h3 className="text-lg font-bold">Identidade Visual</h3>
                                <Button onClick={handleSaveSettings} className="gap-2"><Save size={16} /> Salvar Aparência</Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Logotipo do Sistema (URL ou Base64)</label>
                                    <p className="text-xs text-stone-500">Irá substituir a tenda (ícone nativo) no menu lateral e tela de login.</p>
                                    <textarea
                                        className="w-full flex min-h-[120px] rounded-radius border border-input bg-background px-3 py-2 text-sm outline-none cursor-text focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        placeholder="Cole um link https:// ou base64 de imagem png/jpg aqui..."
                                        value={tempSettings.siteLogo || ''}
                                        onChange={e => setTempSettings({ ...tempSettings, siteLogo: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Favicon do Navegador (URL ou Base64)</label>
                                    <p className="text-xs text-stone-500">Irá alterar o ícone pequeno exibido nas abas do Google Chrome / Edge.</p>
                                    <textarea
                                        className="w-full flex min-h-[120px] rounded-radius border border-input bg-background px-3 py-2 text-sm outline-none cursor-text focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        placeholder="Cole um link https:// ou base64 de imagem png (.ico) aqui..."
                                        value={tempSettings.favicon || ''}
                                        onChange={e => setTempSettings({ ...tempSettings, favicon: e.target.value })}
                                    />
                                </div>
                            </div>

                            {(tempSettings.siteLogo || tempSettings.favicon) && (
                                <div className="mt-4 p-4 border rounded-lg bg-stone-50 flex gap-8 items-center">
                                    {tempSettings.siteLogo && (
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-semibold uppercase mb-2">Preview Logo</span>
                                            <img src={tempSettings.siteLogo} alt="Logo Preview" className="h-12 object-contain" />
                                        </div>
                                    )}
                                    {tempSettings.favicon && (
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-semibold uppercase mb-2">Preview Favicon</span>
                                            <img src={tempSettings.favicon} alt="Fav Preview" className="h-6 w-6 object-contain border" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ABAS CATEGORIAS */}
                    {activeTab === 'Categorias' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold border-b pb-4">Gerenciar Categorias</h3>

                            <div className="bg-stone-50 p-4 border rounded-lg flex items-end gap-4">
                                <div className="flex-1 space-y-1">
                                    <label className="text-sm font-medium block">Adicionar Nova Categoria</label>
                                    <Input
                                        placeholder="Ex: Farmácia..."
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                    />
                                </div>
                                <div className="w-1/3 space-y-1">
                                    <label className="text-sm font-medium block">Destino da Lista</label>
                                    <select
                                        className="flex h-10 w-full rounded-radius border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        value={categoryType}
                                        onChange={(e) => setCategoryType(e.target.value as any)}
                                    >
                                        <option value="financas">Financeiro (Caixa Geral)</option>
                                        <option value="expedicao">Planejamento da Expedição</option>
                                    </select>
                                </div>
                                <Button onClick={handleAddCategory}>Adicionar</Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <div>
                                    <h4 className="font-semibold text-stone-700 flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Caixa Geral (Entradas/Saídas)
                                    </h4>
                                    <ul className="space-y-2">
                                        {financialCategories.map(cat => (
                                            <li key={cat} className="flex justify-between items-center text-sm p-2 px-3 border rounded bg-white">
                                                {cat}
                                                <button onClick={() => deleteFinancialCategory(cat)} className="text-stone-400 hover:text-red-500"><Trash2 size={16} /></button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-stone-700 flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div> Lançamentos Expedição (Gastos da Viagem)
                                    </h4>
                                    <ul className="space-y-2">
                                        {transactionCategories.map(cat => (
                                            <li key={cat} className="flex justify-between items-center text-sm p-2 px-3 border rounded bg-white">
                                                {cat}
                                                <button onClick={() => deleteTransactionCategory(cat)} className="text-stone-400 hover:text-red-500"><Trash2 size={16} /></button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="Confirmar Exclusão">
                <div className="space-y-4">
                    <p className="text-stone-600">
                        Tem certeza que deseja excluir o acesso de <strong>{userToDelete?.name}</strong>?
                    </p>
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                        Esta ação removerá o acesso desta pessoa ao sistema de planejamento, mas preservará o histórico financeiro já atrelado a ela.
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Confirmar Exclusão</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={newUserModal} onClose={() => { setNewUserModal(false); setUserToEdit(null); }} title={userToEdit ? "Editar Usuário" : "Adicionar Novo Usuário"}>
                <form onSubmit={handleCreateOrUpdateUser} className="space-y-4">
                    <div className="space-y-1 block">
                        <label className="text-sm font-medium block">Nome Completo</label>
                        <Input required value={newUserData.name} onChange={e => setNewUserData({ ...newUserData, name: e.target.value })} placeholder="João Silva" />
                    </div>
                    <div className="space-y-1 block">
                        <label className="text-sm font-medium block">Nome de Usuário (Login)</label>
                        <Input required value={newUserData.username} onChange={e => setNewUserData({ ...newUserData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })} placeholder="joao" />
                    </div>
                    <div className="space-y-1 block">
                        <label className="text-sm font-medium block">Permissão do Sistema</label>
                        <select
                            className="flex h-10 w-full rounded-radius border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
                            value={newUserData.role}
                            onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as any })}
                        >
                            <option value="Admin">Administrador (Total Acesso)</option>
                            <option value="Editor">Editor (Lançamentos e Edições Livres)</option>
                            <option value="User">Usuário Comum (Apenas Visualização)</option>
                        </select>
                    </div>

                    {!userToEdit && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded text-xs">
                            Ao criar o acesso, a senha inicial será <strong>mudar123</strong> e o usuário será forçado a definir uma nova senha no primeiro acesso.
                        </div>
                    )}

                    <div className="flex justify-end pt-4 gap-2">
                        <Button type="button" variant="outline" onClick={() => { setNewUserModal(false); setUserToEdit(null); }}>Cancelar</Button>
                        <Button type="submit">{userToEdit ? "Salvar" : "Cadastrar"}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
