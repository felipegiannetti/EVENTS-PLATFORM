"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Ticket } from "lucide-react";
import type { MeuIngressoResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { ApiError } from "@/lib/api-client";
import { COR_STATUS_INGRESSO, ROTULO_STATUS_INGRESSO } from "@/lib/status-ingresso";
import { listarMeusIngressos } from "@/lib/tickets-client";

type Filtro = "proximos" | "passados";

export default function MeusIngressosPage() {
  return <ProtectedPage>{(token) => <ListaMeusIngressos token={token} />}</ProtectedPage>;
}

function ListaMeusIngressos({ token }: { token: string }) {
  const [ingressos, setIngressos] = useState<MeuIngressoResponse[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("proximos");

  useEffect(() => {
    listarMeusIngressos(token)
      .then(setIngressos)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar seus ingressos."));
  }, [token]);

  const agora = new Date();
  const proximos = ingressos?.filter((i) => new Date(i.eventoData) >= agora) ?? [];
  const passados = ingressos?.filter((i) => new Date(i.eventoData) < agora) ?? [];
  const exibidos = filtro === "proximos" ? proximos : passados;

  return (
    <main className="page-shell max-w-3xl">
      <span className="eyebrow">
        <Ticket size={12} /> Meus ingressos
      </span>
      <h1 className="page-title">Seus ingressos</h1>
      <p className="page-description">
        Ingressos vinculados ao seu email. Ainda não existe compra self-service — se um organizador
        emitiu um ingresso com seu email, ele aparece aqui.
      </p>

      {erro && <p className="mt-6 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}

      {ingressos === null && !erro && <p className="mt-8 text-sm text-muted">Carregando...</p>}

      {ingressos !== null && (
        <>
          <div className="mt-8 inline-flex rounded-xl border border-border/15 bg-background/60 p-1">
            {([
              ["proximos", `Próximos (${proximos.length})`],
              ["passados", `Passados (${passados.length})`],
            ] as const).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                className={`h-10 rounded-lg px-4 text-sm font-semibold transition-all ${
                  filtro === valor ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {exibidos.map((ingresso) => (
              <Card key={ingresso.id} className="flex items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-medium text-foreground">{ingresso.eventoNome}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <CalendarDays size={14} /> {new Date(ingresso.eventoData).toLocaleString("pt-BR")}
                  </p>
                </div>
                <StatusDot cor={COR_STATUS_INGRESSO[ingresso.status]} rotulo={ROTULO_STATUS_INGRESSO[ingresso.status]} className="shrink-0" />
              </Card>
            ))}
            {exibidos.length === 0 && (
              <p className="text-sm text-muted">
                {filtro === "proximos" ? "Nenhum ingresso para eventos futuros." : "Nenhum ingresso de eventos passados."}
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
