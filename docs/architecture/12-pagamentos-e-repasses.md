[← Voltar ao índice](README.md)

# Pagamentos, repasses e central financeira — especificação futura

> **PAYMENT GATEWAY STATUS: NOT IMPLEMENTED.**
> Este documento é **especificação arquitetural e de negócio**, não uma descrição de código existente. Não há gateway de pagamento integrado ao projeto — nem Asaas, nem Stripe, nem Pagar.me, nem Mercado Pago. Não há webhooks reais, API keys, chamadas fictícias, ou qualquer simulação de produção. Nada neste documento foi implementado.
>
> Para o que **já existe** hoje (emissão manual de ingresso, taxa de serviço de 12%, `AcordoComercial`, resumo financeiro agregado sem dinheiro real), ver [09-modelo-financeiro.md](09-modelo-financeiro.md) — que continua sendo a fonte da verdade sobre o estado atual do código. Este documento aqui é a extensão: cobre tudo que falta desenhar antes de existir um checkout de verdade — pagamento, repasse, conta bloqueada, saldo não reclamado, ledger, painel administrativo financeiro, segurança e auditoria.

## 1. Por que este documento existe

A plataforma vai processar pagamentos de compradores e repassar parte desse valor a organizadores. Isso é dinheiro de terceiros passando pela plataforma — a categoria de bug mais cara que existe (dinheiro perdido, duplicado, preso ou pago à pessoa errada). Antes de escolher um gateway ou escrever uma linha de código de cobrança, o modelo conceitual — quem tem direito a quê, em que estado, com que prova — precisa estar decidido e escrito. É isso que este documento faz.

Este documento **não** substitui [09-modelo-financeiro.md](09-modelo-financeiro.md) (que descreve o split de 12%/`AcordoComercial`, já parcialmente implementado) nem o [README principal da documentação](../README.md). Ele referencia ambos e assume o leitor já conhece o modelo de taxa de serviço fixa descrito em 09.

## 2. Princípio financeiro fundamental: GMV ≠ receita da plataforma

A plataforma é uma **intermediadora**, não a dona do dinheiro que passa por ela. Três números diferentes, que nunca podem ser tratados como o mesmo número:

| Termo | Definição | Exemplo |
|---|---|---|
| **GMV** (Gross Merchandise Value) | Valor total vendido em ingressos, processado pela plataforma | R$ 100.000 |
| **Platform Revenue** (receita da plataforma) | Parte que efetivamente pertence à RARO Tickets — a taxa de serviço (ver [09-modelo-financeiro.md](09-modelo-financeiro.md)) | R$ 10.000 |
| **Organizer Payable** (valor devido ao organizador) | Parte que pertence ao organizador do evento | R$ 90.000 |

`GMV` passar pela plataforma **não** significa que a plataforma faturou `GMV`. Essa distinção precisa existir em todo lugar do sistema que toca dinheiro — modelo de dados, cálculos, telas, relatórios, contabilidade. Confundir os dois é o erro mais comum (e mais caro) em plataformas de marketplace/intermediação.

## 3. Regra: nunca colapsar "valor pago" em "receita"

Nunca assumir implicitamente:

```
total pago pelo comprador == receita da plataforma
```

O domínio financeiro precisa distinguir conceitualmente (nomes exatos a definir na implementação, adaptados ao padrão já usado no projeto — `camelCase`, em português onde o resto do domínio já é português):

- `valorBruto` (grossAmount) — o que o comprador pagou
- `taxaPlataforma` (platformFee) — a parte retida pela RARO Tickets
- `taxaGateway` (gatewayFee) — custo cobrado pelo provedor de pagamento (Asaas ou outro), separado da taxa da plataforma
- `valorLiquidoOrganizador` (organizerNetAmount) — o que o organizador tem direito a receber
- `valorEstornado` (refundedAmount)
- `valorChargeback` (chargebackAmount)
- `valorRepassado` (paidOutAmount)
- `valorBloqueado` (blockedAmount)

Essa separação é o que torna o sistema auditável — cada real precisa ter um dono e um motivo, o tempo todo.

## 4. Fluxo normal de pagamento (conceitual)

```
Comprador
  → Compra de ingresso
  → Gateway de pagamento
  → Pagamento confirmado
  → Obrigação financeira criada (quanto o organizador tem direito a receber)
  → Taxas calculadas (taxa da plataforma + taxa do gateway)
  → Receita da plataforma reconhecida + valor devido ao organizador registrado
  → Período de retenção (settlement/holding)
  → Elegibilidade de repasse atingida
  → Conta de repasse do organizador é válida?
      SIM → repasse (payout) executado
      NÃO → saldo bloqueado, motivo registrado
```

