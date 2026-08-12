[← Voltar ao índice](README.md)

# Tarefas pendentes — visão consolidada

Checklist único juntando tudo que está registrado como pendente espalhado pelos outros documentos ([11-roadmap.md](11-roadmap.md), [12-pagamentos-e-repasses.md](12-pagamentos-e-repasses.md), [04-modelo-de-dados.md](04-modelo-de-dados.md)) e o que foi descoberto/discutido em sessões de implementação. Serve pra consulta rápida — pra entender o *porquê* de cada item, siga o link pro documento de origem, que tem o racional completo.

**Como manter isso atualizado**: quando um item daqui for resolvido, mova a explicação completa pro documento de origem (com `~~riscado~~ **Resolvido.**`, padrão já usado no roadmap) e apague a linha daqui — este documento é uma lista de trabalho, não um histórico.

## Conta / autenticação

- [ ] **Email de confirmação de criação de conta** — `POST /auth/register` loga direto, sem nenhum email de boas-vindas/confirmação. Falta decidir se vira um gate ("conta não confirmada" até clicar num link) ou só um email informativo. Ver [11-roadmap.md](11-roadmap.md#backlog-imediato-itens-identificados-ainda-não-implementados).
- [ ] **Completar cadastro de conta criada via Google** — hoje uma conta criada com "Continuar com Google" fica permanentemente com `documento`/`telefone` nulos até o usuário editar manualmente em `/perfil` (documento nem dá pra editar lá — é imutável por design). Não existe nenhum lembrete, gate ou fluxo guiado pra completar isso, mesmo que seja necessário depois (ex: pra criar evento pago, cadastrar conta bancária). Ver [11-roadmap.md](11-roadmap.md#login-com-google-oauth2--implementado-precisa-de-credenciais-reais).
- [ ] **Exclusão self-service de conta criada via Google** — `DELETE /auth/me` exige senha; conta Google não tem. Hoje só mostra uma nota "fale com o suporte", sem alternativa real (nem existe canal de suporte ainda, ver item abaixo).
- [ ] **Código de indicação (`?ref=`) no cadastro via Google** — o botão "Criar conta com Google" em `/registro?ref=CODIGO` não carrega esse código pro backend; só o formulário normal atribui a indicação.
- [ ] **Credenciais reais do Google OAuth** — `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` vêm vazios em `.env`; sem preencher, o botão "Continuar com Google" redireciona mas o Google rejeita o `client_id`. Criar em https://console.cloud.google.com/apis/credentials.
- [ ] **Confirmação real de CPF/CNPJ** (não só dígito verificador) — exigiria serviço externo pago (SERPRO/Serasa) ou a checagem que o próprio gateway de pagamento faria no onboarding. **Adiado a pedido do usuário.**

## Suporte ao usuário final

- [ ] **Canal de suporte / FAQ / fallback amigável** — hoje um erro inesperado do backend aparece cru na tela (`err.message`). Não existe FAQ, central de ajuda, nem canal de contato real por trás do link "Ajuda" do rodapé.

## Checkout self-service (bloqueador de vários itens abaixo)

Nada disso existe ainda — hoje **todo ingresso nasce de emissão manual pelo organizador**, nunca de uma compra self-service:

- [ ] Fluxo de compra do comprador (carrinho, pagamento, confirmação)
- [ ] Integração com gateway de pagamento (Asaas — PIX/boleto/cartão, split nativo) — ver [08-pagamento.md](08-pagamento.md)
- [ ] `Transacao` real criada a partir de um pagamento de verdade (hoje o model existe, mas nunca é escrito)
- [ ] Tela de "Reservar meu ingresso" pro comprador — a infraestrutura de hold de 15 minutos já existe no backend (`ReservaIngresso`, `TicketsService.reservar/confirmarReserva/cancelarReserva`), só falta a tela: cronômetro, formulário de confirmação, nenhuma UI ainda. Ver [11-roadmap.md](11-roadmap.md#reserva-de-ingresso-hold-de-15-minutos--infraestrutura-pronta-sem-ui-ainda).
- [ ] Cobrança real do adicional de 10% do ingresso com cancelamento flexível — regra de produto já definida, só falta cobrança de verdade. Ver [12-pagamentos-e-repasses.md#43](12-pagamentos-e-repasses.md#43-ingresso-com-cancelamento-flexível--produto-pago-10-revertido-só-à-plataforma).
- [ ] Cobrança real da taxa fixa de gateway (R$0,49 em ingresso < R$50) — cálculo já implementado e exposto no financeiro, só falta existir uma cobrança de verdade pra calcular em cima. Ver [09-modelo-financeiro.md#taxa-fixa-de-gateway-em-ingressos-de-baixo-valor-implementado](09-modelo-financeiro.md#taxa-fixa-de-gateway-em-ingressos-de-baixo-valor-implementado).
- [ ] Reembolso/estorno automático real ao cancelar um ingresso — hoje cancelar só muda `status`, nenhum dinheiro se move (porque nenhum foi cobrado). Ver [11-roadmap.md](11-roadmap.md#backlog-imediato-itens-identificados-ainda-não-implementados).
- [ ] A janela de 7 dias de cancelamento (direito de arrependimento) só passa a valer na prática com uma "compra" de verdade pra contar o prazo. Ver [12-pagamentos-e-repasses.md#42](12-pagamentos-e-repasses.md#42-cancelamento-de-compra--direito-de-arrependimento-7-dias-e-página-de-políticas).
- [ ] Liquidação real do programa de indicação — `ComissaoIndicacao` já existe como ledger preparado, mas sem gateway não vira pagamento de verdade (fica em estimativa). Ver [09-modelo-financeiro.md](09-modelo-financeiro.md#programa-de-indicação-referral--implementado-no-produto-aguardando-liquidação-real).
- [ ] Central Financeira do Admin com GMV real, valores devidos/repassados/bloqueados por evento e organizador — desenhada em [12-pagamentos-e-repasses.md](12-pagamentos-e-repasses.md), não implementada.

## Sistema (feature flags)

- [ ] **Nenhuma funcionalidade real checa os feature flags ainda** — `/admin/sistema` só guarda o estado ligado/desligado (CRUD completo, auditado), mas não há nenhum `if (flagAtiva(...))` em nenhum service. Conectar isso ao comportamento real (ex: `TicketsService` checando `transferencia_ingressos` antes de permitir transferir) é decisão consciente de escopo, ainda não feita.
- [ ] `eventosEscopo` (flag valendo só pra alguns eventos, não globalmente) sem UI — toda flag criada hoje é sempre global.
- [ ] Migração planejada pro **PostHog Feature Flags** como fonte de verdade — checklist completo em [11-roadmap.md](11-roadmap.md#todo--migrar-feature-flags-para-o-posthog).

## Admin

- [ ] **Controle de contas de usuário** — o painel `/admin` hoje só cobre Acordos comerciais, Suporte (ver eventos), Sistema (flags) e Financeiro (consolidado). Não existe uma tela de gestão de contas em si (listar/suspender/promover usuário, resetar senha administrativamente, etc.) — só o CRUD de `AcordoComercial` por organizador.
- [ ] **Visão de auditoria** — `AuditLog` já grava ações administrativas (acordos, feature flags), mas não existe nenhuma tela que leia esse histórico. Só existe o `INSERT`, nunca o `SELECT`.
- [ ] **Formato de reembolso em massa ao cancelar/deletar um evento abusivo/inapropriado** — ideia levantada pelo usuário (devolver o dinheiro de todos os compradores de um evento removido por violação de política), registrada aqui pra desenhar quando fizer sentido — ainda não modelada nem implementada. Depende de checkout self-service existir primeiro (sem cobrança real, não há o que devolver).

## Carrinho abandonado

- [ ] **Sem automação de contato** — o relatório em `/eventos/[id]/carrinho-abandonado` é só leitura + CSV manual; não dispara nenhum email/SMS automático de recuperação pro comprador que abandonou. Ver [11-roadmap.md](11-roadmap.md#reserva-de-ingresso-hold-de-15-minutos--infraestrutura-pronta-sem-ui-ainda).
- [ ] Só se popula de verdade quando existir alguma tela de comprador chamando os endpoints públicos de reserva — hoje só é testável via API direta, nenhum fluxo real do site cria uma reserva.

## Infraestrutura / escala (nada implementado, tudo é desenho)

- [ ] AWS (ECS Fargate, Aurora Postgres Serverless v2, ElastiCache Redis, CloudFront, S3, SQS) — ver [10-infra-cicd.md](10-infra-cicd.md) e o diagrama em [README.md](README.md#diagrama-geral).
- [ ] Fila assíncrona (BullMQ/SQS) para emissão de ingresso, QR, email em massa — hoje tudo roda síncrono, sem fila.
- [ ] CI/CD real (pipeline, ambientes, deploy automatizado).
- [ ] Desenho de escala pra 5.000–25.000 usuários simultâneos em pico de venda — ver [05-escala.md](05-escala.md) (throughput em pico é diferente de corretude sob concorrência, que já está resolvida — ver [11-roadmap.md#concorrência--corretude-sob-múltiplos-usuários-simultâneos](11-roadmap.md#concorrência--corretude-sob-múltiplos-usuários-simultâneos)).

## Mobile (`apps/mobile`)

- [ ] App React Native é só esqueleto (Expo + tela de health check) — nenhuma tela de produto (check-in, carteira do comprador) foi construída ainda. Ver [07-app-checkin.md](07-app-checkin.md) pro desenho planejado.

## Outras ideias registradas, não implementadas

- [ ] **Programa de indicação de organizadores (ideia distinta do programa de indicação já implementado)** — não confundir com o programa de indicação já existente (`/indicacoes`, funcional). Já coberto acima na seção de liquidação real.
- [ ] Sistema de ponto de venda para o bar do evento (comandas, controle de consumo, fechamento de caixa) — roadmap de longo prazo, avaliado só depois da plataforma de ingressos e do app estarem consolidados. Ver [11-roadmap.md](11-roadmap.md#roadmap-futuro-pós-web--app-completos).
