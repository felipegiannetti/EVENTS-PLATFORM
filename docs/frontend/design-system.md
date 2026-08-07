[← Voltar à documentação](../README.md)

# Design system — Novyx

## Identidade

O nome exibido na experiência web é **Novyx**. A linguagem visual combina entretenimento e tecnologia: superfícies limpas, violeta elétrico, azul profundo, iluminação ambiente, cards arredondados e bastante espaço visual.

O símbolo usa um ticket dentro de um quadrado arredondado com gradiente. Os ícones funcionais vêm de `lucide-react`, evitando estilos inconsistentes entre telas.

## Paleta semântica

Os tokens ficam em `apps/web/app/globals.css` e são expostos ao Tailwind por `packages/config/tailwind-preset.js`.

| Token | Tema claro | Tema escuro | Uso |
|---|---:|---:|---|
| `background` | `#F7F7FC` | `#060814` | Fundo principal |
| `foreground` | `#161526` | `#F4F4FF` | Texto principal |
| `card` | `#FFFFFF` | `#0E1226` | Cards e superfícies |
| `muted` | `#67657E` | `#9D9FBB` | Texto secundário |
| `primary` | `#6D28D9` | `#8541FF` | CTA, links e foco |
| `success` | `#059669` | `#34D399` | Estados positivos |
| `warning` | `#D97706` | `#FBBF24` | Alertas |
| `danger` | `#E11D48` | `#FB7185` | Erros e ações destrutivas |

As cores são variáveis CSS no formato RGB, permitindo opacidade com classes como `bg-primary/10` e troca instantânea de tema.

## Temas claro e escuro

- A preferência é persistida em `localStorage` pela chave `raro-theme`, mantida por compatibilidade.
- Na primeira visita, o sistema respeita `prefers-color-scheme`.
- O tema é aplicado antes da hidratação em `app/layout.tsx`, evitando flash de cores incorretas.
- O controle global fica no header e utiliza os ícones `Sun` e `Moon`.
- Ambos os temas compartilham hierarquia, espaçamento e componentes; somente os tokens mudam.

## Estrutura visual

- Largura principal: `max-w-6xl`, com `20px` a `32px` de margem lateral.
- Cards: raio de `16px`, borda semântica discreta, fundo translúcido e sombra suave.
- Blocos de destaque: raio de `32px` e gradientes violeta/azul.
- Botão primário: gradiente violeta, sombra colorida e pequena elevação no hover.
- Botão secundário: superfície neutra com borda e realce violeta no hover.
- Campos: altura de `48px`, raio de `12px`, label acima e anel violeta no foco.
- Tipografia: stack baseada em Inter e fontes de sistema, títulos com tracking negativo.

## Componentes compartilhados

| Componente | Responsabilidade |
|---|---|
| `Header` | Marca, navegação, autenticação, tema e menu mobile |
| `Footer` | Navegação institucional e assinatura da marca |
| `AuthShell` | Composição visual compartilhada por login e cadastro |
| `Button` | Variantes primária e secundária |
| `Card` | Superfície padrão do produto |
| `Input` / `Select` | Campos acessíveis e consistentes |
| `Stat` | Métricas financeiras e operacionais |
| `ProtectedPage` | Proteção de rotas e estado de carregamento |

## Home pública

A página inicial segue esta ordem:

1. Hero com imagem de evento, proposta de valor, busca e filtros rápidos.
2. Categorias de eventos.
3. Eventos em destaque.
4. Conversão para organizadores com prévia do dashboard.
5. Jornada em quatro etapas.
6. Newsletter.
7. Footer institucional.

## Áreas autenticadas

O mesmo sistema visual é aplicado a `/eventos`, criação de evento, detalhes, lotes, ingressos, financeiro, conta de repasse, equipe e status. Estados vazios, carregamentos e mensagens de erro usam superfícies e cores semânticas.

## Responsividade e acessibilidade

- Navegação desktop vira menu recolhível em telas pequenas.
- Grids reduzem progressivamente de quatro/seis colunas para uma ou duas.
- Formulários e CTAs ocupam a largura disponível no mobile.
- Controles possuem labels ou `aria-label`.
- Foco de teclado é visível e usa o token primário.
- Textos e superfícies mantêm contraste nos dois temas.
