# Docker + API Node.js + PostgreSQL (Supabase) + N8N

API REST em **Node.js + TypeScript** com autenticação JWT, controle de acesso por perfil (`USER`/`ADMIN`) e bloqueio de usuários com histórico de motivos. Os dados ficam em um **PostgreSQL gerenciado pelo Supabase**, acessado via **Prisma**.

> **Status:** a API (`server/`) está funcional. A orquestração com **Docker** e as automações com **N8N** ainda não foram adicionadas ao repositório.

## Stack

| Área | Tecnologia |
|---|---|
| Runtime | Node.js ≥ 22, TypeScript |
| HTTP | Express 5 |
| Banco | PostgreSQL (Supabase) + Prisma 7 (`@prisma/adapter-pg`) |
| Validação | Zod (entrada da API e variáveis de ambiente) |
| Segurança | JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `express-rate-limit` |
| Testes | Vitest + Supertest (dublês em memória, sem banco) |
| Documentação | Swagger UI (`swagger-ui-express`) + OpenAPI 3.1 |

## Estrutura do repositório

```
.
├── References/            # Documentos de referência (NodeJS-Estrutura.txt = fonte da arquitetura)
└── server/                # API REST
    ├── prisma/            # schema.prisma, migrations e seed
    ├── prisma.config.ts   # Configuração do Prisma CLI (usa DIRECT_URL)
    └── src/
        ├── app/             # controllers, services, dtos, validators, mappers, routes
        ├── domain/          # entities, interfaces (contratos), errors — núcleo puro
        ├── infrastructure/  # Prisma, repositórios, providers (bcrypt, jwt)
        ├── shared/          # middlewares, utils, constants, config (env)
        ├── main/            # composition root: server, app, routes, factories
        └── tests/           # unit/, integration/, doubles/
```

## Arquitetura

Camadas + Clean Architecture, organizada por domínio (feature-first), seguindo SOLID, Repository, Service Layer, DTO e Factory Pattern.

```
Route → Controller → Service → Repository (interface) → Database
```

- **Controller** valida a entrada (Zod), chama o service e responde HTTP. Nunca acessa o banco.
- **Service** contém as regras de negócio, recebe DTOs e lança `DomainError`. Não conhece Express.
- **Repository** implementa a interface do domínio com Prisma e traduz erros do Prisma para `DomainError`.
- **Domain** não depende de nenhuma outra camada nem de bibliotecas externas.
- Classes concretas são instanciadas somente em `src/main/factories/`.
- Erros são centralizados no `error.middleware`, que converte o código do erro em status HTTP.

As regras completas de camadas e nomenclatura estão em [server/CLAUDE.md](server/CLAUDE.md).

## Pré-requisitos

