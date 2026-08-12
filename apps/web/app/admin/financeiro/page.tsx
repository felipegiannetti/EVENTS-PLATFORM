"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, RotateCcw, TrendingUp, Wallet } from "lucide-react";
import type { FinanceiroAdminResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api-client";
import { buscarFinanceiroAdmin } from "@/lib/admin-client";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const EVENTOS_POR_PAGINA = 15;
type ColunaOrdenacao = "evento" | "organizador" | "data" | "vendasBrutas" | "taxaRetida" | "repasse";
type DirecaoOrdenacao = "asc" | "desc";

export default function FinanceiroAdminPage() {
  return <ProtectedPage>{(token) => <PainelFinanceiro token={token} />}</ProtectedPage>;
}

function PainelFinanceiro({ token }: { token: string }) {
  const [dados, setDados] = useState<FinanceiroAdminResponse | null>(null);
  const [filtroEvento, setFiltroEvento] = useState("");
  const [filtroOrganizador, setFiltroOrganizador] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>("data");
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>("desc");
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    buscarFinanceiroAdmin(token)
      .then(setDados)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o financeiro."));
  }, [token]);

  const eventosFiltrados = useMemo(() => {
    if (!dados) return [];
    const termoEvento = filtroEvento.trim().toLocaleLowerCase("pt-BR");
    const termoOrganizador = filtroOrganizador.trim().toLocaleLowerCase("pt-BR");
    const inicio = dataInicio ? new Date(`${dataInicio}T00:00:00`).getTime() : null;
    const fim = dataFim ? new Date(`${dataFim}T23:59:59.999`).getTime() : null;
    const filtrados = dados.eventos.filter((evento) => {
      const dataEvento = new Date(evento.data).getTime();
      return (!termoEvento || evento.eventoNome.toLocaleLowerCase("pt-BR").includes(termoEvento))
        && (!termoOrganizador || evento.organizadorNome?.toLocaleLowerCase("pt-BR").includes(termoOrganizador))
        && (inicio === null || dataEvento >= inicio)
        && (fim === null || dataEvento <= fim);
    });

    const compararTexto = (a: string | null, b: string | null) => (a ?? "").localeCompare(b ?? "", "pt-BR", { sensitivity: "base" });
    const multiplicador = direcaoOrdenacao === "asc" ? 1 : -1;
    return filtrados.sort((a, b) => {
      if (colunaOrdenacao === "evento") return compararTexto(a.eventoNome, b.eventoNome) * multiplicador;
      if (colunaOrdenacao === "organizador") return compararTexto(a.organizadorNome, b.organizadorNome) * multiplicador;
      if (colunaOrdenacao === "data") return (new Date(a.data).getTime() - new Date(b.data).getTime()) * multiplicador;
      if (colunaOrdenacao === "vendasBrutas") return (a.vendasBrutas - b.vendasBrutas) * multiplicador;
      if (colunaOrdenacao === "taxaRetida") return (a.taxaRetidaPlataforma - b.taxaRetidaPlataforma) * multiplicador;
      return (a.valorRepasseOrganizador - b.valorRepasseOrganizador) * multiplicador;
    });
  }, [colunaOrdenacao, dados, dataFim, dataInicio, direcaoOrdenacao, filtroEvento, filtroOrganizador]);

  useEffect(() => { setPagina(1); }, [filtroEvento, filtroOrganizador, dataInicio, dataFim, colunaOrdenacao, direcaoOrdenacao]);

  function ordenarPor(coluna: ColunaOrdenacao) {
    if (coluna === colunaOrdenacao) {
      setDirecaoOrdenacao((atual) => atual === "asc" ? "desc" : "asc");
      return;
    }
    setColunaOrdenacao(coluna);
    setDirecaoOrdenacao("asc");
  }

  function limparFiltros() {
    setFiltroEvento("");
    setFiltroOrganizador("");
    setDataInicio("");
    setDataFim("");
  }

  const totalFiltrosAtivos = [filtroEvento, filtroOrganizador, dataInicio, dataFim].filter(Boolean).length;

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

      <Card className="mt-8 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-foreground"><Filter size={16} className="text-primary" /> Filtros do financeiro</p>
            <p className="mt-1 text-xs text-muted">Combine evento, organizador e período na mesma consulta.</p>
          </div>
          {totalFiltrosAtivos > 0 && (
            <button type="button" onClick={limparFiltros} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/15 px-3 text-xs font-semibold text-muted transition hover:border-primary/25 hover:text-primary">
              <RotateCcw size={14} /> Limpar {totalFiltrosAtivos} filtro(s)
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground/80">
            Nome do evento
            <input value={filtroEvento} onChange={(e) => setFiltroEvento(e.target.value)} placeholder="Pesquisar evento..." className="h-11 rounded-xl border border-border/15 bg-background/60 px-3 text-sm font-normal text-foreground outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground/80">
            Organizador
            <input value={filtroOrganizador} onChange={(e) => setFiltroOrganizador(e.target.value)} placeholder="Nome do organizador..." className="h-11 rounded-xl border border-border/15 bg-background/60 px-3 text-sm font-normal text-foreground outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground/80">
            Data inicial
            <input type="date" value={dataInicio} max={dataFim || undefined} onChange={(e) => setDataInicio(e.target.value)} className="h-11 rounded-xl border border-border/15 bg-background/60 px-3 text-sm font-normal text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground/80">
            Data final
            <input type="date" value={dataFim} min={dataInicio || undefined} onChange={(e) => setDataFim(e.target.value)} className="h-11 rounded-xl border border-border/15 bg-background/60 px-3 text-sm font-normal text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/10 text-xs uppercase tracking-wide text-muted">
                <CabecalhoOrdenavel rotulo="Evento" coluna="evento" ativa={colunaOrdenacao} direcao={direcaoOrdenacao} onOrdenar={ordenarPor} />
                <CabecalhoOrdenavel rotulo="Organizador" coluna="organizador" ativa={colunaOrdenacao} direcao={direcaoOrdenacao} onOrdenar={ordenarPor} />
                <CabecalhoOrdenavel rotulo="Data" coluna="data" ativa={colunaOrdenacao} direcao={direcaoOrdenacao} onOrdenar={ordenarPor} />
                <CabecalhoOrdenavel rotulo="Vendas brutas" coluna="vendasBrutas" ativa={colunaOrdenacao} direcao={direcaoOrdenacao} onOrdenar={ordenarPor} alinharDireita />
                <CabecalhoOrdenavel rotulo="Taxa retida" coluna="taxaRetida" ativa={colunaOrdenacao} direcao={direcaoOrdenacao} onOrdenar={ordenarPor} alinharDireita />
                <CabecalhoOrdenavel rotulo="Repasse estimado" coluna="repasse" ativa={colunaOrdenacao} direcao={direcaoOrdenacao} onOrdenar={ordenarPor} alinharDireita />
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

function CabecalhoOrdenavel({
  rotulo,
  coluna,
  ativa,
  direcao,
  onOrdenar,
  alinharDireita = false,
}: {
  rotulo: string;
  coluna: ColunaOrdenacao;
  ativa: ColunaOrdenacao;
  direcao: DirecaoOrdenacao;
  onOrdenar: (coluna: ColunaOrdenacao) => void;
  alinharDireita?: boolean;
}) {
  const Icone = ativa === coluna ? (direcao === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={`px-6 py-3 font-semibold ${alinharDireita ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onOrdenar(coluna)}
        aria-label={`Ordenar por ${rotulo}`}
        className={`inline-flex items-center gap-1.5 transition-colors hover:text-primary ${alinharDireita ? "ml-auto" : ""} ${ativa === coluna ? "text-primary" : ""}`}
      >
        {rotulo}<Icone size={13} />
      </button>
    </th>
  );
}
