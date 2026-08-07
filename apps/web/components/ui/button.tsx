import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

/** Ver docs/frontend/design-system.md — só deve existir um botão "primary" por tela. */
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-transparent text-foreground border border-border/20 hover:bg-border/5",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
