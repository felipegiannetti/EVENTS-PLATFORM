[← Voltar à documentação](../README.md)

# Design system — apps/web

## Objetivo

Interface **clara, moderna e fácil de aprender**: quem abre uma tela pela primeira vez deve entender o que fazer sem precisar pensar muito — a hierarquia visual (cor, tamanho, posição) já indica qual é a ação principal. Isso é feito reduzindo decisão subjetiva: poucas cores com papel bem definido, uma única ação de destaque por tela.

Definido em [`packages/config/tailwind-preset.js`](../../packages/config/tailwind-preset.js) e usado por `apps/web` (e futuramente `apps/mobile`).

## Paleta

| Token | Uso |
|---|---|
| `primary` (roxo, `#7C3AED`) | **A única cor de ação principal do produto.** Botão primário, link ativo, ícone selecionado. Nunca usar duas cores de destaque concorrendo na mesma tela — se duas ações parecem igualmente importantes, uma delas vira `neutral` (botão secundário/outline). |
| `neutral` (escala de cinza-azulado, 0–900) | Texto, fundo, bordas, botões secundários. `neutral-900` é o texto principal, `neutral-500` texto secundário, `neutral-200` bordas/divisores, `neutral-50`/`0` fundo. |
| `success` / `warning` / `danger` | Só para estado (confirmação, alerta, erro) — nunca para ação de navegação/CTA. Ex: badge "ingresso válido" (success), erro de formulário (danger). |

## Regras de uso (para não precisar decidir de novo a cada tela)

1. **Um botão `primary` por tela.** É a ação que o produto quer que a pessoa tome ali (ex: "Criar evento", "Entrar"). Toda outra ação é `neutral` (outline/ghost) ou um link de texto.
2. **Cards com `shadow-card` + `rounded` (0.75rem)** — mesmo tratamento visual em toda listagem (eventos, lotes, ingressos), para a pessoa reconhecer o padrão em qualquer tela nova.
3. **Formulários**: label acima do campo, erro em `danger` abaixo do campo, botão de submit sempre `primary` e sempre a última coisa do formulário.
4. **Fonte**: Inter (`font-sans` já configurado no preset) — moderna, muito legível em telas pequenas (importante já pensando no futuro app).
5. **Fundo padrão `neutral-50`, cards em `neutral-0` (branco)** — dá profundidade sem precisar de bordas fortes em todo lugar.

## Como aplicar num novo app do monorepo

```js
// tailwind.config.js do app
const preset = require("@events-platform/config/tailwind-preset");

module.exports = {
  presets: [preset],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
};
```
