interface StatProps {
  label: string;
  value: string;
  hint?: string;
}

/** Mini métrica (número grande + rótulo) — usado no painel do evento e na tela Financeiro. */
export function Stat({ label, value, hint }: StatProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
