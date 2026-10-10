---
name: checar-arquitetura
description: Audita a API (server/src) contra as regras de camadas, inversão de dependência e nomenclatura definidas em server/CLAUDE.md. Use após criar/alterar features, antes de commits/PRs, ou quando o usuário pedir "checar arquitetura", "validar padrões", "revisar camadas" ou "conferir nomenclatura".
---

# Checar arquitetura

Execute as verificações abaixo a partir de `server/`. Cada comando deve retornar **vazio**; qualquer saída é uma violação a reportar com `arquivo:linha` e a correção sugerida.

## 1. Regras de dependência entre camadas

```bash
# domain é puro: não importa de outras camadas nem libs externas
grep -rnE "from \"(\.\./)+(app|infrastructure|shared|main)/|from \"(express|zod|@prisma|bcryptjs|jsonwebtoken)" src/domain

# Controller nunca acessa banco/infra
grep -rnE "infrastructure/|prisma" src/app/controllers

# Service nunca conhece Express nem HTTP nem infraestrutura concreta
grep -rnE "from \"express\"|HTTP_STATUS|res\.status|infrastructure/" src/app/services

# Repository nunca conhece HTTP
grep -rnE "from \"express\"|HTTP_STATUS" src/infrastructure/repositories

# Prisma Client gerado só é usado dentro de infrastructure
grep -rln "prisma/generated" src --include=*.ts | grep -vE "^src/infrastructure/"

# Classes concretas só são instanciadas no composition root (main) e nos testes
grep -rnE "new (\w+PrismaRepository|BcryptHashProvider|JwtTokenProvider|\w+Service|\w+Controller)\(" src | grep -vE "^src/(main|tests)/"
```

## 2. Nomenclatura

```bash
# Arquivos fora do padrão <feature>.<tipo>.ts nas pastas de camada
find src/app src/domain src/infrastructure/repositories src/infrastructure/providers -name "*.ts" \
  | grep -vE "/[a-z0-9-]+\.(controller|service|dto|validator|mapper|routes|entity|repository\.interface|provider\.interface|interface|error|prisma\.repository|provider)\.ts$"

# Constantes exportadas que não estão em UPPER_SNAKE_CASE (revise manualmente o resultado)
grep -rnE "^export const [a-z][A-Za-z]* = [0-9\"'\[{]" src/shared/constants
```

Verifique manualmente também:
- Métodos de controller/service/repository começam com verbo e seguem os nomes de `server/CLAUDE.md`.
- Classes em PascalCase; interfaces de contrato com prefixo `I`.

## 3. Segurança de dados

```bash
# Métodos públicos de service devem retornar DTO, nunca Entity (risco de vazar password)
grep -rnE "^\s+(async )?\w+\(.*\): Promise<[^>]*Entity" src/app/services
```

Confirme que todo retorno de usuário passa por `UserMapper.toResponse`.

## 4. Qualidade

```bash
npm run typecheck && npm test
```

## Relatório

Liste: ✅ regras atendidas, ❌ violações (`arquivo:linha` + correção) e ⚠️ pontos de atenção. Não corrija automaticamente sem o usuário pedir — proponha as mudanças.
