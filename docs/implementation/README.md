[← Voltar à documentação](../README.md)

# Implementação

Documentação do que já foi **construído** (código real), como complemento à [arquitetura](../architecture/README.md) (que é o desenho, definido antes de escrever código). Atualizado a cada módulo novo.

## Como rodar localmente

```bash
pnpm install
docker-compose up -d          # sobe o Postgres local
pnpm --filter api exec prisma migrate dev
pnpm dev                      # roda api + web + mobile em paralelo (Turborepo)
```

A API sobe em `http://localhost:3000` (porta configurável via `API_PORT` no `.env`, copiado de `.env.example`).

## Estrutura implementada

Segue o padrão descrito em [docs/architecture/03-modulos-backend.md](../architecture/03-modulos-backend.md), com as camadas Controller → DTO → Mapper → Service → Repository → Model em cada módulo de `apps/api/src/`, mais as camadas transversais `security/` (guards/strategies/decorators de auth e RBAC), `common/` (filtro global de exceção + interceptors) e `infra/prisma/` (único ponto que fala com o Prisma).

**Convenção**: dentro de um módulo, os arquivos são organizados por **camada** (`model/`, `repository/`, `mapper/`, `dto/`, `exceptions/`), não por entidade — ex: `events/model/` guarda `evento.model.ts`, `lote.model.ts`, `link-venda.model.ts` e `papel-acesso.model.ts` juntos. Optamos por isso em vez de uma pasta por entidade (`events/lote/{model,repository,mapper}.ts`) porque o Service de cada módulo já orquestra várias entidades na mesma operação (ex: criar evento também cria o `PapelAcesso` de owner), e hoje nenhum módulo passa de ~4 entidades — o ganho de "tudo de uma entidade junto" só compensaria o custo de mais um nível de pastas se um módulo crescesse bem mais que isso. Se algum módulo futuro (ex: `admin`) crescer muito, vale reconsiderar pasta-por-entidade só ali.

## Referência da API

### Auth (`apps/api/src/auth/`)

| Rota | Descrição |
|---|---|
| `POST /auth/register` | Cria usuário (senha com argon2id) e já retorna sessão logada (auto-login) |
| `POST /auth/login` | Valida email/senha (rate limit: 5/min), retorna access + refresh token |
| `POST /auth/refresh` | Rotaciona o refresh token (janela deslizante de 90 dias); reuso de token já revogado derruba toda a sessão |
| `POST /auth/logout` | Revoga o refresh token atual |

Estratégia de sessão completa em [docs/architecture/07-app-checkin.md](../architecture/07-app-checkin.md) *(nota: a decisão de token está documentada na fatia de implementação, não na arquitetura original — ver seção abaixo)*.

**Sessão persistente**: access token JWT de 15 minutos + refresh token opaco (hash SHA-256 no banco) com validade de 90 dias, renovada a cada uso (sliding window) — o usuário só é deslogado automaticamente depois de 90 dias sem abrir o app/site. Web recebe o refresh token em cookie `httpOnly`/`secure`/`sameSite=strict`; mobile recebe no corpo da resposta.

**RBAC**: `Usuario.papelGlobal` (`usuario` | `admin_geral`) checado pelo `RolesGuard`; papel por evento (`owner` | `gestor` | `view` | `checkin_operator`, tabela `PapelAcesso`) checado pelo `EventRoleGuard` — ambos em `apps/api/src/security/guards/`.

### Events (`apps/api/src/events/`)

| Rota | Papel mínimo | Descrição |
|---|---|---|
| `POST /events` | qualquer usuário logado | Cria evento; quem cria vira `owner` (cria `PapelAcesso` automaticamente) |
| `GET /events` | — | Lista os eventos em que o usuário logado tem algum papel |
| `GET /events/:id` | view+ | Detalhe do evento |
| `PATCH /events/:id` | gestor+ | Atualiza evento |
| `GET /events/:id/lotes`, `POST .../lotes`, `PATCH .../lotes/:loteId` | view+ / gestor+ / gestor+ | Lotes do evento (`quantidadeEmitida` calculado a partir da contagem de ingressos) |
| `GET /events/:id/links-venda`, `POST .../links-venda` | view+ / gestor+ | Links de venda (slug único por evento) |
| `GET /events/:id/acesso`, `POST .../acesso`, `DELETE .../acesso/:usuarioId` | owner | Gerencia quem tem acesso ao evento e com qual papel. **Não é uma coluna no Evento** — é a tabela relacional `PapelAcesso` (usuário + evento + papel), que é a forma certa de modelar "vários usuários, cada um com uma permissão diferente" (uma coluna não segura isso de forma consultável). A resposta de `GET .../acesso` inclui `usuarioNome`/`usuarioEmail` (join com `Usuario`) — sem isso a UI só teria UUID cru pra mostrar |