Nenhuma etapa deste fluxo existe hoje. A emissão manual atual (`TicketsService.emitir`) pula direto para "ingresso emitido", sem nenhuma das etapas de pagamento/obrigação/retenção acima — o que é honesto pro estado atual (não existe checkout), mas significa que **nada** deste fluxo pode ser reaproveitado sem construção nova.

## 5. Prazo de repasse

Regra inicial de produto (não hardcode): aproximadamente **D+3 a D+4** após a condição que tornar o pagamento elegível para repasse — a definir entre "D+3 da venda" (mais simples, é o que o Asaas costuma oferecer nativamente) ou "D+N após o evento" (mais conservador contra chargeback/cancelamento, é o que [09-modelo-financeiro.md](09-modelo-financeiro.md) já registra como decisão preliminar de produto). Essas duas âncoras de tempo **não são a mesma coisa** e a escolha final depende de risco de estorno aceito pelo negócio — isso precisa ser decidido explicitamente, não herdado por padrão de um gateway.

Isso deve ser configuração, não constante fixa no código:

```
payoutDelayDays  // int, configurável — nunca espalhar "3" ou "4" hardcoded pelo código
```

O valor exato — e se conta a partir da venda ou do evento — é uma **decisão de negócio pendente** (ver seção 21).

## 6. Conta de recebimento do organizador

Hoje `ContaBancaria` (ver [04-modelo-de-dados.md](04-modelo-de-dados.md)) só guarda dados brutos cadastrados pelo organizador, sem nenhuma validação real (não existe gateway pra validar). No modelo futuro, a conta de repasse precisa de um estado explícito:

- `NOT_CONFIGURED` — organizador nunca cadastrou
- `PENDING_VALIDATION` — cadastrada, aguardando validação do gateway/KYC
- `VALID` — pode receber repasse
- `REJECTED` — validação falhou
- `SUSPENDED` — já foi válida, foi suspensa (fraude, compliance, solicitação)

**Somente `VALID` permite payout.** Todos os outros estados bloqueiam repasse — nunca "quase válida o suficiente".

## 7. Organizador sem conta de repasse válida no momento do repasse

Se a data de elegibilidade de repasse chega e o organizador não tem `ContaBancaria` em estado `VALID`:

- **Não** executar o payout.
- O saldo fica bloqueado, nunca perdido, nunca virando receita da plataforma automaticamente.
- O motivo do bloqueio é sempre registrado explicitamente — nunca um bloqueio "silencioso" sem razão anexada.

Estados de bloqueio candidatos:

```
BLOCKED_MISSING_PAYOUT_ACCOUNT
BLOCKED_PAYOUT_ACCOUNT_VALIDATION
BLOCKED_KYC
BLOCKED_COMPLIANCE
```

## 8. Exemplo numérico

Evento A: GMV R$ 50.000, taxa de serviço de 12% ([09-modelo-financeiro.md](09-modelo-financeiro.md)) → Platform Revenue R$ 6.000, Organizer Payable R$ 44.000.

Chega D+4. Organizador não tem conta cadastrada.

| | Valor |
|---|---:|
| Platform Revenue | R$ 6.000 |
| Organizer Payable | R$ 44.000 |
| Bloqueado | R$ 44.000 |
| Repassado | R$ 0 |
| Status | `BLOCKED_MISSING_PAYOUT_ACCOUNT` |

Os R$ 44.000 **não** se tornam receita da plataforma só porque estão bloqueados. Continuam sendo, conceitualmente, dinheiro do organizador — só que ele ainda não pode recebê-lo.

## 9. Organizador cadastra conta depois do bloqueio

Se o organizador cadastra (ou corrige) a conta em D+20, por exemplo:

```
Conta enviada → Validação → KYC/KYB (se aplicável) → Conta válida
  → Sistema busca payouts bloqueados desse organizador
  → Reavalia elegibilidade de cada um
  → Executa o(s) payout(s) pendente(s)
```

Não cria saldo novo. Não duplica a obrigação. Só atualiza o estado da obrigação financeira que já existia desde a venda original.

## 10. Organizador que nunca cadastra conta — saldo não reclamado

Este cenário precisa estar coberto explicitamente, porque é onde erros de "converter em receita por padrão" mais acontecem.

```
D+4:  BLOCKED_MISSING_PAYOUT_ACCOUNT
D+30: continua bloqueado + notificação ao organizador
D+60: continua bloqueado + nova notificação
D+90: continua bloqueado + possível restrição adicional da conta do organizador
longo prazo: UNCLAIMED_BALANCE
```

**`UNCLAIMED_BALANCE` não é `PLATFORM_REVENUE`.** O saldo continua identificado como obrigação relacionada àquele organizador específico até que exista uma destinação juridicamente válida: pagamento, restituição, decisão jurídica, prescrição aplicável, ou outra que a assessoria jurídica/contábil definir. **Não existirá** uma ação administrativa genérica de "converter saldo não reclamado em receita" sem essa validação formal prévia (ver seção 18).

