---
name: migration-segura
description: Fluxo seguro para alterar o schema Prisma e gerar migrations no Supabase sem perda de dados (renomear tabela/coluna, adicionar campo obrigatório, mudar tipo). Use sempre que for editar server/prisma/schema.prisma, criar migration, renomear model/campo ou quando o usuário mencionar "migration", "alterar tabela" ou "adicionar coluna".
---

# Migration segura (Prisma 7 + Supabase)

O Prisma **não detecta renomeações**: renomear model, `@@map` ou campo vira `DROP` + `CREATE`, apagando dados. Por isso, nunca rode `migrate dev` direto após mudanças estruturais.

## Fluxo

1. Edite `server/prisma/schema.prisma`.
2. Gere **sem aplicar**:
   ```bash
   cd server && npx prisma migrate dev --create-only --name <verbo_descricao_snake_case>
   ```
3. **Leia** o `migration.sql` gerado em `prisma/migrations/<timestamp>_<nome>/` e procure:
   - `DROP TABLE` / `DROP COLUMN` → se a intenção é renomear, troque por:
     ```sql
     ALTER TABLE "antiga" RENAME TO "nova";
     ALTER TABLE "nova" RENAME CONSTRAINT "antiga_pkey" TO "nova_pkey";
     ALTER INDEX "antiga_campo_key" RENAME TO "nova_campo_key";
     ALTER TABLE "tabela" RENAME COLUMN "antigo" TO "novo";
     ```
   - `ADD COLUMN ... NOT NULL` sem `DEFAULT` → só funciona com tabela vazia. Verifique a contagem de linhas; se houver dados, adicione como opcional, faça backfill (`UPDATE`) e depois torne obrigatório.
   - `ALTER COLUMN ... TYPE` → confirme que a conversão é compatível com os dados existentes.
4. Mostre o SQL ao usuário quando houver qualquer operação destrutiva e peça confirmação.
5. Aplique: `npx prisma migrate dev`.
6. Gere o client: `npx prisma generate` (saída em `src/infrastructure/database/prisma/generated`).
7. Valide: `npx prisma migrate status` e `npm run typecheck && npm test`.

## Convenções

- Nome da migration: verbo + descrição em snake_case (`add_phone_to_users`, `rename_user_to_app_users`).
- Tabelas em snake_case plural via `@@map` (evita conflito com `auth.users` do Supabase).
- Nunca edite uma migration já aplicada; crie uma nova.
- **Toda tabela nova** deve sair trancada para a Data API do Supabase (só o backend acessa). Inclua no `migration.sql`:
  ```sql
  ALTER TABLE "nova_tabela" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON "nova_tabela" FROM anon, authenticated;
  ```
  Nunca crie políticas `USING (true)` para `public`/`anon`/`authenticated`: elas expõem a tabela (inclusive hashes de senha) a qualquer um com a chave anon.
- Produção: `npm run prisma:deploy` (aplica sem gerar nem resetar).
- Erro `P1001` (banco inacessível) costuma ser intermitente no pooler do Supabase: tente de novo antes de investigar.
