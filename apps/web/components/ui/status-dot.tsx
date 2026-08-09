/** Bolinha colorida + rótulo — mesmo padrão usado no status de evento em /eventos. */
export function StatusDot({ cor, rotulo, className = "" }: { cor: string; rotulo: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold text-foreground ${className}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${cor}`} /> {rotulo}
    </span>
  );
}
