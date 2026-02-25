-- 11. Segurança Máxima (Row Level Security - RLS)

-- Forçar ativação do RLS em TODAS as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tshirt_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- No sistema atual não há RLS habilitado na tabela de "users_app" pois migraremos para o Supabase Auth.
-- Se por acaso a users_app foi criada pelo arquivo anterior, vamos protegê-la também ou apenas abandoná-la.
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users_app') THEN
        EXECUTE 'ALTER TABLE public.users_app ENABLE ROW LEVEL SECURITY;';
    END IF;
END $$;


-- CRIANDO AS POLÍTICAS GLOBAIS DE ACESSO (POLICIES)

-- Regra de Ouro: SOMENTE USUÁRIOS AUTENTICADOS (Logados via JWT do Supabase Auth)
-- podem LER (SELECT), INSERIR (INSERT), ATUALIZAR (UPDATE) ou EXCLUIR (DELETE) qualquer dado.

-- Função utilitária para garantir que ninguém de fora acesse as tabelas.

-- Profiles
CREATE POLICY "Acesso total a Profiles para usuários logados" 
ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expeditions
CREATE POLICY "Acesso total a Expeditions para usuários logados" 
ON public.expeditions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expedition Participants
CREATE POLICY "Acesso total a Expedition Participants para usuários logados" 
ON public.expedition_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Transactions
CREATE POLICY "Acesso total a Transactions para usuários logados" 
ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Monthly Fees
CREATE POLICY "Acesso total a Monthly Fees para usuários logados" 
ON public.monthly_fees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Financial Transactions
CREATE POLICY "Acesso total a Financial Transactions para usuários logados" 
ON public.financial_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks
CREATE POLICY "Acesso total a Tasks para usuários logados" 
ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Boats
CREATE POLICY "Acesso total a Boats para usuários logados" 
ON public.boats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Teams
CREATE POLICY "Acesso total a Teams para usuários logados" 
ON public.teams FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Team Members
CREATE POLICY "Acesso total a Team Members para usuários logados" 
ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Checklist Items
CREATE POLICY "Acesso total a Checklist Items para usuários logados" 
ON public.checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- T-Shirt Orders
CREATE POLICY "Acesso total a T-Shirt Orders para usuários logados" 
ON public.tshirt_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Settings (Apenas Leitura ou Atualização e apenas Logados)
CREATE POLICY "Acesso total a Settings para usuários logados" 
ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Users App (Para transição caso ainda seja usado, logados podem alterar/ler)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users_app') THEN
        EXECUTE 'CREATE POLICY "Acesso total a Users App para logados" ON public.users_app FOR ALL TO authenticated USING (true) WITH CHECK (true);';
    END IF;
END $$;
