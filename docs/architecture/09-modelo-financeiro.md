[← Voltar ao índice](README.md)

# Modelo financeiro: split, repasse ao organizador e taxa de serviço

Requisito de negócio, validado contra o modelo que a Sympla já usa em produção (referência de mercado):

- A NOVYX **sempre retém 12%** de cada venda — taxa fixa, não é negociável por transação (garante a margem da plataforma e mantém o split simples e auditável).
- O dinheiro da venda vai para a conta bancária do **organizador**, com repasse alguns dias **após o evento** (proteção contra cancelamento/chargeback — mais conservador que o D+3 "da venda" que a Sympla usa, porque nosso requisito é segurar até o evento acontecer).
- Como incentivo comercial, o **admin geral pode devolver parte dos 12% retidos** para um organizador específico — isso é tratado como um repasse adicional à parte, não como uma alteração da taxa cobrada na transação.

## Desenho técnico (mesmo padrão da Sympla, usando o split nativo do Asaas por baixo dos panos)

- Igual à Sympla, o organizador cadastra os dados bancários **dentro do próprio onboarding da NOVYX** (documento do titular + conta de repasse) — ele não precisa saber que existe um Asaas por trás. Esse cadastro dispara a criação de uma **subconta Asaas** via API, vinculada ao `Usuario` organizador (`asaas_subconta_id`).
- No momento da cobrança, o `checkout` envia o **split** fixo: 88% para a subconta do organizador, 12% retido na conta principal da NOVYX. O dinheiro não passa contabilmente pela conta da NOVYX como receita bruta — cada parte só recebe (e reconhece como receita) o que é efetivamente seu (ver nota tributária abaixo).
- **Quem paga a taxa na prática** (igual à Sympla): opção por evento — cobrar os 12% somados ao preço do ingresso (o comprador paga) ou absorvidos pelo organizador (descontados do repasse). Essa escolha não muda o valor fixo de 12% retido pela NOVYX, só onde ele é descontado.
- **Repasse pós-evento**: bloqueio programado no split, liberado via API alguns dias depois da data do evento — reduz risco de estorno/chargeback consumir um saldo já repassado.
- **Incentivo comercial (painel de acordo comercial no admin geral)**: em vez de repassar depois, a divisão já sai certa na cobrança — o admin geral configura, por organizador, como os 12% de taxa se dividem entre NOVYX e organizador (ex: 8% NOVYX / 4% organizador), com escopo de **todos os eventos futuros do organizador**, **um evento específico**, ou **os próximos N eventos** (com contador que expira o acordo automaticamente). No momento do checkout, o `checkout` consulta o `AcordoComercial` ativo daquele organizador/evento e monta o split com 3 destinos: valor do ingresso → subconta do organizador; parte do fee → subconta do organizador; parte do fee → conta da NOVYX. Assim a NOVYX **nunca chega a receber** a fatia que ficou com o organizador — evita o problema tributário de dinheiro "passar" pela conta da NOVYX e depois ser devolvido (ver nota tributária abaixo), e casa com o mesmo racional de split-na-liquidação acima.
  - `AcordoComercial` (id, organizador_id, evento_id opcional, percentual_novyx, percentual_organizador — os dois somam os 12% da taxa —, escopo: todos_eventos | evento_especifico | proximos_n_eventos, eventos_restantes opcional, ativo, definido_por_admin_id, criado_em)
  - Painel do admin geral (módulo `admin`, ver [03-modulos-backend.md](03-modulos-backend.md)) lista organizadores e permite criar/editar esses acordos.

## Status de implementação

O racional acima (12% fixos, `AcordoComercial` só divide esses 12% entre NOVYX e organizador, `taxaPagaPor` decide só onde a taxa é descontada) já está implementado em `FinanceService.buscarResumoFinanceiro` (`apps/api/src/finance/finance.service.ts`) e exposto em `GET /events/:id/financeiro/resumo`, consumido pelas telas `/eventos/[id]` (mini painel) e `/eventos/[id]/financeiro` (painel completo) — ver [docs/implementation/README.md](../implementation/README.md). `vendasBrutas` reflete o volume real da transação (incluindo o acréscimo pago pelo comprador quando `taxaPagaPor: "comprador"`), e `vendaLiquida = vendasBrutas - taxaRetidaPelaNovyx` é sempre menor que `vendasBrutas`, exceto no caso extremo de um acordo devolver a taxa inteira ao organizador.

