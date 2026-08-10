"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Pencil, Plus, Search, Ticket } from "lucide-react";
import type { CupomDescontoResponse, IngressoResponse, LoteResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatarReais } from "@/components/ui/stat";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ApiError } from "@/lib/api-client";
import { atualizarLote, criarLote, listarCupons, listarLotes } from "@/lib/events-client";
import { emitirIngresso, listarIngressos } from "@/lib/tickets-client";

function ModalEmitirIngresso({
  lote,
  eventoId,
  token,
  onFechar,
  onEmitido,
}: {
  lote: LoteResponse;
  eventoId: string;
  token: string;
  onFechar: () => void;
  onEmitido: () => Promise<void>;
}) {
  const [compradorNome, setCompradorNome] = useState("");
  const [compradorEmail, setCompradorEmail] = useState("");
  const [cupomDescontoId, setCupomDescontoId] = useState("");
  const [cancelamentoFlexivel, setCancelamentoFlexivel] = useState(false);
  const [cupons, setCupons] = useState<CupomDescontoResponse[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarCupons(eventoId, token)
      .then((lista) => setCupons(lista.filter((cupom) => cupom.ativo && (cupom.limiteUsos === null || cupom.usos < cupom.limiteUsos))))
      .catch(() => setCupons([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId, token]);

  async function emitir(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await emitirIngresso(
        eventoId,
        lote.id,
        {
          compradorNome: compradorNome || undefined,
          compradorEmail,
          cupomDescontoId: cupomDescontoId || undefined,
          cancelamentoFlexivel,
        },
        token,
      );
      await onEmitido();
      onFechar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível emitir o ingresso.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold">Emitir ingresso — {lote.nome}</h2>
        <p className="mt-1 text-sm text-muted">
          O email é obrigatório — é o que liga esse ingresso a &quot;Meus ingressos&quot; da pessoa. O nome é opcional.
        </p>
        <form onSubmit={emitir} className="mt-4 flex flex-col gap-3">
          <Input id="comprador-email" label="Email do comprador" type="email" required value={compradorEmail} onChange={(e) => setCompradorEmail(e.target.value)} />
          <Input id="comprador-nome" label="Nome do comprador (opcional)" value={compradorNome} onChange={(e) => setCompradorNome(e.target.value)} />
          {cupons.length > 0 && (
            <div className="flex flex-col gap-2">
              <label htmlFor="cupom-usado" className="text-sm font-semibold text-foreground/80">
                Cupom usado (opcional)
              </label>
              <select
                id="cupom-usado"
                value={cupomDescontoId}
                onChange={(e) => setCupomDescontoId(e.target.value)}
                className="h-12 rounded-xl border border-border/15 bg-background/60 px-4 text-sm text-foreground shadow-inner outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Nenhum</option>
                {cupons.map((cupom) => (
                  <option key={cupom.id} value={cupom.id}>
                    {cupom.codigo}
                  </option>
                ))}
              </select>
            </div>
          )}
          <label className="flex items-start gap-3 rounded-xl border border-border/15 bg-background/60 px-4 py-3">
            <input
              type="checkbox"
              checked={cancelamentoFlexivel}
              onChange={(e) => setCancelamentoFlexivel(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span className="text-sm text-foreground">
              Cancelamento flexível
              <span className="mt-0.5 block text-xs text-muted">
                Comprador pode cancelar até perto do evento (em vez do prazo padrão de 7 dias). Normalmente envolveria uma taxa
                adicional de 10% revertida à plataforma — como não existe checkout de pagamento implementado, nenhuma cobrança
                real é feita aqui.
              </span>
            </span>
          </label>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="mt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={onFechar} className="flex-1" disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" loading={enviando} className="flex-1">
              Emitir
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalEditarLote({
  lote,
  eventoId,
  token,
  onFechar,
  onSalvo,
}: {
  lote: LoteResponse;
  eventoId: string;
  token: string;
  onFechar: () => void;
  onSalvo: () => Promise<void>;
}) {
  const [nome, setNome] = useState(lote.nome);
  const [precoCentavos, setPrecoCentavos] = useState(Math.round(lote.preco * 100));
  const [quantidade, setQuantidade] = useState(String(lote.quantidade));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await atualizarLote(eventoId, lote.id, { nome, preco: precoCentavos / 100, quantidade: Number(quantidade) }, token);
      await onSalvo();
      onFechar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o lote.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold">Editar lote</h2>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          <Input id="editar-lote-nome" label="Nome do lote" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <CurrencyInput id="editar-lote-preco" label="Preço (R$ 0,00 = gratuito)" valorCentavos={precoCentavos} onChange={setPrecoCentavos} />
          <Input
            id="editar-lote-quantidade"
            label="Quantidade"
            type="number"
            min={lote.quantidadeEmitida}
            required
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          {quantidade !== "" && Number(quantidade) < lote.quantidadeEmitida && (
            <p className="text-xs text-danger">Já foram emitidos {lote.quantidadeEmitida} ingressos — não dá pra reduzir abaixo disso.</p>
          )}
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="mt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={onFechar} className="flex-1" disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" loading={salvando} disabled={Number(quantidade) < lote.quantidadeEmitida} className="flex-1">
              Salvar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function IngressosEventoPage() {
  return <ProtectedPage>{(token) => <PainelIngressos token={token} />}</ProtectedPage>;
}

function PainelIngressos({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [lotes, setLotes] = useState<LoteResponse[] | null>(null);
  const [ingressos, setIngressos] = useState<IngressoResponse[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loteParaEmitir, setLoteParaEmitir] = useState<LoteResponse | null>(null);
  const [loteParaEditar, setLoteParaEditar] = useState<LoteResponse | null>(null);

  async function recarregar() {
    const [lotesAtuais, ingressosAtuais] = await Promise.all([listarLotes(id, token), listarIngressos(id, token)]);
    setLotes(lotesAtuais);
    setIngressos(ingressosAtuais);
  }

  useEffect(() => {
    recarregar().catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar os ingressos."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const aprovados = ingressos.filter((i) => i.status === "valido" || i.status === "usado").length;
  const cancelados = ingressos.filter((i) => i.status === "cancelado").length;

  const lotesFiltrados = useMemo(() => {
    if (!lotes) return [];
    const termo = busca.trim().toLowerCase();
    return termo ? lotes.filter((l) => l.nome.toLowerCase().includes(termo)) : lotes;
  }, [lotes, busca]);

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow">Ingressos</span>
      <h1 className="page-title">Lotes e ingressos</h1>
      <p className="page-description">Crie lotes, acompanhe vendas e emita ingressos manualmente.</p>

      <Card className="mt-8 grid grid-cols-2 gap-3 p-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/10 bg-background/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ingressos aprovados</p>
          <p className="mt-1 text-2xl font-bold text-success">{aprovados}</p>
        </div>
        <div className="rounded-xl border border-border/10 bg-background/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Cancelados</p>
          <p className="mt-1 text-2xl font-bold text-danger">{cancelados}</p>
        </div>
      </Card>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title !text-lg">Gerenciar lotes</h2>
        <Button onClick={() => setMostrarFormulario((v) => !v)} className="gap-2">
          <Plus size={16} /> Novo lote
        </Button>
      </div>

      {mostrarFormulario && (
        <FormularioLote
          eventoId={id}
          token={token}
          onCriado={async () => {
            await recarregar();
            setMostrarFormulario(false);
          }}
        />
      )}

      <div className="relative mt-5">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar lotes..."
          className="search-shell h-11 w-full rounded-xl border border-border/15 bg-background/60 pl-11 pr-4 text-sm text-foreground outline-none"
        />
      </div>

      {erro && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-border/10 bg-card shadow-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border/10 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Vendidos/total</th>
              <th className="px-5 py-3">Preço</th>
              <th className="px-5 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {lotesFiltrados.map((lote) => {
              const percentual = lote.quantidade > 0 ? Math.min(100, (lote.quantidadeEmitida / lote.quantidade) * 100) : 0;
              return (
                <tr key={lote.id} className="border-b border-border/10 last:border-0">
                  <td className="px-5 py-4 font-medium text-foreground">
                    {lote.nome}
                    {lote.especial && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                        Especial
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-muted/15">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${percentual}%` }} />
                      </div>
                      <span className="text-xs text-muted">
                        {lote.quantidadeEmitida}/{lote.quantidade} · {Math.round(percentual)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-foreground">{lote.preco > 0 ? formatarReais(lote.preco) : "Gratuito"}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setLoteParaEditar(lote)}
                        aria-label="Editar lote"
                        title="Editar lote"
                        className="grid h-9 w-9 place-items-center rounded-lg border border-border/15 text-muted hover:border-primary/30 hover:text-primary"
                      >
                        <Pencil size={15} />
                      </button>
                      <Button variant="secondary" onClick={() => setLoteParaEmitir(lote)} className="gap-2">
                        <Ticket size={15} /> Emitir
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {lotes !== null && lotesFiltrados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                  {lotes.length === 0 ? "Nenhum lote criado ainda." : "Nenhum lote encontrado para essa busca."}
                </td>
              </tr>
            )}
            {lotes === null && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                  Carregando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {loteParaEmitir && (
        <ModalEmitirIngresso
          lote={loteParaEmitir}
          eventoId={id}
          token={token}
          onFechar={() => setLoteParaEmitir(null)}
          onEmitido={recarregar}
        />
      )}

      {loteParaEditar && (
        <ModalEditarLote
          lote={loteParaEditar}
          eventoId={id}
          token={token}
          onFechar={() => setLoteParaEditar(null)}
          onSalvo={recarregar}
        />
      )}
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
  const [precoCentavos, setPrecoCentavos] = useState(0);
  const [quantidade, setQuantidade] = useState("100");
  const [especial, setEspecial] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await criarLote(eventoId, { nome, preco: precoCentavos / 100, quantidade: Number(quantidade), especial }, token);
      setNome("");
      setPrecoCentavos(0);
      setQuantidade("100");
      setEspecial(false);
      await onCriado();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar o lote.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-5">
      <div className="min-w-40 flex-1">
        <Input id="lote-nome" label="Nome do lote" required value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <CurrencyInput id="lote-preco" label="Preço (R$ 0,00 = gratuito)" valorCentavos={precoCentavos} onChange={setPrecoCentavos} className="w-40" />
      <Input
        id="lote-quantidade"
        label="Quantidade"
        type="number"
        min={1}
        className="w-28"
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
      />
      <label className="flex h-12 items-center gap-2 rounded-xl border border-border/15 bg-background/60 px-3">
        <input type="checkbox" checked={especial} onChange={(e) => setEspecial(e.target.checked)} className="h-4 w-4 accent-primary" />
        <span className="text-sm text-foreground">Lote especial (privado)</span>
      </label>
      <Button type="submit" loading={enviando}>
        Criar lote
      </Button>
      {erro && <p className="basis-full text-sm text-danger">{erro}</p>}
      {especial && (
        <p className="basis-full text-xs text-muted">
          Lotes especiais ficam pensados pra só ser acessados através de um cupom especial protegido por senha (crie o cupom em
          Cupons de desconto).
        </p>
      )}
    </form>
  );
}
