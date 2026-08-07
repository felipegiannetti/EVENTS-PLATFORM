[← Voltar ao índice](README.md)

# Infraestrutura como código e CI/CD

- **AWS CDK em TypeScript** (mesma linguagem do resto do stack) para provisionar toda a infra — VPC, ECS, Aurora, ElastiCache, S3, CloudFront, WAF, SQS, SES.
- Ambientes separados **dev / staging / produção** (contas AWS ou VPCs isoladas).
- **GitHub Actions** rodando o pipeline do Turborepo (lint/test/build) em PRs; deploy automático em merge para staging; aprovação manual para produção.
- Migrações de banco via Prisma (bom encaixe com NestJS/TypeScript; reavaliar para Drizzle só se necessidade de tuning fino de SQL aparecer).
