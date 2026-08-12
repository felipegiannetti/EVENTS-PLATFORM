[← Voltar à documentação](../README.md)

# Implementação

Documentação do que já foi **construído** (código real), como complemento à [arquitetura](../architecture/README.md) (que é o desenho, definido antes de escrever código). Atualizado a cada módulo novo.

## Como rodar localmente

O procedimento atualizado, incluindo a porta `5433` do PostgreSQL e os comandos separados para API e frontend, está em [desenvolvimento-local.md](desenvolvimento-local.md).

```bash
pnpm install
docker compose up -d postgres # sobe o Postgres local na porta externa 5433
pnpm --filter api exec prisma migrate dev
pnpm --filter api dev         # terminal 1: API na porta 3000
pnpm --filter web dev         # terminal 2: web na porta 3001
```

A API sobe em `http://localhost:3000` (porta configurável via `API_PORT` no `.env`, copiado de `.env.example`).

## Estrutura implementada

Segue o padrão descrito em [docs/architecture/03-modulos-backend.md](../architecture/03-modulos-backend.md), com as camadas Controller → DTO → Mapper → Service → Repository → Model em cada módulo de `apps/api/src/`, mais as camadas transversais `security/` (guards/strategies/decorators de auth e RBAC), `common/` (filtro global de exceção + interceptors) e `infra/prisma/` (único ponto que fala com o Prisma).

**Convenção**: dentro de um módulo, os arquivos são organizados por **camada** (`model/`, `repository/`, `mapper/`, `dto/`, `exceptions/`), não por entidade — ex: `events/model/` guarda `evento.model.ts`, `lote.model.ts`, `link-venda.model.ts` e `papel-acesso.model.ts` juntos. Optamos por isso em vez de uma pasta por entidade (`events/lote/{model,repository,mapper}.ts`) porque o Service de cada módulo já orquestra várias entidades na mesma operação (ex: criar evento também cria o `PapelAcesso` de owner), e hoje nenhum módulo passa de ~4 entidades — o ganho de "tudo de uma entidade junto" só compensaria o custo de mais um nível de pastas se um módulo crescesse bem mais que isso. Se algum módulo futuro (ex: `admin`) crescer muito, vale reconsiderar pasta-por-entidade só ali.

## Referência da API

### Auth (`apps/api/src/auth/`)

