"use client";

import { HelpCircle } from "lucide-react";

/** Ícone "?" — hover mostra a explicação num balão, em vez de texto explicativo sempre visível na tela. */
export function HelpTooltip({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <span className={`group relative inline-flex align-middle ${className}`} tabIndex={0} role="button" aria-label={texto}>
      <HelpCircle size={14} className="cursor-help text-muted/60 transition-colors hover:text-primary" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-xl border border-border/15 bg-card px-3 py-2.5 text-xs font-normal normal-case leading-relaxed text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100">
        {texto}
      </span>
    </span>
  );
}
