# Plataforma de Ingressos — Resumo do Produto
### Produto próprio da NOVYX (primeiro produto do portfólio, estilo "Alphabet")

> **Nome da marca**: o produto se chama **RARO Tickets**. NOVYX é só a empresa dona da plataforma — não aparece pro usuário final dentro do produto (título, header, telas), só em contextos institucionais. Este documento usa "Plataforma de Ingressos NOVYX" como referência interna/de arquitetura; ver [docs/frontend/design-system.md](../frontend/design-system.md) para a marca voltada ao usuário.

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

### 3.8 Painel do admin geral do sistema (NOVYX)
- Tela separada da administração do evento — é o **superadmin da plataforma como um todo**
- Liga/desliga features do sistema (feature flags): ex: desativar temporariamente a geração de parciais por e-mail, ou lançar uma feature nova só para eventos selecionados
- Configuração comercial (split de taxa de serviço por organizador — ver [docs/architecture/09-modelo-financeiro.md](../architecture/09-modelo-financeiro.md))
- Também é onde, no futuro, dá pra colocar: monitoramento de uso, saúde do sistema, gestão de todos os eventos/organizadores cadastrados

---

## 4. Entidades principais (visão de dados, alto nível)

- **Evento** → tem Lotes, Links de venda, Papéis de acesso (Gestor/View)
- **Ingresso** → pertence a um Evento e um Lote, tem status (válido/usado/cancelado), QR code único, flag de transferível ou não
- **Lista Off** → CPFs vinculados a um Evento, com status de uso
- **Link de venda** → rastreia origem da venda, usado para gerar parcial segmentada
- **Usuário** → pode ser Organizador, Gestor, View, Operador de check-in, ou Admin geral
- **Transação** → registro de pagamento (ou gratuidade) vinculado a um Ingresso

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
