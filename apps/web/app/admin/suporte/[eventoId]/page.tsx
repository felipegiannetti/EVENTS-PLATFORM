"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CalendarDays, QrCode, Search, Ticket } from "lucide-react";
import type { EventoResponse, IngressoResponse, LeituraCheckinResponse, LoteResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { StatusDot } from "@/components/ui/status-dot";
import { ApiError } from "@/lib/api-client";
import { buscarEvento, listarLotes } from "@/lib/events-client";
import { listarIngressos, listarLeiturasCheckin } from "@/lib/tickets-client";
import { COR_STATUS_INGRESSO, ROTULO_STATUS_INGRESSO } from "@/lib/status-ingresso";

const ITENS_POR_PAGINA = 15;

export default function SuporteEventoPage() {
  return <ProtectedPage>{(token) => <DetalheEvento token={token} />}</ProtectedPage>;
}

function DetalheEvento({ token }: { token: string }) {
  const { eventoId } = useParams<{ eventoId: string }>();
  const searchParams = useSearchParams();
  const organizadorNome = searchParams.get("organizador");
  const organizadorEmail = searchParams.get("email");

  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [lotes, setLotes] = useState<LoteResponse[] | null>(null);
  const [ingressos, setIngressos] = useState<IngressoResponse[] | null>(null);
  const [leituras, setLeituras] = useState<LeituraCheckinResponse[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [buscaParticipante, setBuscaParticipante] = useState("");
  const [paginaIngressos, setPaginaIngressos] = useState(1);
  const [paginaLeituras, setPaginaLeituras] = useState(1);

  useEffect(() => {
    Promise.all([
      buscarEvento(eventoId, token),
      listarLotes(eventoId, token),
      listarIngressos(eventoId, token),
      listarLeiturasCheckin(eventoId, token),
    ])
      .then(([eventoRes, lotesRes, ingressosRes, leiturasRes]) => {
        setEvento(eventoRes);
        setLotes(lotesRes);
        setIngressos(ingressosRes);
        setLeituras(leiturasRes);
      })
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o evento."));
  }, [eventoId, token]);

  const ingressosFiltrados = useMemo(() => {
    if (!ingressos) return [];
    const termo = buscaParticipante.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return ingressos;
    return ingressos.filter((ingresso) =>
      ingresso.compradorNome?.toLocaleLowerCase("pt-BR").includes(termo)
      || ingresso.compradorEmail?.toLocaleLowerCase("pt-BR").includes(termo)
      || ingresso.compradorDocumento?.toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [buscaParticipante, ingressos]);

  const leiturasFiltradas = useMemo(() => {
    if (!leituras) return [];
    const idsIngressos = new Set(ingressosFiltrados.map((ingresso) => ingresso.id));
    return leituras.filter((leitura) => idsIngressos.has(leitura.ingressoId));
  }, [ingressosFiltrados, leituras]);

  useEffect(() => {
    setPaginaIngressos(1);
    setPaginaLeituras(1);
  }, [buscaParticipante]);

  if (erro) {
    return <main className="page-shell max-w-5xl"><Card className="border-danger/20 bg-danger/5 p-8 text-center text-sm text-danger">{erro}</Card></main>;
  }

  if (!evento || !lotes || !ingressos || !leituras) {
    return <div className="page-shell"><div className="h-72 animate-pulse rounded-3xl bg-card" /></div>;
  }

  const nomeLote = new Map(lotes.map((lote) => [lote.id, lote.nome]));
  const totalPaginasIngressos = Math.max(1, Math.ceil(ingressosFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtualIngressos = Math.min(paginaIngressos, totalPaginasIngressos);
  const ingressosPaginados = ingressosFiltrados.slice((paginaAtualIngressos - 1) * ITENS_POR_PAGINA, paginaAtualIngressos * ITENS_POR_PAGINA);
  const totalPaginasLeituras = Math.max(1, Math.ceil(leiturasFiltradas.length / ITENS_POR_PAGINA));
  const paginaAtualLeituras = Math.min(paginaLeituras, totalPaginasLeituras);
  const leiturasPaginadas = leiturasFiltradas.slice((paginaAtualLeituras - 1) * ITENS_POR_PAGINA, paginaAtualLeituras * ITENS_POR_PAGINA);

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow">Suporte · modo leitura</span>
      <h1 className="page-title">{evento.nome}</h1>
      <p className="page-description">
        {(organizadorNome ?? "Organizador não informado")} {organizadorEmail && `· ${organizadorEmail}`}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} /> {new Date(evento.data).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${evento.publicado ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
          {evento.publicado ? "Publicado" : "Rascunho"}
        </span>
      </div>

      <Card className="mt-8 p-5">
        <label htmlFor="buscaParticipanteSuporte" className="text-sm font-bold text-foreground">Pesquisar usuário dentro do evento</label>
        <div className="relative mt-3">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="buscaParticipanteSuporte"
            value={buscaParticipante}
            onChange={(eventoBusca) => setBuscaParticipante(eventoBusca.target.value)}
            placeholder="Nome, email ou documento do participante..."
            className="h-12 w-full rounded-xl border border-border/15 bg-background/60 pl-11 pr-4 text-sm text-foreground shadow-inner outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <p className="mt-2 text-xs text-muted">Os ingressos e check-ins abaixo são filtrados automaticamente.</p>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border/10 px-6 py-4">
          <Ticket size={17} className="text-primary" />
          <h2 className="font-bold text-foreground">Ingressos</h2>
          <span className="ml-auto text-xs text-muted">{ingressosFiltrados.length} encontrado(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/10 text-xs uppercase tracking-wide text-muted">
                <th className="px-6 py-3 font-semibold">Comprador</th>
                <th className="px-6 py-3 font-semibold">Lote</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Emitido em</th>
              </tr>
            </thead>
            <tbody>
              {ingressosPaginados.map((ingresso) => (
                <tr key={ingresso.id} className="border-b border-border/5 last:border-0">
                  <td className="px-6 py-3">
                    <p className="font-medium text-foreground">{ingresso.compradorNome ?? "Não informado"}</p>
                    <p className="text-xs text-muted">{ingresso.compradorEmail ?? "—"}</p>
                  </td>
                  <td className="px-6 py-3 text-muted">{nomeLote.get(ingresso.loteId) ?? "—"}</td>
                  <td className="px-6 py-3">
                    <StatusDot cor={COR_STATUS_INGRESSO[ingresso.status]} rotulo={ROTULO_STATUS_INGRESSO[ingresso.status]} />
                  </td>
                  <td className="px-6 py-3 text-muted">{new Date(ingresso.criadoEm).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {ingressosFiltrados.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-muted">Nenhum ingresso corresponde à busca.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4"><Pagination pagina={paginaAtualIngressos} totalPaginas={totalPaginasIngressos} onMudarPagina={setPaginaIngressos} /></div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border/10 px-6 py-4">
          <QrCode size={17} className="text-primary" />
          <h2 className="font-bold text-foreground">Leituras de check-in</h2>
          <span className="ml-auto text-xs text-muted">{leiturasFiltradas.length} encontrado(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/10 text-xs uppercase tracking-wide text-muted">
                <th className="px-6 py-3 font-semibold">Participante</th>
                <th className="px-6 py-3 font-semibold">Validado em</th>
              </tr>
            </thead>
            <tbody>
              {leiturasPaginadas.map((leitura) => (
                <tr key={leitura.ingressoId} className="border-b border-border/5 last:border-0">
                  <td className="px-6 py-3">
                    <p className="font-medium text-foreground">{leitura.compradorNome ?? "Não informado"}</p>
                    <p className="text-xs text-muted">{leitura.compradorEmail ?? "—"}</p>
                  </td>
                  <td className="px-6 py-3 text-muted">{new Date(leitura.usadoEm).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {leiturasFiltradas.length === 0 && (
                <tr><td colSpan={2} className="px-6 py-10 text-center text-muted">Nenhum check-in corresponde à busca.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4"><Pagination pagina={paginaAtualLeituras} totalPaginas={totalPaginasLeituras} onMudarPagina={setPaginaLeituras} /></div>
      </Card>
    </main>
  );
}