Marcar explicitamente no backlog de decisões: `PENDING LEGAL/ACCOUNTING DEFINITION`.

## 11. Princípio de segregação: evitar que o dinheiro "passe" pela conta da plataforma

Sempre que tecnicamente possível, evitar a arquitetura:

```
Comprador → conta bancária da plataforma → organizador
```

E preferir usar a infraestrutura de split/subconta do próprio provedor de pagamento:

```
Comprador → Provedor de pagamento → Ledger/subconta/split
              → parte da plataforma
              → parte do organizador → repasse
```

[09-modelo-financeiro.md](09-modelo-financeiro.md) já registra esse racional para o desenho do split via Asaas — o objetivo é sempre o mesmo: nunca deixar ambíguo o que é dinheiro da plataforma, o que é dinheiro do organizador, o que é GMV, o que é receita e o que é saldo a pagar. A arquitetura final de segregação depende do gateway escolhido.

## 12. Tributação — só o princípio, não a decisão

Registrar explicitamente: **o fato de um valor passar pela plataforma não significa que ele constitui receita tributável da plataforma.**

Exemplo: venda de R$ 10.000, taxa de serviço R$ 1.200 (12%) → Platform Revenue R$ 1.200, Organizer Payable R$ 8.800. O tratamento contábil e tributário definitivo — inclusive o impacto da Reforma Tributária brasileira (IBS/CBS) e seu próprio mecanismo de split payment, já mencionado em [09-modelo-financeiro.md](09-modelo-financeiro.md) — **deve ser validado com contador/tributarista antes de qualquer implementação de cobrança real.** Marcar: `PENDING ACCOUNTING/TAX VALIDATION`.

## 13. Asaas — candidato, não decisão

Asaas é atualmente **um possível** provedor, não um compromisso arquitetural. A arquitetura descrita neste documento não pode depender exclusivamente dele.

Antes de qualquer implementação real com Asaas, confirmar diretamente com o provedor (nunca assumir por suposição):

1. prazo máximo de retenção de valores;
2. comportamento de `daysToExpire` (a Conta Escrow do Asaas tem retenção **temporária**, não indefinida — não assumir o contrário);
3. comportamento do saldo após a expiração da retenção;
4. estrutura de marketplace/split disponível;
5. estrutura de subcontas;
6. requisitos de KYC/KYB;
7. mecanismo de split nativo;
8. o que acontece quando o organizador não tem conta bancária cadastrada no Asaas;
9. tratamento de saldos não reclamados do lado do próprio Asaas;
10. chargebacks;
11. estornos/refunds;
12. mecanismo de payout;
13. dados disponíveis para conciliação.

Nenhuma dessas respostas deve ser assumida — todas precisam de confirmação com o provedor antes da implementação.

## 14. Abstração do provedor de pagamento

Para não acoplar o domínio financeiro a um gateway específico, a arquitetura futura deve isolar tudo atrás de uma interface conceitual (nome e shape final a adaptar ao padrão Repository/Service já usado no projeto — ver [03-modulos-backend.md](03-modulos-backend.md)):

```
PaymentProvider
  criarPagamento()
  buscarStatusPagamento()
  estornarPagamento()
  criarRepasse()
  buscarStatusRepasse()
  validarContaDeRepasse()
  buscarSaldo()
  reconciliarTransacao()
```

Futuramente: `AsaasPaymentProvider implements PaymentProvider`. **Nenhuma implementação concreta deve ser criada agora** — só a interface, quando o módulo `checkout` começar a ser construído de fato.

## 15. Máquina de estados — pagamento

```
CREATED → PENDING → CONFIRMED
                  ↘ FAILED
                  ↘ CANCELLED
CONFIRMED → REFUNDED
CONFIRMED → PARTIALLY_REFUNDED
CONFIRMED → CHARGEBACK
```

Os estados exatos devem seguir as capacidades reais do gateway escolhido — esta é a forma conceitual mínima, não o modelo final.

## 16. Máquina de estados — repasse (payout)

```
PENDING → ELIGIBLE → PROCESSING → PAID
ELIGIBLE → BLOCKED_MISSING_PAYOUT_ACCOUNT
ELIGIBLE → BLOCKED_KYC
ELIGIBLE → BLOCKED_COMPLIANCE
PROCESSING → FAILED
PENDING → CANCELLED
BLOCKED_* (longo prazo, sem resolução) → UNCLAIMED_BALANCE
```

## 17. Idempotência

Toda operação financeira futura precisa de proteção contra duplicação — especialmente pagamento, estorno, repasse, webhook, split e processamento de chargeback.

Exemplo: se `payoutId = PAY_123` for solicitado ao gateway e a resposta der timeout, **nunca** criar automaticamente um segundo payout. Primeiro consultar/reconciliar o estado real no gateway. Usar idempotency keys sempre que o gateway suportar.

