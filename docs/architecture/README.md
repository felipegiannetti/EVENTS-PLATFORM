# Arquitetura — Plataforma de Ingressos NOVYX

## Contexto

A NOVYX está lançando seu primeiro produto próprio: uma plataforma de venda e gestão de ingressos, com diferencial em controle operacional (check-in, antifraude, relatórios) e governança de acesso por papéis. O time é pequeno (2 sócios + software house terceirizada), mas o produto precisa suportar desde o dia 1 picos de tráfego reais — vendas de shows grandes (ex: Luan Santana, open bar) com **5.000 a 25.000 usuários simultâneos** no lançamento de vendas.

Ver o resumo funcional do produto em [docs/product/resumo-produto.md](../product/resumo-produto.md).

## Decisões já validadas

- **Backend**: NestJS + TypeScript, como **monólito modular** (não microsserviços desde o dia 1). Módulos de compra/pagamento e de check-in/QR ficam com fronteiras internas bem definidas e comunicação assíncrona via fila, para poderem ser extraídos como serviços separados no futuro sem reescrever regra de negócio.
- **Mobile**: React Native (iOS + Android), começando como app de check-in (QR), evoluindo para o app completo do comprador. Validação de QR sempre online, sem modo offline (ver [07-app-checkin.md](07-app-checkin.md)).
- **Banco de dados**: PostgreSQL.
- **Repositório**: Monorepo (Turborepo).
- **Cloud**: AWS, priorizando serviços pay-as-you-go para manter custo baixo no início e escalar sem re-arquitetar.
- **Pagamento**: Asaas (PIX + boleto + cartão, split de pagamento nativo), desenhado como módulo plugável.
- **Taxa de serviço**: 12% fixos, com divisão configurável entre NOVYX e organizador como incentivo comercial (ver [09-modelo-financeiro.md](09-modelo-financeiro.md)).

## Diagrama geral

```
                         ┌─────────────────────┐
                         │   CloudFront (CDN)   │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼───────────────────┐
                 │                  │                    │
        ┌────────▼────────┐ ┌──────▼───────┐   ┌────────▼─────────┐
        │  Next.js (Web)   │ │  ALB + WAF   │   │  S3 (assets, CSV, │
        │  Storefront +    │ │  (rate limit, │   │  QR images)       │
        │  Dashboard Org.  │ │  bot rules)   │   └───────────────────┘
        └──────────────────┘ └──────┬───────┘
                                     │
                         ┌───────────▼────────────┐
                         │   ECS Fargate (NestJS)   │
                         │   Monólito Modular API   │
                         │  auth · events · tickets │
                         │  checkout · checkin      │
                         │  guestlist · reports     │
                         │  admin · notifications   │
                         └───┬──────────┬───────────┘
                             │          │
                 ┌───────────▼──┐   ┌───▼─────────────┐
                 │ Aurora Postgres│   │ ElastiCache Redis│
                 │ Serverless v2  │   │ cache · filas    │
                 │ (+ read replica)│  │ (BullMQ) · sala  │
                 └────────────────┘   │ de espera        │
                                       └──────────────────┘
                             │
                 ┌───────────▼──────────────┐
                 │  SQS + Workers (async)     │
                 │  emissão de ingresso, QR,  │
                 │  e-mail (SES), parciais    │
                 └────────────────────────────┘

        ┌───────────────────────────┐
        │ React Native (check-in →   │──▶ API (módulo checkin, validação
        │ app completo no futuro)    │    sempre online, sem fallback offline)
        └───────────────────────────┘

        Gateway de pagamento (Asaas, com split/subconta por organizador) ⇄
        módulo checkout via adapter + webhook assíncrono (fila) p/ confirmação
```

**Princípio central**: monólito modular no NestJS, mas as duas áreas mais sensíveis a pico e a falha de rede — **compra/pagamento** e **check-in/QR** — já nascem com fronteiras internas rígidas (módulo próprio, schema de dados próprio, comunicação só via eventos/fila), para que possam virar serviços independentes depois sem reescrever regra de negócio.

## Índice

1. [Estrutura do monorepo](02-monorepo.md)
2. [Módulos do backend](03-modulos-backend.md)
3. [Modelo de dados](04-modelo-de-dados.md)
4. [Desenho para escala (5k–25k usuários simultâneos)](05-escala.md)
5. [Segurança e conformidade](06-seguranca.md)
6. [App de check-in → app completo](07-app-checkin.md)
7. [Pagamento](08-pagamento.md)
8. [Modelo financeiro: split, repasse e taxa de serviço](09-modelo-financeiro.md)
9. [Infraestrutura como código e CI/CD](10-infra-cicd.md)
10. [Roadmap e fora de escopo](11-roadmap.md)
11. [Pagamentos, repasses e central financeira — especificação futura](12-pagamentos-e-repasses.md)

> **Nota de status (atualizada após rodadas de implementação)**: uma fatia real do produto já está construída — ver [docs/implementation/README.md](../implementation/README.md) para o que existe de verdade no código hoje. Este conjunto de documentos mistura decisões já implementadas (modelo de dados core, RBAC por evento, modelo financeiro de split/taxa) com desenho ainda **não construído** (gateway de pagamento/Asaas, fila assíncrona, infraestrutura AWS, app de check-in em React Native, módulos `checkin`/`guestlist`/`reports`/`admin`/`notifications`/`audit-log` como serviços próprios). Onde um documento descreve algo que ainda não existe no código, isso é desenho para orientar a implementação futura, não um relato do que já roda em produção — consulte sempre a fatia de implementação para saber o que é real. [Roadmap e gaps conhecidos](11-roadmap.md) lista o que falta de forma explícita.
