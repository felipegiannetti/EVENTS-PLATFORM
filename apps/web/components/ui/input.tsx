import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/** Label acima, erro em vermelho abaixo — ver docs/frontend/design-system.md. */
export function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground/80">
        {label}
      </label>
      <input
        id={id}
        className={`h-12 rounded-xl border bg-background/60 px-4 text-sm text-foreground shadow-inner outline-none transition-all placeholder:text-muted/60 ${
          error ? "border-danger focus:ring-4 focus:ring-danger/10" : "border-border/15 focus:border-primary focus:ring-4 focus:ring-primary/10"
        } ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
