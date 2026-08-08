"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Check, Copy, DollarSign, Percent, Plus, Tag, Trash2 } from "lucide-react";
import type { CupomDescontoResponse, TipoDescontoCupom } from "@events-platform/shared-types";
import { formatarDescontoCupom } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ApiError } from "@/lib/api-client";
import { atualizarCupom, criarCupom, listarCupons, removerCupom } from "@/lib/events-client";

export default function CuponsEventoPage() {
  return <ProtectedPage>{(token) => <PainelCupons token={token} />}</ProtectedPage>;
}

function PainelCupons({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [cupons, setCupons] = useState<CupomDescontoResponse[] | null>(null);
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<TipoDescontoCupom>("percentual");
  const [percentual, setPercentual] = useState("10");
  const [valorCentavos, setValorCentavos] = useState(1000);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState<string | null>(null);

  async function recarregar() {
    setCupons(await listarCupons(id, token));
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
      await criarCupom(id, { codigo, tipo, valor }, token);
      setCodigo("");
      setPercentual("10");
      setValorCentavos(1000);
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar o cupom.");
    } finally {
      setEnviando(false);
    }
  }

  async function onAlternarAtivo(cupom: CupomDescontoResponse) {
    try {
      await atualizarCupom(id, cupom.id, { ativo: !cupom.ativo }, token);
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível atualizar o cupom.");
    }
  }

  async function onRemover(cupomId: string) {
    try {
      await removerCupom(id, cupomId, token);
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível remover o cupom.");
    }
  }

  async function onCopiar(codigoCupom: string) {
    await navigator.clipboard.writeText(codigoCupom);
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
        Crie cupons em percentual ou valor fixo. Eles ficam prontos para uso assim que a compra
        self-service (checkout) entrar na plataforma — por isso "usos" começa e fica em 0 por
        enquanto, não é possível inventar esse número.
      </p>

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

          <Button type="submit" loading={enviando} className="gap-2">
            <Plus size={16} /> Criar cupom
          </Button>
        </form>
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {cupons?.map((cupom) => (
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
                    aria-label="Copiar código do cupom"
                    title="Copiar código"
                    className="text-muted hover:text-primary"
                  >
                    {codigoCopiado === cupom.codigo ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-sm text-muted">
                  {formatarDescontoCupom(cupom)} de desconto · {cupom.usos} venda{cupom.usos === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onAlternarAtivo(cupom)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  cupom.ativo ? "bg-success/10 text-success" : "bg-muted/15 text-muted"
                }`}
              >
                {cupom.ativo ? "Ativo" : "Inativo"}
              </button>
              <button
                type="button"
                onClick={() => onRemover(cupom.id)}
                aria-label="Remover cupom"
                className="text-danger hover:text-danger/80"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
        {cupons?.length === 0 && <p className="text-sm text-muted">Nenhum cupom criado ainda.</p>}
        {cupons === null && <p className="text-sm text-muted">Carregando...</p>}
      </div>
    </main>
  );
}
