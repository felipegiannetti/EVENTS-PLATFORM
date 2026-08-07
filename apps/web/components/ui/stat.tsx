interface StatProps {
  label: string;
  value: string;
  hint?: string;
}

/** Mini métrica (número grande + rótulo) — usado no painel do evento e na tela Financeiro. */
export function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="rounded-xl border border-border/10 bg-background/45 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
