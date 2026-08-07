import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

/** Ver docs/frontend/design-system.md — só deve existir um botão "primary" por tela. */
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-700",
    secondary: "bg-neutral-0 text-neutral-800 border border-neutral-200 hover:bg-neutral-50",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
