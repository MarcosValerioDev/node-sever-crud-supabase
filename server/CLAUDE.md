# API Node.js — Express + Prisma + Supabase (PostgreSQL)

Comunicação sempre em **Português do Brasil** (respostas, mensagens de erro da API, comentários e commits).

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API com hot reload (`tsx watch`) em `http://localhost:3333/api` |
| `npm test` | Testes (vitest) — usam dublês em memória, **não tocam no banco** |
| `npm run typecheck` | `tsc --noEmit` do código e dos testes |
| `npm run build` / `npm start` | Gera o Prisma Client, compila para `dist/` e roda |
| `npm run prisma:migrate -- --name <nome>` | Cria e aplica migration (ver skill `migration-segura`) |
| `npm run db:seed` | Cria/promove o primeiro ADMIN (`ADMIN_EMAIL`/`ADMIN_PASSWORD` no `.env`) |

Antes de concluir qualquer tarefa de código: `npm run typecheck && npm test`.

## Arquitetura (Camadas + Clean Architecture, feature-first)

```
src/
├── app/             # Casos de uso e HTTP: controllers, services, dtos, validators, mappers, routes
├── domain/          # Núcleo puro: entities, interfaces (contratos), errors — NÃO importa nada de fora
├── infrastructure/  # Implementações técnicas: database (Prisma), repositories, providers (bcrypt, jwt)
├── shared/          # Reutilizável: middlewares, utils, constants, config (env validado com zod)
├── main/            # Composition root: server.ts, app.ts, routes.ts, factories/
└── tests/           # unit/, integration/, doubles/ (repositório em memória, fakes)
```

Fluxo: **Route → Controller → Service → Repository (interface) → Database**

### Regras de dependência (inegociáveis)

- **Controller NUNCA acessa banco.** Só valida entrada (zod), chama o service e responde HTTP.
- **Service NUNCA conhece Express** (`Request`, `Response`, status HTTP). Recebe DTOs, lança `DomainError`.
- **Repository NUNCA conhece HTTP.** Traduz erros do Prisma (P2002, P2025) para `DomainError`.
- `domain/` não importa de `app/`, `infrastructure/`, `shared/` nem de bibliotecas externas.
- Services dependem de **interfaces** (`IUserRepository`, `IHashProvider`, `ITokenProvider`), nunca de classes concretas (DIP).
- Classes concretas são instanciadas **somente** em `src/main/factories/` (Factory Pattern).
- O Prisma Client gerado fica em `src/infrastructure/database/prisma/generated` (git-ignored) e só é importado dentro de `infrastructure/`.
- Erros: lance `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError` ou `ValidationError`. O `error.middleware` mapeia `code` → status HTTP. Nunca faça `res.status(4xx)` dentro de service.
- Resposta de usuário sai **sempre** por `UserMapper.toResponse` (nunca expõe `password`).

## Nomenclatura

- Arquivos: `<feature>.<tipo>.ts` → `user.controller.ts`, `user.service.ts`, `user.prisma.repository.ts`, `user.repository.interface.ts`.
- Classes: PascalCase (`UserController`, `UserService`, `UserPrismaRepository`, `UserEntity`). Interfaces de contrato com prefixo `I` (`IUserRepository`).
- Tipos de DTO: `CreateUserDto`, `UpdateUserDto`, `UserResponseDto` (inferidos dos schemas zod quando são entrada).
- Variáveis/funções: camelCase (`userRepository`, `createUserDto`). Constantes: UPPER_SNAKE_CASE (`DEFAULT_PAGE_SIZE`).
- Métodos sempre iniciam com verbo:
  - Controller: `createUser`, `getUserById`, `listUsers`, `updateUser`, `deleteUser` (arrow functions, para não perder o `this` no router).
  - Service: `create`, `findById`, `findAll`, `update`, `delete`.
  - Repository: `save`, `findById`, `findAll`, `update`, `delete` (+ buscas específicas como `findByEmail`).
- Factories: `make<Nome>` (`makeUserController`). Rotas: `create<Feature>Routes`.

## Rotas atuais

| Método | Rota | Acesso |
|---|---|---|
| POST | `/api/users` | público (cadastro próprio, sempre `USER`) |
| GET | `/api/users?page=&pageSize=` | ADMIN |
| GET | `/api/users/:id` | dono da conta ou ADMIN |
| PATCH | `/api/users/:id` | dono da conta ou ADMIN (`role` e `isActive` só ADMIN altera) |
| DELETE | `/api/users/:id` | dono da conta ou ADMIN |
| PATCH | `/api/users/:id/block` | ADMIN — body `{ "reason": "..." }`; grava em `motivos` (não pode bloquear a si mesmo) |
| PATCH | `/api/users/:id/unblock` | ADMIN — o histórico de motivos é mantido |
| GET | `/api/users/:id/block-reasons` | ADMIN — histórico de bloqueios |

Usuário bloqueado (`bloqueado`) ou inativo (`ativo = false`) recebe 403 no login **e** em qualquer rota autenticada: o `authenticate` confere o usuário no banco a cada requisição, então o efeito é imediato mesmo com token ainda válido.
| POST | `/api/auth/signin` | público (rate limit de tentativas falhas) |
| POST | `/api/auth/signup` | ADMIN (pode definir `role`) |
| GET | `/health` | público |
| GET | `/api/docs` | público — Swagger UI (`/api/docs/openapi.json` = documento OpenAPI 3.1) |

### Documentação (Swagger)

O documento fica em `src/app/docs/openapi.document.ts`. Os schemas de **entrada** são gerados dos validators zod (`z.toJSONSchema`), então mudam sozinhos com a validação. Ao criar ou alterar rota, ou mudar o formato de uma resposta, atualize `paths` e os schemas de resposta nesse arquivo.

## Banco (Supabase)

- `DATABASE_URL` (pooler 6543, pgbouncer) é usada em runtime; `DIRECT_URL` (5432) pelas migrations (`prisma.config.ts`).
- Tabelas e colunas mapeadas via `@@map`/`@map`: código em inglês, banco com os nomes do negócio. `User` → `app_users` (`isActive` → `ativo`, `isBlocked` → `bloqueado`); `BlockReason` → `motivos` (`userId` → `id_user`, `reason` → `motivo`). O nome `app_users` evita confusão com `auth.users` do Supabase.
- **Nunca** aplique migration que contenha `DROP` sem revisar — use a skill `migration-segura`.

## Skills e agentes do projeto

- Skills: `nova-feature` (scaffold de domínio completo), `checar-arquitetura` (auditoria das regras acima), `migration-segura`.
- Agentes: `arquiteto-backend`, `revisor-codigo`, `engenheiro-testes`, `auditor-seguranca`.