## 18. Ledger financeiro interno

A arquitetura futura deve incluir um **ledger financeiro interno append-only** — nunca depender só do último status retornado pelo gateway como fonte da verdade. Cada movimentação relevante gera um registro imutável e auditável:

```
TICKET_SALE
PLATFORM_FEE
GATEWAY_FEE
ORGANIZER_PAYABLE
PAYOUT
REFUND
CHARGEBACK
ADJUSTMENT
REVERSAL
```

Nunca simplesmente sobrescrever um número (`saldo = saldo - 100`) sem deixar rastro de por quê. É esse ledger que torna possível a seção 20 (Central Financeira do Admin) e a seção 29 (conciliação) sem inventar dado.

## 19. Central Financeira do Admin — visão geral

Área exclusiva para administradores autorizados (ver RBAC na seção 26) com visão financeira global da operação — hoje **não existe nenhum painel `admin_geral`** funcional na plataforma (`RolesGuard` existe mas não é usado em nenhuma rota, ver [11-roadmap.md](11-roadmap.md)); este seria o primeiro caso de uso real desse papel.

### Dashboard executivo global

Filtrável por período:

- GMV total
- Platform Revenue
- Organizer Payable (total devido)
- Blocked Balance
- Pending Payout
- Paid Out
- Refunds
- Chargebacks

### Visão por evento (tabela)

| Evento | GMV | Receita plataforma | Organizador | Bloqueado | Repassado | Status |
|---|---:|---:|---:|---:|---:|---|
| Festival A | R$ 100.000 | R$ 12.000 | R$ 88.000 | R$ 0 | R$ 88.000 | OK |
| Evento B | R$ 35.000 | R$ 4.200 | R$ 30.800 | R$ 30.800 | R$ 0 | Conta ausente |

Permite identificar de imediato: *"Evento B tem R$ 30.800 bloqueados porque o organizador não configurou conta de recebimento."*

### Visão por organizador

Ao abrir um organizador: eventos, GMV agregado, receita gerada para a plataforma, saldo pendente, saldo bloqueado, saldo disponível, total repassado, refunds, chargebacks, status da conta de repasse, status de KYC/KYB, último repasse, próximo repasse, problemas em aberto.

### Visão por evento (detalhe)

Financial Overview: GMV, Platform Revenue, Gateway Fees, Organizer Net, Refunds, Chargebacks, Pending, Blocked, Paid Out — mais o status de payout com motivo explícito e há quantos dias está bloqueado.

## 20. Alertas financeiros

- **Crítico**: divergência financeira, payout duplicado, saldo negativo inesperado, webhook inconsistente, diferença de conciliação, chargeback relevante.
- **Alto**: payout falhou, conta suspensa, KYC recusado, valor grande bloqueado.
- **Aviso**: organizador sem conta, saldo bloqueado há mais de X dias, payout pendente por tempo excessivo.

## 21. Saldos bloqueados e não reclamados (painéis dedicados)

**Blocked Balances**: organizador, evento, valor, motivo, dias bloqueado — filtrável por valor, período, motivo, organizador, evento e tempo de bloqueio.

**Unclaimed Balances**: organizador, valor, desde quando, última notificação, status. O admin **visualiza**, mas **não existe** (e não deve existir sem fundamento jurídico formal) um botão genérico "converter em receita" — essa decisão precisa vir de definição jurídica/contábil, nunca de uma ação de UI de um administrador isolado.

## 22. Receita por evento e Take Rate

O admin precisa conseguir ver, por evento: GMV, Platform Revenue, Gateway Fees, Organizer Net — para analisar eventos mais rentáveis, organizadores mais relevantes, receita por período/categoria, ticket médio e:

```
Take Rate = Platform Revenue / GMV
```

Exemplo: GMV R$ 1.000.000, Platform Revenue R$ 80.000 → Take Rate 8%. Vira KPI de negócio de referência.

## 23. Timeline de transações (admin)

Visão cronológica por evento, montada a partir do ledger (seção 18):

```
10/08 14:35  Ticket purchased        +R$ 200 GMV
10/08 14:35  Platform fee            +R$ 24 Platform Revenue
10/08 14:35  Organizer payable       +R$ 176
14/08 09:00  Payout eligibility reached
14/08 09:00  Payout blocked          Reason: Missing payout account
20/08 11:22  Payout account submitted
20/08 13:40  Payout account validated
20/08 14:00  Payout processing
20/08 14:03  Payout completed
```

## 24. O painel administrativo não é um CRUD de saldos

**Nenhum administrador pode editar `saldo` ou `status de payout` diretamente**, como se fosse um campo de formulário qualquer. Operações financeiras não funcionam como CRUD convencional.

