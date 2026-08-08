"use client";

import { useParams } from "next/navigation";
import { EventWorkspaceSidebar } from "@/components/event-workspace-sidebar";
import { useIsEventWorkspace } from "@/lib/event-workspace";

/**
 * Alterna entre o assistente de criação (?wizard=1 — card centralizado, sem sidebar, ver
 * app/eventos/novo/page.tsx) e o painel do evento (sidebar própria estilo Sympla, sem a navbar
 * geral do site — Header/Footer já se escondem sozinhos via useIsEventWorkspace).
 */
export default function EventoLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const emWorkspace = useIsEventWorkspace();

  if (!emWorkspace) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <EventWorkspaceSidebar eventoId={id} />
      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
