import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

/** Mesmo visual do Input, só que multi-linha — ver docs/frontend/design-system.md. */
export function Textarea({ label, error, id, className = "", ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground/80">
        {label}
      </label>
      <textarea
        id={id}
        className={`min-h-32 rounded-xl border bg-background/60 px-4 py-3 text-sm text-foreground shadow-inner outline-none transition-all placeholder:text-muted/60 ${
          error ? "border-danger focus:ring-4 focus:ring-danger/10" : "border-border/15 focus:border-primary focus:ring-4 focus:ring-primary/10"
        } ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
