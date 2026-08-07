"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Plus, Sparkles } from "lucide-react";
import { ROTULO_CATEGORIA_EVENTO, type EventoResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { listarEventos } from "@/lib/events-client";

export default function EventosPage() { return <ProtectedPage>{(token) => <ListaEventos token={token} />}</ProtectedPage>; }

function ListaEventos({ token }: { token: string }) {
  const [eventos, setEventos] = useState<EventoResponse[] | null>(null);
  useEffect(() => { listarEventos(token).then(setEventos); }, [token]);

  return (
    <main className="page-shell">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="eyebrow"><Sparkles size={12} /> Painel do organizador</span><h1 className="page-title">Seus eventos</h1><p className="page-description">Acompanhe e gerencie todas as suas experiências.</p></div><Link href="/eventos/novo"><Button className="w-full gap-2 sm:w-auto"><Plus size={17} /> Criar evento</Button></Link></div>
      {eventos === null && <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-card/70" />)}</div>}
      {eventos?.length === 0 && <div className="mt-10 rounded-[2rem] border border-dashed border-primary/25 bg-primary/5 px-6 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarDays /></span><h2 className="mt-5 text-xl font-semibold">Seu primeiro evento começa aqui</h2><p className="mt-2 text-sm text-muted">Crie uma página, configure os lotes e comece a vender.</p><Link href="/eventos/novo" className="mt-6 inline-block"><Button>Criar primeiro evento</Button></Link></div>}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{eventos?.map((evento, index) => <Link key={evento.id} href={`/eventos/${evento.id}`} className="group overflow-hidden rounded-2xl border border-border/10 bg-card shadow-card transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-glow"><div className={`h-2 ${["bg-gradient-to-r from-violet-500 to-blue-500","bg-gradient-to-r from-fuchsia-500 to-violet-500","bg-gradient-to-r from-cyan-500 to-blue-600"][index % 3]}`} /><div className="p-6"><div className="flex items-start justify-between gap-4"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-success">Ativo</span><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{ROTULO_CATEGORIA_EVENTO[evento.categoria]}</span></div><ArrowUpRight size={18} className="text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" /></div><h2 className="mt-5 text-xl font-semibold tracking-tight">{evento.nome}</h2><div className="mt-4 space-y-2 text-sm text-muted"><p className="flex items-center gap-2"><CalendarDays size={15} className="text-primary" />{new Date(evento.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p><p className="flex items-center gap-2"><MapPin size={15} className="text-primary" />{evento.local}</p></div></div></Link>)}</div>
    </main>
  );
}
