"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Copy, Gift, Landmark, Link2, Sparkles, TrendingUp, Users } from "lucide-react";
import { BANCOS_BRASIL, nomeDoBanco, type PainelIndicacaoResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Stat, formatarReais } from "@/components/ui/stat";
import { ApiError } from "@/lib/api-client";
import { formatarCpfOuCnpj } from "@/lib/formatters";
import {
  buscarPainelIndicacoes,
  criarOfertaIndicacao,
  criarProgramaIndicacao,
} from "@/lib/referrals-client";

export default function IndicacoesPage() {
  return <ProtectedPage>{(token) => <PainelIndicacoes token={token} />}</ProtectedPage>;
}

function PainelIndicacoes({ token }: { token: string }) {
  const [painel, setPainel] = useState<PainelIndicacaoResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    setErro(null);
    return buscarPainelIndicacoes(token)
      .then(setPainel)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar suas indicações."));
  }, [token]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  if (erro && !painel) {
    return <p className="p-6 text-sm text-danger">{erro}</p>;
  }

  if (!painel) {
    return <div className="page-shell"><div className="h-72 animate-pulse rounded-3xl border border-border/10 bg-card/70" /></div>;
  }

  return (
    <main className="page-shell max-w-6xl">
      <div className="overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-blue-500/10 p-7 shadow-card sm:p-10">
        <span className="eyebrow"><Sparkles size={12} /> Programa de indicação</span>
        <div className="mt-4 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="page-title max-w-2xl">Indique organizadores. Cresça junto com eles.</h1>
            <p className="page-description max-w-2xl">
              Crie ofertas personalizadas, compartilhe seu link e receba em todos os eventos pagos de cada organizador indicado.
            </p>
          </div>
          {painel.programa && (
            <div className="rounded-2xl border border-border/10 bg-background/60 px-5 py-4 text-sm backdrop-blur">
              <p className="flex items-center gap-2 font-semibold"><Landmark size={16} className="text-primary" /> Conta de recebimento</p>
              <p className="mt-1 text-muted">{nomeDoBanco(painel.programa.banco)} · final {painel.programa.contaFinal}</p>
            </div>
          )}
        </div>
      </div>

      {!painel.programa ? (
        <CadastroPrograma token={token} onCriado={recarregar} />
      ) : (
        <ConteudoPrograma token={token} painel={painel} onAtualizado={recarregar} />
      )}
    </main>
  );
}

function CadastroPrograma({ token, onCriado }: { token: string; onCriado: () => Promise<void> }) {
  const [banco, setBanco] = useState(BANCOS_BRASIL[0].codigo);
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [tipoConta, setTipoConta] = useState<"corrente" | "poupanca">("corrente");
  const [titular, setTitular] = useState("");
  const [documentoTitular, setDocumentoTitular] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await criarProgramaIndicacao(
        { banco, agencia, conta, tipoConta, titular, documentoTitular, senhaAtual },
        token,
      );
      await onCriado();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível ativar o programa.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="mx-auto mt-7 max-w-3xl p-7 sm:p-9">
      <h2 className="section-title">Cadastre sua conta de recebimento</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Essa conta será usada nos futuros repasses das suas comissões. Os dados ficam criptografados e sua senha confirma a operação.
      </p>
      <form onSubmit={onSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Select id="bancoIndicacao" label="Banco" value={banco} onChange={(e) => setBanco(e.target.value)}>
            {BANCOS_BRASIL.map((item) => <option key={item.codigo} value={item.codigo}>{item.nome}</option>)}
          </Select>
        </div>
        <Input id="agenciaIndicacao" label="Agência" required value={agencia} onChange={(e) => setAgencia(e.target.value)} />
        <Input id="contaIndicacao" label="Conta com dígito" required value={conta} onChange={(e) => setConta(e.target.value)} />
        <Select id="tipoContaIndicacao" label="Tipo de conta" value={tipoConta} onChange={(e) => setTipoConta(e.target.value as "corrente" | "poupanca")}>
          <option value="corrente">Conta corrente</option>
          <option value="poupanca">Poupança</option>
        </Select>
        <Input id="titularIndicacao" label="Titular" required value={titular} onChange={(e) => setTitular(e.target.value)} />
        <Input id="documentoIndicacao" label="CPF ou CNPJ do titular" required value={documentoTitular} onChange={(e) => setDocumentoTitular(formatarCpfOuCnpj(e.target.value))} />
        <Input id="senhaIndicacao" label="Sua senha atual" type="password" required value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
        {erro && <p className="text-sm text-danger sm:col-span-2">{erro}</p>}
        <Button type="submit" loading={enviando} className="sm:col-span-2">Ativar programa de indicação</Button>
      </form>
    </Card>
  );
}

