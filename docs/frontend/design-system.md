[← Voltar à documentação](../README.md)

# Design system — RARO Tickets

## Identidade

O produto exibido ao usuário se chama **RARO Tickets**. A Novyx é a proprietária e aparece na interface somente no copyright: `© 2026 Novyx. Todos os direitos reservados.`

A linguagem visual combina entretenimento e tecnologia: superfícies claras, violeta elétrico, azul profundo, iluminação ambiente, cards arredondados e bastante espaço visual. A iconografia funcional usa `lucide-react`.

## Tema

A aplicação possui apenas tema claro. Não existem toggle, classe `.dark`, preferência em `localStorage` ou detecção de tema do sistema.

| Token | Valor | Uso |
|---|---:|---|
| `background` | `#F7F7FC` | Fundo principal |
| `foreground` | `#161526` | Texto principal |
| `card` | `#FFFFFF` | Cards e superfícies |
| `muted` | `#67657E` | Texto secundário |
| `primary` | `#6D28D9` | CTA, links e foco |
| `success` | `#059669` | Estados positivos |
| `warning` | `#D97706` | Alertas |
| `danger` | `#E11D48` | Erros e ações destrutivas |

Os tokens ficam em `apps/web/app/globals.css` e são mapeados para o Tailwind por `packages/config/tailwind-preset.js`.

## Classes utilitárias (`@layer components` em `globals.css`)

Em vez de repetir a mesma combinação de classes Tailwind em toda página, o layout comum vira uma classe única — usar estas em vez de recriar o padrão manualmente:

| Classe | Uso |
|---|---|
| `.page-shell` | Container de página: largura máxima, padding responsivo. Todo `<main>` de página começa com ela. |
| `.eyebrow` | Selo pequeno acima do título (ex: "Etapa 1 de 2", "Bem-vindo à RARO Tickets") |
| `.page-title` | Título principal da página (`<h1>`) |
| `.page-description` | Parágrafo de apoio logo abaixo do título |
| `.section-title` | Título de seção dentro de uma página (`<h2>`) |
| `.glass-panel` | Superfície com blur e transparência (usada em painéis flutuantes) |
| `.grid-pattern` | Fundo com grade sutil (uso decorativo) |
| `.search-shell` | Estado de foco customizado para containers de busca (usado no catálogo e no modal de localização) |

## Conteúdo orientado pelo banco

A home consulta `GET /events/public`. Não existem nomes, quantidades ou cards de eventos fictícios no frontend.

- Eventos exibidos são registros da tabela `eventos`.
- Categorias sem eventos não são renderizadas.
- Contagens são calculadas a partir da resposta da API.
- Busca e filtro trabalham sobre os eventos reais carregados.
- O filtro de localização usa a composição `cidade, estado, país`; nomes de arenas ou estabelecimentos não entram no dropdown. A UI é o `LocationFilterModal` (busca + "usar minha localização atual" + lista), não um `<select>` simples — ver seção de componentes.
- O filtro de data usa um seletor de calendário e exibe somente eventos do dia escolhido.
- O header apresenta somente uma lupa para entrada na busca pública.
- A rota `/eventos/todos` concentra a barra de pesquisa e os filtros adicionais.
- Cards de categoria navegam para `/eventos/todos?categoria=<categoria>`.
- Cada evento recebe uma das categorias predefinidas: Shows, Festivais, Negócios, Esportes, Cursos, Tecnologia ou Outros.
- `Outros` é uma classificação final e não abre campo de texto adicional.
- O card do evento (home e catálogo) mostra o banner enviado pelo organizador (`evento.temBanner` → `GET /events/:id/banner`) quando existe; senão cai numa foto de estoque por categoria (`categoryImages`/`categoryStyle`, só front-end, não vem do banco).

## Cadastro (pessoa física ou jurídica)

O formulário de `/registro` alterna entre **Pessoa física** (CPF + data de nascimento, rótulo "Nome completo") e **Pessoa jurídica** (CNPJ, sem data de nascimento, rótulo "Razão social") — mesmo campo `nome` no banco, o rótulo só muda na UI. CPF/CNPJ são validados no blur do campo usando `validarCpf`/`validarCnpj` de `@events-platform/shared-types` (mesmas funções que o backend usa) — dá feedback antes do submit, mas a validação de verdade (que barra o cadastro) é sempre no backend.

