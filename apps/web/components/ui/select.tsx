import type { SelectHTMLAttributes } from "react";
import { HelpTooltip } from "./help-tooltip";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  ajuda?: string;
}

/** Mesmo tratamento visual do Input — ver docs/frontend/design-system.md. */
export function Select({ label, ajuda, id, className = "", children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-sm font-semibold text-foreground/80">{label}</label>
        {ajuda && <HelpTooltip texto={ajuda} />}
      </div>
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
