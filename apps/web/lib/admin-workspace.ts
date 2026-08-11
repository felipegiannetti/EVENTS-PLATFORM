"use client";

import { usePathname } from "next/navigation";

/**
 * Detecta se a rota atual é o painel do admin (sidebar própria — Suporte/Administrador/Sistema/
 * Financeiro —, sem a navbar geral do site) — qualquer /admin/... Pensada pra um dia virar um
 * subdomínio próprio (ver docs/architecture/11-roadmap.md), por isso já vive isolada como uma
 * "workspace" no mesmo padrão de useIsEventWorkspace.
 */
export function useIsAdminWorkspace(): boolean {
  const pathname = usePathname();
  const segmentos = pathname.split("/").filter(Boolean);
  return segmentos[0] === "admin";
}
