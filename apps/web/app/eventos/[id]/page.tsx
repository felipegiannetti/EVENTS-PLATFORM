"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CalendarClock, CircleDot, Eye, EyeOff, Ticket, Users, Wallet } from "lucide-react";
import type { EventoResponse, IngressoResponse, ResumoFinanceiroEvento } from "@events-platform/shared-types";
import { formatarEnderecoEvento, ROTULO_CATEGORIA_EVENTO } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { formatarReais } from "@/components/ui/stat";
import { ApiError } from "@/lib/api-client";
import { atualizarEvento, buscarEvento } from "@/lib/events-client";
import { listarIngressos } from "@/lib/tickets-client";
import { buscarResumoFinanceiro } from "@/lib/finance-client";

export default function EventoDetalhePage() {
  return <ProtectedPage>{(token) => <EventoDetalhe token={token} />}</ProtectedPage>;
}

function EventoDetalhe({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [ingressos, setIngressos] = useState<IngressoResponse[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiroEvento | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [alterandoVisibilidade, setAlterandoVisibilidade] = useState(false);

  async function recarregar() {
    const [eventoAtual, ingressosAtuais, resumoAtual] = await Promise.all([
      buscarEvento(id, token),
      listarIngressos(id, token),
      buscarResumoFinanceiro(id, token),
    ]);
    setEvento(eventoAtual);
    setIngressos(ingressosAtuais);
    setResumo(resumoAtual);
  }

  useEffect(() => {
    recarregar().catch((err) =>
      setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o evento."),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  async function onAlternarVisibilidade() {
    if (!evento) return;
    setAlterandoVisibilidade(true);
    try {
      const atualizado = await atualizarEvento(id, { publicado: !evento.publicado }, token);
      setEvento(atualizado);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível alterar a visibilidade do evento.");
    } finally {
      setAlterandoVisibilidade(false);
    }
  }

  if (erro) {
    return <p className="p-6 text-sm text-danger">{erro}</p>;
  }
  if (!evento) {
    return <p className="p-6 text-sm text-muted">Carregando...</p>;
  }

  const status = calcularStatusEvento(evento.data, evento.dataFim);

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow">Painel do evento</span>
      <h1 className="page-title">{evento.nome}</h1>
      <p className="page-description">
        {formatarPeriodoEvento(evento.data, evento.dataFim)} · {formatarEnderecoEvento(evento)}
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="section-title !text-base">Detalhes do evento</h2>
          <dl className="mt-4 grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Status</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-medium text-foreground">
                <CircleDot size={13} className={status.cor} /> {status.rotulo}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Categoria</dt>
              <dd className="mt-1 font-medium text-foreground">{ROTULO_CATEGORIA_EVENTO[evento.categoria]}</dd>
            </div>
            {evento.somenteMaioresDeIdade && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Classificação</dt>
                <dd className="mt-1 inline-flex w-fit rounded-full bg-warning/10 px-2 py-0.5 font-semibold text-warning">18+</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Visibilidade</dt>
              <dd className="mt-1 flex items-center gap-2">
                <span className={`font-medium ${evento.publicado ? "text-success" : "text-muted"}`}>
                  {evento.publicado ? "Visível para compradores" : "Privado"}
                </span>
                <button
                  type="button"
                  onClick={onAlternarVisibilidade}
                  disabled={alterandoVisibilidade}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {evento.publicado ? <EyeOff size={13} /> : <Eye size={13} />}
                  {alterandoVisibilidade ? "Salvando..." : evento.publicado ? "Tornar privado" : "Liberar para compradores"}
                </button>
              </dd>
            </div>
          </dl>
          <Link href={`/eventos/${id}/detalhes`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            {evento.descricao || evento.contatoNome ? "Editar banner, descrição e contato →" : "Adicionar banner, descrição e contato →"}
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="section-title !text-base">Financeiro</h2>
          {resumo && (
            <dl className="mt-4 grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Vendas totais</dt>
                <dd className="mt-1 text-lg font-semibold text-foreground">{formatarReais(resumo.vendasBrutas)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Ticket médio</dt>
                <dd className="mt-1 text-lg font-semibold text-foreground">{formatarReais(resumo.ticketMedioBruto)}</dd>
              </div>
            </dl>
          )}
          <p className="mt-3 text-xs text-muted">
            Ainda não há gateway de pagamento integrado — por isso não mostramos "em processamento" nem "total recebido" aqui, seria inventar dado.
          </p>
          <Link href={`/eventos/${id}/financeiro`} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
            Ver detalhes financeiros →
          </Link>
        </Card>
      </div>

      <section className="mt-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title !text-base">Ingressos</h2>
            <Link href={`/eventos/${id}/ingressos`} className="text-sm font-medium text-primary hover:underline">
              Gerenciar lotes e ingressos →
            </Link>
          </div>

          {resumo && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniStat icon={Ticket} label="Confirmados" value={resumo.ingressosValidos} tom="text-success" />
              <MiniStat icon={Ticket} label="Cancelados" value={resumo.ingressosCancelados} tom="text-danger" />
              <MiniStat icon={Users} label="Emitidos ao todo" value={ingressos.length} tom="text-primary" />
            </div>
          )}

          <GraficoEmissoesPorDia ingressos={ingressos} />
        </Card>
      </section>
    </main>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tom,
}: {
  icon: typeof Ticket;
  label: string;
  value: number;
  tom: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/10 bg-background/60 px-4 py-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-current/10 ${tom}`}>
        <Icon size={16} className={tom} />
      </span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

/** Barra por dia usando Ingresso.criadoEm real — sem número inventado (nada de "visualizações da página" fake). */
function GraficoEmissoesPorDia({ ingressos }: { ingressos: IngressoResponse[] }) {
  const DIAS = 14;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const contagemPorDia = new Map<string, number>();
  for (const ingresso of ingressos) {
    const dia = new Date(ingresso.criadoEm);
    dia.setHours(0, 0, 0, 0);
    const chave = dia.toISOString().slice(0, 10);
    contagemPorDia.set(chave, (contagemPorDia.get(chave) ?? 0) + 1);
  }

  const dias = Array.from({ length: DIAS }, (_, i) => {
    const data = new Date(hoje);
    data.setDate(data.getDate() - (DIAS - 1 - i));
    const chave = data.toISOString().slice(0, 10);
    return { chave, data, total: contagemPorDia.get(chave) ?? 0 };
  });

  const maximo = Math.max(1, ...dias.map((d) => d.total));

  if (ingressos.length === 0) {
    return <p className="mt-6 text-sm text-muted">Ainda não há ingressos emitidos para mostrar no gráfico.</p>;
  }

  return (
    <div className="mt-6">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <CalendarClock size={13} /> Ingressos emitidos por dia (últimos 14 dias)
      </p>
      <div className="flex h-24 items-end gap-1.5">
        {dias.map((dia) => (
          <div key={dia.chave} className="group relative flex-1">
            <div
              className="w-full rounded-t-sm bg-primary/70 transition-colors group-hover:bg-primary"
              style={{ height: `${Math.max(4, (dia.total / maximo) * 96)}px` }}
            />
            <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[10px] font-semibold text-background group-hover:block">
              {dia.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}: {dia.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function calcularStatusEvento(data: string, dataFim: string | null): { rotulo: string; cor: string } {
  const agora = new Date();
  const inicio = new Date(data);
  const fim = dataFim ? new Date(dataFim) : null;

  if (agora < inicio) return { rotulo: "Programado", cor: "text-primary" };
  if (fim ? agora <= fim : agora.toDateString() === inicio.toDateString()) {
    return { rotulo: "Em andamento", cor: "text-success" };
  }
  return { rotulo: "Encerrado", cor: "text-muted" };
}

function formatarPeriodoEvento(data: string, dataFim: string | null): string {
  const inicio = new Date(data);
  const inicioTexto = inicio.toLocaleString("pt-BR");
  if (!dataFim) return inicioTexto;

  const fim = new Date(dataFim);
  const mesmoDia = inicio.toDateString() === fim.toDateString();
  const fimTexto = mesmoDia
    ? fim.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : fim.toLocaleString("pt-BR");
  return `${inicioTexto} até ${fimTexto}`;
}
