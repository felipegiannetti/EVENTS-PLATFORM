[← Voltar ao índice](README.md)

# Modelo financeiro: split, repasse ao organizador e taxa de serviço

Requisito de negócio, validado contra o modelo que a Sympla já usa em produção (referência de mercado):

- A taxa de serviço total é **sempre 12%** de cada venda. A cobrança não aumenta quando há acordo ou indicação; esses mecanismos apenas distribuem os mesmos 12% entre as partes.
- O dinheiro da venda vai para a conta bancária do **organizador**, com repasse alguns dias **após o evento** (proteção contra cancelamento/chargeback — mais conservador que o D+3 "da venda" que a Sympla usa, porque nosso requisito é segurar até o evento acontecer).
- Como incentivo comercial, o **admin geral pode devolver parte dos 12% retidos** para um organizador específico — isso é tratado como um repasse adicional à parte, não como uma alteração da taxa cobrada na transação.

## Desenho técnico (mesmo padrão da Sympla, usando o split nativo do Asaas por baixo dos panos)

- Igual à Sympla, o organizador cadastra os dados bancários **dentro do próprio onboarding da NOVYX** (documento do titular + conta de repasse) — ele não precisa saber que existe um Asaas por trás. Esse cadastro dispara a criação de uma **subconta Asaas** via API, vinculada ao `Usuario` organizador (`asaas_subconta_id`).
- No momento da cobrança, o `checkout` deverá enviar um **split dinâmico** calculado pelo motor central: valor-base e benefícios para o organizador, comissão para o indicador quando houver, e parcela residual da taxa para a NOVYX. O dinheiro não passa contabilmente inteiro pela conta da NOVYX como receita bruta — cada parte recebe apenas o que lhe pertence (ver nota tributária abaixo).
- **Quem paga a taxa na prática**: opção por evento — cobrar os 12% somados ao preço do ingresso (o comprador paga) ou absorvidos pelo organizador (descontados do repasse). Essa escolha não muda a taxa total de 12% nem sua distribuição, só onde ela é cobrada.
- **Repasse pós-evento**: bloqueio programado no split, liberado via API alguns dias depois da data do evento — reduz risco de estorno/chargeback consumir um saldo já repassado.
- **Incentivo comercial (painel de acordo comercial no admin geral)**: em vez de repassar depois, a divisão já sai certa na cobrança — o admin geral configura, por organizador, como os 12% de taxa se dividem entre NOVYX e organizador (ex: 8% NOVYX / 4% organizador), com escopo de **todos os eventos futuros do organizador**, **um evento específico**, ou **os próximos N eventos** (com contador que expira o acordo automaticamente). No momento do checkout, o `checkout` consulta o `AcordoComercial` ativo daquele organizador/evento e monta o split com 3 destinos: valor do ingresso → subconta do organizador; parte do fee → subconta do organizador; parte do fee → conta da NOVYX. Assim a NOVYX **nunca chega a receber** a fatia que ficou com o organizador — evita o problema tributário de dinheiro "passar" pela conta da NOVYX e depois ser devolvido (ver nota tributária abaixo), e casa com o mesmo racional de split-na-liquidação acima.
  - `AcordoComercial` (id, organizador_id, evento_id opcional, percentual_novyx, percentual_organizador — os dois somam os 12% da taxa —, escopo: todos_eventos | evento_especifico | proximos_n_eventos, eventos_restantes opcional, ativo, definido_por_admin_id, criado_em)
  - Painel do admin geral (módulo `admin`, ver [03-modulos-backend.md](03-modulos-backend.md)) lista organizadores e permite criar/editar esses acordos.

## Status de implementação

O motor de distribuição dos 12%, o CRUD administrativo de `AcordoComercial` e o programa de indicação já estão implementados. `DistribuicaoTaxaService` centraliza a regra; `FinanceService.buscarResumoFinanceiro` expõe a decomposição completa em `GET /events/:id/financeiro/resumo`; `/admin` permite ao `admin_geral` configurar um acordo; e `/indicacoes` permite ativar o programa, cadastrar a conta e criar ofertas. A `vendaLiquida` considera a parcela residual da plataforma e a comissão estimada do indicador, deixando com o organizador o valor-base do ingresso e as parcelas da taxa que lhe pertencem.

O que **não** está implementado é o checkout/gateway de pagamento (Asaas): split real, subcontas, liquidação, chargeback e repasse pós-evento ainda são desenho. Hoje os valores são estimativas calculadas sobre ingressos pagos emitidos manualmente. `ComissaoIndicacao` já reserva o ledger auditável e idempotente por transação para essa integração futura, mas nenhuma comissão muda para `paga` sem uma transação confirmada pelo gateway.

