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

## Ponto de atenção tributário

**Validar com contador/advogado tributário antes do lançamento — isso não é uma decisão de arquitetura.** O racional de mercado é que, ao usar split real na liquidação (o dinheiro nunca "entra" inteiro na conta da NOVYX), cada parte tributa apenas o que efetivamente recebe — o organizador tributa a receita do ingresso, a NOVYX tributa só a taxa de serviço — evitando a bitributação que ocorreria se 100% do valor passasse pela conta da NOVYX antes do repasse manual. Isso também é relevante porque a Reforma Tributária brasileira (IBS/CBS) está introduzindo seu próprio mecanismo de "split payment" para tributos no pagamento eletrônico, com cronograma de transição já em andamento em 2026 — vale acompanhar isso com o time contábil ao definir a integração fiscal final.