| Rota | Descrição |
|---|---|
| `POST /auth/register` | Cria usuário (senha com argon2id) e já retorna sessão logada (auto-login). Pede `tipoPessoa` (`fisica`/`juridica`), `documento`, `dataNascimento` quando PF e **`telefone`** (obrigatório). Aceita `codigoIndicacao` opcional: valida uma oferta ativa e cria na mesma transação o vínculo permanente com indicador e snapshot do benefício negociado |
| `POST /auth/login` | Valida email/senha (rate limit: 5/min), retorna access + refresh token |
| `POST /auth/refresh` | Rotaciona o refresh token (janela deslizante de 90 dias); reuso de token já revogado derruba toda a sessão |
| `POST /auth/logout` | Revoga o refresh token atual |
| `GET /auth/google` | Redireciona pro consentimento do Google (Passport `passport-google-oauth20`) |
| `GET /auth/google/callback` | Callback do Google — find-or-create-or-link por `googleId`/email, seta o cookie de refresh e redireciona pro front (`/entrar-google?accessToken=...`). Ver [11-roadmap.md](../architecture/11-roadmap.md#login-com-google-oauth2--implementado-precisa-de-credenciais-reais) |
| `GET /auth/me` | Retorna o perfil do usuário logado, incluindo `telefone` e `usaGoogle` (`true` = conta sem senha própria, criada via Google) |
| `PATCH /auth/me` | Atualiza dados de perfil (nome, dataNascimento, **telefone** — via `AtualizarPerfilDto`) |
| `PATCH /auth/me/email` | Troca o email da conta; exige `senhaAtual` no corpo pra confirmar. `409 CONTA_SEM_SENHA` pra conta Google (sem senha pra confirmar) |
| `PATCH /auth/me/senha` | Troca a senha; exige `senhaAtual` + `novaSenha`. Mesmo `409` acima pra conta Google |
| `DELETE /auth/me` | Deleta a própria conta (exige `senhaAtual`); bloqueada se o usuário for `owner` de evento ou participar do programa de indicação como indicador/indicado — evita eventos órfãos e quebra de histórico financeiro. Mesmo `409` acima pra conta Google — hoje não existe exclusão self-service pra quem entrou só pelo Google |

Rotas `/auth/me*` ficam em `apps/web/app/perfil/page.tsx` (editar perfil, trocar email/senha, apagar conta).

**Pendência conhecida — CPF/CNPJ "existe de verdade"**: a validação hoje é só matemática (dígito verificador, algoritmo da Receita) — confirma que o número é *bem formado*, não que foi de fato emitido nem que pertence a quem está se cadastrando. Confirmar existência real exigiria uma consulta a um serviço externo (a Receita Federal não tem API pública gratuita pra isso; opções são serviços pagos como SERPRO/Serasa, ou a checagem que o próprio gateway de pagamento faz no onboarding — ver [09-modelo-financeiro.md](../architecture/09-modelo-financeiro.md)). **Decisão do usuário: adiado para depois** — não integrar agora.

Estratégia de sessão completa em [docs/architecture/07-app-checkin.md](../architecture/07-app-checkin.md) *(nota: a decisão de token está documentada na fatia de implementação, não na arquitetura original — ver seção abaixo)*.

**Sessão persistente**: access token JWT de 15 minutos + refresh token opaco (hash SHA-256 no banco) com validade de 90 dias, renovada a cada uso (sliding window) — o usuário só é deslogado automaticamente depois de 90 dias sem abrir o app/site. Web recebe o refresh token em cookie `httpOnly`/`secure`/`sameSite=strict`; mobile recebe no corpo da resposta.

**RBAC**: `Usuario.papelGlobal` (`usuario` | `admin_geral`) checado pelo `RolesGuard`; papel por evento (`owner` | `gestor` | `view` | `checkin_operator`, tabela `PapelAcesso`) checado pelo `EventRoleGuard` — ambos em `apps/api/src/security/guards/`.

### Events (`apps/api/src/events/`)

| Rota | Papel mínimo | Descrição |
|---|---|---|
| `POST /events` | qualquer usuário logado | Cria o evento **por completo**; quem cria vira `owner` (cria `PapelAcesso` automaticamente). Exige `nome`, `data`, `cidade`/`estado`/`pais`, endereço completo (`rua`/`numero`/`bairro`/`cep`, `complemento` opcional) e `categoria`. Aceita `dataFim` opcional (deve ser depois de `data`), `somenteMaioresDeIdade` (classificação 18+, default `false`), `transferivel`, `taxaPagaPor` (`comprador`/`organizador`, default `comprador`), `publicado` (privado/`false` por padrão — não é um evento "incompleto", só ainda não liberado pra compradores), e os campos opcionais `descricao`/`contatoNome`/`contatoEmail`/`contatoTelefone`, todos preenchíveis depois pela etapa 4 do assistente |
| `GET /events` | — | Lista os eventos em que o usuário logado tem algum papel — independente de `publicado` (o organizador sempre vê os próprios eventos, visíveis a compradores ou não) |
| `GET /events/public` | público | Catálogo visto pelos **compradores**; filtra `publicado: true` — um evento privado não aparece aqui mesmo já existindo por completo no banco, com lotes, banner etc. `publicado` é estritamente sobre visibilidade pro comprador, não sobre o evento estar "pronto" |
| `GET /events/public/:id` | público | Detalhe de um evento publicado, sem exigir login — base da página pública `/e/:id` (ver seção Frontend). Não expõe eventos com `publicado: false` |
| `GET /events/public/:id/cupom/:codigo` | público | Valida um código de cupom para aquele evento (existe, está `ativo`) e retorna os dados do cupom para exibir o desconto — usado pelo link de venda com cupom pré-preenchido (`?cupom=CODIGO` em `/e/:id`, ver `urlPublicaEvento` na seção Frontend). Não aplica desconto algum (não existe checkout) — só confirma que o cupom é válido |
| `GET /events/:id` | view+ | Detalhe do evento |
| `PATCH /events/:id` | gestor+ | Atualiza evento — inclusive `publicado` (é assim que o botão "Liberar para compradores"/"Tornar privado" do painel funciona: um `PATCH` simples, sem endpoint dedicado) |
| `GET /events/:id/lotes`, `POST .../lotes`, `PATCH .../lotes/:loteId` | view+ / gestor+ / gestor+ | Lotes do evento. `oculto: true` remove o lote da oferta pública e bloqueia novas reservas, sem apagar ingressos ou impedir emissão manual do organizador |
| `GET /events/:id/links-venda`, `POST .../links-venda` | view+ / gestor+ | Links de venda (slug único por evento) |
| `GET /events/:id/acesso`, `POST .../acesso`, `DELETE .../acesso/:usuarioId` | owner | Gerencia quem tem acesso ao evento e com qual papel. **Não é uma coluna no Evento** — é a tabela relacional `PapelAcesso` (usuário + evento + papel). A resposta inclui `usuarioNome`/`usuarioEmail` e a UI apresenta as pessoas em lista |
| `GET /events/:id/acesso/usuarios?busca=` | owner | Autocomplete de usuários registrados por email; exige ao menos 2 caracteres, limita a 8 resultados e exclui quem já tem acesso |
| `GET /events/:id/cupons`, `POST .../cupons` | view+ / gestor+ | Lista/cria cupom de desconto do evento (`codigo` único por evento, sempre normalizado pra maiúsculo; `tipo`: `percentual` ≤100 ou `valor_fixo`; `limiteUsos` opcional — `null`/omitido = ilimitado, padrão ao criar; cupom sempre nasce `ativo`) |
| `PATCH /events/:id/cupons/:cupomId` | gestor+ | **Edição completa** — código, tipo, valor, `limiteUsos` e `ativo`, não só o toggle de ativo. Rejeita `limiteUsos` menor que `usos` já registrado. Front-end exige confirmação explícita antes de ativar/desativar |
| `DELETE .../cupons/:cupomId` | gestor+ | Remove um cupom — **bloqueado com `409` (`CupomComUsosException`) se `usos > 0`** (o organizador precisa desativar em vez de remover um cupom já usado); front-end exige confirmação antes de chamar |
| `PUT /events/:id/banner` | gestor+ | Upload do banner do evento (`multipart/form-data`, campo `arquivo`) — salvo como **bytes direto no Postgres** (`bytea`), não em storage externo. Limite de 5MB, só `image/jpeg`/`image/png`/`image/webp` (validado pelo Multer *e* pela regra de negócio). Ver [docs/architecture/04-modelo-de-dados.md](../architecture/04-modelo-de-dados.md#imagens-salvas-como-bytes-não-em-storage-externo) |
| `GET /events/:id/banner` | público | Serve os bytes do banner com o `Content-Type` correto (resposta binária, não passa pelo envelope `{data}`/`{error}` — usa `@Res()` direto). `404` se o evento não tem banner. `EventoResponse.temBanner` (boolean) indica presença sem carregar os bytes — listagens nunca selecionam a coluna de bytes |

### Finance (`apps/api/src/finance/`)

| Rota | Papel mínimo | Descrição |
|---|---|---|
| `GET /events/:id/conta-bancaria`, `PUT .../conta-bancaria` | owner | Conta de repasse — **por evento, não por organizador** (o mesmo organizador pode ter eventos com repasses diferentes). `banco` é um código Febraban de uma lista curada (`BANCOS_BRASIL` em shared-types), não texto livre — elimina banco inexistente por digitação. `documentoTitular` aceita CPF ou CNPJ, validado por dígito verificador real (`validarCpfOuCnpj`), não só tamanho. Os campos sensíveis (agência, conta, titular, documento) são **criptografados em repouso** (AES-256-GCM, `apps/api/src/infra/crypto/campo-criptografado.util.ts`, chave em `CONTA_BANCARIA_ENCRYPTION_KEY`) — ver [06-seguranca.md](../architecture/06-seguranca.md). **O que não dá pra validar sem gateway real**: se a agência+conta específica existe de fato — isso só é possível quando o Asaas entrar na fatia de checkout (ele valida ao criar a subconta) |
| `GET /events/:id/financeiro/resumo` | view+ | Resumo calculado de ingressos não cancelados. Além de vendas e ticket médio, devolve a decomposição dos 12%: acordo ADMIN, benefício referral do organizador, base e bônus do indicador, total do indicador e residual da plataforma. Também devolve `valorTaxaFixaGateway`/`quantidadeComTaxaFixaGateway` — adicional fixo de R$0,49 por ingresso com `lote.preco < R$50`, 100% plataforma, já somado à taxa retida (ver [09-modelo-financeiro.md](../architecture/09-modelo-financeiro.md#taxa-fixa-de-gateway-em-ingressos-de-baixo-valor-implementado)). `DistribuicaoTaxaService` é a fonte única da regra dos 12%. **De propósito não tem** saldo processado/recebido: sem gateway, tudo é estimativa |

### Referrals (`apps/api/src/referrals/`)

| Rota | Acesso | Descrição |
|---|---|---|
| `GET /referrals/ofertas/:codigo` | público | Preview seguro do convite: primeiro nome do indicador e benefício permanente do organizador; usado no cadastro |
| `GET /referrals/me` | autenticado | Painel com programa, ofertas, total de indicados e comissões estimadas por evento pago |
| `POST /referrals/me/conta` | autenticado | Solicita cadastro ou alteração da conta de recebimento, criptografa os dados e envia confirmação ao email da conta do usuário; não exige senha atual e não troca uma conta ativa antes da confirmação |
| `POST /referrals/conta/confirmar` | público, com token | Confirma o token de uso único, com validade de 24 horas, e ativa/substitui a conta de recebimento |
| `POST /referrals/me/ofertas` | autenticado | Cria oferta/link ilimitado com benefício negociado entre 0% e 2% para o organizador |
| `PATCH /referrals/me/ofertas/:id`, `DELETE .../:id` | autenticado | Edita ou remove uma oferta somente antes do primeiro uso; após o uso ela fica marcada como utilizada, imutável e continua aceitando indicações ilimitadas |

### Admin (`apps/api/src/admin/`)

Todas as rotas exigem `papelGlobal: admin_geral` por `RolesGuard`. Frontend em `/admin/*` — sidebar própria (`AdminWorkspaceSidebar`, mesmo padrão do workspace de evento, esconde a navbar geral do site), 4 áreas: Suporte, Administrador (Acordos), Sistema, Financeiro. Pensada pra um dia virar subdomínio próprio, por isso já vive isolada.

| Rota | Descrição |
|---|---|
| `GET /admin/organizadores` | Lista organizadores pelo vínculo estável `Evento.organizadorId`, seus eventos, indicação e histórico de acordos |
| `POST /admin/acordos` | Cria acordo para sempre, próximos N eventos pagos ou evento específico. Desativa o acordo ativo anterior e rejeita percentual acima do espaço disponível nos 12% |
| `PATCH /admin/acordos/:id/desativar` | Desativa um acordo sem apagar o histórico; criação e desativação geram `AuditLog` |
| `PATCH /admin/acordos/:id/reativar` | Reativa um acordo desativado, substitui o acordo ativo atual do organizador e registra `REATIVAR_ACORDO_COMERCIAL` no `AuditLog` |
| `GET /admin/eventos?busca=` | **Espaço de Suporte** — busca evento de qualquer organizador por nome do evento/organizador/email. Base de `/admin/suporte`, que deep-linka pra uma tela nova e somente-leitura mostrando ingressos e leituras de check-in daquele evento (sem nenhum botão de ação) |
| `GET/POST /admin/feature-flags`, `PATCH .../:id/alternar` | **Espaço de Sistema** — CRUD de `FeatureFlag` (só registro/estado por enquanto, nenhuma funcionalidade do sistema checa esses flags ainda). Alternar gera `AuditLog` |
| `GET /admin/financeiro` | **Espaço Financeiro** — consolidado entre todos os eventos com venda, reaproveitando `FinanceService.buscarResumoFinanceiro` por evento (mesmo cálculo que o organizador já vê, sem `Transacao` real por trás) |

> **TODO de feature flags:** o CRUD local atual é transitório. A fonte de verdade planejada é o **PostHog Feature Flags**, com avaliação obrigatória no backend para regras sensíveis, segmentação por usuário/organizador/evento e uma única camada de integração. O checklist de migração está em [Roadmap e fora de escopo](../architecture/11-roadmap.md#todo--migrar-feature-flags-para-o-posthog).

**`EventRoleGuard` (`apps/api/src/security/guards/event-role.guard.ts`) deixa `admin_geral` passar direto**, sem precisar de `PapelAcesso` — é o que faz o Suporte funcionar reaproveitando as rotas normais de tickets/eventos (`GET /events/:id`, `GET /events/:id/ingressos`, `GET /events/:id/checkin/leituras`) sem nenhuma rota nova pra ler esses dados. Isso vale pra **toda** rota gated por esse guard, não só as consumidas pelo Suporte — um `admin_geral` tecnicamente também consegue chamar rotas de escrita (editar/cancelar ingresso, etc.) que o frontend do admin não expõe hoje.

### Tickets (`apps/api/src/tickets/`)

Todo ingresso hoje nasce de **emissão manual pelo organizador** — não existe checkout self-service nem gateway de pagamento. `StatusIngresso` tem 5 valores (`packages/shared-types/src/enums.ts`): `pendente` (ainda não produzido por nenhum código — plumbing de compatibilidade para quando existir um checkout assíncrono de verdade), `valido` (todo ingresso emitido nasce assim; exibido na UI como **"Aprovado"**), `usado` (após check-in; exibido como **"Check-in feito"**), `cancelado` (exibido como **"Cancelado"**) e `aguardando_aceite` (transferência iniciada, esperando o destinatário aceitar — exibido como **"Aguardando aceite da transferência"**; ver seção de transferência abaixo).

| Rota | Papel mínimo | Descrição |
|---|---|---|
| `POST /events/:id/lotes/:loteId/ingressos` | gestor+ | Emissão manual; gera `qrToken` assinado (HMAC-SHA256, `qr-token.util.ts`). `compradorEmail` é **obrigatório** (é o que liga o ingresso ao "Meus ingressos" de um `Usuario`); `compradorNome`/`compradorDocumento`/`linkVendaId` são opcionais. Aceita `cupomDescontoId` opcional — o organizador escolhe no modal de emissão um cupom `ativo` do evento; rejeita com `409` se o cupom estiver inativo (`CupomInativoException`) ou já tiver atingido `limiteUsos` (`CupomEsgotadoException`), e incrementa `CupomDesconto.usos` ao emitir com sucesso. Também aceita `cancelamentoFlexivel` (bool) — ver política de cancelamento abaixo. A **capacidade do lote e o limite do cupom são reservados de forma atômica** (`UPDATE ... WHERE ainda cabe`, checando linhas afetadas — `LoteRepository.ocuparVagaEmitidaSeDisponivel`/`CupomDescontoRepository.incrementarUsosSeDisponivel`) antes de criar o ingresso, não por um "ler → checar → escrever" em passos separados — isso é o que impede overselling quando duas emissões concorrentes disputam o mesmo lote/cupom quase esgotado. Ao emitir, dispara automaticamente um email de confirmação **com o ingresso anexado em PDF** (QR + dados do comprador, gerado via Puppeteer + `qrcode`, `apps/api/src/tickets/pdf/ingresso-pdf.util.ts`) — **melhor esforço** em duas camadas: se a geração do PDF falhar, o email ainda é enviado sem anexo (só um `logger.warn`); se o SMTP não estiver configurado (comum em dev) ou o envio falhar, o erro também só vira `logger.warn` — a emissão **não é desfeita** em nenhum dos dois casos |
| `GET /events/:id/ingressos` | view+ | Lista ingressos do evento |
| `GET /events/:id/ingressos/:ticketId` | view+ | Detalhe (inclui o `qrToken`) |
| `PATCH /events/:id/ingressos/:ticketId` | gestor+ | **"Editar"** — atualiza só os dados do comprador (`compradorNome`/`compradorEmail`/`compradorDocumento`). Não mexe em status, QR ou lote |
| `PATCH /events/:id/ingressos/:ticketId/status` | gestor+ | **"Cancelar" (organizador)** — marca o ingresso como `cancelado` e, se o ingresso tinha `cupomDescontoId`, decrementa `CupomDesconto.usos`. A tela de Participantes exige confirmação explícita (popup) antes de chamar essa rota, e o popup avisa que nenhum reembolso real é processado hoje (não existe checkout/pagamento — ver [12-pagamentos-e-repasses.md](../architecture/12-pagamentos-e-repasses.md)) |
| `POST /events/:id/ingressos/:ticketId/reenviar` | gestor+ | **"Reenviar"** — reenvia o email de confirmação manualmente. Ao contrário do envio automático da emissão, aqui o erro (ex: SMTP não configurado) **propaga de verdade pra UI** — é uma ação explícita do organizador, não deve falhar em silêncio |
| `POST /events/:id/checkin` | owner/gestor/checkin_operator | Valida um `qrToken` (verifica assinatura HMAC contra `QR_TOKEN_SECRET`, busca o ingresso, confirma que pertence ao evento e está `valido`) e marca como `usado` via `marcarComoUsadoSeValido` (update condicional no banco — 2ª tentativa sobre o mesmo ingresso falha visivelmente, mesmo em corrida). Essa é a rota de check-in em si — **não existe módulo `checkin` separado**, vive dentro de `tickets` |
| `GET /events/:id/checkin/leituras` | owner/gestor/checkin_operator | Histórico persistente das leituras confirmadas, com nome, email e `usadoEm`, ordenado da mais recente para a mais antiga |
| `GET /events/:id/participantes/csv` | view+ | Exporta todos os ingressos do evento como CSV (`ParticipantesService.gerarCsvParticipantes`) |
| `POST /events/:id/participantes/email` | gestor+ | Envia uma mensagem por email a todos os compradores com email cadastrado no evento (assunto/cabeçalho fixos no backend, corpo escrito pelo organizador). Retorna `{ enviadosPara: number }` |
| `GET /events/:id/carrinho-abandonado` | view+ | Lista reservas de 15min que nunca viraram ingresso (nome/email/telefone/lote/datas) — ver seção "Reservas de ingresso" abaixo |
| `GET /events/:id/carrinho-abandonado/csv` | view+ | Mesmo relatório acima, em CSV (`TicketsService.gerarCsvCarrinhoAbandonado`, reaproveita `montarCsv`/`escaparCampoCsv` de `apps/api/src/common/csv.util.ts`, extraído de `ParticipantesService` nesta revisão pra não duplicar a lógica de escape) |
| `GET /tickets/meus` | qualquer usuário logado | Fora de `/events/:id` de propósito — lista os ingressos vinculados ao email do usuário logado, entre eventos diferentes (`MeusIngressosController`). Base da tela `/meus-ingressos` |
| `GET /tickets/recebidas` | qualquer usuário logado | Lista transferências pendentes de aceite endereçadas ao usuário logado (`destinatarioTransferenciaEmail === usuário logado`, `status: "aguardando_aceite"`). Base da seção "Transferências recebidas" em `/meus-ingressos` |
| `POST /tickets/:ticketId/transferir` | qualquer usuário logado | **Self-service, só inicia** — o próprio comprador (`ingresso.compradorEmail === usuário logado`) marca o ingresso como `status: "aguardando_aceite"` e grava `destinatarioTransferenciaEmail`; `compradorEmail` **não muda ainda**. Exige `evento.transferivel`, que o evento ainda não tenha começado (trava base, sempre ativa) e, se configurado, respeita `evento.prazoTransferenciaHoras` (rejeita com `409` — `PrazoTransferenciaExpiradoException`, mensagem distingue "evento já começou" de "prazo configurado passou"). Dispara email avisando o destinatário |
| `POST /tickets/:ticketId/transferir/cancelar` | qualquer usuário logado | **Self-service** — quem enviou desiste antes do aceite; ingresso volta a `status: "valido"` com o remetente, `qrToken` não muda (nunca chegou a trocar de dono) |
| `POST /tickets/:ticketId/aceitar` | qualquer usuário logado | Só o destinatário (`destinatarioTransferenciaEmail === usuário logado`, senão `404` — mesmo padrão anti-IDOR do resto do módulo). Só aqui `compradorEmail`/`compradorNome`/`compradorDocumento` mudam de fato e o `qrToken` é **regerado** (invalida o QR que ainda estava com quem enviou). Dispara o mesmo email de confirmação com PDF que a emissão normal envia |
| `POST /tickets/:ticketId/recusar` | qualquer usuário logado | Só o destinatário — mesmo efeito de `transferir/cancelar`, mas iniciado por quem recebeu |
| `POST /tickets/:ticketId/cancelar` | qualquer usuário logado | **Self-service** — o próprio comprador cancela o próprio ingresso. Janela padrão de 7 dias corridos da emissão (`PRAZO_CANCELAMENTO_PADRAO_DIAS`, direito de arrependimento — ver [12-pagamentos-e-repasses.md#42](../architecture/12-pagamentos-e-repasses.md#42-cancelamento-de-compra--direito-de-arrependimento-7-dias-e-página-de-políticas)); ingressos com `cancelamentoFlexivel:true` podem cancelar a qualquer momento até o evento começar. Bloqueado (`409`) enquanto o ingresso está `aguardando_aceite`. Igual ao cancelamento do organizador, não processa reembolso real hoje (não existe checkout) — quando existir, a taxa de serviço nunca seria reembolsável na janela padrão de 7 dias, mas **seria reembolsável** no cancelamento via ingresso flexível (só o adicional de 10% de flexibilidade ficaria retido — decisão de produto registrada em [12-pagamentos-e-repasses.md#43](../architecture/12-pagamentos-e-repasses.md#43-ingresso-com-cancelamento-flexível--produto-pago-10-revertido-só-à-plataforma)) |

### Reservas de ingresso (`POST/GET /events/public/:id/...`) — infraestrutura, sem tela de comprador

Endpoints públicos (`ReservasPublicasController`) para segurar uma vaga de lote por até 15 minutos (`PRAZO_RESERVA_MINUTOS`) enquanto um futuro checkout self-service não existe de verdade — ver [11-roadmap.md](../architecture/11-roadmap.md#reserva-de-ingresso-hold-de-15-minutos--infraestrutura-pronta-sem-ui-ainda) para o racional completo. Nenhuma tela de **comprador** consome isso ainda (nada de "Reservar meu ingresso" na página pública do evento), mas o organizador já tem um relatório em cima dessa mesma tabela — ver "Carrinho abandonado" acima.

| Rota | Descrição |
|---|---|
| `POST /events/public/:id/lotes/:loteId/reservas` | Cria uma reserva (`compradorEmail`/`compradorNome`/`compradorTelefone`, todos opcionais). Capacidade reservada de forma atômica, mesmo padrão da emissão — `409 LoteEsgotadoException` se não houver vaga |
| `GET /events/public/:id/reservas/:reservaId` | Consulta status/`expiraEm` da reserva |
| `POST /events/public/:id/reservas/:reservaId/confirmar` | Converte a reserva num `Ingresso` de verdade (mesmo corpo da emissão manual — dados do comprador, cupom opcional). `409 ReservaNaoDisponivelException` se já expirou/foi processada — a validade é sempre revalidada contra `expiraEm` na hora, nunca só pelo `status` salvo |
| `POST /events/public/:id/reservas/:reservaId/cancelar` | Desiste da reserva antes do prazo, liberando a vaga na hora |

*Nota: o plano original descrevia `GET /tickets/:id` solto — ficou aninhado em `/events/:id/ingressos/:ticketId` porque o `EventRoleGuard` precisa do `eventoId` na própria rota para checar o papel do usuário.*

### Lista off (`apps/api/src/guestlist/`)

| Rota | Papel mínimo | Descrição |
|---|---|---|
| `GET/POST /events/:id/listas-off` | leitura+ / gestor+ | Lista os grupos ou cria uma lista nomeada com `entradaAte` opcional |
| `PATCH/DELETE /events/:id/listas-off/:listaId` | gestor+ | Edita ou remove a lista; remover apaga seus convidados em cascata após confirmação na UI |
| `POST /events/:id/listas-off/:listaId/pessoas/importar` | gestor+ | Importa atomicamente até 1.000 linhas `NOME COMPLETO, CPF`; aceita CPF pontuado ou só números, valida dígitos e salva formatado |
| `GET /events/:id/listas-off/:listaId/pessoas` | leitura+ | Lista paginada com filtros independentes `nome` e `cpf`; CPF é pesquisado pelos dígitos normalizados |
| `PATCH/DELETE .../pessoas/:pessoaId` | gestor+ | Edita nome/CPF ou remove uma pessoa da lista |
| `POST .../pessoas/:pessoaId/checkin` | owner/gestor/checkin_operator | Confirma a entrada de forma condicional, bloqueando segunda utilização e listas cujo horário limite expirou |

## Marca RARO Tickets

A experiência web usa a marca **RARO Tickets**. A Novyx aparece apenas no copyright do rodapé como proprietária da plataforma. A interface utiliza linguagem violeta/azul, tema exclusivamente claro, superfícies modernas e iconografia Lucide. Consulte o [design system](../frontend/design-system.md) para os tokens e padrões atuais.

## Frontend (`apps/web`)

Construído em paralelo ao backend — a regra do time é sempre ter a tela de cada funcionalidade pronta assim que o módulo correspondente da API existe (ver [docs/frontend/design-system.md](../frontend/design-system.md) para a paleta clara e as regras de UI usadas em todas as telas abaixo).

| Rota | Descrição |
|---|---|
| `/login`, `/registro` | Autenticação — usam `lib/auth-context.tsx`, que guarda o access token só em memória e faz refresh silencioso. `/registro` aceita `?ref=CODIGO`, exibe a negociação do convite e envia o código na criação atômica da conta; pede `telefone` (obrigatório, com máscara). Ambas as telas têm um botão "Continuar com Google" (`components/google-login-button.tsx`, navegação de página inteira pra `GET /auth/google`, não um fetch) |
| `/entrar-google` | Destino do redirect de `GET /auth/google/callback` — lê `accessToken` da query string e chama `AuthContext.definirSessaoExterna` (o refresh token já veio via cookie no redirect do backend), depois manda pra `/` |
| `/status` | Health check da API (esqueleto original da fatia 1) |
| `/eventos/todos` | Catálogo público com busca por nome/localização, filtros de categoria, cidade/estado/país (via `LocationFilterModal`, estilo Sympla) e data exata, além de ordenação |
| `/eventos` | Lista os eventos do usuário logado |
| `/eventos/novo` | Assistente de criação — só a etapa 1 (dados do evento) vive nesta rota; ao submeter mostra um popup perguntando "Compradores já podem ver esse evento?" e cria o evento **por completo** via `POST /events`, seguindo pra `/eventos/[id]/conta-repasse?wizard=1` |
| `/meus-ingressos` | Lista os ingressos do usuário logado entre eventos (`GET /tickets/meus`), com toggle Próximos/Passados. Quando há transferências pendentes de outra pessoa (`GET /tickets/recebidas`), mostra uma seção "Transferências recebidas" no topo com botões Aceitar/Recusar por item, sem precisar abrir o modal. Clicar num ingresso próprio abre `TicketQrModal` (`components/ticket-qr-modal.tsx`) — bottom sheet com animação de baixo para cima mostrando nome do evento, código da compra (`ingresso.id`), nome, email, data de compra (`criadoEm`) e o QR code (gerado client-side com `qrcode` a partir do mesmo `qrToken` assinado que o check-in valida), com o código repetido como legenda logo abaixo do QR. **Transferir** passa por duas telas — inserir o email do destinatário, depois um popup dedicado de "Confirmar transferência" (mostra pra quem vai e o aviso de que fica bloqueado até aceite) — antes de chamar a API; a tela de sucesso deixa claro que é "Transferência enviada" (pendente), não "transferido". Enquanto `status === "aguardando_aceite"`, o modal mostra o QR bloqueado (esmaecido) e o menu troca as opções normais (Transferir/Cancelar) por uma única opção "Cancelar transferência" |
| `/perfil` | Editar perfil (nome, data de nascimento, **telefone**), trocar email/senha, apagar conta (`/auth/me*`). Conta `usaGoogle: true` esconde os formulários de trocar email/senha e o botão de excluir (mostram uma nota explicando por quê, em vez de deixar bater no `409 CONTA_SEM_SENHA`) — e mostra um aviso se `documento` ainda for nulo (cadastro via Google incompleto) |
| `/indicacoes` | Cadastro e alteração da conta de recebimento com confirmação por email, criação de ofertas ilimitadas, edição/exclusão antes do uso, status imutável após o uso, preview das porcentagens e comissões estimadas com 0,25% fixo + bônus de negociação em todos os eventos pagos |
| `/admin/*` | Área exclusiva do `admin_geral` — sidebar própria (`AdminWorkspaceSidebar`), sem a navbar geral do site, gated no frontend por `ProtectedPage somenteAdmin` (checa `usuario.papelGlobal`, exposto via `AuthContext` depois de `GET /auth/me`) e no backend por `RolesGuard`. `/admin` é a visão geral (4 cards); `/admin/acordos` escolhe organizador, configura acordo comercial e consulta/desativa histórico; `/admin/suporte` busca evento de qualquer organizador e abre uma visão somente-leitura de ingressos + check-in; `/admin/sistema` cria/lista/alterna `FeatureFlag`; `/admin/financeiro` mostra o consolidado entre todos os eventos |

**Painel do evento (`/eventos/[id]/*`)**: a partir do momento que o evento existe, todas as rotas abaixo de `/eventos/[id]` vivem dentro do **workspace do evento** — sidebar própria e escura (`EventWorkspaceSidebar`, `apps/web/components/event-workspace-sidebar.tsx`), sem a navbar/rodapé geral do site (`Header`/`Footer` se escondem via `useIsEventWorkspace`, `apps/web/lib/event-workspace.ts`). A sidebar agrupa as telas em: **Painel do evento** (Visão geral, Quem tem acesso, Configurações), **Ingressos** (Lotes e ingressos, Cupons de desconto, Carrinho abandonado), **Participantes**, **Check-in**, **Financeiro**.

**Navbar do `Header` para sessões de admin**: quando `usuario.papelGlobal === "admin_geral"` (e a pessoa não está em nenhuma workspace), o `Header` (`apps/web/components/header.tsx`) deixa de mostrar a lista de links inline no desktop — só o botão de hamburger (sempre visível, não só `lg:hidden`) — e mostra um botão "Painel admin" (`ShieldCheck`) fixo ao lado da busca, levando pra `/admin`. Para qualquer outro usuário, a navbar não muda em nada.

| Rota | Descrição |
|---|---|
| `/eventos/[id]` | **Visão geral** — badge de status ("Visível para compradores" / "Privado") com botão pra alternar a qualquer momento, banner, período/endereço formatados, classificação 18+ se aplicável, card "Compartilhar" com o link público (`/e/[id]`, copiável via `urlPublicaEvento`), mini painel financeiro (vendas brutas/líquida), mini resumo de ingressos (confirmados/cancelados/emitidos) com gráfico de emissões por dia, e atalhos pra descrição/contato, Financeiro e Ingressos |
| `/eventos/[id]/acesso` | **Quem tem acesso** — pessoas e permissões em formato de lista; o convite pesquisa e sugere emails de usuários cadastrados enquanto o owner digita |
| `/eventos/[id]/detalhes` | **Configurações** — banner clicável para visualização em tamanho ampliado, descrição e responsável/contato (nome, email, telefone) do evento |
| `/eventos/[id]/ingressos` | **Lotes e ingressos** — cria/edita lotes, permite ocultar/desocultar cada lote e emite ingressos manualmente (nome/email do comprador) |
| `/eventos/[id]/cupons` | **Cupons de desconto** — cria (com opção de limitar a X usos, ou deixar ilimitado por padrão) e edita por completo (`ModalEditarCupom`: código, tipo, valor, limite de usos, ativo — rejeita salvar se o novo limite for menor que os usos já registrados); ativar/desativar e excluir sempre exigem popup de confirmação, e excluir é bloqueado com aviso se o cupom já tiver alguma emissão vinculada (`usos > 0`); mostra `usos/limiteUsos` quando há limite, ou só a contagem quando ilimitado; busca por código + paginação de 20/página (`components/ui/pagination.tsx`); botão "copiar link" gera a URL pública do evento já com `?cupom=CODIGO` pré-preenchido (`urlPublicaEvento`) |
| `/eventos/[id]/carrinho-abandonado` | **Carrinho abandonado** — reservas de 15min que nunca viraram ingresso (nome/email/telefone/lote/data), busca + paginação 20/página, botão de exportar CSV. Só se popula se algo chamar os endpoints públicos de reserva — não existe checkout de comprador ainda (ver seção "Reservas de ingresso" abaixo) |
| `/eventos/[id]/participantes` | **Participantes** — uma linha por ingresso emitido (status, participante, email, tipo, data), com ícone (visível só no hover) indicando qual cupom foi usado na compra quando houver um vinculado; ações **Reenviar** (email), **Editar** (dados do comprador, modal), e **Cancelar** — ícone de X que abre popup de confirmação antes de chamar a API; busca por nome/email + paginação de 20/página; botões pra exportar CSV e enviar email em massa aos compradores |
| `/eventos/[id]/lista-off` | **Gestão da lista off** — cria/edita/remove listas com horário limite opcional, importa até 1.000 pessoas no formato `NOME, CPF`, filtra automaticamente enquanto nome/CPF são digitados, pagina, edita e remove convidados; também permite confirmar a entrada diretamente em cada linha aguardando |
| `/eventos/[id]/checkin` | **Check-in via scanner** — campo de leitura por leitor USB ou câmera do dispositivo (`jsQR`) com validação automática do token completo; histórico persistente em formato de lista, pesquisa por nome/email e paginação de 15 leituras por página |
| `/eventos/[id]/lista-off/checkin` | **Check-in da lista off** — escolha da lista, filtros separados de nome e CPF, 15 convidados por página, status/hora de utilização e confirmação de entrada |
| `/eventos/[id]/financeiro` | **Financeiro** — métricas do evento e, somente quando o organizador recebe uma parcela maior que 0%, um card único com o percentual total dele dentro dos 12%; a distribuição interna entre ADMIN, indicação, indicador e plataforma não é exposta ao organizador. Inclui também conta de repasse e aviso de valores estimados |
| `/eventos/[id]/conta-repasse` | Cadastro/edição da conta de repasse. Não aparece na sidebar — acessada pelo link "Cadastrar"/"Editar" na tela Financeiro |

**Assistente de criação (`?wizard=1`)**: as rotas `conta-repasse`, `acesso` e `detalhes` são compartilhadas entre o assistente de criação e o workspace permanente do evento — a mesma página muda de comportamento conforme a query string `?wizard=1` (`useIsEventWorkspace`, que suprime a sidebar/navbar nesse modo). No fluxo do assistente: `/eventos/novo` (dados do evento, sem `id` ainda) → `/eventos/[id]/conta-repasse?wizard=1` (**Etapa 2 de 4**) → `/eventos/[id]/acesso?wizard=1` (**Etapa 3 de 4**) → `/eventos/[id]/detalhes?wizard=1` (**Etapa 4 de 4**, totalmente opcional). Só a etapa 1 é obrigatória para o evento existir — as etapas 2–4 sempre têm um jeito de pular ("Cadastrar depois" / "Pular por enquanto" / "Concluir depois") que leva direto pro painel do evento (`/eventos/[id]`, sem a query string), e os mesmos formulários continuam acessíveis por lá a qualquer momento como telas normais do workspace (sem "Etapa N de 4" no `.eyebrow`, com o rótulo da própria tela — "Financeiro", "Equipe", "Configurações").

**Página pública do evento (`/e/[id]`)**: fora do namespace `/eventos`, sem navbar/sidebar de organizador — o que um comprador vê ao abrir o link de um evento. Consome `GET /events/public/:id` (404 amigável se o evento não existir ou não estiver `publicado`). Mostra banner, categoria, badge 18+ se aplicável, data, endereço, descrição e contato. Se a URL tiver `?cupom=CODIGO` (gerado pelo botão "copiar link" da tela de Cupons via `urlPublicaEvento(eventoId, origin, codigo)`), valida o cupom contra `GET /events/public/:id/cupom/:codigo` e mostra se é válido ou não. Termina com um aviso fixo de que **a compra online ainda não está disponível** — não existe checkout self-service, a emissão continua sendo feita pelo organizador.

`lib/api-client.ts` centraliza o fetch (envelope `{ data }` / `{ error }` do backend, `credentials: "include"` para o cookie de refresh); `lib/events-client.ts`, `lib/tickets-client.ts` e `lib/finance-client.ts` são os clients tipados com `@events-platform/shared-types`. Toda tela autenticada usa `<ProtectedPage>` (`components/protected-page.tsx`), que redireciona para `/login` se não houver sessão. A aplicação usa exclusivamente o tema claro; não existe contexto, toggle ou persistência de tema (a sidebar escura do workspace do evento é um estilo de componente fixo, não um modo escuro do sistema).

**Categorias de evento**: `shows`, `festivais`, `negocios`, `esportes`, `cursos`, `tecnologia` e `outros`. O formulário usa um dropdown fechado; escolher `outros` não abre campo livre. A home calcula as categorias e contagens a partir de `GET /events/public`, não renderiza categorias vazias e não contém eventos fictícios.

**Localização do evento**: novos eventos exigem `cidade`, `estado` e `pais`. O campo legado `local` permanece apenas para compatibilidade do banco e não é usado no catálogo. Eventos antigos sem os três novos campos são exibidos como “Localização não informada”; nenhuma localização é inferida a partir do nome de uma arena ou estabelecimento.

**Estado/cidade em `/eventos/novo`**: dois `<Select>` dependentes (`apps/web/lib/ibge-client.ts`), populados pela **API pública do IBGE** (sem chave, sem custo) — estado lista as 27 UFs (`GET /localidades/estados`), e escolher um estado dispara a busca dos municípios daquele estado (`GET /localidades/estados/{UF}/municipios`) pra popular o select de cidade, que fica desabilitado até um estado ser escolhido. `estado` é salvo com a sigla (`MG`), `cidade` com o nome do município. **País não aparece no formulário** — é sempre `PAIS_PADRAO` ("Brasil", de `packages/shared-types/src/data/paises.ts`), mandado fixo no payload. A lista `PAISES_SUPORTADOS` já é modelada como array (não uma string solta) de propósito: expandir pra outro país no futuro é adicionar um item ali e trocar a constante por um `<Select>` de verdade — o schema do banco (`Evento.pais`) já é texto livre, não precisa mudar.

**Busca pública**: o header exibe somente um botão de lupa, que abre `/eventos/todos` com foco na busca. A busca grande da home envia o termo para essa página. Os cards e atalhos de categoria também abrem o catálogo usando `?categoria=<valor>`, permitindo combinar a categoria recebida com cidade/estado/país, uma data específica e ordenação.

**Validação compartilhada** (`packages/shared-types`): `validators/documento.ts` valida CPF/CNPJ por dígito verificador real (não só tamanho — algoritmo oficial da Receita), `data/bancos-brasil.ts` é a lista curada de bancos (código Febraban) usada tanto na validação do Zod quanto no `<Select>` do formulário — usada em vez de texto livre porque elimina "banco que não existe" por digitação.

**Pendente**: `apps/mobile` ainda é só o esqueleto original (chama `/health`), sem nenhuma tela própria. O check-in via QR **já existe no backend** (`POST /events/:id/checkin`, ver seção Tickets acima) e já é usado de verdade — mas só pela tela web `/eventos/[id]/checkin` (câmera do navegador via `jsQR`). Adaptar isso pro app React Native ainda não foi feito.

## Verificação end-to-end (fatia 1) — feita e confirmada

Testado via `curl` (API direta) e via browser (UI real):
- `pnpm install`, `prisma generate`, `prisma migrate dev`, build de `shared-types`/`api`/`web` sem erros
- Fluxo completo: registro → login → criar evento → criar lote → emitir ingresso (QR gerado, `quantidadeEmitida` incrementado) — funcionando tanto por chamada direta à API quanto pela UI em `/eventos`
- RBAC: requisição sem token → `401`; usuário sem `PapelAcesso` no evento → `403`
- Refresh token: rotação funciona; reapresentar um refresh token já trocado revoga a sessão inteira (detecção de reuso), confirmando o desenho descrito na seção Auth acima
- `/health` (API e página `/status` do web) reportam `database: up`

Também testado, na rodada seguinte (rebrand + financeiro + acesso): fluxo completo criar evento → conta de repasse → financeiro → gestão de acesso, tanto via `curl` quanto via browser (login → evento → mini painel financeiro com valores reais → página Financeiro → tela de acesso). Validação de CPF/CNPJ e banco confirmada rejeitando documento com dígito verificador errado e código de banco inexistente.

Terceira rodada (registro PF/PJ + banner + localização), via `curl` contra o servidor rodando: registro de pessoa física com CPF inválido → `400`; CPF válido (com pontuação, ex. `111.444.777-35`) → conta criada com `dataNascimento` salva; CNPJ válido de pessoa jurídica → conta criada com `dataNascimento: null`. Upload de banner: PNG válido → `temBanner: true` no evento e `GET /events/:id/banner` retorna os bytes certos com `Content-Type: image/png`; arquivo `text/plain` → `400 BANNER_INVALIDO`. `tsc --noEmit` limpo em `apps/web` depois de cada mudança (front-end).

Quarta rodada (assistente de criação em 4 etapas + visibilidade para compradores), via browser real (registro → criar evento): popup de visibilidade aparece ao submeter a etapa 1, escolher "Não, manter privado por enquanto" cria o evento — **por completo** — com `publicado: false` e segue pra etapa 2; "Cadastrar depois" na conta de repasse leva pra etapa 3 (acesso), que mostra o próprio usuário como `owner`; "Continuar" leva pra etapa 4, onde descrição e contato preenchidos aparecem no painel do evento (`/eventos/[id]`) junto com o badge "Privado — visível só para você e sua equipe"; clicar em "Liberar para compradores" no painel muda o badge pra "Visível para compradores" e o evento passa a aparecer em `/eventos/todos` (catálogo público) — clicar em "Tornar privado" tira o evento de lá de novo, confirmando que `GET /events/public` filtra por `publicado` nos dois sentidos, sem nunca ter deixado de existir por completo (lotes, banner e demais dados continuam lá o tempo todo). `tsc --noEmit` limpo em `apps/api` e `apps/web` antes do teste.

Quinta rodada (QR code visível pro comprador + PDF anexado ao email), via browser real: registro → criar evento → criar lote → emitir ingresso → `/meus-ingressos` → clicar no ingresso abre o `TicketQrModal` com todos os campos corretos (nome do evento, código da compra, nome, email, data de compra, QR renderizado). O `qrToken` mostrado no modal foi extraído da resposta real da API e submetido à tela de Check-in do mesmo evento — validou com sucesso ("Check-in confirmado"), confirmando que o QR do comprador carrega o token assinado de verdade, não um placeholder. `gerarPdfIngresso` testado isoladamente (fora do fluxo de email, que depende de SMTP configurado) gerando um PDF de ~47KB com layout de página única.

## Bugs encontrados e corrigidos durante o teste manual

- **Formulário de criar lote não quebrava linha em telas estreitas** (`apps/web/app/eventos/[id]/page.tsx`) — o campo "Quantidade" ficava fora da viewport. Causa: classes de `flex-grow` (`flex-1`) foram aplicadas direto no `<input>` do componente `Input`, cujo pai real é um `flex flex-col` (o wrapper label+input) — isso fez o campo crescer no eixo vertical (esticando a altura) em vez de crescer horizontalmente na linha do formulário. Corrigido envolvendo o `<Input>` num `<div className="flex-1 min-w-40">` e adicionando `flex-wrap` ao container.
- **"Sem permissão" ao abrir um evento recém-criado (relatado pelo usuário) — na verdade não era um bug de permissão.** Causa real: ao adicionar o campo `dataFim`, `apps/web/app/eventos/[id]/page.tsx` passou a chamar `formatarPeriodoEvento(evento.data, evento.dataFim)` no JSX sem que essa função existisse no arquivo — um `ReferenceError` em runtime que derrubava a página inteira (tela de erro genérica do Next.js), o que o usuário percebeu como "não consigo acessar mesmo sendo o dono". Diagnosticado reproduzindo no browser com `read_console_messages` (mostrou o stack trace exato) depois de confirmar por `curl` que a API respondia normal — ou seja, o problema era 100% front-end. Corrigido adicionando a função que faltava. **Lição**: quando o usuário relata "não tenho permissão" num fluxo que ele mesmo é o dono, checar o console do browser antes de assumir que é RBAC — uma página quebrada no client pode se manifestar como uma tela genérica de erro que parece bloqueio de acesso.
- **PDF do ingresso cortava e duplicava o QR code numa 2ª página.** `gerarPdfIngresso` (`apps/api/src/tickets/pdf/ingresso-pdf.util.ts`) inicialmente gerava o PDF com altura fixa (`height: "420px"`) — o conteúdo real do ticket (endereço, tipo de ingresso etc. variam de tamanho conforme o evento) era mais alto que isso, forçando o Puppeteer a quebrar página no meio do cartão: o QR code e o rodapé apareciam cortados e depois repetidos numa segunda página. Encontrado gerando o PDF isoladamente (fora do fluxo de email) e inspecionando o resultado. Corrigido medindo a altura real do conteúdo renderizado (`page.evaluate(() => document.body.scrollHeight)`) e usando esse valor como altura do PDF, em vez de um número fixo — reproduzido depois com sucesso, ticket sempre numa página só.

## Lições operacionais (pra quem for mexer depois)

- **`prisma migrate dev` pode resetar o banco inteiro sem avisar direito, se o histórico de migrações estiver "sujo"** (pasta deletada manualmente + linha correspondente removida de `_prisma_migrations`). Isso aconteceu nesta sessão ao mover `ContaBancaria` de `Usuario` pra `Evento` e apagou dados de teste. Pra alterações de schema neste ambiente (sem TTY interativo), o caminho seguro é: `prisma migrate diff --from-migrations ... --to-schema-datamodel ... --script` pra gerar o SQL, salvar manualmente numa pasta de migração, e aplicar com `prisma migrate deploy` (não interativo). Se o banco já tinha tabelas sem `_prisma_migrations` (schema aplicado antes por `db push` ou similar), rodar `prisma migrate resolve --applied <migração>` pra "batizar" o estado atual antes do deploy.
- **Rodar `next build` (produção) enquanto `next dev` está rodando corrompe o `.next/`** — os dois usam formatos de manifest incompatíveis no mesmo diretório. Depois de qualquer `pnpm --filter web build` usado só pra checar erro de tipo, apagar `apps/web/.next` antes de subir o dev server de novo. O mesmo vale pro `apps/api/dist` com `nest build` vs. `nest start --watch`.
- **No Windows, parar uma task em background (`TaskStop`) às vezes não mata o processo `node` filho** — a porta continua ocupada e o próximo `pnpm dev` falha com `EADDRINUSE`. Checar com `netstat -ano | grep ":PORTA"` e `taskkill //PID <pid> //F` se precisar.
- **Se já existe um `nest dev`/`next dev` rodando (seu ou de outra sessão), prefira `tsc --noEmit`** (`apps/web`) em vez de `next build`/`nest build` só para checar erro de tipo — `build` de produção mexe no `.next`/`dist` e pode corromper o cache do processo que já está rodando nessas pastas.
- **Upload multipart via `curl -F "campo=@caminho"` neste ambiente às vezes falha silenciosamente (resposta vazia ou `curl: (26)`) quando o arquivo está em `/tmp`** — usar um caminho dentro da pasta de scratchpad da sessão resolve; é uma peculiaridade de resolução de caminho da ferramenta de shell, não um bug do upload em si.

**Ambiente sandbox desta sessão não tinha Docker** — a instalação do Docker Desktop e a subida do Postgres (`docker-compose up -d`) foram feitas pelo usuário na própria máquina antes da primeira verificação.