O campo de documento aplica **máscara progressiva** enquanto digita (`apps/web/lib/formatters.ts` — `formatarCpf`/`formatarCnpj`/`formatarDocumento`), trocando de máscara junto com o toggle PF/PJ — nunca mostra só números crus. O mesmo helper (`formatarCpfOuCnpj`, que detecta o tipo pela quantidade de dígitos) é usado no campo de titular da conta de repasse, que não tem seletor de PF/PJ. O formulário também pede **Confirmar senha** (campo só de UI — não é enviado ao backend, só compara com "Senha" no blur e no submit).

## Componentes compartilhados

| Componente | Responsabilidade |
|---|---|
| `Header` | Marca RARO Tickets, navegação, autenticação e menu mobile. A navbar pública (Eventos, Categorias, Para organizadores, Como funciona) **fica sempre visível** — logado só ganha itens extras à frente (ex: "Meus eventos"), nunca perde os públicos |
| `Footer` | Navegação institucional e copyright da Novyx |
| `AuthShell` | Composição visual de login e cadastro |
| `Button` | Variantes primária e secundária |
| `Card` | Superfície padrão |
| `Input` / `Select` / `Textarea` | Campos acessíveis e consistentes — mesmo visual (label acima, erro abaixo), `Textarea` usada só na descrição do evento (etapa 4 do assistente) |
| `Stat` | Métricas financeiras e operacionais (`apps/web/components/ui/stat.tsx`, junto do helper `formatarReais`) |
| `ProtectedPage` | Proteção de rotas e carregamento |
| `LocationFilterModal` | Modal de localização estilo Sympla (busca + geolocalização + lista) — `apps/web/components/location-filter-modal.tsx`, usado em `/eventos/todos` |

**Upload de banner** não é um componente compartilhado — existe um bloco `BannerUploader` em `apps/web/app/eventos/[id]/page.tsx` (painel do evento) e um segundo, semelhante mas próprio, em `apps/web/app/eventos/[id]/detalhes/page.tsx` (etapa 4 do assistente) — não foi extraído em componente único porque cada tela tem um layout de card diferente ao redor.

## Assistente de criação de evento (4 etapas)

`/eventos/novo` → `/eventos/[id]/conta-repasse` → `/eventos/[id]/acesso` → `/eventos/[id]/detalhes`, cada etapa com `Etapa N de 4` no `.eyebrow` do card. Só a etapa 1 (dados básicos) é obrigatória para o evento existir — as etapas 2, 3 e 4 têm sempre um jeito de pular ("Cadastrar depois" / "Pular por enquanto" / "Concluir depois") que leva direto pro painel do evento (`/eventos/[id]`), e os mesmos formulários continuam acessíveis por lá a qualquer momento (Financeiro, Quem tem acesso, editar banner/descrição/contato).

**Visibilidade para compradores, não "publicar/rascunho"**: ao final da etapa 1, um popup pergunta "Compradores já podem ver esse evento?" ("Sim, deixar visível para compradores" / "Não, manter privado por enquanto"). O evento é sempre criado **por completo** nesse momento — a escolha não afeta se o evento existe ou está "pronto", só se ele aparece no catálogo público (`GET /events/public`, campo `Evento.publicado`). Um evento privado continua com todos os dados, lotes e banner configuráveis normalmente; só não aparece pra quem não tem `PapelAcesso` nele. O painel do evento sempre mostra um badge de status ("Visível para compradores" / "Privado — visível só para você e sua equipe") com um botão pra alternar ("Liberar para compradores" / "Tornar privado") a qualquer momento, nas duas direções.

## Responsividade e acessibilidade

- Navegação desktop vira menu recolhível em telas pequenas.
- Grids reduzem de múltiplas colunas para uma ou duas.
- Formulários e CTAs ocupam a largura disponível no mobile.
- Controles possuem labels ou `aria-label`.
- Foco de teclado é visível e usa o token primário.
