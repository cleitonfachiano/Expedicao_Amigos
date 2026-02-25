-- Schema Principal para o ExpediçãoPro

-- Habilitar a extensão UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (usuários, associados ao Auth do Supabase ou cadastrados manualmente)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null se cadastrado por outro sem login
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  is_partner BOOLEAN DEFAULT false, -- true = Sócio, false = Convidado
  drinks_alcohol BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Expeditions
CREATE TABLE expeditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  maps_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Expedition Participants
CREATE TABLE expedition_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expedition_id UUID REFERENCES expeditions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  drinks_alcohol BOOLEAN DEFAULT false, -- Pode sobrescrever o padrão do profile
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expedition_id, profile_id)
);

-- 4. Financial Categories / Gastos
CREATE TYPE transaction_category AS ENUM (
  'mercado', 'investimento', 'isca_pesca', 'combustivel', 'camping', 'bebida_alcoolica', 'outros'
);

CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expedition_id UUID REFERENCES expeditions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL, -- Quantidade ou Total de itens
  unit_price NUMERIC(10,2) NOT NULL, 
  total_price NUMERIC(10,2) NOT NULL,
  purchase_date DATE,
  purchased_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  receipt_url TEXT,
  category transaction_category DEFAULT 'outros',
  is_expense BOOLEAN DEFAULT true, -- true = gasto, false = receita/pagamento
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Monthly Fees (Mensalidades dos Sócios)
CREATE TYPE fee_status AS ENUM ('pendente', 'pago', 'atrasado');

CREATE TABLE monthly_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status fee_status DEFAULT 'pendente',
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, year, month)
);

-- 6. Tasks (Kanban)
CREATE TYPE task_status AS ENUM ('fazer', 'andamento', 'pendente', 'concluido');
CREATE TYPE task_priority AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE task_category AS ENUM ('pesca', 'acampamento', 'compras', 'logistica', 'financeiro', 'administrativo', 'camisetas');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expedition_id UUID REFERENCES expeditions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status task_status DEFAULT 'fazer',
  priority task_priority DEFAULT 'media',
  category task_category DEFAULT 'administrativo',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Grocery List
CREATE TABLE grocery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expedition_id UUID REFERENCES expeditions(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  unit TEXT,
  quantity NUMERIC(10,2),
  estimated_price NUMERIC(10,2),
  is_purchased BOOLEAN DEFAULT false,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Camping Checklist
CREATE TABLE camping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expedition_id UUID REFERENCES expeditions(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_checked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Teams and Boats
CREATE TABLE boats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expedition_id UUID REFERENCES expeditions(id) ON DELETE CASCADE,
  code_name TEXT NOT NULL, -- ex: B1, B2
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expedition_id UUID REFERENCES expeditions(id) ON DELETE CASCADE,
  boat_id UUID REFERENCES boats(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color_hex TEXT, -- ex: #FF0000
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(team_id, profile_id)
);

-- 10. T-Shirt Orders
CREATE TABLE tshirt_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expedition_id UUID REFERENCES expeditions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  size TEXT NOT NULL, -- P, M, G, GG, etc.
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
