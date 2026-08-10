"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Clock3, Sparkles, Ticket, Tickets } from "lucide-react";
import type { MeuIngressoResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { StatusDot } from "@/components/ui/status-dot";
import { TicketQrModal } from "@/components/ticket-qr-modal";
import { ApiError } from "@/lib/api-client";
import { COR_STATUS_INGRESSO, ROTULO_STATUS_INGRESSO } from "@/lib/status-ingresso";
import { listarMeusIngressos } from "@/lib/tickets-client";

type Filtro = "proximos" | "passados";

interface GrupoIngressos {
  eventoId: string;
  eventoNome: string;
  eventoData: string;
  ingressos: MeuIngressoResponse[];
}

export default function MeusIngressosPage() {
  return <ProtectedPage>{(token) => <ListaMeusIngressos token={token} />}</ProtectedPage>;
}

function ListaMeusIngressos({ token }: { token: string }) {
  const [ingressos, setIngressos] = useState<MeuIngressoResponse[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("proximos");
  const [eventoAberto, setEventoAberto] = useState<string | null>(null);
  const [ingressoSelecionado, setIngressoSelecionado] = useState<MeuIngressoResponse | null>(null);

  useEffect(() => {
    listarMeusIngressos(token)
      .then(setIngressos)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar seus ingressos."));
  }, [token]);

  const agora = new Date();
  const proximos = ingressos?.filter((i) => new Date(i.eventoData) >= agora) ?? [];
  const passados = ingressos?.filter((i) => new Date(i.eventoData) < agora) ?? [];
  const exibidos = filtro === "proximos" ? proximos : passados;
  const grupos = useMemo(() => agruparPorEvento(exibidos), [exibidos]);

  function selecionarGrupo(grupo: GrupoIngressos) {
    if (grupo.ingressos.length === 1) {
      setIngressoSelecionado(grupo.ingressos[0]);
      return;
    }
    setEventoAberto((atual) => (atual === grupo.eventoId ? null : grupo.eventoId));
  }

  function trocarFiltro(novoFiltro: Filtro) {
    setFiltro(novoFiltro);
    setEventoAberto(null);
  }

  function removerIngressoTransferido(id: string) {
    setIngressos((atuais) => atuais?.filter((ingresso) => ingresso.id !== id) ?? null);
  }

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow">
        <Ticket size={12} /> Minha carteira
      </span>
      <h1 className="page-title">Seus ingressos</h1>
      <p className="page-description">Todos os seus eventos em um só lugar. Escolha um ingresso para abrir o QR code.</p>

      {erro && <p className="mt-6 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}
      {ingressos === null && !erro && <CarteiraSkeleton />}

      {ingressos !== null && (
        <>
          <div className="mt-8 grid w-full grid-cols-2 rounded-2xl border border-border/10 bg-card/70 p-1.5 shadow-sm backdrop-blur">
            {([
              ["proximos", "Próximos", proximos.length],
              ["passados", "Passados", passados.length],
            ] as const).map(([valor, rotulo, quantidade]) => (
              <button
                key={valor}
                type="button"
                onClick={() => trocarFiltro(valor)}
                aria-pressed={filtro === valor}
                className={`flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all ${
                  filtro === valor
                    ? "bg-primary text-primary-foreground shadow-[0_8px_22px_rgb(109_40_217/0.22)]"
                    : "text-muted hover:bg-primary/5 hover:text-foreground"
                }`}
              >
                {rotulo}
                <span className={`rounded-full px-2 py-0.5 text-xs ${filtro === valor ? "bg-white/20" : "bg-surface"}`}>
                  {quantidade}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {grupos.map((grupo) => {
              const temMaisDeUm = grupo.ingressos.length > 1;
              const aberto = eventoAberto === grupo.eventoId;
              return (
                <article
                  key={grupo.eventoId}
                  className={`overflow-hidden rounded-3xl border bg-card/90 shadow-card backdrop-blur-sm transition-all ${
                    aberto ? "border-primary/25 shadow-[0_18px_50px_rgb(46_40_88/0.12)]" : "border-border/10 hover:border-primary/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selecionarGrupo(grupo)}
                    aria-expanded={temMaisDeUm ? aberto : undefined}
                    className="group flex w-full items-center gap-4 p-4 text-left sm:gap-5 sm:p-6"
                  >
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-[0_10px_24px_rgb(109_40_217/0.25)] sm:h-16 sm:w-16">
                      <Tickets size={27} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold tracking-[-0.02em] text-foreground sm:text-lg">{grupo.eventoNome}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted sm:text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={14} /> {formatarData(grupo.eventoData)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} /> {formatarHora(grupo.eventoData)}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="hidden rounded-full bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary sm:inline-flex">
                        {grupo.ingressos.length} {grupo.ingressos.length === 1 ? "ingresso" : "ingressos"}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-muted transition-transform ${temMaisDeUm && aberto ? "rotate-180" : ""} ${!temMaisDeUm ? "-rotate-90" : ""}`}
                      />
                    </span>
                  </button>

                  {temMaisDeUm && aberto && (
                    <div className="border-t border-dashed border-border/15 bg-surface/45 px-4 py-4 sm:px-6">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Escolha seu ingresso</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {grupo.ingressos.map((ingresso, indice) => (
                          <button
                            key={ingresso.id}
                            type="button"
                            onClick={() => setIngressoSelecionado(ingresso)}
                            className="flex items-center gap-3 rounded-2xl border border-border/10 bg-card px-4 py-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                          >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-bold text-primary">{indice + 1}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-foreground">{ingresso.loteNome}</span>
                              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-muted">#{ingresso.id.slice(0, 8)}</span>
                            </span>
                            <StatusDot
                              cor={COR_STATUS_INGRESSO[ingresso.status]}
                              rotulo={ROTULO_STATUS_INGRESSO[ingresso.status]}
                              className="shrink-0"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {grupos.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border/20 bg-card/60 px-6 py-14 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles size={24} />
                </span>
                <p className="mt-4 font-semibold text-foreground">
                  {filtro === "proximos" ? "Nenhum evento futuro por aqui" : "Nenhum ingresso no histórico"}
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  {filtro === "proximos" ? "Quando um ingresso for vinculado ao seu email, ele aparecerá nesta carteira." : "Seus eventos passados aparecerão aqui."}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {ingressoSelecionado && (
        <TicketQrModal
          ingresso={ingressoSelecionado}
          token={token}
          onTransferido={() => removerIngressoTransferido(ingressoSelecionado.id)}
          onFechar={() => setIngressoSelecionado(null)}
        />
      )}
    </main>
  );
}

function agruparPorEvento(ingressos: MeuIngressoResponse[]): GrupoIngressos[] {
  const grupos = new Map<string, GrupoIngressos>();
  for (const ingresso of ingressos) {
    const grupo = grupos.get(ingresso.eventoId);
    if (grupo) {
      grupo.ingressos.push(ingresso);
    } else {
      grupos.set(ingresso.eventoId, {
        eventoId: ingresso.eventoId,
        eventoNome: ingresso.eventoNome,
        eventoData: ingresso.eventoData,
        ingressos: [ingresso],
      });
    }
  }
  return [...grupos.values()].sort((a, b) => new Date(a.eventoData).getTime() - new Date(b.eventoData).getTime());
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatarHora(data: string) {
  return new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function CarteiraSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-5" aria-label="Carregando ingressos">
      <div className="h-14 rounded-2xl bg-surface" />
      {[0, 1].map((item) => <div key={item} className="h-28 rounded-3xl bg-surface" />)}
    </div>
  );
}
