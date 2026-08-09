"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ExternalLink, Plus, Search, Sparkles, Ticket } from "lucide-react";
import { formatarLocalizacaoEvento, type EventoResponse, type LoteResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { listarEventos, listarLotes } from "@/lib/events-client";

type FiltroVisibilidade = "todos" | "publicos" | "privados";
type FiltroStatus = "todos" | "programado" | "em_andamento" | "encerrado";

function statusEvento(data: string, dataFim: string | null): { rotulo: string; valor: FiltroStatus; cor: string } {
  const agora = new Date();
  const inicio = new Date(data);
  const fim = dataFim ? new Date(dataFim) : null;
  if (agora < inicio) return { rotulo: "Programado", valor: "programado", cor: "bg-primary" };
  if (fim ? agora <= fim : agora.toDateString() === inicio.toDateString()) {
    return { rotulo: "Em andamento", valor: "em_andamento", cor: "bg-success" };
  }
  return { rotulo: "Encerrado", valor: "encerrado", cor: "bg-muted" };
}

export default function EventosPage() {
  return <ProtectedPage>{(token) => <ListaEventos token={token} />}</ProtectedPage>;
}

function ListaEventos({ token }: { token: string }) {
  const [eventos, setEventos] = useState<EventoResponse[] | null>(null);
  const [ingressosPorEvento, setIngressosPorEvento] = useState<Map<string, { emitidos: number; capacidade: number }>>(new Map());
  const [busca, setBusca] = useState("");
  const [filtroVisibilidade, setFiltroVisibilidade] = useState<FiltroVisibilidade>("todos");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");

  useEffect(() => {
    listarEventos(token).then(async (lista) => {
      setEventos(lista);
      const entradas = await Promise.all(
        lista.map(async (evento): Promise<[string, { emitidos: number; capacidade: number }]> => {
          try {
            const lotes: LoteResponse[] = await listarLotes(evento.id, token);
            return [
              evento.id,
              {
                emitidos: lotes.reduce((total, lote) => total + lote.quantidadeEmitida, 0),
                capacidade: lotes.reduce((total, lote) => total + lote.quantidade, 0),
              },
            ];
          } catch {
            return [evento.id, { emitidos: 0, capacidade: 0 }];
          }
        }),
      );
      setIngressosPorEvento(new Map(entradas));
    });
  }, [token]);

  const eventosFiltrados = useMemo(() => {
    if (!eventos) return [];
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return eventos.filter((evento) => {
      const correspondeBusca = !termo || evento.nome.toLocaleLowerCase("pt-BR").includes(termo);
      const correspondeVisibilidade =
        filtroVisibilidade === "todos" ||
        (filtroVisibilidade === "publicos" ? evento.publicado : !evento.publicado);
      const correspondeStatus = filtroStatus === "todos" || statusEvento(evento.data, evento.dataFim).valor === filtroStatus;
      return correspondeBusca && correspondeVisibilidade && correspondeStatus;
    });
  }, [eventos, busca, filtroVisibilidade, filtroStatus]);

  return (
    <main className="page-shell">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow">
            <Sparkles size={12} /> Espaço do organizador
          </span>
          <h1 className="page-title">Seus eventos</h1>
          <p className="page-description">Acompanhe e gerencie todas as suas experiências.</p>
        </div>
        <Link href="/eventos/novo">
          <Button className="w-full gap-2 sm:w-auto">
            <Plus size={17} /> Criar evento
          </Button>
        </Link>
      </div>

      {eventos === null && (
        <div className="mt-10 h-64 animate-pulse rounded-2xl bg-card/70" />
      )}

      {eventos?.length === 0 && (
        <div className="mt-10 rounded-[2rem] border border-dashed border-primary/25 bg-primary/5 px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays />
          </span>
          <h2 className="mt-5 text-xl font-semibold">Seu primeiro evento começa aqui</h2>
          <p className="mt-2 text-sm text-muted">Crie uma página, configure os lotes e comece a vender.</p>
          <Link href="/eventos/novo" className="mt-6 inline-block">
            <Button>Criar primeiro evento</Button>
          </Link>
        </div>
      )}

      {eventos && eventos.length > 0 && (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar pelo nome do evento"
                className="h-11 w-full rounded-xl border border-border/15 bg-card px-4 pl-11 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <select
              value={filtroVisibilidade}
              onChange={(e) => setFiltroVisibilidade(e.target.value as FiltroVisibilidade)}
              className="h-11 rounded-xl border border-border/15 bg-card px-3 text-sm font-medium text-foreground outline-none focus:border-primary"
            >
              <option value="todos">Todos os eventos</option>
              <option value="publicos">Visíveis para compradores</option>
              <option value="privados">Privados</option>
            </select>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}
              className="h-11 rounded-xl border border-border/15 bg-card px-3 text-sm font-medium text-foreground outline-none focus:border-primary"
            >
              <option value="todos">Todos os status</option>
              <option value="programado">Programado</option>
              <option value="em_andamento">Em andamento</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-border/10 bg-card shadow-card">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-border/10 text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Evento</th>
                  <th className="px-5 py-3">Quando</th>
                  <th className="px-5 py-3">Onde</th>
                  <th className="px-5 py-3">Ingressos</th>
                  <th className="px-5 py-3 text-right">Gerenciar</th>
                </tr>
              </thead>
              <tbody>
                {eventosFiltrados.map((evento) => {
                  const status = statusEvento(evento.data, evento.dataFim);
                  const ingressos = ingressosPorEvento.get(evento.id);
                  const percentual = ingressos && ingressos.capacidade > 0 ? Math.min(100, (ingressos.emitidos / ingressos.capacidade) * 100) : 0;
                  return (
                    <tr key={evento.id} className="border-b border-border/10 last:border-0">
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span className={`h-2 w-2 rounded-full ${status.cor}`} /> {status.rotulo}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Ticket size={14} />
                          </span>
                          <span className="font-medium text-foreground">{evento.nome}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {new Date(evento.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4 text-muted">{formatarLocalizacaoEvento(evento)}</td>
                      <td className="px-5 py-4">
                        {ingressos && ingressos.capacidade > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted/15">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${percentual}%` }} />
                            </div>
                            <span className="whitespace-nowrap text-xs text-muted">
                              {ingressos.emitidos}/{ingressos.capacidade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">Sem lotes</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {evento.publicado && (
                            <Link
                              href={`/e/${evento.id}`}
                              target="_blank"
                              aria-label="Abrir página pública do evento"
                              title="Abrir página pública do evento"
                              className="grid h-9 w-9 place-items-center rounded-lg border border-border/15 text-muted hover:border-primary/30 hover:text-primary"
                            >
                              <ExternalLink size={15} />
                            </Link>
                          )}
                          <Link href={`/eventos/${evento.id}`}>
                            <Button variant="secondary">Gerenciar</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {eventosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                      Nenhum evento encontrado para esses filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
