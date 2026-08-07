import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

/** Mesmo tratamento visual do Input — ver docs/frontend/design-system.md. */
export function Select({ label, id, className = "", children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </label>
      <select
        id={id}
        className={`rounded border border-border/20 bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
