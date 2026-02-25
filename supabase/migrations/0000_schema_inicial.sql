-- Migração Inicial para Expedição Amigos

-- Habilita extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users App (Local Login)
CREATE TABLE IF NOT EXISTS public.users_app (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    force_password_change BOOLEAN DEFAULT false,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Editor', 'User')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir usuário Admin padrão se não existir
INSERT INTO public.users_app (id, name, username, password_hash, force_password_change, role)
VALUES (uuid_generate_v4(), 'Administrador', 'admin', 'mudar123', true, 'Admin')
ON CONFLICT (username) DO NOTHING;


-- 2. Profiles (Pessoas / Sócios / Convidados)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Sócio', 'Convidado')),
    phone TEXT,
    email TEXT,
    drinks_alcohol BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Expeditions
CREATE TABLE IF NOT EXISTS public.expeditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Relacionamento N:N Expeditions <-> Profiles
CREATE TABLE IF NOT EXISTS public.expedition_participants (
    expedition_id UUID REFERENCES public.expeditions(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (expedition_id, profile_id)
);


-- 4. Transactions (Compras e Rateios da Expedição)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expedition_id UUID REFERENCES public.expeditions(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    purchase_date DATE NOT NULL,
    purchased_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    is_expense BOOLEAN DEFAULT true,
    is_for_drinkers_only BOOLEAN DEFAULT false,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 5. Monthly Fees (Mensalidades dos Sócios)
CREATE TABLE IF NOT EXISTS public.monthly_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pendente', 'Pago', 'Atrasado')),
    payment_date DATE,
    payment_method TEXT CHECK (payment_method IN ('Pix', 'Dinheiro', 'Transferência')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id, year, month)
);


-- 6. Financial Transactions (Caixa Geral)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('ENTRADA', 'SAIDA')),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    payment_date DATE,
    status TEXT NOT NULL CHECK (status IN ('Pendente', 'Pago', 'Recebido', 'Atrasado', 'Cancelado')),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT,
    expedition_id UUID REFERENCES public.expeditions(id) ON DELETE SET NULL,
    source TEXT NOT NULL CHECK (source IN ('Mensalidade', 'Conta a Receber', 'Conta a Pagar', 'Avulso')),
    notes TEXT,
    attachment_url TEXT,
    monthly_fee_id UUID REFERENCES public.monthly_fees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 7. Tasks (Tarefas da Expedição)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expedition_id UUID REFERENCES public.expeditions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('Fazer', 'Em Andamento', 'Pendente', 'Concluído')),
    priority TEXT NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta')),
    category TEXT NOT NULL CHECK (category IN ('Pesca', 'Acampamento', 'Compras', 'Logística', 'Financeiro', 'Administrativo', 'Camisetas')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 8. Boats and Teams
CREATE TABLE IF NOT EXISTS public.boats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expedition_id UUID REFERENCES public.expeditions(id) ON DELETE CASCADE,
    code_name TEXT NOT NULL,
    nickname TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expedition_id UUID REFERENCES public.expeditions(id) ON DELETE CASCADE,
    boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Relacionamento N:N Teams <-> Profiles (Membros do Barco)
CREATE TABLE IF NOT EXISTS public.team_members (
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, profile_id)
);


-- 9. Checklist & T-Shirts
CREATE TABLE IF NOT EXISTS public.checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expedition_id UUID REFERENCES public.expeditions(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Mercado', 'Acampamento')),
    name TEXT NOT NULL,
    quantity NUMERIC,
    unit TEXT,
    unit_price NUMERIC,
    total_price NUMERIC,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    is_checked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tshirt_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expedition_id UUID REFERENCES public.expeditions(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    size TEXT NOT NULL CHECK (size IN ('P', 'M', 'G', 'GG', 'XG', 'EXG')),
    quantity INTEGER NOT NULL,
    price NUMERIC,
    has_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 10. Settings Configuration
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_logo TEXT,
    favicon TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert empty row so there's always one setting to update
INSERT INTO public.settings (site_logo) VALUES (NULL);


-- SECURITY (Desabilita RLS por hora na aplicação principal até refinarmos as roles, ou ativa e cria policy global)
-- Descomente as linhas abaixo caso queria fechar o banco para leitura irrestrita.
-- Para o estágio inicial onde a lógica do frontend é a principal autoridade, deixaremos as tabelas abertas (acesso anon) no esquema atual.
-- ALTER TABLE public.users_app ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Acesso completo" ON public.users_app FOR ALL USING (true);
