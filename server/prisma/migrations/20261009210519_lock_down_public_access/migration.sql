-- Tabelas da API são acessadas SOMENTE pelo backend (role postgres, que ignora RLS).
-- A Data API do Supabase (chaves anon/authenticated) não deve ler nem escrever nelas.

-- Remove políticas que liberavam acesso total para qualquer role
DROP POLICY IF EXISTS "userAll" ON "app_users";
DROP POLICY IF EXISTS "motivoAll" ON "motivos";

-- RLS ligado e sem políticas = acesso negado para anon/authenticated
ALTER TABLE "app_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "motivos" ENABLE ROW LEVEL SECURITY;

-- Segunda camada: remove os privilégios de tabela dessas roles
REVOKE ALL ON "app_users", "motivos" FROM anon, authenticated;

-- _prisma_migrations não existe no shadow database usado pelo `migrate dev`
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public._prisma_migrations FROM anon, authenticated;
  END IF;
END $$;
