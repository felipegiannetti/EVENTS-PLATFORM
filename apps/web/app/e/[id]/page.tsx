"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Lock,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
  XCircle,
} from "lucide-react";
import type { CupomValidacaoPublicaResponse, EventoResponse } from "@events-platform/shared-types";
import { formatarEnderecoEvento, ROTULO_CATEGORIA_EVENTO } from "@events-platform/shared-types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { buscarEventoPublico, desbloquearCupomPublico, urlBannerEvento, validarCupomPublico } from "@/lib/events-client";

export default function EventoPublicoPage() {
  return (
    <Suspense fallback={<EventoSkeleton />}>
      <EventoPublico />
    </Suspense>
  );
}

function EventoPublico() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const codigoCupom = searchParams.get("cupom");

  const [evento, setEvento] = useState<EventoResponse | null | "nao_encontrado">(null);
  const [cupom, setCupom] = useState<CupomValidacaoPublicaResponse | null>(null);
  const [cupomInvalido, setCupomInvalido] = useState(false);
  const [senhaCupom, setSenhaCupom] = useState("");
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [desbloqueando, setDesbloqueando] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    buscarEventoPublico(id)
      .then(setEvento)
      .catch(() => setEvento("nao_encontrado"));
  }, [id]);

  useEffect(() => {
    if (!codigoCupom) return;
    validarCupomPublico(id, codigoCupom)
      .then(setCupom)
      .catch((err) => {
        if (err instanceof ApiError) setCupomInvalido(true);
      });
  }, [id, codigoCupom]);

  const cupomTravado = cupom?.especial && cupom.tipo === undefined;

  async function onDesbloquear(e: FormEvent) {
    e.preventDefault();
    if (!codigoCupom) return;
    setErroSenha(null);
    setDesbloqueando(true);
    try {
      setCupom(await desbloquearCupomPublico(id, codigoCupom, senhaCupom));
    } catch (err) {
      setErroSenha(err instanceof ApiError ? err.message : "Não foi possível desbloquear o cupom.");
    } finally {
      setDesbloqueando(false);
    }
  }

  async function compartilhar() {
    const dados = { title: evento && evento !== "nao_encontrado" ? evento.nome : "RARO Tickets", url: window.location.href };
    if (navigator.share) {
      await navigator.share(dados).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  }

  if (evento === "nao_encontrado") {
    return (
      <main className="page-shell max-w-2xl py-20 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 text-primary"><Ticket size={28} /></span>
        <h1 className="page-title">Evento não encontrado</h1>
        <p className="page-description mx-auto">Esse evento não existe ou ainda não foi liberado para compradores.</p>
        <Link href="/eventos/todos" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft size={16} /> Ver outros eventos
        </Link>
      </main>
    );
  }

  if (!evento) return <EventoSkeleton />;

  const inicio = new Date(evento.data);

  return (
    <main className="min-h-[80vh] pb-16">
      <div className="mx-auto w-full max-w-6xl px-5 pt-7 sm:px-8 sm:pt-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/eventos/todos" className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-primary">
            <ArrowLeft size={16} /> Todos os eventos
          </Link>
          <button
            type="button"
            onClick={compartilhar}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/10 bg-card/80 px-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/25 hover:text-primary"
          >
            {linkCopiado ? <Check size={16} className="text-success" /> : <Share2 size={16} />}
            {linkCopiado ? "Link copiado" : "Compartilhar"}
          </button>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-border/10 bg-[#24114d] shadow-[0_28px_80px_rgb(46_40_88/0.2)]">
          {evento.temBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlBannerEvento(id)} alt={`Banner de ${evento.nome}`} className="h-[360px] w-full object-cover sm:h-[460px]" />
          ) : (
            <div className="h-[360px] bg-[radial-gradient(circle_at_75%_20%,rgb(139_92_246/0.7),transparent_35%),radial-gradient(circle_at_15%_90%,rgb(37_99_235/0.45),transparent_32%),linear-gradient(135deg,#24114d,#6d28d9)] sm:h-[460px]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120a25] via-[#120a25]/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10 lg:p-12">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] backdrop-blur-md">
                {ROTULO_CATEGORIA_EVENTO[evento.categoria]}
              </span>
              {evento.somenteMaioresDeIdade && (
                <span className="rounded-full border border-amber-300/25 bg-amber-300/20 px-3 py-1.5 text-[11px] font-bold text-amber-100 backdrop-blur-md">18+</span>
              )}
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-[1.05] tracking-[-0.045em] sm:text-5xl lg:text-6xl">{evento.nome}</h1>
            <p className="mt-4 flex items-center gap-2 text-sm text-white/80 sm:text-base">
              <MapPin size={18} className="shrink-0 text-violet-300" /> {evento.cidade}, {evento.estado}
            </p>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <section className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                icon={CalendarDays}
                titulo={inicio.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                texto={formatarHorario(evento.data, evento.dataFim)}
              />
              <InfoCard icon={MapPin} titulo={evento.cidade && evento.estado ? `${evento.cidade}, ${evento.estado}` : "Local do evento"} texto={formatarEnderecoEvento(evento)} />
            </section>

            {codigoCupom && cupomTravado && (
              <Card className="rounded-3xl border-primary/15 p-6">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Lock size={18} /></span>
                  <div>
                    <p className="font-semibold text-foreground">Cupom especial <span className="font-mono">{cupom.codigo}</span></p>
                    <p className="mt-1 text-sm leading-6 text-muted">Digite a senha para revelar os benefícios deste acesso especial.</p>
                  </div>
                </div>
                <form onSubmit={onDesbloquear} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <Input id="senha-cupom-publico" label="Senha do cupom" type="password" required value={senhaCupom} onChange={(e) => setSenhaCupom(e.target.value)} error={erroSenha ?? undefined} />
                  </div>
                  <Button type="submit" loading={desbloqueando}>Desbloquear</Button>
                </form>
              </Card>
            )}

            {codigoCupom && !cupomTravado && (
              <Card className={`flex items-start gap-3 rounded-3xl p-5 ${cupom ? "border-success/20 bg-success/5" : cupomInvalido ? "border-danger/20 bg-danger/5" : ""}`}>
                {cupom && cupom.tipo !== undefined && cupom.valor !== undefined ? (
                  <>
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
                    <p className="text-sm leading-6 text-foreground">Cupom <strong className="font-mono">{cupom.codigo}</strong> aplicado — {cupom.tipo === "percentual" ? `${cupom.valor}%` : `R$ ${cupom.valor.toFixed(2)}`} de desconto.</p>
                  </>
                ) : cupomInvalido ? (
                  <>
                    <XCircle size={20} className="mt-0.5 shrink-0 text-danger" />
                    <p className="text-sm leading-6 text-foreground">O cupom <strong className="font-mono">{codigoCupom}</strong> não é válido para este evento.</p>
                  </>
                ) : <p className="text-sm text-muted">Verificando cupom...</p>}
              </Card>
            )}

            <section className="rounded-3xl border border-border/10 bg-card/85 p-6 shadow-card backdrop-blur-sm sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles size={18} /></span>
                <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">Sobre o evento</h2>
              </div>
              {evento.descricao ? (
                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-foreground/75 sm:text-base">{evento.descricao}</p>
              ) : (
                <p className="mt-5 text-sm leading-7 text-muted">O organizador ainda não adicionou uma descrição para este evento.</p>
              )}
            </section>

            <section className="rounded-3xl border border-border/10 bg-card/85 p-6 shadow-card sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><Info size={18} /></span>
                <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">Informações importantes</h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface/80 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck size={16} className="text-success" /> Ingresso seguro</p>
                  <p className="mt-1.5 text-xs leading-5 text-muted">QR code individual, validado uma única vez na entrada.</p>
                </div>
                <div className="rounded-2xl bg-surface/80 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><UserRound size={16} className="text-primary" /> Transferência</p>
                  <p className="mt-1.5 text-xs leading-5 text-muted">{evento.transferivel ? "Este evento permite transferir ingressos para outra conta." : "Os ingressos deste evento são pessoais e não transferíveis."}</p>
                </div>
              </div>
            </section>

            {(evento.contatoNome || evento.contatoEmail || evento.contatoTelefone) && (
              <section className="rounded-3xl border border-border/10 bg-card/85 p-6 shadow-card sm:p-8">
                <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">Fale com o organizador</h2>
                {evento.contatoNome && <p className="mt-1 text-sm text-muted">{evento.contatoNome}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {evento.contatoEmail && <a href={`mailto:${evento.contatoEmail}`} className="inline-flex items-center gap-2 rounded-xl border border-border/10 bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition hover:border-primary/25 hover:text-primary"><Mail size={15} /> {evento.contatoEmail}</a>}
                  {evento.contatoTelefone && <a href={`tel:${evento.contatoTelefone.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 rounded-xl border border-border/10 bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition hover:border-primary/25 hover:text-primary"><Phone size={15} /> {evento.contatoTelefone}</a>}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl border border-border/10 bg-card shadow-[0_20px_60px_rgb(46_40_88/0.14)]">
              <div className="bg-gradient-to-br from-primary to-violet-600 px-6 py-7 text-white">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Ticket size={21} /></span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-violet-100">Ingressos</p>
                <h2 className="mt-1 text-2xl font-bold tracking-[-0.035em]">Garanta sua entrada</h2>
              </div>
              <div className="p-6">
                <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">Venda online em breve</p>
                  <p className="mt-1.5 text-xs leading-5 text-muted">No momento, os ingressos são emitidos diretamente pelo organizador.</p>
                </div>
                {evento.contatoEmail ? (
                  <a href={`mailto:${evento.contatoEmail}?subject=${encodeURIComponent(`Ingresso — ${evento.nome}`)}`} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgb(109_40_217/0.24)] transition hover:-translate-y-0.5">
                    Falar com o organizador <ChevronRight size={17} />
                  </a>
                ) : (
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface p-3 text-xs leading-5 text-muted"><Info size={15} className="mt-0.5 shrink-0" /> Aguarde as orientações do organizador para obter seu ingresso.</div>
                )}
                <Link href="/meus-ingressos" className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-primary transition hover:bg-primary/5">
                  Ver meus ingressos <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ icon: Icon, titulo, texto }: { icon: typeof CalendarDays; titulo: string; texto: string }) {
  return (
    <div className="flex min-w-0 gap-4 rounded-3xl border border-border/10 bg-card/85 p-5 shadow-card">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={19} /></span>
      <div className="min-w-0">
        <p className="capitalize font-semibold text-foreground">{titulo}</p>
        <p className="mt-1 text-xs leading-5 text-muted">{texto}</p>
      </div>
    </div>
  );
}

function formatarHorario(data: string, dataFim: string | null) {
  const inicio = new Date(data);
  const horaInicio = inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (!dataFim) return `A partir das ${horaInicio}`;
  const fim = new Date(dataFim);
  const mesmoDia = inicio.toDateString() === fim.toDateString();
  const horaFim = fim.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return mesmoDia
    ? `${horaInicio} às ${horaFim}`
    : `${horaInicio} até ${fim.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`;
}

function EventoSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl animate-pulse px-5 py-10 sm:px-8">
      <div className="h-5 w-36 rounded bg-surface" />
      <div className="mt-5 h-[360px] rounded-[2rem] bg-surface sm:h-[460px]" />
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4"><div className="h-28 rounded-3xl bg-surface" /><div className="h-52 rounded-3xl bg-surface" /></div>
        <div className="h-72 rounded-3xl bg-surface" />
      </div>
    </main>
  );
}
