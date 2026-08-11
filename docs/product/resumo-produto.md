# Plataforma de Ingressos — Resumo do Produto
### Produto próprio da NOVYX (primeiro produto do portfólio, estilo "Alphabet")

> **Nome da marca**: a plataforma voltada ao usuário se chama **RARO Tickets**. A Novyx é citada na interface apenas no copyright do rodapé, como proprietária da plataforma. Consulte [docs/frontend/design-system.md](../frontend/design-system.md) para a identidade visual atual.

---

## 1. Visão geral

Plataforma de venda e gestão de ingressos para eventos, com foco em **controle operacional para o organizador** (check-in, antifraude, relatórios em tempo real) e **flexibilidade de acesso** (equipe, promoters, listas especiais). O diferencial não é só vender ingresso — é dar ao organizador uma central de comando completa do evento, com governança de quem pode fazer o quê.

---

## 2. Personas

| Persona | Papel |
|---|---|
| **Organizador/Dono do evento** | Cria o evento, define lotes, convida equipe, acompanha vendas |
| **Gestor convidado** | Acesso de edição a um evento específico (convidado pelo organizador) |
| **Visualizador (view-only)** | Só acompanha números/relatórios, sem poder editar |
| **Operador de check-in** | Usa a câmera para validar QR code na entrada |
| **Comprador/Convidado** | Compra ou recebe ingresso, apresenta QR code |
| **Admin geral do sistema (NOVYX)** | Superusuário — liga/desliga features da plataforma como um todo, não de um evento específico |

---

## 3. Módulos e funcionalidades

### 3.1 Gestão de evento
- Criação de evento (data, local, lotes, tipos de ingresso, preços)
- Múltiplos **links de venda** por evento (ex: um link por promoter/vendedor externo)
- Compartilhamento do evento com outras pessoas por papel: **gestor** (edita), **view** (só visualiza), outros níveis que fizerem sentido depois (ex: operador de check-in)

### 3.2 Lista off (acesso por CPF)
- Cadastro de convidados que entram **sem ingresso emitido**, validados só pelo CPF na entrada
- Uso típico: cortesias, imprensa, staff, parceiros
- Precisa de: campo de busca rápida por CPF no check-in, e um limite/status (usado/não usado) pra evitar que a mesma pessoa "entre" duas vezes com o mesmo CPF

### 3.3 Ingressos gratuitos com QR code
- Geração de ingresso sem cobrança, com QR code único
- Mesmo fluxo de validação do ingresso pago (mesma tela de check-in)

### 3.4 Parciais e relatórios
- **Exportação de parcial via CSV** (vendas até o momento, por lote, por link)
- **Envio automático por e-mail** da parcial de vendas **separada por link** — importante para prestação de contas com promoters/vendedores externos (cada um recebe só o dele, ou o organizador recebe o consolidado)
- Sugestão: permitir agendar o envio (ex: parcial diária às 18h) além do sob demanda

### 3.5 Check-in via câmera (leitura de QR code)
- App/tela com acesso à câmera do dispositivo (celular ou tablet) para ler o QR code na entrada
- Validação em tempo real: ingresso válido / já utilizado / inválido
- **Decisão de arquitetura**: a validação é sempre online, sem modo offline — ver [docs/architecture/07-app-checkin.md](../architecture/07-app-checkin.md) para o racional

### 3.6 Venda de ingresso reservado (PDV / balcão)
- "Local para vender ingresso já comprado" → interpretando como um **ponto de venda presencial** onde a equipe confirma/finaliza uma reserva feita antes (ex: alguém reservou por WhatsApp e paga na entrada), ou reemite/reimprime um ingresso já pago
- Vale confirmar o cenário exato: é (a) finalizar uma reserva pré-feita, ou (b) vender um ingresso novo presencialmente? Os dois têm fluxos diferentes — se for os dois, melhor desenhar como duas telas separadas no PDV

