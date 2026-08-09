[← Voltar ao índice](README.md)

# Estrutura do monorepo (Turborepo)

```
/apps
  /web       → Next.js: storefront público, dashboard do organizador, painel admin NOVYX
  /api       → NestJS: monólito modular
  /mobile    → React Native (Expo): app de check-in → futuro app completo
/packages
  /shared-types → DTOs e schemas (Zod) compartilhados entre api/web/mobile
  /ui           → componentes React compartilhados (web usa direto; mobile usa equivalentes RN)
  /config       → eslint, tsconfig, tailwind presets compartilhados
/infra
  /cdk       → AWS CDK (TypeScript) — toda a infraestrutura como código
```

Compartilhar `shared-types` entre os três apps evita divergência de contrato de API (o maior risco de bug em times pequenos com múltiplos front-ends).

**Status de implementação desta estrutura**: `apps/web`, `apps/api` e `packages/shared-types` existem e são usados de verdade (ver [docs/implementation/README.md](../implementation/README.md)); `apps/mobile` é só o esqueleto Expo original (chama `/health`, sem telas). `packages/config` existe (eslint/tsconfig/tailwind presets). **`packages/ui` e `infra/cdk` ainda não existem** — hoje `apps/web` tem seus próprios componentes em `apps/web/components/` (não compartilhados com `apps/mobile`, que não tem UI nenhuma ainda), e não há nenhuma infraestrutura como código provisionada (a aplicação roda só localmente, ver [desenvolvimento-local.md](../implementation/desenvolvimento-local.md)).