### Finance (`apps/api/src/finance/`)

| Rota | Papel mínimo | Descrição |
|---|---|---|
| `GET /events/:id/conta-bancaria`, `PUT .../conta-bancaria` | owner | Conta de repasse — **por evento, não por organizador** (o mesmo organizador pode ter eventos com repasses diferentes). `banco` é um código Febraban de uma lista curada (`BANCOS_BRASIL` em shared-types), não texto livre — elimina banco inexistente por digitação. `documentoTitular` aceita CPF ou CNPJ, validado por dígito verificador real (`validarCpfOuCnpj`), não só tamanho. **O que não dá pra validar sem gateway real**: se a agência+conta específica existe de fato — isso só é possível quando o Asaas entrar na fatia de checkout (ele valida ao criar a subconta) |
| `GET /events/:id/financeiro/resumo` | view+ | Vendas brutas, ticket médio e contagem de ingressos válidos/cancelados — calculado direto de `Ingresso`+`Lote` (preço × ingressos não cancelados), sem passar por Model/Repository (é leitura agregada, não uma entidade). **De propósito não tem** "em processamento"/"total a receber"/"total recebido" — isso só existe quando há um gateway de pagamento real; mostrar um número ali seria inventar dado (ver [09-modelo-financeiro.md](../architecture/09-modelo-financeiro.md)) |

### Tickets (`apps/api/src/tickets/`)

| Rota | Papel mínimo | Descrição |
|---|---|---|
| `POST /events/:id/lotes/:loteId/ingressos` | gestor+ | Emissão manual/gratuita (compra paga entra na fatia de `checkout`); gera `qrToken` assinado (HMAC-SHA256, ver `qr-token.util.ts`) |
| `GET /events/:id/ingressos` | view+ | Lista ingressos do evento |
| `GET /events/:id/ingressos/:ticketId` | view+ | Detalhe (inclui o `qrToken`) |
| `PATCH /events/:id/ingressos/:ticketId/status` | gestor+ | Cancela o ingresso |

*Nota: o plano original descrevia `GET /tickets/:id` solto — ficou aninhado em `/events/:id/ingressos/:ticketId` porque o `EventRoleGuard` precisa do `eventoId` na própria rota para checar o papel do usuário.* A validação do QR em si (check-in) fica para o módulo `checkin`, ainda não implementado.

## Marca: RARO Tickets (produto) vs. NOVYX (empresa)

O produto visível pro usuário se chama **RARO Tickets** — título, header, tudo. **NOVYX nunca aparece na UI**, só em contexto institucional (docs, contrato). Ver [docs/product/resumo-produto.md](../product/resumo-produto.md) e [docs/frontend/design-system.md](../frontend/design-system.md) (paleta inspirada na sinalização "CAZA RARO": teal `#2C8C81` sobre creme quente `#F6F1E7`, com modo escuro).

## Frontend (`apps/web`)

Construído em paralelo ao backend — a regra do time é sempre ter a tela de cada funcionalidade pronta assim que o módulo correspondente da API existe (ver [docs/frontend/design-system.md](../frontend/design-system.md) para a paleta, os tokens de claro/escuro e as regras de UI usadas em todas as telas abaixo).

| Rota | Descrição |
|---|---|
| `/login`, `/registro` | Autenticação — usam `lib/auth-context.tsx`, que guarda o access token só em memória e faz refresh silencioso (cookie `httpOnly`) ao montar |
| `/status` | Health check da API (esqueleto original da fatia 1) |
| `/eventos` | Lista os eventos do usuário logado |
| `/eventos/novo` | **Etapa 1 de 2** da criação de evento (dados do evento) — ao salvar, encaminha pra `conta-repasse` |
| `/eventos/[id]` | Painel do evento: mini painel financeiro (vendas brutas, ticket médio, válidos/cancelados), lotes (com criação inline), ingressos emitidos, e atalhos pra Financeiro e Quem tem acesso |
| `/eventos/[id]/conta-repasse` | **Etapa 2 de 2** da criação de evento — cadastro/edição da conta de repasse (também acessível depois, a qualquer momento, pela tela Financeiro) |
| `/eventos/[id]/financeiro` | Painel financeiro completo: as mesmas métricas do mini painel + detalhe da conta de repasse + aviso claro de que "em processamento/a receber/recebido" ainda não existe (depende do checkout) |
| `/eventos/[id]/acesso` | Lista quem tem acesso ao evento (nome, email, papel) e formulário pra convidar por email |

