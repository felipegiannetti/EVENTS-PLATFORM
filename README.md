# NOVYX Events Platform

Plataforma para descoberta, criação e gestão de eventos e ingressos.

## Desenvolvimento local

```powershell
pnpm install
docker compose up -d postgres
pnpm --filter api exec prisma migrate dev
```

Depois, execute em dois terminais separados:

```powershell
# Terminal 1 — API NestJS em http://localhost:3000
pnpm --filter api dev
```

```powershell
# Terminal 2 — frontend Next.js em http://localhost:3001
pnpm --filter web dev
```

Consulte o [guia completo de desenvolvimento local](docs/implementation/desenvolvimento-local.md) para configuração, portas e solução de problemas.

## Documentação

- [Índice da documentação](docs/README.md)
- [Resumo do produto](docs/product/resumo-produto.md)
- [Arquitetura](docs/architecture/README.md)
- [Implementação](docs/implementation/README.md)
- [Design system](docs/frontend/design-system.md)
- [Alterações de agosto de 2026](docs/implementation/alteracoes-2026-08.md)
