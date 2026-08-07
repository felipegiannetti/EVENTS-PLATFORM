"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import type { EventoResponse, IngressoResponse, LoteResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { buscarEvento, criarLote, listarLotes } from "@/lib/events-client";
import { emitirIngresso, listarIngressos } from "@/lib/tickets-client";

export default function EventoDetalhePage() {
  return <ProtectedPage>{(token) => <EventoDetalhe token={token} />}</ProtectedPage>;
}

function EventoDetalhe({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [lotes, setLotes] = useState<LoteResponse[]>([]);
  const [ingressos, setIngressos] = useState<IngressoResponse[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    const [eventoAtual, lotesAtuais, ingressosAtuais] = await Promise.all([
      buscarEvento(id, token),
      listarLotes(id, token),
      listarIngressos(id, token),
    ]);
    setEvento(eventoAtual);
    setLotes(lotesAtuais);
    setIngressos(ingressosAtuais);
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
    return <p className="p-6 text-sm text-neutral-500">Carregando...</p>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold text-neutral-900">{evento.nome}</h1>
      <p className="text-sm text-neutral-500">
        {new Date(evento.data).toLocaleString("pt-BR")} · {evento.local}
      </p>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Lotes
        </h2>
        <div className="flex flex-col gap-3">
          {lotes.map((lote) => (
            <Card key={lote.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{lote.nome}</p>
                  <p className="text-sm text-neutral-500">
                    R$ {lote.preco.toFixed(2)} · {lote.quantidadeEmitida}/{lote.quantidade} emitidos
                  </p>
                </div>
                <Button variant="secondary" onClick={() => onEmitir(lote.id)}>
                  Emitir ingresso
                </Button>
              </div>
            </Card>
          ))}
          {lotes.length === 0 && (
            <p className="text-sm text-neutral-500">Nenhum lote criado ainda.</p>
          )}
        </div>
        <FormularioLote eventoId={id} token={token} onCriado={recarregar} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Ingressos emitidos
        </h2>
        <div className="flex flex-col gap-2">
          {ingressos.map((ingresso) => (
            <Card key={ingresso.id} className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">{ingresso.status}</span>
              <code className="max-w-[60%] truncate text-xs text-neutral-400">
                {ingresso.qrToken}
              </code>
            </Card>
          ))}
          {ingressos.length === 0 && (
            <p className="text-sm text-neutral-500">Nenhum ingresso emitido ainda.</p>
          )}
        </div>
      </section>
    </main>
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
    <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-end gap-3">
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
