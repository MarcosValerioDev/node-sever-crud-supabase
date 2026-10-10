---
name: nova-feature
description: Cria um novo domínio/feature completo na API (server/) seguindo a arquitetura em camadas — entity, interface de repositório, repositório Prisma, DTOs, validator, mapper, service, controller, rotas, factory, testes e model Prisma. Use quando o usuário pedir "criar feature", "novo módulo", "novo CRUD", "nova entidade" ou "novo recurso da API" (ex.: produtos, pedidos, categorias).
---

# Nova feature na API

Crie a feature `<feature>` (singular, minúsculo, kebab-case se composta: `order-item`) replicando **exatamente** o padrão da feature `user`, que é a referência viva. Leia os arquivos de `user` correspondentes antes de escrever cada camada.

## 0. Antes de começar

1. Leia `server/CLAUDE.md` (regras de dependência e nomenclatura).
2. Confirme com o usuário, se não estiver claro: campos e tipos, quais rotas são públicas/privadas/ADMIN, e regras de negócio (ex.: unicidade, dono do recurso).

## 1. Banco — `server/prisma/schema.prisma`

- Model em PascalCase singular com `@@map("<features_em_snake_case_plural>")`.
- `id String @id @default(uuid())`, `createdAt`, `updatedAt @updatedAt`.
- Gere a migration seguindo a skill `migration-segura`.

## 2. Domain (núcleo puro, sem imports externos)

| Arquivo | Conteúdo |
|---|---|
| `src/domain/entities/<feature>.entity.ts` | `<Feature>Props` + `class <Feature>Entity` (readonly, métodos de regra simples) |
| `src/domain/interfaces/<feature>.repository.interface.ts` | `Create<Feature>Data`, `Update<Feature>Data`, `FindAll<Feature>sParams/Result`, `I<Feature>Repository` com `save`, `findById`, `findAll`, `update`, `delete` |

Erros: reutilize `src/domain/errors/domain.error.ts`. Só crie nova classe se surgir um novo `DomainErrorCode` (e então mapeie-o em `error.middleware.ts`).

## 3. Infrastructure

- `src/infrastructure/repositories/<feature>.prisma.repository.ts` → `class <Feature>PrismaRepository implements I<Feature>Repository`.
  - Recebe `DatabaseClient` no construtor; `toEntity` privado; `translateError` para P2002 → `ConflictError`, P2025 → `NotFoundError`.
  - `findAll` com `$transaction([findMany, count])`.

## 4. App

| Arquivo | Conteúdo |
|---|---|
| `validators/<feature>.validator.ts` | schemas zod: `create<Feature>Schema` (`z.strictObject`), `update<Feature>Schema` (`.partial()` + refine "ao menos um campo"), `<feature>IdParamSchema`, `list<Feature>sQuerySchema` (paginação com `DEFAULT_PAGE_SIZE`/`MAX_PAGE_SIZE`) |
| `dtos/<feature>.dto.ts` | `Create<Feature>Dto`, `Update<Feature>Dto`, `List<Feature>sQueryDto` via `z.infer`; `<Feature>ResponseDto` (datas em ISO string) |
| `mappers/<feature>.mapper.ts` | `<Feature>Mapper.toResponse` / `toResponseList` — só campos públicos |
| `services/<feature>.service.ts` | `create`, `findById`, `findAll`, `update`, `delete`; depende só de interfaces; lança `DomainError` |
| `controllers/<feature>.controller.ts` | arrow functions `create<Feature>`, `get<Feature>ById`, `list<Feature>s`, `update<Feature>`, `delete<Feature>`; `schema.parse(...)` → service → `res.status(HTTP_STATUS.X)` |
| `routes/<feature>.routes.ts` | `create<Feature>Routes({ <feature>Controller, authenticate })`; `authorize("ADMIN")` quando aplicável |

## 5. Main (composition root)

1. Adicione o repositório em `AppDependencies` e `makeDependencies()` (`src/main/factories/dependencies.factory.ts`).
2. Crie `src/main/factories/<feature>.factory.ts` com `make<Feature>Service` e `make<Feature>Controller`.
3. Registre em `src/main/routes.ts`: `routes.use("/<features>", create<Feature>Routes(...))`.

## 6. Testes

- `src/tests/doubles/<feature>.in-memory.repository.ts` implementando a interface.
- `src/tests/unit/<feature>.service.spec.ts` — regras de negócio, erros de domínio, permissões.
- `src/tests/integration/<feature>.routes.spec.ts` — `createApp({...})` com dublês + supertest: status HTTP, validação 400, 401/403.
- Atualize o dublê de `AppDependencies` usado em testes de integração existentes, se a interface mudou.

## 7. Finalização

1. `npm run typecheck && npm test` dentro de `server/` — tudo verde.
2. Rode a skill `checar-arquitetura`.
3. Atualize a tabela "Rotas atuais" em `server/CLAUDE.md`.
