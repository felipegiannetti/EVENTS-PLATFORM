"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Wallet } from "lucide-react";
import type { FinanceiroAdminResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api-client";
import { buscarFinanceiroAdmin } from "@/lib/admin-client";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const EVENTOS_POR_PAGINA = 15;

export default function FinanceiroAdminPage() {
  return <ProtectedPage>{(token) => <PainelFinanceiro token={token} />}</ProtectedPage>;
}

function PainelFinanceiro({ token }: { token: string }) {
  const [dados, setDados] = useState<FinanceiroAdminResponse | null>(null);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    buscarFinanceiroAdmin(token)
      .then(setDados)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o financeiro."));
  }, [token]);

  const eventosFiltrados = useMemo(() => {
    if (!dados) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return dados.eventos;
    return dados.eventos.filter(
      (evento) => evento.eventoNome.toLowerCase().includes(termo) || evento.organizadorNome?.toLowerCase().includes(termo),
    );
  }, [dados, busca]);

  useEffect(() => { setPagina(1); }, [busca]);

  const totalPaginas = Math.max(1, Math.ceil(eventosFiltrados.length / EVENTOS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const eventosPaginados = eventosFiltrados.slice((paginaAtual - 1) * EVENTOS_POR_PAGINA, paginaAtual * EVENTOS_POR_PAGINA);

  if (erro) {
    return <main className="page-shell max-w-5xl"><Card className="border-danger/20 bg-danger/5 p-8 text-center text-sm text-danger">{erro}</Card></main>;
  }

  if (!dados) {
    return <div className="page-shell"><div className="h-72 animate-pulse rounded-3xl bg-card" /></div>;
  }

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow"><Wallet size={12} /> Financeiro</span>
      <h1 className="page-title">Consolidado</h1>
      <p className="page-description">
        Soma de vendas, taxa retida e repasse estimado entre todos os eventos com pelo menos uma venda — mesmo cálculo que o organizador já vê por evento.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Vendas brutas</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatarMoeda(dados.totais.vendasBrutas)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Taxa retida pela plataforma</p>
          <p className="mt-2 text-2xl font-bold text-primary">{formatarMoeda(dados.totais.taxaRetidaPlataforma)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Repasse estimado aos organizadores</p>
          <p className="mt-2 text-2xl font-bold text-success">{formatarMoeda(dados.totais.valorRepasseOrganizador)}</p>
        </Card>
      </div>
      <p className="mt-3 text-xs text-muted">
        <TrendingUp size={13} className="mr-1 inline" />
        {dados.totais.totalEventos} evento(s) · {dados.totais.totalIngressosValidos} ingresso(s) válido(s)
      </p>

      <div className="mt-8">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Filtrar por evento ou organizador..."
          className="h-11 w-full max-w-sm rounded-xl border border-border/15 bg-background/60 px-4 text-sm text-foreground shadow-inner outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/10 text-xs uppercase tracking-wide text-muted">
                <th className="px-6 py-3 font-semibold">Evento</th>
                <th className="px-6 py-3 font-semibold">Organizador</th>
                <th className="px-6 py-3 font-semibold">Data</th>
                <th className="px-6 py-3 text-right font-semibold">Vendas brutas</th>
                <th className="px-6 py-3 text-right font-semibold">Taxa retida</th>
                <th className="px-6 py-3 text-right font-semibold">Repasse estimado</th>
              </tr>
            </thead>
            <tbody>
              {eventosPaginados.map((evento) => (
                <tr key={evento.eventoId} className="border-b border-border/5 last:border-0">
                  <td className="px-6 py-3 font-medium text-foreground">{evento.eventoNome}</td>
                  <td className="px-6 py-3 text-muted">{evento.organizadorNome ?? "—"}</td>
                  <td className="px-6 py-3 text-muted">{new Date(evento.data).toLocaleDateString("pt-BR")}</td>
                  <td className="px-6 py-3 text-right text-foreground">{formatarMoeda(evento.vendasBrutas)}</td>
                  <td className="px-6 py-3 text-right text-primary">{formatarMoeda(evento.taxaRetidaPlataforma)}</td>
                  <td className="px-6 py-3 text-right text-success">{formatarMoeda(evento.valorRepasseOrganizador)}</td>
                </tr>
              ))}
              {eventosFiltrados.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Nenhum evento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onMudarPagina={setPagina} />
    </main>
  );
}