`lib/api-client.ts` centraliza o fetch (envelope `{ data }` / `{ error }` do backend, `credentials: "include"` para o cookie de refresh); `lib/events-client.ts`, `lib/tickets-client.ts` e `lib/finance-client.ts` são os clients tipados com `@events-platform/shared-types`. Toda tela autenticada usa `<ProtectedPage>` (`components/protected-page.tsx`), que redireciona para `/login` se não houver sessão. `lib/theme-context.tsx` cuida do claro/escuro (persistido em `localStorage`, aplicado antes da hidratação via script inline em `app/layout.tsx` — sem isso o usuário veria um "flash" do tema errado no load).

**Validação compartilhada** (`packages/shared-types`): `validators/documento.ts` valida CPF/CNPJ por dígito verificador real (não só tamanho — algoritmo oficial da Receita), `data/bancos-brasil.ts` é a lista curada de bancos (código Febraban) usada tanto na validação do Zod quanto no `<Select>` do formulário — usada em vez de texto livre porque elimina "banco que não existe" por digitação.

**Pendente**: `apps/mobile` ainda é só o esqueleto original (chama `/health`) — as telas de check-in/QR entram quando o módulo `checkin` do backend existir; também não tem modo escuro ainda (React Native não lê CSS/Tailwind, precisaria da `Appearance` API do RN + duplicar os tokens, ver nota em `App.tsx`).

## Verificação end-to-end (fatia 1) — feita e confirmada

Testado via `curl` (API direta) e via browser (UI real):
- `pnpm install`, `prisma generate`, `prisma migrate dev`, build de `shared-types`/`api`/`web` sem erros
- Fluxo completo: registro → login → criar evento → criar lote → emitir ingresso (QR gerado, `quantidadeEmitida` incrementado) — funcionando tanto por chamada direta à API quanto pela UI em `/eventos`
- RBAC: requisição sem token → `401`; usuário sem `PapelAcesso` no evento → `403`
- Refresh token: rotação funciona; reapresentar um refresh token já trocado revoga a sessão inteira (detecção de reuso), confirmando o desenho descrito na seção Auth acima
- `/health` (API e página `/status` do web) reportam `database: up`

Também testado, na rodada seguinte (rebrand + financeiro + acesso): fluxo completo criar evento → conta de repasse → financeiro → gestão de acesso, tanto via `curl` quanto via browser (login → evento → mini painel financeiro com valores reais → página Financeiro → tela de acesso). Validação de CPF/CNPJ e banco confirmada rejeitando documento com dígito verificador errado e código de banco inexistente.

## Bugs encontrados e corrigidos durante o teste manual

- **Formulário de criar lote não quebrava linha em telas estreitas** (`apps/web/app/eventos/[id]/page.tsx`) — o campo "Quantidade" ficava fora da viewport. Causa: classes de `flex-grow` (`flex-1`) foram aplicadas direto no `<input>` do componente `Input`, cujo pai real é um `flex flex-col` (o wrapper label+input) — isso fez o campo crescer no eixo vertical (esticando a altura) em vez de crescer horizontalmente na linha do formulário. Corrigido envolvendo o `<Input>` num `<div className="flex-1 min-w-40">` e adicionando `flex-wrap` ao container.

## Lições operacionais (pra quem for mexer depois)

- **`prisma migrate dev` pode resetar o banco inteiro sem avisar direito, se o histórico de migrações estiver "sujo"** (pasta deletada manualmente + linha correspondente removida de `_prisma_migrations`). Isso aconteceu nesta sessão ao mover `ContaBancaria` de `Usuario` pra `Evento` e apagou dados de teste. Pra alterações de schema neste ambiente (sem TTY interativo), o caminho seguro é: `prisma migrate diff --from-migrations ... --to-schema-datamodel ... --script` pra gerar o SQL, salvar manualmente numa pasta de migração, e aplicar com `prisma migrate deploy` (não interativo). Se o banco já tinha tabelas sem `_prisma_migrations` (schema aplicado antes por `db push` ou similar), rodar `prisma migrate resolve --applied <migração>` pra "batizar" o estado atual antes do deploy.
- **Rodar `next build` (produção) enquanto `next dev` está rodando corrompe o `.next/`** — os dois usam formatos de manifest incompatíveis no mesmo diretório. Depois de qualquer `pnpm --filter web build` usado só pra checar erro de tipo, apagar `apps/web/.next` antes de subir o dev server de novo. O mesmo vale pro `apps/api/dist` com `nest build` vs. `nest start --watch`.
- **No Windows, parar uma task em background (`TaskStop`) às vezes não mata o processo `node` filho** — a porta continua ocupada e o próximo `pnpm dev` falha com `EADDRINUSE`. Checar com `netstat -ano | grep ":PORTA"` e `taskkill //PID <pid> //F` se precisar.

**Ambiente sandbox desta sessão não tinha Docker** — a instalação do Docker Desktop e a subida do Postgres (`docker-compose up -d`) foram feitas pelo usuário na própria máquina antes da primeira verificação.
