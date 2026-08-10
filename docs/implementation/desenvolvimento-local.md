[← Voltar à documentação](../README.md)

# Desenvolvimento local

## Pré-requisitos

- Node.js 20 ou superior.
- pnpm 11.20.0.
- Docker Desktop com Docker Compose.

O `package.json` da raiz fixa o gerenciador em `pnpm@11.20.0`. Caso `pnpm` não seja reconhecido no Windows, instale-o no perfil do usuário:

```powershell
npm install --global pnpm@11.20.0
```

Como alternativa sem instalação global:

```powershell
corepack pnpm --version
```

## Instalação

Na raiz do monorepo:

```powershell
pnpm install
```

O workspace autoriza os scripts nativos necessários para NestJS, Prisma, Argon2, Sharp, Puppeteer e suas dependências em `pnpm-workspace.yaml`. **Puppeteer baixa o próprio Chromium no post-install** (usado por `apps/api` pra gerar o PDF do ingresso) — na primeira instalação isso adiciona alguns minutos e ~200MB de download; instalações seguintes reusam o cache em `~/.cache/puppeteer`.

## Banco de dados

O PostgreSQL do projeto é executado pelo Docker:

```powershell
docker compose up -d postgres
```

A porta externa é `5433`, pois a porta `5432` pode estar ocupada por uma instalação local do PostgreSQL. Dentro do contêiner, o banco continua usando `5432`.

URL local utilizada pela API:

```text
postgresql://events_platform:events_platform@localhost:5433/events_platform?schema=public
```

O arquivo `apps/api/.env` deve conter `DATABASE_URL`. Ele é local e ignorado pelo Git; `.env.example` documenta o valor esperado.

Para aplicar migrations:

```powershell
pnpm --filter api exec prisma migrate dev
```

Para consultar o estado das migrations:

```powershell
pnpm --filter api exec prisma migrate status
```

Para visualizar e editar os dados pelo Prisma Studio:

```powershell
pnpm --filter api exec prisma studio
```

O Studio fica disponível em `http://localhost:5555`.

## Iniciar a aplicação

Use dois terminais, ambos abertos na raiz do projeto.

Terminal 1 — backend:

```powershell
pnpm --filter api dev
```

A API NestJS fica em `http://localhost:3000`.

Terminal 2 — frontend:

```powershell
pnpm --filter web dev
```

O frontend Next.js fica em `http://localhost:3001`.

## Validação de produção

```powershell
pnpm --filter api build
pnpm --filter web build
```

## Porta ocupada no Windows

Para descobrir qual processo está usando uma porta:

```powershell
Get-NetTCPConnection -LocalPort 3000,3001 -State Listen |
  Select-Object LocalPort, OwningProcess
```

Depois de confirmar que o PID pertence ao processo do projeto, encerre-o:

```powershell
Stop-Process -Id <PID> -Force
```

Não finalize processos pela porta sem conferir o PID e a linha de comando, pois outro software pode usar a mesma porta.
