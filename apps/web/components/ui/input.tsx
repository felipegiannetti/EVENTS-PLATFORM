import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/** Label acima, erro em vermelho abaixo — ver docs/frontend/design-system.md. */
export function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={id}
        className={`rounded border px-3 py-2 text-sm text-neutral-900 outline-none transition-colors ${
          error
            ? "border-danger focus:border-danger"
            : "border-neutral-200 focus:border-primary"
        } ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
