import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Financas } from './pages/Financas';
import { Pessoas } from './pages/Pessoas';
import { Mensalidades } from './pages/Mensalidades';
import { ExpeditionDetails } from './pages/ExpeditionDetails';
import { ExpeditionOverview } from './pages/expedition/ExpeditionOverview';
import { ExpeditionFinanceiro } from './pages/expedition/ExpeditionFinanceiro';
import { ExpeditionKanban } from './pages/expedition/ExpeditionKanban';
import { ExpeditionEquipes } from './pages/expedition/ExpeditionEquipes';
import { ExpeditionAcampamento } from './pages/expedition/ExpeditionAcampamento';
import { ExpeditionCamisetas } from './pages/expedition/ExpeditionCamisetas';
import { ExpeditionParticipantes } from './pages/expedition/ExpeditionParticipantes';
import { Login } from './pages/Login';
import { Configuracoes } from './pages/Configuracoes';
import { useStore } from './store/useStore';

function App() {
  const { currentUser, setSessionUser, fetchData } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Busca a sessão inicial caso o usuário dê f5
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null);
      setIsInitializing(false);
    });

    // Escuta mudanças (login, logout, troca de token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setSessionUser]);

  // Dispara a busca completa do Banco de Dados sempre que o usuário logar
  useEffect(() => {
    if (currentUser) {
      fetchData().catch(console.error);
    }
  }, [currentUser, fetchData]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pessoas" element={<Pessoas />} />
          <Route path="/mensalidades" element={<Mensalidades />} />
          <Route path="/financas" element={<Financas />} />
          <Route path="/configuracoes" element={<Configuracoes />} />

          <Route path="/expedition/:id" element={<ExpeditionDetails />}>
            <Route index element={<ExpeditionOverview />} />
            <Route path="participantes" element={<ExpeditionParticipantes />} />
            <Route path="financeiro" element={<ExpeditionFinanceiro />} />
            <Route path="kanban" element={<ExpeditionKanban />} />
            <Route path="acampamento" element={<ExpeditionAcampamento />} />
            <Route path="equipes" element={<ExpeditionEquipes />} />
            <Route path="camisetas" element={<ExpeditionCamisetas />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
