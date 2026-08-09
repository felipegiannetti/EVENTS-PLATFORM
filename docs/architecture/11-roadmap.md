[← Voltar ao índice](README.md)

# Roadmap e fora de escopo

A plataforma já está implementada de ponta a ponta na sua fatia atual (auth, eventos, lotes, cupons, ingressos, check-in, participantes, financeiro, perfil) — ver [docs/implementation](../implementation/README.md) pro estado real do código. Este documento lista o que é conhecido como pendente, para não se perder entre conversas.

## Backlog imediato (itens identificados, ainda não implementados)

- **Email de confirmação de criação de conta**: hoje `POST /auth/register` cria a conta e loga o usuário direto, sem nenhum email de boas-vindas/confirmação. Falta decidir se a conta fica "não confirmada" até clicar num link (bloqueando algo) ou se é só um email informativo sem gate nenhum — e então implementar via `MailService` (`apps/api/src/infra/mail/mail.service.ts`), no mesmo padrão do email de confirmação de ingresso.
- **Suporte a erros para o usuário final**: hoje um erro inesperado do backend vira uma mensagem técnica (`err.message` da `ApiError`) exibida crua na tela — não existe um canal de suporte, FAQ, ou fallback amigável quando algo foge do esperado (pagamento, integração externa, etc). Precisa de tratamento de erro mais robusto no frontend (mensagens genéricas amigáveis com opção de reportar) e, possivelmente, um canal de contato/suporte real por trás disso.

## Gaps descobertos durante verificação (não pedidos ainda, registrados para não esquecer)

- **Não existe geração de QR code visível para o comprador.** O check-in (`apps/web/app/eventos/[id]/checkin/page.tsx`) já decodifica QR via câmera (jsQR), e o `qrToken` já é assinado e gravado em cada `Ingresso` — mas nenhuma tela do lado do comprador (`/meus-ingressos`, o email de confirmação) efetivamente desenha esse QR pra ser mostrado na entrada. Sem isso, o check-in não tem o que escanear na prática.

## Outros gaps encontrados (revisão de documentação — não alterar as duas seções acima, só adicionando aqui)

- **`AcordoComercial` não tem CRUD nenhum.** `FinanceService.buscarResumoFinanceiro` já lê o acordo comercial ativo de um organizador/evento e aplica o split nos 12% de taxa (ver [09-modelo-financeiro.md](09-modelo-financeiro.md)) — mas não existe endpoint, tela ou módulo `admin` pra criar, editar ou desativar um acordo. Hoje isso só é possível inserindo a linha direto no banco (Prisma Studio). Sem isso, o "incentivo comercial" descrito no modelo financeiro é inoperável na prática pelo time da NOVYX.
- **`ListaOff`, `FeatureFlag` e `AuditLog` existem só no schema do Prisma.** Nenhum dos três tem controller, service ou tela — são tabelas criadas mas nunca lidas/escritas por código algum hoje (ver [04-modelo-de-dados.md](04-modelo-de-dados.md) e [03-modulos-backend.md](03-modulos-backend.md)).
- **Não existe painel `admin_geral` de fato.** O papel `admin_geral` existe em `Usuario.papelGlobal` e é checado por `RolesGuard`, mas nenhuma rota da API usa esse guard hoje — não há nenhuma funcionalidade exclusiva de superadmin implementada.

## Roadmap futuro (pós web + app completos)

Sistema de ponto de venda para o **bar do evento** (comandas, controle de consumo, fechamento de caixa) — módulo novo, avaliado depois que a plataforma de ingressos e o app estiverem consolidados. A arquitetura de monólito modular já comporta esse tipo de adição futura como um novo módulo (ex: `bar-pos`), reaproveitando auth, RBAC por evento e o mesmo app mobile.
