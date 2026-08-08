import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  /** Mostra um spinner antes do conteúdo e força `disabled` — use pra qualquer ação assíncrona (submit, troca de etapa etc). */
  loading?: boolean;
}

/** Ver docs/frontend/design-system.md — só deve existir um botão "primary" por tela. */
export function Button({ variant = "primary", className = "", loading = false, disabled, children, ...props }: ButtonProps) {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";
  const variants = {
    primary: "bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-[0_10px_28px_rgb(109_40_217/0.24)] hover:-translate-y-0.5 hover:shadow-glow",
    secondary: "border border-border/15 bg-card/70 text-foreground shadow-sm backdrop-blur hover:border-primary/30 hover:bg-primary/5",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current"
        />
      )}
      {children}
    </button>
  );
}
