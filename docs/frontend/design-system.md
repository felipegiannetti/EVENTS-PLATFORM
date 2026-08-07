[← Voltar à documentação](../README.md)

# Design system — RARO Tickets (`apps/web`)

## Marca

O produto se chama **RARO Tickets**. A **NOVYX** é a empresa dona da plataforma (primeiro produto do portfólio) — o nome NOVYX não aparece pro usuário final dentro do produto (título, header, telas), só em contextos institucionais (rodapé, documentação, contratos). Ver [docs/product/resumo-produto.md](../product/resumo-produto.md) para o contexto do produto.

## Paleta

Inspirada na sinalização física **"CAZA RARO"** (teal sobre parede em tom creme) — mais orgânica e distintiva que um azul/roxo genérico de SaaS, e funciona bem tanto num contexto "balada/evento" quanto num painel operacional sério.

| Token (Tailwind) | Claro | Escuro | Uso |
|---|---|---|---|
| `background` | `#F6F1E7` creme quente | `#1E1A16` carvão quente | Fundo da página |
| `foreground` | `#2A241E` | `#F3EEE3` | Texto principal |
| `card` | `#FFFDF9` | `#28231E` | Fundo de cards/superfícies elevadas |
| `muted` | `#8A7D6E` | `#A89C8E` | Texto secundário |
| `border` | `#2A241E` (com opacidade, ex. `border-border/10`) | `#F3EEE3` (idem) | Bordas e divisores |
| `primary` | `#2C8C81` teal | `#3AA69C` teal (mais claro p/ contraste) | **A única cor de ação do produto** |
| `success` / `warning` / `danger` | verde/âmbar/vermelho ajustados por tema | idem | Só estado — nunca navegação/CTA |

Nenhuma cor é um valor fixo no código dos componentes — tudo é lido de variáveis CSS (`--rt-*`, definidas em [`apps/web/app/globals.css`](../../apps/web/app/globals.css) para `:root` e `:root.dark`) e mapeado em [`packages/config/tailwind-preset.js`](../../packages/config/tailwind-preset.js) via `rgb(var(--rt-x) / <alpha-value>)`. Isso é o que permite um componente usar só `bg-primary`/`text-foreground`/`bg-card` e funcionar em claro e escuro automaticamente, sem nenhuma classe `dark:` espalhada pelas telas.

## Modo claro/escuro

- Implementado em [`apps/web/lib/theme-context.tsx`](../../apps/web/lib/theme-context.tsx): guarda a preferência em `localStorage` (`raro-theme`), usa a preferência do sistema (`prefers-color-scheme`) como padrão na primeira visita, e aplica a classe `dark` na tag `<html>`.
- Um script inline em [`apps/web/app/layout.tsx`](../../apps/web/app/layout.tsx) aplica a classe **antes da hidratação do React**, pra evitar o "flash" de tema errado no carregamento da página.
- `<ThemeToggle />` ([`apps/web/components/ui/theme-toggle.tsx`](../../apps/web/components/ui/theme-toggle.tsx)) fica no header, visível em toda tela.

## Regras de uso (para não precisar decidir de novo a cada tela)

1. **Um botão `primary` (teal) por tela.** É a ação que o produto quer que a pessoa tome ali. Toda outra ação é `secondary` (outline neutro) ou um link de texto.
2. **Cards com `shadow-card` + `rounded` + `bg-card`** — mesmo tratamento visual em toda listagem (eventos, lotes, ingressos).
3. **Formulários**: label acima do campo, erro em `danger` abaixo do campo, botão de submit sempre `primary` e sempre a última coisa do formulário.
4. **Fonte**: Inter (`font-sans`) — moderna, muito legível em telas pequenas.
5. **Nunca usar cor fixa** (`#2C8C81`, `bg-white`, `text-black`...) direto num componente — sempre os tokens semânticos (`bg-primary`, `bg-background`, `text-foreground`) pra não quebrar o modo escuro.

## Como aplicar num novo app do monorepo

```js
// tailwind.config.js do app
const preset = require("@events-platform/config/tailwind-preset");

module.exports = {
  presets: [preset],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
};
```

O app também precisa definir as variáveis `--rt-*` (copiar o bloco `:root` / `:root.dark` de `apps/web/app/globals.css`) e aplicar a classe `dark` na raiz — hoje só `apps/web` faz isso; `apps/mobile` ainda usa cores fixas (ver nota em `App.tsx`) porque React Native não lê CSS/Tailwind.
