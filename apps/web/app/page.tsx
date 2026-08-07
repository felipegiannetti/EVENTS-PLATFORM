"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Check, Code2, GraduationCap, Heart, Mail, MapPin, Music2, PartyPopper, Search, Share2, Sparkles, TicketCheck, Trophy, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const categories = [
  { label: "Shows", count: "1.243 eventos", icon: Music2, color: "text-violet-500 bg-violet-500/10" },
  { label: "Festivais", count: "562 eventos", icon: PartyPopper, color: "text-pink-500 bg-pink-500/10" },
  { label: "Negócios", count: "843 eventos", icon: BriefcaseBusiness, color: "text-blue-500 bg-blue-500/10" },
  { label: "Esportes", count: "412 eventos", icon: Trophy, color: "text-emerald-500 bg-emerald-500/10" },
  { label: "Cursos", count: "1.028 eventos", icon: GraduationCap, color: "text-amber-500 bg-amber-500/10" },
  { label: "Tecnologia", count: "715 eventos", icon: Code2, color: "text-cyan-500 bg-cyan-500/10" },
];

const featured = [
  { title: "Rock in Novyx", category: "Show", date: "24 MAI", city: "São Paulo, SP", price: "R$ 120", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85" },
  { title: "Summit Inovação 2026", category: "Negócios", date: "06 JUN", city: "Curitiba, PR", price: "R$ 250", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=85" },
  { title: "Final do Campeonato", category: "Esportes", date: "15 JUN", city: "Rio de Janeiro, RJ", price: "R$ 80", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=85" },
  { title: "Marketing Experience", category: "Curso", date: "22 JUN", city: "Belo Horizonte, MG", price: "R$ 150", image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=85" },
];

export default function HomePage() {
  const { accessToken } = useAuth();
  return (
    <main className="overflow-hidden">
      <section className="page-shell !pt-6 sm:!pt-9">
        <div className="relative min-h-[580px] overflow-hidden rounded-[2rem] border border-border/10 bg-[#080b1b] shadow-[0_30px_90px_rgb(20_8_60/0.22)]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=90')] bg-cover bg-[center_35%]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,20,.98)_0%,rgba(6,8,24,.88)_38%,rgba(7,9,25,.26)_75%,rgba(7,9,25,.2)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070919] via-transparent to-transparent" />
          <div className="relative z-10 flex min-h-[580px] max-w-2xl flex-col justify-center px-7 py-16 sm:px-12 lg:px-16">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-200 backdrop-blur"><Sparkles size={14} /> Onde grandes histórias começam</span>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl">Viva experiências que <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">conectam</span> pessoas e marcas.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">Descubra eventos incríveis ou transforme sua ideia em uma experiência inesquecível.</p>
            <div className="mt-8 flex max-w-xl items-center rounded-2xl border border-white/10 bg-white/[0.08] p-1.5 shadow-2xl backdrop-blur-xl">
              <Search className="ml-3 text-slate-400" size={19} /><input aria-label="Buscar eventos" placeholder="Buscar eventos, shows, palestras..." className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500" /><button className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-glow" aria-label="Buscar"><ArrowRight size={18} /></button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{["Shows", "Festivais", "Negócios", "Esportes", "Cursos"].map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] text-slate-300">{tag}</span>)}</div>
          </div>
        </div>
      </section>

      <section id="categorias" className="page-shell scroll-mt-24">
        <div className="flex items-end justify-between gap-4"><div><span className="eyebrow">Explore</span><h2 className="section-title mt-3">Encontre seu próximo momento</h2></div><Link href="#destaques" className="hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">Ver todos <ArrowRight size={16} /></Link></div>
        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{categories.map(({ label, count, icon: Icon, color }) => <button key={label} className="group rounded-2xl border border-border/10 bg-card/80 p-5 text-left shadow-card transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-glow"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${color}`}><Icon size={22} /></span><p className="mt-4 font-semibold text-foreground">{label}</p><p className="mt-1 text-xs text-muted">{count}</p></button>)}</div>
      </section>

      <section id="destaques" className="page-shell scroll-mt-24 !pt-4">
        <div className="flex items-end justify-between gap-4"><div><span className="eyebrow">Em alta</span><h2 className="section-title mt-3">Eventos que você vai amar</h2></div><button className="hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">Ver agenda <ArrowRight size={16} /></button></div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((event) => <article key={event.title} className="group overflow-hidden rounded-2xl border border-border/10 bg-card shadow-card transition-all hover:-translate-y-1.5 hover:shadow-glow"><div className="relative h-48 overflow-hidden bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]" style={{ backgroundImage: `url(${event.image})` }}><div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" /><button aria-label={`Favoritar ${event.title}`} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur"><Heart size={17} /></button><span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-900">{event.category}</span></div><div className="flex gap-4 p-4"><div className="h-fit min-w-12 rounded-xl bg-primary/10 px-2 py-2 text-center text-primary"><p className="text-xs font-bold leading-4">{event.date.split(" ")[0]}</p><p className="text-[9px] font-bold">{event.date.split(" ")[1]}</p></div><div className="min-w-0"><h3 className="font-semibold leading-5 text-foreground">{event.title}</h3><p className="mt-2 flex items-center gap-1 text-xs text-muted"><MapPin size={12} />{event.city}</p><p className="mt-3 text-xs text-muted">A partir de <strong className="text-foreground">{event.price}</strong></p></div></div></article>)}</div>
      </section>

      <section id="organizadores" className="page-shell scroll-mt-24 !pt-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-primary to-indigo-950 px-7 py-10 text-white shadow-glow sm:px-12 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-12">
          <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="relative z-10"><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">Para organizadores</span><h2 className="mt-5 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Seu evento. Sua marca. Seus resultados.</h2><p className="mt-4 max-w-lg leading-7 text-violet-100">Crie, publique e acompanhe tudo em uma plataforma desenhada para decisões rápidas.</p><ul className="mt-6 grid gap-3 sm:grid-cols-2">{["Gestão completa", "Página personalizada", "Métricas em tempo real", "Suporte especializado"].map((item) => <li key={item} className="flex items-center gap-2 text-sm text-violet-50"><Check size={16} className="text-cyan-300" />{item}</li>)}</ul><Link href={accessToken ? "/eventos/novo" : "/registro"} className="mt-8 inline-block"><Button className="!bg-white !text-violet-800 !shadow-xl">Criar meu evento <ArrowRight size={16} className="ml-2" /></Button></Link></div>
          <div className="relative mt-9 lg:mt-0"><div className="rounded-2xl border border-white/15 bg-[#090d23]/90 p-4 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-pink-400"/><span className="h-2 w-2 rounded-full bg-amber-400"/><span className="h-2 w-2 rounded-full bg-emerald-400"/></div><span className="text-[10px] text-slate-500">Visão geral</span></div><div className="grid grid-cols-3 gap-2">{[["Vendas", "R$ 48,2k"], ["Ingressos", "1.284"], ["Conversão", "8,7%"]].map(([l,v]) => <div key={l} className="rounded-xl bg-white/[.06] p-3"><p className="text-[9px] text-slate-400">{l}</p><p className="mt-1 text-sm font-semibold">{v}</p></div>)}</div><div className="mt-3 flex h-32 items-end gap-2 rounded-xl bg-white/[.04] px-4 pb-4">{[25,45,33,62,50,85,67,92,76,100].map((h,i) => <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-violet-700 to-blue-400" style={{height:`${h}%`}} />)}</div></div></div>
        </div>
      </section>

      <section id="como-funciona" className="page-shell scroll-mt-24 text-center">
        <span className="eyebrow">Simples de verdade</span><h2 className="section-title mt-3">Do interesse à experiência</h2><p className="page-description mx-auto">Uma jornada fluida para quem organiza e para quem participa.</p>
        <div className="relative mt-10 grid gap-7 md:grid-cols-4"><div className="absolute left-[12%] right-[12%] top-7 hidden border-t border-dashed border-primary/20 md:block" />{[[Search,"Descubra","Encontre eventos que combinam com você."],[TicketCheck,"Escolha","Garanta seu ingresso em poucos passos."],[Users,"Participe","Viva experiências que ficam na memória."],[Share2,"Compartilhe","Convide pessoas para o próximo momento."]].map(([Icon,title,copy],i) => { const StepIcon = Icon as typeof Search; return <div key={title as string} className="relative z-10"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-card text-primary shadow-card"><StepIcon size={23} /></span><span className="mt-4 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">0{i+1}</span><h3 className="mt-3 font-semibold text-foreground">{title as string}</h3><p className="mx-auto mt-2 max-w-[13rem] text-sm leading-6 text-muted">{copy as string}</p></div>})}</div>
      </section>

      <section className="page-shell !pt-3"><div className="flex flex-col items-center gap-6 rounded-[2rem] border border-border/10 bg-card/85 p-6 shadow-card sm:flex-row sm:p-8"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-primary text-white shadow-glow"><Mail size={25} /></span><div className="flex-1 text-center sm:text-left"><h2 className="text-lg font-semibold text-foreground">Fique por dentro dos melhores eventos</h2><p className="mt-1 text-sm text-muted">Novidades, lançamentos e experiências exclusivas direto no seu e-mail.</p></div><div className="flex w-full max-w-md rounded-xl border border-border/15 bg-background/60 p-1"><input aria-label="Seu melhor e-mail" placeholder="Seu melhor e-mail" type="email" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted/60" /><Button className="h-10">Inscrever-se</Button></div></div></section>
    </main>
  );
}