O que **não** está implementado: o checkout/gateway de pagamento (Asaas) descrito no resto deste documento — split real, subconta por organizador, repasse pós-evento — é só desenho ainda. Hoje o resumo financeiro é uma leitura agregada de ingressos emitidos manualmente, sem dinheiro de verdade envolvido. Também não existe nenhum endpoint ou tela para criar/editar um `AcordoComercial` — o `FinanceService` já sabe aplicá-lo se um existir no banco, mas cadastrá-lo hoje exige inserir a linha direto via Prisma Studio (ver [04-modelo-de-dados.md](04-modelo-de-dados.md) e [11-roadmap.md](11-roadmap.md)).

## Adicional de cancelamento flexível (produto pago, fora do split de 12%)

Registrado como regra de negócio futura em [12-pagamentos-e-repasses.md#43](12-pagamentos-e-repasses.md#43-ingresso-com-cancelamento-flexível--produto-pago-10-revertido-só-à-plataforma): um ingresso com opção de cancelamento flexível cobra um adicional de 10% sobre ingresso+taxa que fica **inteiro com a plataforma**, sem passar pelo `AcordoComercial` nem pelo split de 12% descrito acima — é um valor conceitualmente separado da taxa de serviço, não implementado ainda (depende de checkout self-service).

## Programa de indicação (referral) — ideia registrada, não implementada

Ideia de crescimento por indicação, ainda **não implementada** (só documentada aqui para não se perder — depende do checkout self-service, igual ao resto deste documento):

- Qualquer usuário cadastrado (não precisa ser organizador) pode gerar seu próprio **link de indicação**. Não há limite de quantos organizadores um usuário pode indicar através dele.
- Ao criar o link de indicação pela primeira vez, o usuário indicador cadastra sua **conta de repasse** (mesmo fluxo que o organizador já usa hoje — ver seção acima) — é para essa conta que os valores de indicação são enviados.
- Quando um novo organizador se cadastra usando o link de alguém, essa relação **indicador ↔ organizador indicado** fica registrada permanentemente (o organizador só pode ter sido indicado por uma pessoa, mas um indicador pode indicar quantos organizadores quiser).
- Sempre que o organizador indicado realizar um **evento pago** (eventos gratuitos — sem cobrança de ingresso — não contam para isso), o indicador recebe uma fatia fixa da taxa de 12% que a NOVYX reteria:
  - **1%** no primeiro evento pago do organizador indicado.
  - **0,25%** em todos os eventos pagos seguintes desse organizador, **para sempre** (não expira).
- Esse repasse ao indicador reduz apenas a fatia que ficaria com a **NOVYX**, nunca a fatia do organizador indicado. Exemplo sem nenhum `AcordoComercial` ativo: no primeiro evento pago do indicado, a NOVYX fica com 11% e o indicador com 1%; nos eventos seguintes, 11,75%/0,25%.
- **Interação com `AcordoComercial` não decidida ainda**: os dois mecanismos dividem a mesma fatia de 12% que caberia à NOVYX (um por acordo comercial com o organizador, outro por indicação) — se são cumulativos, e em que ordem se aplicam quando os dois existem ao mesmo tempo para o mesmo organizador, precisa ser definido quando isso for desenhado de verdade.
- O admin geral da plataforma já pode configurar (via `AcordoComercial`) que organizadores recebam parte da taxa — esse mecanismo de indicação é independente disso, layer adicional sobre o mesmo split de 12%.
- Peças que faltariam construir: uma entidade nova (ex.: `Indicacao`) ligando indicador ↔ organizador indicado com um código/link único por usuário; um jeito de saber se um evento é o "primeiro evento pago" do organizador indicado (pra aplicar 1% vs 0,25%); e inclusão automática da conta de repasse do indicador como um terceiro destino no split do checkout — tudo isso depende do checkout self-service via Asaas (seção acima), que ainda não existe.

## Ponto de atenção tributário

**Validar com contador/advogado tributário antes do lançamento — isso não é uma decisão de arquitetura.** O racional de mercado é que, ao usar split real na liquidação (o dinheiro nunca "entra" inteiro na conta da NOVYX), cada parte tributa apenas o que efetivamente recebe — o organizador tributa a receita do ingresso, a NOVYX tributa só a taxa de serviço — evitando a bitributação que ocorreria se 100% do valor passasse pela conta da NOVYX antes do repasse manual. Isso também é relevante porque a Reforma Tributária brasileira (IBS/CBS) está introduzindo seu próprio mecanismo de "split payment" para tributos no pagamento eletrônico, com cronograma de transição já em andamento em 2026 — vale acompanhar isso com o time contábil ao definir a integração fiscal final.