- Node.js 22 ou superior
- Um projeto no [Supabase](https://supabase.com) (ou outro PostgreSQL)

## Como rodar

```bash
cd server
npm install
cp .env.example .env        # preencha as variáveis (ver abaixo)
npm run prisma:generate     # gera o Prisma Client
npx prisma migrate deploy   # aplica as migrations no banco
npm run db:seed             # cria o primeiro ADMIN
npm run dev                 # http://localhost:3333/api
```

Verifique se está no ar: `GET http://localhost:3333/health`.

### Variáveis de ambiente (`server/.env`)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão usada em runtime — pooler do Supabase em modo transação (porta `6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | Conexão usada pelas migrations — pooler em modo sessão (porta `5432`) |
| `NODE_ENV` | `development`, `test` ou `production` |
| `PORT` | Porta da API (padrão `3333`) |
| `JWT_SECRET` | Segredo do JWT, **mínimo 32 caracteres** |
| `JWT_EXPIRES_IN` | Validade do token (padrão `1d`) |
| `BCRYPT_SALT_ROUNDS` | Custo do hash, entre 8 e 14 (padrão `10`) |
| `CORS_ORIGIN` | `*` ou lista de origens separadas por vírgula |
| `TRUST_PROXY` | Quantidade de proxies na frente da API (ex.: `1` atrás de Nginx/Traefik) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Dados do ADMIN criado pelo `db:seed` |

As variáveis são validadas com Zod na inicialização; se alguma estiver inválida, a API não sobe e informa o campo com problema.

Para gerar um `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Scripts

Execute dentro de `server/`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API com hot reload (`tsx watch`) |
| `npm run build` | Gera o Prisma Client e compila para `dist/` |
| `npm start` | Executa a versão compilada |
| `npm test` / `npm run test:watch` | Roda os testes (Vitest) |
| `npm run typecheck` | Checagem de tipos do código e dos testes |
| `npm run prisma:migrate -- --name <nome>` | Cria e aplica uma migration (desenvolvimento) |
| `npm run prisma:deploy` | Aplica migrations pendentes (produção) |
| `npm run prisma:studio` | Abre o Prisma Studio |
| `npm run db:seed` | Cria ou promove o primeiro ADMIN |

## Endpoints

Prefixo: `/api`. Rotas autenticadas exigem o header `Authorization: Bearer <token>`.

### Autenticação

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/signin` | Público | Login. Retorna `accessToken`, `tokenType` e `user` |
| POST | `/api/auth/signup` | ADMIN | Cadastra usuário podendo definir o `role` |

### Usuários

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/users` | Público | Cadastro próprio (sempre `USER`) |
| GET | `/api/users?page=&pageSize=` | ADMIN | Lista paginada (padrão 10, máximo 100 por página) |
| GET | `/api/users/:id` | Dono ou ADMIN | Busca por ID |
| PATCH | `/api/users/:id` | Dono ou ADMIN | Atualiza dados (`role` e `isActive` só ADMIN altera) |
| DELETE | `/api/users/:id` | Dono ou ADMIN | Remove o usuário |
| PATCH | `/api/users/:id/block` | ADMIN | Bloqueia — body `{ "reason": "..." }` (não pode bloquear a si mesmo) |
| PATCH | `/api/users/:id/unblock` | ADMIN | Desbloqueia (o histórico de motivos é mantido) |
| GET | `/api/users/:id/block-reasons` | ADMIN | Histórico de bloqueios |

### Outros

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status da API |
| GET | `/api/docs` | Documentação interativa (Swagger UI) |
| GET | `/api/docs/openapi.json` | Documento OpenAPI 3.1 |

### Documentação interativa (Swagger)

Com a API rodando, acesse **http://localhost:3333/api/docs**. Para testar rotas protegidas, faça login em `POST /auth/signin`, copie o `accessToken` e cole no botão **Authorize**.

O documento fica em [server/src/app/docs/openapi.document.ts](server/src/app/docs/openapi.document.ts). Os schemas de entrada são gerados a partir dos validators Zod, então a documentação acompanha a validação real.

### Exemplo

```bash
# Login
curl -X POST http://localhost:3333/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","password":"Admin12345"}'

# Listar usuários com o token recebido
curl http://localhost:3333/api/users?page=1&pageSize=10 \
  -H "Authorization: Bearer <accessToken>"
```

### Regras de validação

- **Senha:** 8 a 72 caracteres, com ao menos uma letra e um número.
- **Nome:** opcional, 2 a 100 caracteres.
- **Motivo do bloqueio:** 3 a 500 caracteres.
- Campos não previstos no body são rejeitados.

### Formato de erro

Todas as respostas de erro seguem o mesmo formato:

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "Dados inválidos",
    "details": [{ "field": "email", "message": "E-mail inválido" }]
  }
}
```

| `code` | Status |
|---|---|
| `VALIDATION` / `INVALID_REQUEST` | 400 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` / `ROUTE_NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `TOO_MANY_REQUESTS` | 429 |
| `INTERNAL_SERVER_ERROR` | 500 |

## Segurança

- Senhas armazenadas com **bcrypt**; a senha nunca é retornada nas respostas.
- **Rate limit global** de 100 requisições a cada 15 minutos por IP.
- **Proteção contra força bruta no login:** 5 tentativas falhas a cada 15 minutos.
- Login com credenciais inválidas sempre retorna a mesma mensagem genérica; o status da conta só é revelado a quem acertou a senha.
- Usuário **bloqueado** ou **inativo** recebe `403` no login e em qualquer rota autenticada. O usuário é conferido no banco a cada requisição, então o bloqueio vale na hora, mesmo com token ainda válido.
- `helmet`, CORS configurável e limite de 100 kb no corpo JSON.
- No Supabase, as tabelas da API têm **RLS ativado sem políticas** e os privilégios das roles `anon`/`authenticated` foram revogados: só o backend acessa os dados.

## Banco de dados

O código usa nomes em inglês e o banco usa os nomes do negócio (via `@@map`/`@map` no Prisma):

| Model | Tabela | Colunas mapeadas |
|---|---|---|
| `User` | `app_users` | `isActive` → `ativo`, `isBlocked` → `bloqueado` |
| `BlockReason` | `motivos` | `userId` → `id_user`, `reason` → `motivo` |

O nome `app_users` evita confusão com a tabela `auth.users` do Supabase.

> Antes de aplicar uma migration, revise o SQL gerado — principalmente se houver `DROP`, que pode apagar dados.

## Testes

```bash
cd server
npm run typecheck && npm test
```

- **Unitários** (`src/tests/unit`): testam os services.
- **Integração** (`src/tests/integration`): testam as rotas HTTP com Supertest.
- Os testes usam repositórios em memória e providers falsos (`src/tests/doubles`), então **não acessam o banco**.

## Próximos passos

- [ ] `Dockerfile` da API e `docker-compose.yml`
- [ ] Serviço do N8N integrado à API

## Autor

Marcos Valério — MarcosDev
