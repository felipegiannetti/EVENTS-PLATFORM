import type { ReactNode } from "react";
import { Check, Sparkles } from "lucide-react";

export function AuthShell({ children, title, description }: { children: ReactNode; title: string; description: string }) {
  return (
    <main className="page-shell grid min-h-[calc(100vh-72px)] items-stretch gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-[#090c20] p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85')] bg-cover bg-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a1c] via-[#080a1c]/60 to-violet-950/10" />
        <div className="relative z-10 max-w-md"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs backdrop-blur"><Sparkles size={14} /> Experiências que conectam</span><h2 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.045em]">Tudo para seu evento acontecer.</h2><div className="mt-7 space-y-3">{["Gestão simples e completa", "Dados em tempo real", "Ingressos seguros"].map((item) => <p key={item} className="flex items-center gap-3 text-sm text-slate-200"><span className="grid h-6 w-6 place-items-center rounded-full bg-violet-500/25 text-violet-300"><Check size={14} /></span>{item}</p>)}</div></div>
      </section>
      <section className="flex items-center justify-center py-8"><div className="w-full max-w-md"><span className="eyebrow">Bem-vindo à RARO Tickets</span><h1 className="page-title">{title}</h1><p className="page-description">{description}</p><div className="mt-8">{children}</div></div></section>
    </main>
  );
}
