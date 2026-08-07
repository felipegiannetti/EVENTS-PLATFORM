/**
 * Design system do RARO Tickets — ver docs/frontend/design-system.md para o racional
 * (paleta inspirada na sinalização "CAZA RARO": teal sobre creme quente) e as regras de uso.
 *
 * As cores são variáveis CSS (definidas em apps/web/app/globals.css para :root e .dark),
 * não valores fixos — é isso que permite o mesmo componente (`bg-background`, `text-foreground`,
 * `bg-primary`...) funcionar em claro e escuro sem nenhuma classe `dark:` espalhada pelo código.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--rt-background) / <alpha-value>)",
        foreground: "rgb(var(--rt-foreground) / <alpha-value>)",
        card: "rgb(var(--rt-card) / <alpha-value>)",
        muted: "rgb(var(--rt-muted) / <alpha-value>)",
        border: "rgb(var(--rt-border) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--rt-primary) / <alpha-value>)",
          foreground: "rgb(var(--rt-primary-foreground) / <alpha-value>)",
        },
        success: "rgb(var(--rt-success) / <alpha-value>)",
        warning: "rgb(var(--rt-warning) / <alpha-value>)",
        danger: "rgb(var(--rt-danger) / <alpha-value>)",
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        sm: "0.5rem",
        lg: "1rem",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 10 35 / 0.04), 0 14px 40px rgb(20 12 55 / 0.08)",
        glow: "0 16px 48px rgb(109 40 217 / 0.28)",
      },
    },
  },
  plugins: [],
};