## Adicional de cancelamento flexível (produto pago, fora do split de 12%)

Registrado como regra de negócio futura em [12-pagamentos-e-repasses.md#43](12-pagamentos-e-repasses.md#43-ingresso-com-cancelamento-flexível--produto-pago-10-revertido-só-à-plataforma): um ingresso com opção de cancelamento flexível cobra um adicional de 10% sobre ingresso+taxa que fica **inteiro com a plataforma**, sem passar pelo `AcordoComercial` nem pelo split de 12% descrito acima — é um valor conceitualmente separado da taxa de serviço, não implementado ainda (depende de checkout self-service).

## Programa de indicação (referral) — implementado no produto, aguardando liquidação real

- Qualquer usuário cadastrado pode ativar o programa em `/indicacoes`. Na ativação, confirma a senha e cadastra a conta bancária que receberá as futuras comissões; os dados sensíveis são criptografados no banco.
- Um indicador pode criar **ofertas ilimitadas** e indicar **organizadores ilimitados**. Cada oferta gera um código aleatório e pode negociar uma porcentagem diferente para o novo organizador.
- A oferta define um benefício permanente entre **0% e 2%** para o organizador indicado. A porcentagem é copiada para `Indicacao` no cadastro, portanto alterar ou desativar a oferta depois não muda relações já formadas.
- O vínculo nasce exclusivamente no registro por `/registro?ref=CODIGO`, é permanente, e cada conta indicada aceita no máximo um indicador original. Não há atribuição retroativa.
- Eventos gratuitos não entram em nenhuma contagem. Para eventos pagos, o indicador recebe **1% no primeiro evento pago** do organizador e **0,25% em todos os seguintes, para sempre**.
- Se negociar menos de 2% para o organizador, o indicador recebe ainda **25% da parte não concedida**: `bonusIndicador = (2% - beneficioOrganizador) × 25%`. Exemplo: benefício de 1% deixa 1% não concedido; o bônus é 0,25%. Nesse caso, o indicador recebe 1,25% no primeiro evento e 0,50% nos seguintes.
- O benefício negociado é do organizador; a comissão-base e o bônus são do indicador. O organizador não recebe a comissão do programa e o indicador não assume o acordo comercial do ADMIN.

### Convivência com o acordo do ADMIN

Os mecanismos são cumulativos e independentes dentro dos mesmos 12%:

`12% = acordo ADMIN para organizador + benefício referral para organizador + base do indicador + bônus do indicador + parcela líquida da plataforma`

O ADMIN pode conceder uma parcela para sempre, aos próximos N eventos pagos ou a um evento específico. Ao salvar, a API calcula o máximo seguro considerando o pior caso do referral — o primeiro evento, quando a base do indicador é 1% — e rejeita qualquer acordo que faça a soma ultrapassar 12%. Eventos gratuitos também não consomem o contador de “próximos N”. Um novo acordo ativo desativa o anterior, preservando o histórico e registrando a ação em `AuditLog`.

Exemplo com benefício referral de 1% e acordo ADMIN de 4%:

| Destino | Primeiro evento pago | Eventos seguintes |
|---|---:|---:|
| Organizador — acordo ADMIN | 4,00% | 4,00% |
| Organizador — benefício referral | 1,00% | 1,00% |
| Indicador — base | 1,00% | 0,25% |
| Indicador — bônus | 0,25% | 0,25% |
| Plataforma — residual | 5,75% | 6,50% |
| **Total** | **12,00%** | **12,00%** |

O painel do indicador e o resumo do evento deixam os números como **estimativas**. Quando o gateway existir, cada `Transacao` confirmada deverá gerar uma `ComissaoIndicacao` por chave idempotente e o split terá os destinos do organizador, indicador e plataforma; até lá não existe saldo disponível nem alegação de pagamento.

## Ponto de atenção tributário

**Validar com contador/advogado tributário antes do lançamento — isso não é uma decisão de arquitetura.** O racional de mercado é que, ao usar split real na liquidação (o dinheiro nunca "entra" inteiro na conta da NOVYX), cada parte tributa apenas o que efetivamente recebe — o organizador tributa a receita do ingresso, a NOVYX tributa só a taxa de serviço — evitando a bitributação que ocorreria se 100% do valor passasse pela conta da NOVYX antes do repasse manual. Isso também é relevante porque a Reforma Tributária brasileira (IBS/CBS) está introduzindo seu próprio mecanismo de "split payment" para tributos no pagamento eletrônico, com cronograma de transição já em andamento em 2026 — vale acompanhar isso com o time contábil ao definir a integração fiscal final.
