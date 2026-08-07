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