Se um ajuste manual (`FINANCIAL_ADJUSTMENT`) precisar existir no futuro, ele exige: permissão específica, motivo obrigatório, valor, usuário responsável, timestamp, estado anterior, estado posterior, entrada no audit log e — para valores relevantes — aprovação dupla (seção 25).

## 25. RBAC financeiro e dual control

Não assumir que qualquer `admin_geral` pode mexer em finanças. Papéis/permissões candidatos, a integrar ao RBAC já existente ([06-seguranca.md](06-seguranca.md)):

```
ADMIN_VIEW_FINANCIALS
ADMIN_VIEW_PAYOUTS
ADMIN_MANAGE_PAYOUTS
ADMIN_FINANCIAL_ADJUSTMENT
ADMIN_REFUND
SUPER_ADMIN
```

Para operações sensíveis (estornos grandes, ajustes manuais, payouts excepcionais, troca de beneficiário, liberação manual de bloqueio), considerar **dual control / four eyes**: um admin solicita, outro aprova — só então a operação executa.

## 26. Troca de conta de recebimento — ação de alto risco

Trocar a conta bancária de repasse de um organizador precisa ser tratada como evento de segurança, não um PATCH comum. Candidatos a exigir: reautenticação, MFA, confirmação por email, cooldown antes de liberar repasse pra conta nova, alerta ao organizador, entrada em audit log. Se houver payout pendente no momento da troca, o sistema pode exigir um período de segurança adicional antes de enviar dinheiro para a conta nova. Política exata: `PENDING SECURITY/BUSINESS DEFINITION`.

## 27. Conciliação

O sistema deve comparar periodicamente: **ledger interno** vs. **provedor de pagamento** vs. **informação de liquidação bancária**, identificando pagamentos ausentes, valores divergentes, payout duplicado ou faltante, taxas divergentes, refunds e chargebacks inconsistentes.

Painel de conciliação (exemplo): reconciled 1.240 transações, pending 7, mismatch 2, critical 1. **Divergência financeira nunca é escondida** — sempre visível e alertada (ver seção 20).

## 28. Exportação, filtros e busca (painel admin)

- Exportação (CSV/XLSX) para contabilidade, auditoria e financeiro, respeitando permissões e proteção de dados.
- Filtros: período, evento, organizador, status, status de payout, método de pagamento, valor, motivo de bloqueio, refund, chargeback.
- Busca: por `eventoId`, `organizadorId`, `paymentId`, `payoutId`, `orderId`, comprador, referência de transação — sempre respeitando LGPD e permissões (nunca busca livre por dado bancário completo).

## 29. Audit log

Toda operação administrativa financeira gera log de auditoria: `adminUserId`, `action`, `entity`, `entityId`, `timestamp`, `reason`, `previousState`, `newState`, `requestId` (quando aplicável). **Nunca** registrar secrets ou dados bancários completos em claro no log.

## 30. Webhooks

Eventos futuros a processar: `PAYMENT_CONFIRMED`, `PAYMENT_FAILED`, `REFUND`, `CHARGEBACK`, `PAYOUT_COMPLETED`, `PAYOUT_FAILED`, `ACCOUNT_VALIDATED`, entre outros. Todo webhook deve: validar assinatura, ser idempotente, impedir replay quando possível, registrar o processamento, suportar retry, e nunca duplicar uma movimentação financeira já processada.

## 31. Segurança — módulo financeiro é security-critical

Tratar este módulo com o nível de rigor mais alto da plataforma, protegendo especificamente contra: IDOR/BOLA, Broken Access Control, Mass Assignment, SQL Injection, Parameter Tampering, Race Conditions, Replay, falsificação de webhook, escalação de privilégio, sequestro de sessão e CSRF onde aplicável. Ver o levantamento de segurança já feito no restante da plataforma em [06-seguranca.md](06-seguranca.md) — o módulo financeiro deve receber o mesmo tipo de revisão, com barra mais alta.

## 32. Backend é sempre a fonte da verdade

Nunca confiar no frontend para informar preço, comissão, valor do ingresso, desconto, `organizadorId`, taxa da plataforma, valor de repasse, beneficiário, status de pagamento ou status de repasse. O backend recalcula e valida tudo — mesmo princípio já seguido hoje em `FinanceService` e nos guards de autorização ([06-seguranca.md](06-seguranca.md)), só que aplicado com ainda mais rigor porque aqui o erro custa dinheiro real.

## 33. Race conditions

Cenários a cobrir explicitamente: um payout sendo processado no exato momento em que chega um refund do mesmo valor; dois workers tentando executar o mesmo payout simultaneamente. A arquitetura futura precisa de transações de banco, locks quando apropriado, constraints únicas, idempotência (seção 17) e a máquina de estados (seções 15-16) como proteção — nunca "confiar que não vai acontecer".

## 34. Valores monetários

