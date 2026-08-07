import type { HTMLAttributes } from "react";

/** Mesmo tratamento visual em toda listagem/formulário — ver docs/frontend/design-system.md. */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-border/10 bg-card p-6 shadow-card ${className}`}
      {...props}
    />
  );
}
