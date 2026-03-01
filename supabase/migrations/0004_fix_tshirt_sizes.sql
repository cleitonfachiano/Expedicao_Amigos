-- Migration: Corrigir CHECK constraint da coluna size em tshirt_orders
-- Adicionar tamanhos G1, G2, G3, G4, G5 que faltavam

-- Remover constraint antigo
ALTER TABLE public.tshirt_orders DROP CONSTRAINT IF EXISTS tshirt_orders_size_check;

-- Adicionar constraint atualizado com todos os tamanhos
ALTER TABLE public.tshirt_orders ADD CONSTRAINT tshirt_orders_size_check 
    CHECK (size IN ('PP', 'P', 'M', 'G', 'GG', 'XG', 'EXG', 'G1', 'G2', 'G3', 'G4', 'G5'));