### 3.7 Trava de transferência de ingresso
- Por padrão, ingresso **não pode ser repassado** para outro CPF/e-mail depois de emitido
- Isso é a principal arma antifraude/anticâmbio (evita revenda não autorizada — o "cambismo digital")
- Configurável por evento (o organizador decide se permite transferência ou não), em vez de travado globalmente — dá flexibilidade comercial sem perder a feature como diferencial
- **Extensão registrada, ainda não implementada**: além de ligar/desligar, o organizador poderá configurar até quanto tempo antes do evento a transferência ainda é permitida (ex: até 24h antes) — ver [docs/architecture/12-pagamentos-e-repasses.md#41](../architecture/12-pagamentos-e-repasses.md#41-transferência-de-ingresso--prazo-configurável-pelo-organizador)

### 3.8 Painel do admin geral do sistema (NOVYX)
- Tela separada da administração do evento — é o **superadmin da plataforma como um todo**
- Liga/desliga features do sistema (feature flags): expansão futura; o modelo existe, mas essa parte ainda não tem UI
- Configuração comercial já implementada: parcela da taxa para o organizador para sempre, nos próximos X eventos pagos ou em evento específico, limitada automaticamente pelo programa de indicação — ver [docs/architecture/09-modelo-financeiro.md](../architecture/09-modelo-financeiro.md)
- Também é onde, no futuro, dá pra colocar: monitoramento de uso, saúde do sistema, gestão de todos os eventos/organizadores cadastrados

### 3.9 Política de cancelamento e página de Políticas
- Regra de negócio registrada, **página ainda não criada**: o comprador pode cancelar uma compra em até 7 dias corridos após a compra (direito de arrependimento, análogo ao art. 49 do CDC para compras online)
- Precisa de uma página de Políticas pública expondo essa e outras regras — ver [docs/architecture/12-pagamentos-e-repasses.md#42](../architecture/12-pagamentos-e-repasses.md#42-cancelamento-de-compra--direito-de-arrependimento-7-dias-e-página-de-políticas)
- Só passa a valer na prática quando existir checkout self-service (hoje não existe "compra" para cancelar dentro de um prazo, só emissão manual pelo organizador)

### 3.10 Ingresso com cancelamento flexível (produto pago, não implementado)
- Opção no momento da compra: pagar um adicional de **10% sobre ingresso + taxa**, revertido inteiramente à plataforma (nunca ao organizador), em troca de poder cancelar até bem perto do evento (ex: 1 minuto antes)
- Detalhamento financeiro completo em [docs/architecture/12-pagamentos-e-repasses.md#43](../architecture/12-pagamentos-e-repasses.md#43-ingresso-com-cancelamento-flexível--produto-pago-10-revertido-só-à-plataforma)

### 3.11 Lote especial (privado) com cupom protegido por senha
- Regra de negócio registrada, não implementada: o organizador cria um lote marcado como especial/privado, e um cupom especial vinculado protegido por senha — o comprador digita a senha num popup para desbloquear a compra desses ingressos
- Detalhes em [docs/architecture/04-modelo-de-dados.md](../architecture/04-modelo-de-dados.md) e [docs/architecture/11-roadmap.md](../architecture/11-roadmap.md)

### 3.12 Programa de indicação e negociação com organizadores
- Qualquer usuário pode cadastrar uma conta de recebimento, criar links ilimitados e indicar organizadores ilimitados
- Cada link negocia um benefício permanente de **0% a 2%** da taxa para o novo organizador
- O indicador recebe **1% no primeiro evento pago** e **0,25% nos seguintes, para sempre**; evento gratuito não conta
- O indicador recebe também 25% da parcela dos 2% que não concedeu ao organizador. Exemplo: concedeu 1%, então ganha bônus de 0,25%
- O vínculo é criado no registro, aceita apenas um indicador original por conta e mantém o percentual da oferta daquele momento
- O acordo concedido pelo ADMIN é independente e cumulativo. O motor central impede que a soma ultrapasse os 12% da taxa
- Cadastro, links, painel e estimativas já estão implementados; pagamento real aguarda checkout/gateway. Regra completa em [docs/architecture/09-modelo-financeiro.md](../architecture/09-modelo-financeiro.md)

---

## 4. Entidades principais (visão de dados, alto nível)

- **Evento** → tem Lotes, Links de venda, Papéis de acesso (Gestor/View)
- **Ingresso** → pertence a um Evento e um Lote, tem status (pendente/válido/usado/cancelado — "pendente" é reservado para quando existir checkout assíncrono, ainda não produzido por nenhum fluxo hoje), QR code único, flag de transferível ou não
- **Lista Off** → CPFs vinculados a um Evento, com status de uso
- **Link de venda** → rastreia origem da venda, usado para gerar parcial segmentada
- **Usuário** → pode ser Organizador, Gestor, View, Operador de check-in, ou Admin geral
- **Transação** → registro de pagamento (ou gratuidade) vinculado a um Ingresso
- **Programa/Oferta/Indicação/Comissão** → conta do indicador, negociação por link, vínculo permanente com o indicado e ledger futuro por transação

Modelo de dados completo (com RBAC por evento, split financeiro e auditoria) em [docs/architecture/04-modelo-de-dados.md](../architecture/04-modelo-de-dados.md).

---

## 5. Pontos de atenção antifraude (dado o perfil "premium/segurança" da NOVYX)
- QR code deve ser assinado/validado no back-end, não só decodificado no app (evita QR falsificado)
- Um QR só pode ser validado **uma vez** — segunda leitura tem que barrar visivelmente ("já utilizado às HH:MM")
- CPF na lista off: considerar limitar tentativas de busca pra evitar varredura de CPFs válidos
- Log de auditoria de quem fez check-in, quando, e de qual dispositivo — útil em disputa

---

## 6. Monólito ou microsserviço no início?

**Decisão: monólito modular.** Ver o racional completo e o desenho técnico em [docs/architecture/README.md](../architecture/README.md).

Resumo: comecem monólito, mas organizado como se um dia fosse virar vários serviços. Migrar para microsserviço é uma decisão de quando a dor de escala for real e específica — não uma decisão de dia 1. Os módulos de compra/pagamento e de check-in/QR já nascem com fronteiras internas rígidas para facilitar essa extração futura, se necessário.
