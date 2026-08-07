import type { HTMLAttributes } from "react";

/** Mesmo tratamento visual em toda listagem/formulário — ver docs/frontend/design-system.md. */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg bg-neutral-0 p-6 shadow-card border border-neutral-100 ${className}`}
      {...props}
    />
  );
}
