"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BriefcaseBusiness, Check, Code2, GraduationCap, Mail, MapPin,
  Music2, PartyPopper, Search, Share2, Sparkles, TicketCheck, Trophy, Users,
  type LucideIcon,
} from "lucide-react";
import {
  CATEGORIA_EVENTO,
  formatarLocalizacaoEvento,
  ROTULO_CATEGORIA_EVENTO,
  type CategoriaEvento,
  type EventoResponse,
} from "@events-platform/shared-types";
import { useAuth } from "@/lib/auth-context";
import { listarEventosPublicos, urlBannerEvento } from "@/lib/events-client";
import { Button } from "@/components/ui/button";

const categoryStyle: Record<CategoriaEvento, { icon: LucideIcon; color: string; image: string }> = {
  shows: { icon: Music2, color: "text-violet-600 bg-violet-500/10", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85" },
  festivais: { icon: PartyPopper, color: "text-pink-600 bg-pink-500/10", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85" },
  negocios: { icon: BriefcaseBusiness, color: "text-blue-600 bg-blue-500/10", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=85" },
  esportes: { icon: Trophy, color: "text-emerald-600 bg-emerald-500/10", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=85" },
  cursos: { icon: GraduationCap, color: "text-amber-600 bg-amber-500/10", image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=85" },
  tecnologia: { icon: Code2, color: "text-cyan-600 bg-cyan-500/10", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=85" },
  outros: { icon: Sparkles, color: "text-primary bg-primary/10", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85" },
};

export default function HomePage() {
  const { accessToken } = useAuth();
  const [eventos, setEventos] = useState<EventoResponse[]>([]);
  const [carregandoEventos, setCarregandoEventos] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    listarEventosPublicos().then(setEventos).catch(() => setEventos([])).finally(() => setCarregandoEventos(false));
  }, []);

  const categoriasDisponiveis = useMemo(() => CATEGORIA_EVENTO.map((categoria) => ({
    categoria,
    quantidade: eventos.filter((evento) => evento.categoria === categoria).length,
  })).filter((item) => item.quantidade > 0), [eventos]);

  const eventosVisiveis = useMemo(() => eventos.filter((evento) => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const correspondeBusca = !termo || `${evento.nome} ${formatarLocalizacaoEvento(evento)}`.toLocaleLowerCase("pt-BR").includes(termo);
    return correspondeBusca;
  }), [busca, eventos]);

  return (
    <main className="overflow-hidden">
      <section className="page-shell !pt-6 sm:!pt-9">
        <div className="relative min-h-[580px] overflow-hidden rounded-[2rem] border border-border/10 bg-[#080b1b] shadow-[0_30px_90px_rgb(20_8_60/0.22)]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=90')] bg-cover bg-[center_35%]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,20,.98)_0%,rgba(6,8,24,.88)_38%,rgba(7,9,25,.26)_75%,rgba(7,9,25,.2)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070919] via-transparent to-transparent" />
          <div className="relative z-10 flex min-h-[580px] max-w-2xl flex-col justify-center px-7 py-16 sm:px-12 lg:px-16">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-100 backdrop-blur"><Sparkles size={14} /> Onde grandes histórias começam</span>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl">Viva experiências que <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">conectam</span> pessoas e marcas.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">Descubra eventos incríveis ou transforme sua ideia em uma experiência inesquecível.</p>
            <form action="/eventos/todos" method="get" className="search-shell mt-8 flex max-w-xl items-center rounded-2xl border border-white/10 bg-white/[0.08] p-1.5 shadow-2xl backdrop-blur-xl">
              <Search className="ml-3 text-slate-400" size={19} />
              <input name="q" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar eventos" placeholder="Buscar eventos por nome ou cidade..." className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
              <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-glow" aria-label="Pesquisar eventos"><ArrowRight size={18} /></button>
            </form>
            {categoriasDisponiveis.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{categoriasDisponiveis.map(({ categoria }) => <Link key={categoria} href={`/eventos/todos?categoria=${categoria}`} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] text-slate-300 transition-colors hover:bg-white/10">{ROTULO_CATEGORIA_EVENTO[categoria]}</Link>)}</div>}
          </div>
        </div>
      </section>

      {categoriasDisponiveis.length > 0 && (
        <section id="categorias" className="page-shell scroll-mt-24">
          <div><span className="eyebrow">Explore</span><h2 className="section-title mt-3">Encontre seu próximo momento</h2></div>
          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{categoriasDisponiveis.map(({ categoria, quantidade }) => {
            const { icon: Icon, color } = categoryStyle[categoria];
            return <Link key={categoria} href={`/eventos/todos?categoria=${categoria}`} className="group rounded-2xl border border-border/10 bg-card/80 p-5 text-left shadow-card transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-glow"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${color}`}><Icon size={22} /></span><p className="mt-4 font-semibold text-foreground">{ROTULO_CATEGORIA_EVENTO[categoria]}</p><p className="mt-1 text-xs text-muted">{quantidade} {quantidade === 1 ? "evento" : "eventos"}</p></Link>;
          })}</div>
        </section>
      )}

      <section id="destaques" className="page-shell scroll-mt-24 !pt-4">
        <div className="flex items-end justify-between gap-4"><div><span className="eyebrow">Agenda real</span><h2 className="section-title mt-3">Eventos cadastrados</h2></div><Link href="/eventos/todos" className="hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">Ver todos <ArrowRight size={16} /></Link></div>
        {carregandoEventos ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-card" />)}</div> : eventosVisiveis.length > 0 ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{eventosVisiveis.map((evento) => {
            const date = new Date(evento.data);
            const imagemFundo = evento.temBanner ? urlBannerEvento(evento.id) : categoryStyle[evento.categoria].image;
            return <article key={evento.id} className="group overflow-hidden rounded-2xl border border-border/10 bg-card shadow-card transition-all hover:-translate-y-1.5 hover:shadow-glow"><div className="relative h-48 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${imagemFundo})` }}><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-900">{ROTULO_CATEGORIA_EVENTO[evento.categoria]}</span></div><div className="flex gap-4 p-4"><div className="h-fit min-w-12 rounded-xl bg-primary/10 px-2 py-2 text-center text-primary"><p className="text-sm font-bold leading-4">{String(date.getDate()).padStart(2, "0")}</p><p className="text-[9px] font-bold uppercase">{date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</p></div><div className="min-w-0"><h3 className="font-semibold leading-5 text-foreground">{evento.nome}</h3><p className="mt-2 flex items-center gap-1 text-xs text-muted"><MapPin size={12} />{formatarLocalizacaoEvento(evento)}</p><p className="mt-3 text-xs text-muted">{date.toLocaleDateString("pt-BR", { year: "numeric" })}</p></div></div></article>;
          })}</div>
        ) : <div className="mt-7 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-6 py-12 text-center"><p className="font-semibold text-foreground">Nenhum evento disponível no momento.</p><p className="mt-2 text-sm text-muted">Assim que um evento for cadastrado, ele aparecerá aqui.</p></div>}
      </section>

      <section id="organizadores" className="page-shell scroll-mt-24 !pt-5">
        <div className="relative rounded-[2rem] bg-gradient-to-br from-violet-700 via-primary to-indigo-950 px-7 py-10 text-white shadow-glow sm:px-12 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-12">
          <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl" />
          <div className="relative z-10"><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">Para organizadores</span><h2 className="mt-5 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Seu evento. Sua marca. Seus resultados.</h2><p className="mt-4 max-w-lg leading-7 text-violet-100">Crie, publique e acompanhe tudo em uma plataforma desenhada para decisões rápidas.</p><ul className="mt-6 grid gap-3 sm:grid-cols-2">{["Gestão completa", "Página personalizada", "Métricas em tempo real", "Suporte especializado"].map((item) => <li key={item} className="flex items-center gap-2 text-sm text-violet-50"><Check size={16} className="text-cyan-300" />{item}</li>)}</ul><Link href={accessToken ? "/eventos/novo" : "/registro"} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-violet-800 shadow-xl transition-transform hover:-translate-y-0.5">Criar meu evento <ArrowRight size={17} /></Link></div>
          <div className="relative mt-9 lg:mt-0"><div className="rounded-2xl border border-white/15 bg-[#090d23]/95 p-4 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-pink-400" /><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="h-2 w-2 rounded-full bg-emerald-400" /></div><span className="text-[10px] text-slate-500">Visão geral</span></div><div className="grid grid-cols-3 gap-2">{[["Vendas", "—"], ["Ingressos", "—"], ["Conversão", "—"]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/[.06] p-3"><p className="text-[9px] text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>)}</div><div className="mt-3 flex h-32 items-end gap-2 rounded-xl bg-white/[.04] px-4 pb-4">{[25, 45, 33, 62, 50, 85, 67, 92, 76, 100].map((height, index) => <span key={index} className="flex-1 rounded-t bg-gradient-to-t from-violet-700 to-blue-400" style={{ height: `${height}%` }} />)}</div></div></div>
        </div>
      </section>

      <section id="como-funciona" className="page-shell scroll-mt-24 text-center"><span className="eyebrow">Simples de verdade</span><h2 className="section-title mt-3">Do interesse à experiência</h2><p className="page-description mx-auto">Uma jornada fluida para quem organiza e para quem participa.</p><div className="relative mt-10 grid gap-7 md:grid-cols-4"><div className="absolute left-[12%] right-[12%] top-7 hidden border-t border-dashed border-primary/20 md:block" />{[[Search, "Descubra", "Encontre eventos que combinam com você."], [TicketCheck, "Escolha", "Garanta seu ingresso em poucos passos."], [Users, "Participe", "Viva experiências que ficam na memória."], [Share2, "Compartilhe", "Convide pessoas para o próximo momento."]].map(([Icon, title, copy], index) => { const StepIcon = Icon as LucideIcon; return <div key={title as string} className="relative z-10"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-card text-primary shadow-card"><StepIcon size={23} /></span><span className="mt-4 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">0{index + 1}</span><h3 className="mt-3 font-semibold text-foreground">{title as string}</h3><p className="mx-auto mt-2 max-w-[13rem] text-sm leading-6 text-muted">{copy as string}</p></div>; })}</div></section>

      <section className="page-shell !pt-3"><div className="flex flex-col items-center gap-6 rounded-[2rem] border border-border/10 bg-card/85 p-6 shadow-card sm:flex-row sm:p-8"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-primary text-white shadow-glow"><Mail size={25} /></span><div className="flex-1 text-center sm:text-left"><h2 className="text-lg font-semibold text-foreground">Fique por dentro dos melhores eventos</h2><p className="mt-1 text-sm text-muted">Novidades, lançamentos e experiências exclusivas direto no seu e-mail.</p></div><div className="flex w-full max-w-md rounded-xl border border-border/15 bg-background/60 p-1"><input aria-label="Seu melhor e-mail" placeholder="Seu melhor e-mail" type="email" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted/60" /><Button className="h-10">Inscrever-se</Button></div></div></section>
    </main>
  );
}
