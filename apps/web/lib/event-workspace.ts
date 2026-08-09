"use client";

import { usePathname, useSearchParams } from "next/navigation";

const ROTAS_SEM_WORKSPACE = new Set(["novo", "todos"]);

/**
 * Detecta se a rota atual é o "painel do evento" (sidebar própria, sem navbar geral do site) —
 * qualquer /eventos/{id}/... que não seja /eventos/novo ou /eventos/todos, e que não esteja em
 * modo assistente (?wizard=1, usado só durante a criação do evento — ver detalhes em
 * docs/frontend/design-system.md).
 */
export function useIsEventWorkspace(): boolean {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segmentos = pathname.split("/").filter(Boolean);

  if (segmentos[0] !== "eventos" || !segmentos[1] || ROTAS_SEM_WORKSPACE.has(segmentos[1])) {
    return false;
  }
  return searchParams.get("wizard") !== "1";
}