function ConteudoPrograma({ token, painel, onAtualizado }: { token: string; painel: PainelIndicacaoResponse; onAtualizado: () => Promise<void> }) {
  const [percentual, setPercentual] = useState("2");
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const beneficio = Math.min(2, Math.max(0, Number(percentual.replace(",", ".")) || 0));
  const bonus = (2 - beneficio) * 0.25;

  async function criarLink(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCriando(true);
    try {
      await criarOfertaIndicacao({ percentualBeneficioOrganizador: beneficio }, token);
      await onAtualizado();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar o link.");
    } finally {
      setCriando(false);
    }
  }

  async function copiar(codigo: string) {
    const url = `${window.location.origin}/registro?ref=${codigo}`;
    await navigator.clipboard.writeText(url);
    setCopiado(codigo);
    window.setTimeout(() => setCopiado(null), 1800);
  }

  const eventosOrdenados = useMemo(
    () => [...painel.eventos].sort((a, b) => b.valorEstimado - a.valorEstimado),
    [painel.eventos],
  );

  return (
    <>
      <Card className="mt-7 grid grid-cols-2 gap-3 p-3 lg:grid-cols-4">
        <Stat label="Organizadores indicados" value={String(painel.totalIndicados)} />
        <Stat label="Eventos pagos" value={String(painel.totalEventosPagos)} />
        <Stat label="Comissão estimada" value={formatarReais(painel.totalEstimado)} hint="Antes da integração do gateway" />
        <Stat label="Ofertas criadas" value={String(painel.programa?.ofertas.length ?? 0)} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-7">
          <span className="eyebrow"><Gift size={12} /> Nova negociação</span>
          <h2 className="mt-3 text-xl font-bold tracking-tight">Crie um link personalizado</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Defina quanto o organizador receberá da taxa da plataforma em todos os eventos pagos dele. O limite é 2%.</p>
          <form onSubmit={criarLink} className="mt-6">
            <Input id="percentualBeneficio" label="Benefício permanente do organizador (%)" type="number" min="0" max="2" step="0.01" required value={percentual} onChange={(e) => setPercentual(e.target.value)} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-primary/15 bg-primary/5">
              <LinhaCalculo rotulo="Organizador indicado" valor={`${beneficio.toFixed(2)}%`} destaque />
              <LinhaCalculo rotulo="Seu bônus pela negociação" valor={`${bonus.toFixed(2)}%`} />
              <LinhaCalculo rotulo="Você no primeiro evento" valor={`${(1 + bonus).toFixed(2)}%`} />
              <LinhaCalculo rotulo="Você nos eventos seguintes" valor={`${(0.25 + bonus).toFixed(2)}%`} />
            </div>
            {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
            <Button type="submit" loading={criando} className="mt-5 w-full"><Link2 size={16} /> Criar link de indicação</Button>
          </form>
        </Card>

        <Card className="p-7">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Link2 size={19} className="text-primary" /> Seus links</h2>
          <div className="mt-5 flex flex-col gap-3">
            {painel.programa?.ofertas.map((oferta) => {
              const ofertaBonus = (2 - oferta.percentualBeneficioOrganizador) * 0.25;
              return (
                <div key={oferta.id} className="rounded-2xl border border-border/10 bg-background/45 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{oferta.percentualBeneficioOrganizador.toFixed(2)}% para o organizador</p>
                      <p className="mt-1 text-xs text-muted">Seu bônus: {ofertaBonus.toFixed(2)}% · Código {oferta.codigo}</p>
                    </div>
                    <button type="button" onClick={() => copiar(oferta.codigo)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/10">
                      {copiado === oferta.codigo ? <Check size={15} /> : <Copy size={15} />}
                      {copiado === oferta.codigo ? "Copiado" : "Copiar link"}
                    </button>
                  </div>
                </div>
              );
            })}
            {painel.programa?.ofertas.length === 0 && <p className="rounded-2xl border border-dashed border-border/20 p-7 text-center text-sm text-muted">Crie seu primeiro link para começar.</p>}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow"><TrendingUp size={12} /> Desempenho</span>
            <h2 className="mt-3 text-xl font-bold tracking-tight">Eventos dos seus indicados</h2>
          </div>
          <p className="text-xs text-muted">Somente eventos com ingressos pagos · valores estimados</p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-border/10 text-[10px] uppercase tracking-wider text-muted">
              <tr><th className="px-3 py-3">Evento</th><th className="px-3 py-3">Organizador</th><th className="px-3 py-3">Comissão</th><th className="px-3 py-3">Base</th><th className="px-3 py-3 text-right">Estimativa</th></tr>
            </thead>
            <tbody>
              {eventosOrdenados.map((evento) => (
                <tr key={evento.eventoId} className="border-b border-border/5 last:border-0">
                  <td className="px-3 py-4 font-semibold">{evento.eventoNome}{evento.primeiroEventoPago && <span className="ml-2 rounded-full bg-success/10 px-2 py-1 text-[9px] font-bold text-success">PRIMEIRO</span>}</td>
                  <td className="px-3 py-4 text-muted">{evento.organizadorNome}</td>
                  <td className="px-3 py-4">{evento.percentualTotal.toFixed(2)}%</td>
                  <td className="px-3 py-4 text-muted">{formatarReais(evento.baseCalculo)}</td>
                  <td className="px-3 py-4 text-right font-bold text-primary">{formatarReais(evento.valorEstimado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {eventosOrdenados.length === 0 && <div className="grid place-items-center py-12 text-center"><Users size={30} className="text-primary/50" /><p className="mt-3 text-sm text-muted">As comissões aparecem aqui quando seus indicados realizarem eventos pagos.</p></div>}
        </div>
      </Card>

      <p className="mt-5 text-center text-xs text-muted">Os repasses reais serão processados quando o checkout e o gateway de pagamentos estiverem integrados. Nenhum valor estimado é apresentado como saldo disponível.</p>
    </>
  );
}

function LinhaCalculo({ rotulo, valor, destaque = false }: { rotulo: string; valor: string; destaque?: boolean }) {
  return <div className="flex items-center justify-between border-b border-border/10 px-4 py-3 text-sm last:border-0"><span className="text-muted">{rotulo}</span><strong className={destaque ? "text-primary" : "text-foreground"}>{valor}</strong></div>;
}
