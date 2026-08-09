import { ChevronLeft, ChevronRight } from "lucide-react";

export const ITENS_POR_PAGINA = 20;

export function Pagination({
  pagina,
  totalPaginas,
  onMudarPagina,
}: {
  pagina: number;
  totalPaginas: number;
  onMudarPagina: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">
        Página {pagina} de {totalPaginas}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pagina <= 1}
          onClick={() => onMudarPagina(pagina - 1)}
          aria-label="Página anterior"
          className="grid h-9 w-9 place-items-center rounded-lg border border-border/15 text-muted transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          disabled={pagina >= totalPaginas}
          onClick={() => onMudarPagina(pagina + 1)}
          aria-label="Próxima página"
          className="grid h-9 w-9 place-items-center rounded-lg border border-border/15 text-muted transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
