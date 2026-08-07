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
| `GET /events/:id/acesso`, `POST .../acesso`, `DELETE .../acesso/:usuarioId` | owner | Gerencia quem tem acesso ao evento e com qual papel |

### Tickets (`apps/api/src/tickets/`)

| Rota | Papel mínimo | Descrição |
|---|---|---|
| `POST /events/:id/lotes/:loteId/ingressos` | gestor+ | Emissão manual/gratuita (compra paga entra na fatia de `checkout`); gera `qrToken` assinado (HMAC-SHA256, ver `qr-token.util.ts`) |
| `GET /events/:id/ingressos` | view+ | Lista ingressos do evento |
| `GET /events/:id/ingressos/:ticketId` | view+ | Detalhe (inclui o `qrToken`) |
| `PATCH /events/:id/ingressos/:ticketId/status` | gestor+ | Cancela o ingresso |

*Nota: o plano original descrevia `GET /tickets/:id` solto — ficou aninhado em `/events/:id/ingressos/:ticketId` porque o `EventRoleGuard` precisa do `eventoId` na própria rota para checar o papel do usuário.* A validação do QR em si (check-in) fica para o módulo `checkin`, ainda não implementado.

## Frontend (`apps/web`)

Construído em paralelo ao backend — a regra do time é sempre ter a tela de cada funcionalidade pronta assim que o módulo correspondente da API existe (ver [docs/frontend/design-system.md](../frontend/design-system.md) para a paleta e as regras de UI usadas em todas as telas abaixo).

| Rota | Descrição |
|---|---|
| `/login`, `/registro` | Autenticação — usam `lib/auth-context.tsx`, que guarda o access token só em memória e faz refresh silencioso (cookie `httpOnly`) ao montar |
| `/status` | Health check da API (esqueleto original da fatia 1) |
| `/eventos` | Lista os eventos do usuário logado |
| `/eventos/novo` | Formulário de criação de evento |
| `/eventos/[id]` | Detalhe: lotes (com criação inline) e ingressos emitidos (com emissão manual por lote) |

`lib/api-client.ts` centraliza o fetch (envelope `{ data }` / `{ error }` do backend, `credentials: "include"` para o cookie de refresh); `lib/events-client.ts` e `lib/tickets-client.ts` são os clients tipados com `@events-platform/shared-types`. Toda tela autenticada usa `<ProtectedPage>` (`components/protected-page.tsx`), que redireciona para `/login` se não houver sessão.

**Pendente**: `apps/mobile` ainda é só o esqueleto original (chama `/health`) — as telas de check-in/QR entram quando o módulo `checkin` do backend existir.

## Verificação end-to-end (fatia 1) — feita e confirmada

Testado via `curl` (API direta) e via browser (UI real):
- `pnpm install`, `prisma generate`, `prisma migrate dev`, build de `shared-types`/`api`/`web` sem erros
- Fluxo completo: registro → login → criar evento → criar lote → emitir ingresso (QR gerado, `quantidadeEmitida` incrementado) — funcionando tanto por chamada direta à API quanto pela UI em `/eventos`
- RBAC: requisição sem token → `401`; usuário sem `PapelAcesso` no evento → `403`
- Refresh token: rotação funciona; reapresentar um refresh token já trocado revoga a sessão inteira (detecção de reuso), confirmando o desenho descrito na seção Auth acima
- `/health` (API e página `/status` do web) reportam `database: up`

**Bug encontrado e corrigido durante o teste manual**: o formulário de criar lote (`apps/web/app/eventos/[id]/page.tsx`) não quebrava linha em telas estreitas — o campo "Quantidade" ficava fora da viewport. Causa raiz: classes de `flex-grow` (`flex-1`) foram aplicadas direto no `<input>` do componente `Input`, cujo pai real é um `flex flex-col` (o wrapper label+input) — isso fez o campo crescer no eixo vertical (esticando a altura) em vez de crescer horizontalmente na linha do formulário. Corrigido envolvendo o `<Input>` num `<div className="flex-1 min-w-40">` no formulário, e adicionando `flex-wrap` ao container — os campos de preço/quantidade agora quebram pra a linha de baixo em telas estreitas em vez de estourar a viewport.

**Ambiente sandbox desta sessão não tinha Docker** — a instalação do Docker Desktop e a subida do Postgres (`docker-compose up -d`) foram feitas pelo usuário na própria máquina antes desta verificação.
