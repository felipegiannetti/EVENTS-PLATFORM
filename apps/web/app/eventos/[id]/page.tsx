"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type {
  EventoResponse,
  IngressoResponse,
  LoteResponse,
  ResumoFinanceiroEvento,
} from "@events-platform/shared-types";
import { ROTULO_CATEGORIA_EVENTO } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Stat, formatarReais } from "@/components/ui/stat";
import { ApiError } from "@/lib/api-client";
import { buscarEvento, criarLote, listarLotes } from "@/lib/events-client";
import { emitirIngresso, listarIngressos } from "@/lib/tickets-client";
import { buscarResumoFinanceiro } from "@/lib/finance-client";

export default function EventoDetalhePage() {
  return <ProtectedPage>{(token) => <EventoDetalhe token={token} />}</ProtectedPage>;
}

function EventoDetalhe({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [lotes, setLotes] = useState<LoteResponse[]>([]);
  const [ingressos, setIngressos] = useState<IngressoResponse[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiroEvento | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    const [eventoAtual, lotesAtuais, ingressosAtuais, resumoAtual] = await Promise.all([
      buscarEvento(id, token),
      listarLotes(id, token),
      listarIngressos(id, token),
      buscarResumoFinanceiro(id, token),
    ]);
    setEvento(eventoAtual);
    setLotes(lotesAtuais);
    setIngressos(ingressosAtuais);
    setResumo(resumoAtual);
  }

  useEffect(() => {
    recarregar().catch((err) =>
      setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o evento."),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  async function onEmitir(loteId: string) {
    try {
      await emitirIngresso(id, loteId, {}, token);
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível emitir o ingresso.");
    }
  }

  if (erro) {
    return <p className="p-6 text-sm text-danger">{erro}</p>;
  }
  if (!evento) {
    return <p className="p-6 text-sm text-muted">Carregando...</p>;
  }

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow">Visão geral do evento</span>
      <h1 className="page-title">{evento.nome}</h1>
      <span className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{ROTULO_CATEGORIA_EVENTO[evento.categoria]}</span>
      <p className="page-description">
        {new Date(evento.data).toLocaleString("pt-BR")} · {evento.local}
      </p>

      {resumo && (
        <Card className="mt-8 grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
          <Stat label="Vendas brutas" value={formatarReais(resumo.vendasBrutas)} />
          <Stat label="Ticket médio" value={formatarReais(resumo.ticketMedioBruto)} />
          <Stat label="Ingressos válidos" value={String(resumo.ingressosValidos)} />
          <Stat label="Cancelados" value={String(resumo.ingressosCancelados)} />
        </Card>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/eventos/${id}/financeiro`}
          className="flex items-center justify-between rounded-2xl border border-border/10 bg-card px-5 py-4 text-sm shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30"
        >
          <span className="text-foreground/80">Financeiro</span>
          <span className="font-medium text-primary">Ver detalhes →</span>
        </Link>

        <Link
          href={`/eventos/${id}/acesso`}
          className="flex items-center justify-between rounded-2xl border border-border/10 bg-card px-5 py-4 text-sm shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30"
        >
          <span className="text-foreground/80">Quem tem acesso</span>
          <span className="font-medium text-primary">Gerenciar →</span>
        </Link>
      </div>

      <section className="mt-12">
        <h2 className="section-title mb-5">Lotes e ingressos</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {lotes.map((lote) => (
            <Card key={lote.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{lote.nome}</p>
                  <p className="text-sm text-muted">
                    R$ {lote.preco.toFixed(2)} · {lote.quantidadeEmitida}/{lote.quantidade} emitidos
                  </p>
                </div>
                <Button variant="secondary" onClick={() => onEmitir(lote.id)}>
                  Emitir ingresso
                </Button>
              </div>
            </Card>
          ))}
          {lotes.length === 0 && <p className="text-sm text-muted">Nenhum lote criado ainda.</p>}
        </div>
        <FormularioLote eventoId={id} token={token} onCriado={recarregar} />
      </section>

      <section className="mt-12">
        <h2 className="section-title mb-5">
          Ingressos emitidos
        </h2>
        <div className="flex flex-col gap-2">
          {ingressos.map((ingresso) => (
            <Card key={ingresso.id} className="flex items-center justify-between gap-3">
              <StatusBadge status={ingresso.status} />
              <code className="max-w-[60%] truncate text-xs text-muted">{ingresso.qrToken}</code>
            </Card>
          ))}
          {ingressos.length === 0 && (
            <p className="text-sm text-muted">Nenhum ingresso emitido ainda.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const estilos: Record<string, string> = {
    valido: "bg-success/10 text-success",
    usado: "bg-muted/15 text-muted",
    cancelado: "bg-danger/10 text-danger",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${estilos[status] ?? "bg-muted/15 text-muted"}`}
    >
      {status}
    </span>
  );
}

function FormularioLote({
  eventoId,
  token,
  onCriado,
}: {
  eventoId: string;
  token: string;
  onCriado: () => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("0");
  const [quantidade, setQuantidade] = useState("100");
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await criarLote(
        eventoId,
        { nome, preco: Number(preco), quantidade: Number(quantidade) },
        token,
      );
      setNome("");
      await onCriado();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-5">
      <div className="min-w-40 flex-1">
        <Input id="lote-nome" label="Novo lote" required value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <Input
        id="lote-preco"
        label="Preço"
        type="number"
        min={0}
        step="0.01"
        className="w-24"
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
      />
      <Input
        id="lote-quantidade"
        label="Quantidade"
        type="number"
        min={1}
        className="w-24"
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
      />
      <Button type="submit" disabled={enviando}>
        Adicionar
      </Button>
    </form>
  );
}
