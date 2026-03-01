-- Migration: Criar tabela checklist_templates para listas fixas de Mercado/Acampamento
-- Os templates são itens globais que são copiados automaticamente para cada nova expedição.

CREATE TABLE IF NOT EXISTS public.checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('Mercado', 'Acampamento')),
    name TEXT NOT NULL,
    quantity NUMERIC,
    unit TEXT,
    unit_price NUMERIC,
    total_price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar acesso anon (mesmo padrão das demais tabelas)
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso completo checklist_templates" ON public.checklist_templates FOR ALL USING (true) WITH CHECK (true);

-- Povoar templates a partir dos checklist_items da expedição mais recente (se houver dados)
INSERT INTO public.checklist_templates (category, name, quantity, unit, unit_price, total_price)
SELECT DISTINCT ON (category, name)
    category, name, quantity, unit, unit_price, total_price
FROM public.checklist_items
ORDER BY category, name, created_at DESC;
