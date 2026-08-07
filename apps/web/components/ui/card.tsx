import type { HTMLAttributes } from "react";

/** Mesmo tratamento visual em toda listagem/formulário — ver docs/frontend/design-system.md. */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border/10 bg-card/85 p-6 shadow-card backdrop-blur-sm transition-colors ${className}`}
      {...props}
    />
  );
}
