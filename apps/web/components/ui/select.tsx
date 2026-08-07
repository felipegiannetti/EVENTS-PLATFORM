import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

/** Mesmo tratamento visual do Input — ver docs/frontend/design-system.md. */
export function Select({ label, id, className = "", children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground/80">
        {label}
      </label>
      <select
        id={id}
        className={`h-12 rounded-xl border border-border/15 bg-background/60 px-4 text-sm text-foreground shadow-inner outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