Nunca usar ponto flutuante de forma insegura para dinheiro (`0.1 + 0.2` não é um problema teórico). Usar unidades inteiras da menor denominação (ex: R$ 100,00 = 10000 centavos) ou tipo decimal apropriado ao stack — já é o padrão adotado hoje no restante do domínio financeiro (`CurrencyInput` guarda centavos no frontend; `Decimal` no schema Prisma) e deve continuar sendo.

## 35. Invariantes financeiras

Toda vez que o módulo financeiro for implementado de verdade, invariantes como esta precisam de teste automatizado:

```
GMV = Platform Revenue + Gateway Fees + Organizer Net + ajustes aplicáveis
```

Considerando corretamente refunds, chargebacks, descontos e impostos. A equação exata depende do modelo comercial final — o ponto é que ela **precisa existir e ser testada**, não só ser verdade "na prática".

## 36. Testes obrigatórios (quando o módulo for implementado)

No mínimo: pagamento normal, pagamento recusado, payout normal, payout sem conta, cadastro posterior de conta (desbloqueio), KYC pendente, KYC recusado, payout duplicado, webhook duplicado, timeout de gateway, refund antes do payout, refund depois do payout, chargeback, race condition entre payout e refund, troca de conta durante payout pendente, organizador suspenso, saldo não reclamado, e divergência de conciliação.

## 37. Observabilidade

Métricas candidatas: `payments_processed`, `payment_failures`, `payouts_processed`, `payout_failures`, `blocked_balance_total`, `unclaimed_balance_total`, `reconciliation_mismatch`, `refund_total`, `chargeback_total` — com alertas automáticos para anomalias.

## 38. LGPD e dados sensíveis

Dados financeiros e bancários exigem acesso mínimo, criptografia adequada (já existe hoje para `ContaBancaria` — ver [06-seguranca.md](06-seguranca.md)), mascaramento na exibição (ex: `Banco XXX •••• 4821`, nunca o número completo sem necessidade), retenção definida e auditabilidade completa.

## 39. Decisões pendentes

| Decisão | Estado |
|---|---|
| Provedor de pagamento | Em aberto — Asaas é candidato, não compromisso |
| Prazo de repasse (`payoutDelayDays`) | Alvo inicial ~D+3/D+4; ainda não definido se conta da venda ou do evento |
| Destinação final de saldo não reclamado (`UNCLAIMED_BALANCE`) | Pendente definição jurídica/contábil |
| Tratamento tributário | Pendente validação contábil/tributária |
| Reserva para chargeback | Pendente definição de negócio |
| Cancelamento de evento (reembolso em massa) | Pendente definição de negócio |
| Cooldown de troca de conta de repasse | Pendente definição de segurança/negócio |
| Limiar de aprovação dupla (dual control) | Pendente definição de negócio/segurança |
| Prazo de transferência de ingresso (`prazoTransferenciaHoras`, por evento) | **Resolvido** — configurável em dias ou horas em `/eventos/[id]/detalhes`, validado no back-end na transferência |
| Página de Políticas (cancelamento/reembolso) | **Resolvido** — `/politicas`, linkada no rodapé |
| Ingresso com cancelamento flexível (produto pago, 10%) | Regra de negócio registrada (seção 43) — cobrança em si depende de checkout self-service, que não existe |
| Taxa de serviço é reembolsável ao cancelar? | **Resolvido — nunca.** Nem no cancelamento padrão (7 dias) nem no flexível (nem o adicional de 10%). Só o valor do ingresso é elegível a reembolso (ver seções 42–43) |

## 40. Resumo executivo

1. A plataforma processará pagamentos de ingressos — hoje não processa nenhum.
2. GMV (valor total vendido) e receita da plataforma são conceitos diferentes e nunca podem ser tratados como o mesmo número.
3. A receita da plataforma é sempre separada do valor devido ao organizador.
4. O organizador só recebe repasse com conta de recebimento válida.
5. O prazo de repasse inicialmente considerado é ~D+3/D+4 (a confirmar).
6. Sem conta válida, o payout fica bloqueado — nunca cancelado silenciosamente.
7. O dinheiro bloqueado continua sendo, conceitualmente, do organizador.
8. Saldo bloqueado nunca vira receita da plataforma automaticamente.
9. Saldos muito antigos e nunca reclamados recebem status `UNCLAIMED_BALANCE` — sua destinação final depende de decisão jurídica/contábil, nunca de uma ação de UI.
10. A plataforma precisa de um ledger financeiro auditável, append-only.
11. Um Central Financeira do Admin dará visão completa de GMV, receita, valores devidos, repassados e bloqueados, por evento e por organizador.
12. Nenhum administrador pode editar saldos livremente — ajustes manuais exigem motivo, permissão específica e trilha de auditoria.
13. A futura integração precisa de idempotência, conciliação, webhooks seguros e auditoria completa desde o primeiro dia.
14. **Nenhum gateway foi integrado nesta tarefa.** Asaas é uma possibilidade futura avaliada em [08-pagamento.md](08-pagamento.md) e [09-modelo-financeiro.md](09-modelo-financeiro.md), mas nenhuma chamada real, API key ou webhook foi criada.
15. A arquitetura (interface `PaymentProvider`, seção 14) deve permitir trocar de provedor no futuro sem reescrever o domínio financeiro inteiro.
16. Três novas regras de negócio foram registradas em revisões anteriores (seções 41–43): prazo de transferência de ingresso configurável por evento com aceite do destinatário (seção 41, **implementado**), cancelamento de compra em até 7 dias (direito de arrependimento, exige página de Políticas — não implementado, depende de checkout), e um produto pago de "ingresso com cancelamento flexível" (10% adicional revertido inteiramente à plataforma, nunca ao organizador — não implementado, depende de checkout).

