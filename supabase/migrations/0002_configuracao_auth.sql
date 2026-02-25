-- 12. Gatilho de Autenticação Automática
-- Quando você criar um Usuário no painel de Auth (ou pela tela), isso insere um perfil correspondente automaticamente.

-- Se for utilizar e-mail/senha como fonte de verdade (Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Editor', 'User')),
    force_password_change BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de usuários para autenticados" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Atualização do proprio perfil" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger para criar o registro no public.users assim que se cadastra no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, role)
    VALUES (new.id, COALESCE((new.raw_user_meta_data->>'role'), 'User'));
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executa após INSERT no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
