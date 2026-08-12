"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CalendarDays, LifeBuoy, MapPin, Search } from "lucide-react";
import type { EventoAdminResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api-client";
import { buscarEventosAdmin } from "@/lib/admin-client";

const EVENTOS_POR_PAGINA = 10;

export default function SuporteAdminPage() {
  return <ProtectedPage>{(token) => <PainelSuporte token={token} />}</ProtectedPage>;
}

function PainelSuporte({ token }: { token: string }) {
  const [busca, setBusca] = useState("");
  const [eventos, setEventos] = useState<EventoAdminResponse[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const requisicaoAtual = useRef(0);

  async function pesquisar(termo: string) {
    const requisicao = ++requisicaoAtual.current;
    setCarregando(true);
    setErro(null);
    try {
      const encontrados = await buscarEventosAdmin(termo, token);
      if (requisicao !== requisicaoAtual.current) return;
      setEventos(encontrados);
      setPagina(1);
    } catch (err) {
      if (requisicao !== requisicaoAtual.current) return;
      setErro(err instanceof ApiError ? err.message : "Não foi possível buscar os eventos.");
    } finally {
      if (requisicao === requisicaoAtual.current) setCarregando(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void pesquisar(busca); }, 300);
    return () => window.clearTimeout(timer);
  }, [busca, token]); // eslint-disable-line react-hooks/exhaustive-deps

  function aoSubmeter(e: FormEvent) {
    e.preventDefault();
    void pesquisar(busca);
  }

  const totalPaginas = Math.max(1, Math.ceil((eventos?.length ?? 0) / EVENTOS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const eventosPaginados = eventos?.slice((paginaAtual - 1) * EVENTOS_POR_PAGINA, paginaAtual * EVENTOS_POR_PAGINA) ?? [];

  return (
    <main className="page-shell max-w-4xl">
      <span className="eyebrow"><LifeBuoy size={12} /> Suporte</span>
      <h1 className="page-title">Buscar evento</h1>
      <p className="page-description">
        Encontre o evento de qualquer organizador para checar ingressos e check-in — em modo leitura, sem ações de edição.
      </p>

      <form onSubmit={aoSubmeter} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome do evento, do organizador ou email..."
            aria-label="Pesquisar evento ou organizador"
            className="h-12 w-full rounded-xl border border-border/15 bg-background/60 pl-11 pr-4 text-sm text-foreground shadow-inner outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </form>

      <p className="mt-2 text-xs text-muted">{carregando ? "Buscando..." : "A busca é atualizada automaticamente enquanto você digita."}</p>

      {erro && <p className="mt-4 text-sm text-danger">{erro}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {carregando && !eventos && [0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-card" />)}

        {eventosPaginados.map((evento) => (
          <Link
            key={evento.id}
            href={`/admin/suporte/${evento.id}?organizador=${encodeURIComponent(evento.organizadorNome ?? "")}&email=${encodeURIComponent(evento.organizadorEmail ?? "")}`}
          >
            <Card className="flex flex-wrap items-center justify-between gap-3 p-5 transition-all hover:border-primary/25 hover:shadow-glow">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{evento.nome}</p>
                <p className="mt-1 text-xs text-muted">
                  {evento.organizadorNome ?? "Organizador removido"} · {evento.organizadorEmail ?? "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {new Date(evento.data).toLocaleDateString("pt-BR")}</span>
                {evento.cidade && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {evento.cidade}/{evento.estado}</span>}
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${evento.publicado ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {evento.publicado ? "Publicado" : "Rascunho"}
                </span>
              </div>
            </Card>
          </Link>
        ))}

        {eventos && eventos.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted">Nenhum evento encontrado.</Card>
        )}
      </div>

      <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onMudarPagina={setPagina} />
    </main>
  );
}