## 41. Transferência de ingresso — prazo configurável + aceite do destinatário (implementado)

**Implementado.** O organizador liga/desliga transferência por evento (`Evento.transferivel: bool`) e, opcionalmente, configura até quanto tempo antes do início um ingresso ainda pode ser transferido (`Evento.prazoTransferenciaHoras: int?`, `null` = sem limite adicional — só a trava base abaixo se aplica). Na tela de configurações do evento (`/eventos/[id]/detalhes`) isso aparece como um seletor de **dias ou horas** antes do evento (ex: "até 7 dias antes", "até 48 horas antes"); a UI converte para horas, que é como fica salvo.

- **Trava base, sempre ativa mesmo sem `prazoTransferenciaHoras` configurado**: um ingresso nunca pode ser transferido depois que o evento já começou (`agora >= evento.data`), independente de haver um prazo específico configurado. Bug corrigido nesta revisão — antes, `prazoTransferenciaHoras: null` era interpretado como "sem trava nenhuma", permitindo transferir um ingresso durante ou depois do evento; agora `null` significa só "sem trava *adicional* antes do início", nunca "sem trava". Ver `TicketsService.iniciarTransferencia` (`apps/api/src/tickets/tickets.service.ts`).
- **Fluxo de transferência exige aceite do destinatário** — não é instantâneo. `POST /tickets/:ticketId/transferir` só marca o ingresso como `status: "aguardando_aceite"` e grava `Ingresso.destinatarioTransferenciaEmail`; `Ingresso.compradorEmail` (dono atual) **não muda** nesse momento. O destinatário precisa **já ter conta cadastrada** na plataforma (resolve a pendência de produto que existia aqui: decidido que não é um email qualquer).
  - `POST /tickets/:ticketId/aceitar` (só o destinatário, checado por email) — só aqui `compradorEmail`/`compradorNome`/`compradorDocumento` mudam de fato, e o `qrToken` é **regerado** (o QR antigo, que ainda estava com quem enviou, deixa de valer). Dispara o mesmo email de confirmação com PDF anexado que a emissão normal envia.
  - `POST /tickets/:ticketId/recusar` (só o destinatário) e `POST /tickets/:ticketId/transferir/cancelar` (só quem enviou) — os dois têm o mesmo efeito: o ingresso volta para `status: "valido"` com o remetente original, sem mexer no `qrToken` (nunca chegou a mudar de dono).
  - Enquanto `status === "aguardando_aceite"`: o ingresso não pode ser usado no check-in (`IngressoAguardandoAceiteException`) nem cancelado via self-service (mesma exceção) — só as ações de aceitar/recusar/cancelar-transferência acima têm efeito. Isso existe pra impedir que o remetente ainda use o ingresso depois de já ter transferido a titularidade, e evita cancelamento self-service no meio de uma transferência pendente.
  - Frontend: popup de confirmação antes de enviar a transferência (mostra destinatário + aviso de que fica bloqueada até aceite), e uma tela dedicada em "Meus ingressos" tanto para quem enviou (ver status pendente + cancelar) quanto para quem recebe (seção "Transferências recebidas", aceitar/recusar).
- Validação do prazo (e da trava base) é sempre no back-end, no momento da tentativa de transferência — nunca confiar em um botão desabilitado no front como única proteção.

## 42. Cancelamento de compra — direito de arrependimento (7 dias) e página de Políticas

Regra de negócio registrada (não implementada): por política da plataforma, o comprador só pode solicitar o cancelamento/reembolso de uma compra de ingresso em **até 7 dias corridos após a compra** — janela que espelha o direito de arrependimento do art. 49 do CDC para compras feitas fora do estabelecimento físico (o que se aplica a compras online no Brasil). Depois desse prazo, o cancelamento deixa de ser um direito automático do comprador (pode ainda existir a critério do organizador/plataforma, mas não é mais garantido).

