"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Check, Copy, DollarSign, Pencil, Percent, Plus, Search, Tag, Trash2 } from "lucide-react";
import type { CupomDescontoResponse, EventoResponse, TipoDescontoCupom } from "@events-platform/shared-types";
import { formatarDescontoCupom } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Pagination, ITENS_POR_PAGINA } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api-client";
import { atualizarCupom, buscarEvento, criarCupom, listarCupons, removerCupom, urlPublicaEvento } from "@/lib/events-client";

export default function CuponsEventoPage() {
  return <ProtectedPage>{(token) => <PainelCupons token={token} />}</ProtectedPage>;
}

function PainelCupons({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [cupons, setCupons] = useState<CupomDescontoResponse[] | null>(null);
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<TipoDescontoCupom>("percentual");
  const [percentual, setPercentual] = useState("10");
  const [valorCentavos, setValorCentavos] = useState(1000);
  const [limiteUsos, setLimiteUsos] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState<string | null>(null);
  const [cupomEditando, setCupomEditando] = useState<CupomDescontoResponse | null>(null);
  const [cupomRemovendo, setCupomRemovendo] = useState<CupomDescontoResponse | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [cupomAlternando, setCupomAlternando] = useState<CupomDescontoResponse | null>(null);
  const [alternando, setAlternando] = useState(false);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const cuponsFiltrados = useMemo(() => {
    if (!cupons) return [];
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return termo ? cupons.filter((cupom) => cupom.codigo.toLocaleLowerCase("pt-BR").includes(termo)) : cupons;
  }, [cupons, busca]);

  const totalPaginas = Math.max(1, Math.ceil(cuponsFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const cuponsPaginados = cuponsFiltrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  async function recarregar() {
    const [cuponsAtuais, eventoAtual] = await Promise.all([listarCupons(id, token), buscarEvento(id, token)]);
    setCupons(cuponsAtuais);
    setEvento(eventoAtual);
  }

  useEffect(() => {
    recarregar().catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar os cupons."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  async function onCriar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const valor = tipo === "percentual" ? Number(percentual) : valorCentavos / 100;
      await criarCupom(id, { codigo, tipo, valor, limiteUsos: limiteUsos ? Number(limiteUsos) : undefined }, token);
      setCodigo("");
      setPercentual("10");
      setValorCentavos(1000);
      setLimiteUsos("");
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar o cupom.");
    } finally {
      setEnviando(false);
    }
  }

  async function onConfirmarAlternarAtivo() {
    if (!cupomAlternando) return;
    setAlternando(true);
    try {
      await atualizarCupom(
        id,
        cupomAlternando.id,
        {
          codigo: cupomAlternando.codigo,
          tipo: cupomAlternando.tipo,
          valor: cupomAlternando.valor,
          limiteUsos: cupomAlternando.limiteUsos ?? undefined,
          ativo: !cupomAlternando.ativo,
        },
        token,
      );
      setCupomAlternando(null);
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível atualizar o cupom.");
      setCupomAlternando(null);
    } finally {
      setAlternando(false);
    }
  }

  async function onConfirmarRemocao() {
    if (!cupomRemovendo) return;
    setRemovendo(true);
    try {
      await removerCupom(id, cupomRemovendo.id, token);
      setCupomRemovendo(null);
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível remover o cupom.");
      setCupomRemovendo(null);
    } finally {
      setRemovendo(false);
    }
  }

  async function onCopiar(codigoCupom: string) {
    const link = urlPublicaEvento(id, window.location.origin, codigoCupom);
    await navigator.clipboard.writeText(link);
    setCodigoCopiado(codigoCupom);
    setTimeout(() => setCodigoCopiado(null), 2000);
  }

  return (
    <main className="page-shell max-w-4xl">
      <span className="eyebrow">
        <Tag size={12} /> Cupons de desconto
      </span>
      <h1 className="page-title">Cupons deste evento</h1>
      <p className="page-description">
        Crie cupons em percentual ou valor fixo e limite quantas vezes cada um pode ser usado.
        <HelpTooltip
          className="ml-1.5"
          texto={'O botão de copiar gera o link direto da página do evento já com o cupom aplicado. A compra em si (checkout) ainda não existe na plataforma — "usos" só sobe quando um organizador emite um ingresso manualmente marcando que esse cupom foi usado.'}
        />
      </p>

      {evento && !evento.publicado && (
        <Card className="mt-6 flex items-center gap-3 border-warning/20 bg-warning/5 p-4">
          <AlertTriangle size={18} className="shrink-0 text-warning" />
          <p className="text-sm text-foreground">
            Este evento ainda está privado — o link do cupom não vai aparecer pra ninguém até você
            liberá-lo para compradores no painel do evento.
          </p>
        </Card>
      )}

      <Card className="mt-8 p-6">
        <h2 className="section-title !text-base">Novo cupom</h2>
        <form onSubmit={onCriar} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-32 flex-1">
            <Input
              id="codigo"
              label="Código"
              required
              placeholder="EX: PROMO10"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-foreground/80">Tipo</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTipo("percentual")}
                aria-label="Percentual"
                title="Percentual (%)"
                className={`grid h-12 w-12 place-items-center rounded-full border-2 transition-all ${
                  tipo === "percentual" ? "border-primary bg-primary/10 text-primary" : "border-border/15 text-muted hover:border-primary/30"
                }`}
              >
                <Percent size={18} />
              </button>
              <button
                type="button"
                onClick={() => setTipo("valor_fixo")}
                aria-label="Valor fixo"
                title="Valor fixo (R$)"
                className={`grid h-12 w-12 place-items-center rounded-full border-2 transition-all ${
                  tipo === "valor_fixo" ? "border-primary bg-primary/10 text-primary" : "border-border/15 text-muted hover:border-primary/30"
                }`}
              >
                <DollarSign size={18} />
              </button>
            </div>
          </div>

          {tipo === "percentual" ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="percentual" className="text-sm font-semibold text-foreground/80">
                Desconto
              </label>
              <div className="relative">
                <input
                  id="percentual"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={percentual}
                  onChange={(e) => setPercentual(e.target.value)}
                  className="h-12 w-28 rounded-xl border border-border/15 bg-background/60 px-4 pr-8 text-sm text-foreground shadow-inner outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">%</span>
              </div>
            </div>
          ) : (
            <CurrencyInput id="valorCentavos" label="Desconto" valorCentavos={valorCentavos} onChange={setValorCentavos} className="w-32" />
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="limite-usos" className="flex items-center text-sm font-semibold text-foreground/80">
              Limite de usos
              <HelpTooltip className="ml-1.5" texto="Deixe em branco para o cupom valer sem limite de vezes. Se preencher, a emissão manual passa a ser bloqueada assim que esse número de usos for atingido." />
            </label>
            <input
              id="limite-usos"
              type="number"
              min={1}
              placeholder="Ilimitado"
              value={limiteUsos}
              onChange={(e) => setLimiteUsos(e.target.value)}
              className="h-12 w-28 rounded-xl border border-border/15 bg-background/60 px-4 text-sm text-foreground shadow-inner outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <Button type="submit" loading={enviando} className="gap-2">
            <Plus size={16} /> Criar cupom
          </Button>
        </form>
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
      </Card>

      {cupons && cupons.length > 0 && (
        <div className="relative mt-6">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por código do cupom..."
            className="h-11 w-full rounded-xl border border-border/15 bg-background/60 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {cuponsPaginados.map((cupom) => (
          <Card key={cupom.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                {cupom.tipo === "percentual" ? <Percent size={17} /> : <DollarSign size={17} />}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-semibold text-foreground">{cupom.codigo}</p>
                  <button
                    type="button"
                    onClick={() => onCopiar(cupom.codigo)}
                    aria-label="Copiar link de compra com este cupom"
                    title="Copiar link de compra com este cupom"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    {codigoCopiado === cupom.codigo ? (
                      <>
                        <Check size={14} className="text-success" /> Link copiado
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copiar link
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-muted">
                  {formatarDescontoCupom(cupom)} de desconto ·{" "}
                  {cupom.limiteUsos !== null
                    ? `${cupom.usos}/${cupom.limiteUsos} uso${cupom.limiteUsos === 1 ? "" : "s"}`
                    : `${cupom.usos} venda${cupom.usos === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCupomAlternando(cupom)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  cupom.ativo ? "bg-success/10 text-success" : "bg-muted/15 text-muted"
                }`}
              >
                {cupom.ativo ? "Ativo" : "Inativo"}
              </button>
              <button
                type="button"
                onClick={() => setCupomEditando(cupom)}
                aria-label="Editar cupom"
                title="Editar cupom"
                className="text-muted hover:text-primary"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCupomRemovendo(cupom)}
                disabled={cupom.usos > 0}
                aria-label="Remover cupom"
                title={cupom.usos > 0 ? "Cupom já usado em alguma emissão — desative-o em vez de remover" : "Remover cupom"}
                className="text-danger hover:text-danger/80 disabled:cursor-not-allowed disabled:text-muted/40"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
        {cupons?.length === 0 && <p className="text-sm text-muted">Nenhum cupom criado ainda.</p>}
        {cupons && cupons.length > 0 && cuponsFiltrados.length === 0 && (
          <p className="text-sm text-muted">Nenhum cupom encontrado para essa busca.</p>
        )}
        {cupons === null && <p className="text-sm text-muted">Carregando...</p>}
      </div>

      <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onMudarPagina={setPagina} />

      {cupomEditando && (
        <ModalEditarCupom
          eventoId={id}
          cupom={cupomEditando}
          token={token}
          onFechar={() => setCupomEditando(null)}
          onSalvo={() => {
            setCupomEditando(null);
            recarregar();
          }}
        />
      )}

      {cupomRemovendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-semibold">Remover este cupom?</h2>
            <p className="mt-2 text-sm text-muted">
              O cupom <strong className="font-mono text-foreground">{cupomRemovendo.codigo}</strong> vai ser removido
              permanentemente. Essa ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="secondary" onClick={() => setCupomRemovendo(null)} className="flex-1" disabled={removendo}>
                Voltar
              </Button>
              <Button onClick={onConfirmarRemocao} loading={removendo} className="flex-1 !bg-danger !bg-none">
                Remover cupom
              </Button>
            </div>
          </Card>
        </div>
      )}

      {cupomAlternando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-semibold">
              {cupomAlternando.ativo ? "Desativar" : "Ativar"} o cupom{" "}
              <span className="font-mono">{cupomAlternando.codigo}</span>?
            </h2>
            <p className="mt-2 text-sm text-muted">
              {cupomAlternando.ativo
                ? "Enquanto estiver inativo, esse cupom não pode ser usado numa nova emissão nem no link de compra."
                : "O cupom volta a poder ser usado em novas emissões e no link de compra."}
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="secondary" onClick={() => setCupomAlternando(null)} className="flex-1" disabled={alternando}>
                Voltar
              </Button>
              <Button onClick={onConfirmarAlternarAtivo} loading={alternando} className="flex-1">
                {cupomAlternando.ativo ? "Desativar" : "Ativar"} cupom
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}

function ModalEditarCupom({
  eventoId,
  cupom,
  token,
  onFechar,
  onSalvo,
}: {
  eventoId: string;
  cupom: CupomDescontoResponse;
  token: string;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [codigo, setCodigo] = useState(cupom.codigo);
  const [tipo, setTipo] = useState<TipoDescontoCupom>(cupom.tipo);
  const [percentual, setPercentual] = useState(cupom.tipo === "percentual" ? String(cupom.valor) : "10");
  const [valorCentavos, setValorCentavos] = useState(cupom.tipo === "valor_fixo" ? Math.round(cupom.valor * 100) : 0);
  const [limiteUsos, setLimiteUsos] = useState(cupom.limiteUsos !== null ? String(cupom.limiteUsos) : "");
  const [ativo, setAtivo] = useState(cupom.ativo);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const valor = tipo === "percentual" ? Number(percentual) : valorCentavos / 100;
      await atualizarCupom(
        eventoId,
        cupom.id,
        { codigo, tipo, valor, limiteUsos: limiteUsos ? Number(limiteUsos) : undefined, ativo },
        token,
      );
      onSalvo();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o cupom.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold">Editar cupom</h2>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          <Input id="editar-cupom-codigo" label="Código" required value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-foreground/80">Tipo</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTipo("percentual")}
                aria-label="Percentual"
                title="Percentual (%)"
                className={`grid h-11 w-11 place-items-center rounded-full border-2 transition-all ${
                  tipo === "percentual" ? "border-primary bg-primary/10 text-primary" : "border-border/15 text-muted hover:border-primary/30"
                }`}
              >
                <Percent size={16} />
              </button>
              <button
                type="button"
                onClick={() => setTipo("valor_fixo")}
                aria-label="Valor fixo"
                title="Valor fixo (R$)"
                className={`grid h-11 w-11 place-items-center rounded-full border-2 transition-all ${
                  tipo === "valor_fixo" ? "border-primary bg-primary/10 text-primary" : "border-border/15 text-muted hover:border-primary/30"
                }`}
              >
                <DollarSign size={16} />
              </button>
            </div>
          </div>

          {tipo === "percentual" ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="editar-percentual" className="text-sm font-semibold text-foreground/80">
                Desconto
              </label>
              <div className="relative">
                <input
                  id="editar-percentual"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={percentual}
                  onChange={(e) => setPercentual(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border/15 bg-background/60 px-4 pr-8 text-sm text-foreground shadow-inner outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">%</span>
              </div>
            </div>
          ) : (
            <CurrencyInput id="editar-valorCentavos" label="Desconto" valorCentavos={valorCentavos} onChange={setValorCentavos} />
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="editar-limite-usos" className="text-sm font-semibold text-foreground/80">
              Limite de usos (vazio = ilimitado)
            </label>
            <input
              id="editar-limite-usos"
              type="number"
              min={1}
              placeholder="Ilimitado"
              value={limiteUsos}
              onChange={(e) => setLimiteUsos(e.target.value)}
              className="h-12 rounded-xl border border-border/15 bg-background/60 px-4 text-sm text-foreground shadow-inner outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            {limiteUsos !== "" && Number(limiteUsos) < cupom.usos && (
              <p className="text-xs text-danger">Esse cupom já foi usado {cupom.usos} vez(es) — não dá pra colocar um limite menor que isso.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setAtivo((v) => !v)}
            className={`flex h-12 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
              ativo ? "bg-success/10 text-success" : "bg-muted/15 text-muted"
            }`}
          >
            {ativo ? "Ativo" : "Inativo"}
          </button>

          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="mt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={onFechar} className="flex-1" disabled={salvando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={salvando}
              disabled={limiteUsos !== "" && Number(limiteUsos) < cupom.usos}
              className="flex-1"
            >
              Salvar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
