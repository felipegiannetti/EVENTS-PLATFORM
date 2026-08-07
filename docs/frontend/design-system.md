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

## Conteúdo orientado pelo banco

A home consulta `GET /events/public`. Não existem nomes, quantidades ou cards de eventos fictícios no frontend.

- Eventos exibidos são registros da tabela `eventos`.
- Categorias sem eventos não são renderizadas.
- Contagens são calculadas a partir da resposta da API.
- Busca e filtro trabalham sobre os eventos reais carregados.
- O filtro de localização usa a composição `cidade, estado, país`; nomes de arenas ou estabelecimentos não entram no dropdown.
- O header apresenta somente uma lupa para entrada na busca pública.
- A rota `/eventos/todos` concentra a barra de pesquisa e os filtros adicionais.
- Cards de categoria navegam para `/eventos/todos?categoria=<categoria>`.
- Cada evento recebe uma das categorias predefinidas: Shows, Festivais, Negócios, Esportes, Cursos, Tecnologia ou Outros.
- `Outros` é uma classificação final e não abre campo de texto adicional.

## Componentes compartilhados

| Componente | Responsabilidade |
|---|---|
| `Header` | Marca RARO Tickets, navegação, autenticação e menu mobile |
| `Footer` | Navegação institucional e copyright da Novyx |
| `AuthShell` | Composição visual de login e cadastro |
| `Button` | Variantes primária e secundária |
| `Card` | Superfície padrão |
| `Input` / `Select` | Campos acessíveis e consistentes |
| `Stat` | Métricas financeiras e operacionais |
| `ProtectedPage` | Proteção de rotas e carregamento |

## Responsividade e acessibilidade

- Navegação desktop vira menu recolhível em telas pequenas.
- Grids reduzem de múltiplas colunas para uma ou duas.
- Formulários e CTAs ocupam a largura disponível no mobile.
- Controles possuem labels ou `aria-label`.
- Foco de teclado é visível e usa o token primário.