- **Isso é uma política de comprador em uma compra normal (self-service, com pagamento)** — diferente do cancelamento que o organizador já faz hoje pela tela de Participantes (`PATCH /events/:id/ingressos/:ticketId/status`), que é uma ação do organizador sobre qualquer ingresso emitido manualmente, sem essa janela de 7 dias (não existe "compra" de verdade nesse fluxo, é emissão direta).
- **Falta criar a página de Políticas** (conteúdo legal/institucional — termos de cancelamento, reembolso, e o que mais for necessário) — registrada aqui como pendência explícita, ver [11-roadmap.md](11-roadmap.md). Ainda não decidido: rota (`/politicas`? `/termos`?), se é uma página estática ou vem de CMS/banco, e se precisa de aceite explícito no cadastro/checkout.
- Essa janela de 7 dias só passa a ter efeito prático quando existir checkout self-service de verdade (ver seção 4) — hoje não há "compra" para cancelar dentro de um prazo, só emissão manual pelo organizador.
- Quando o checkout existir, a janela dos 7 dias precisa ser validada no back-end contra a data real do pagamento (`Transacao.criadoEm` ou equivalente), nunca confiada só à UI, e precisa decidir sua interação com a máquina de estados de pagamento (seção 15) — provavelmente `CONFIRMED → REFUNDED` dentro da janela, negado fora dela salvo exceção do organizador/admin.
- **Decisão de produto confirmada: a taxa de serviço (os 12% — ver [09-modelo-financeiro.md](09-modelo-financeiro.md)) nunca é reembolsada, mesmo dentro dos 7 dias.** Só o valor do ingresso em si (`valorBruto` menos a taxa) é elegível a reembolso. Isso vale igual pro cancelamento dentro do prazo padrão de 7 dias e pro cancelamento via ingresso flexível (seção 43) — nos dois casos, `valorEstornado` (seção 3) deve excluir a taxa de serviço, nunca devolvê-la.

## 43. Ingresso com cancelamento flexível — produto pago (10%, revertido só à plataforma)

Regra de produto registrada (não implementada): no momento da compra, o comprador poderá optar por um ingresso com **cancelamento flexível** — cancelável até um prazo bem mais curto que o normal (ex: até 1 minuto antes do horário de início do evento, valor ilustrativo a confirmar como decisão de produto) — pagando, além da taxa de serviço normal, um adicional de **10% sobre o valor total (ingresso + taxa)**.

- **Esse adicional de 10% é receita da plataforma, ponto final — nunca é dividido com o organizador, nunca passa pelo `AcordoComercial`** (seção 17 de [09-modelo-financeiro.md](09-modelo-financeiro.md) só divide os 12% de taxa de serviço normal; este é um valor conceitualmente separado, uma espécie de prêmio de flexibilidade que o comprador paga à plataforma por um direito de cancelamento maior do que o padrão). Isso precisa de um campo próprio no domínio financeiro (ex: `valorFlexibilidade`/`flexibleCancellationFee`, distinto de `taxaPlataforma` — ver seção 3) para não se misturar com a taxa de serviço nos relatórios e no ledger (seção 18).
- Efeito em GMV vs. receita da plataforma (seção 2): o adicional de 10% entra no `valorBruto` pago pelo comprador (GMV), mas 100% dele vira `Platform Revenue` — nunca `Organizer Payable`. É um dos poucos casos em que a plataforma fica com mais que a taxa de serviço padrão sobre uma transação, então relatórios (painel financeiro do organizador e Central Financeira do Admin — seções 22 e 24) precisam mostrar essa parcela separadamente, para o organizador nunca estranhar "por que a taxa retida foi maior que 12% desta venda".
- Interage com a seção 42 (cancelamento em 7 dias): esta é uma opção **paga** que estende o direito de cancelamento além do padrão (até perto do evento), não um substituto da janela gratuita de 7 dias — as duas regras convivem: dentro dos 7 dias, cancelamento é sempre possível (ingresso normal ou flexível); depois dos 7 dias, só quem pagou o adicional de flexibilidade continua podendo cancelar (até o prazo curto configurado).
- **Decisão de produto confirmada: nem a taxa de serviço normal, nem o adicional de 10% de flexibilidade são reembolsáveis ao cancelar.** O adicional de 10% é o preço da opcionalidade em si (pagou pelo direito de poder cancelar até perto do evento — o direito foi exercido, não faria sentido devolver o que se pagou por ele), e a taxa de serviço segue a mesma regra do cancelamento padrão (seção 42). Só o valor do ingresso (`valorBruto` menos taxa de serviço menos adicional de flexibilidade) é elegível a reembolso. Fica pendente só como comportam-se se o evento for cancelado pelo organizador (cenário já listado como pendente na tabela da seção 39 — esse é um caso diferente de o comprador cancelar por vontade própria).
- Depende inteiramente de checkout self-service existir (seção 4) — sem pagamento de verdade, não há "adicional de 10%" para cobrar.
