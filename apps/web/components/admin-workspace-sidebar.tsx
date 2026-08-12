"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  LandmarkIcon,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  Wallet,
  X,
} from "lucide-react";
import { Brand } from "@/components/header";

const ITENS = [
  { href: "/admin", label: "Visão geral", descricao: "Resumo da plataforma", icon: LayoutDashboard },
  { href: "/admin/suporte", label: "Suporte", descricao: "Eventos e check-ins", icon: LifeBuoy },
  { href: "/admin/acordos", label: "Administrador", descricao: "Acordos comerciais", icon: LandmarkIcon },
  { href: "/admin/sistema", label: "Sistema", descricao: "Funcionalidades globais", icon: ToggleLeft },
  { href: "/admin/financeiro", label: "Financeiro", descricao: "Consolidado financeiro", icon: Wallet },
];

export function AdminWorkspaceSidebar() {
  const pathname = usePathname();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  useEffect(() => setMenuMobileAberto(false), [pathname]);

  useEffect(() => {
    if (!menuMobileAberto) return;
    const fecharComEsc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setMenuMobileAberto(false);
    };
    document.addEventListener("keydown", fecharComEsc);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fecharComEsc);
      document.body.style.overflow = overflowAnterior;
    };
  }, [menuMobileAberto]);

  function linksNavegacao(mobile = false) {
    return ITENS.map((item) => {
      const Icon = item.icon;
      const ativo = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => mobile && setMenuMobileAberto(false)}
          className={`group relative mb-1.5 flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 transition-all duration-200 ${
            ativo
              ? "border-white/15 bg-gradient-to-r from-violet-500/35 to-blue-500/20 text-white shadow-[0_12px_32px_rgb(0_0_0/0.18)]"
              : "border-transparent text-white/75 hover:translate-x-0.5 hover:border-white/10 hover:bg-white/[0.07] hover:text-white"
          }`}
        >
          {ativo && <span className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-violet-300" />}
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${ativo ? "bg-white/[0.14] text-white" : "bg-white/[0.06] text-white/70 group-hover:bg-white/10 group-hover:text-white"}`}>
            <Icon size={18} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className={`mt-0.5 block truncate text-[11px] ${ativo ? "text-white/70" : "text-white/50 group-hover:text-white/70"}`}>{item.descricao}</span>
          </span>
          <ChevronRight size={15} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${ativo ? "text-white/80" : "text-white/40"}`} />
        </Link>
      );
    });
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden bg-[#14122f] lg:flex">
        <div className="pointer-events-none absolute -left-16 top-16 h-52 w-52 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="relative px-5 pb-5 pt-6">
          <Brand compact />
          <div className="mt-5 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/15 text-violet-300"><ShieldCheck size={16} /></span>
            <div><p className="text-sm font-semibold text-white">Painel do admin</p><p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Acesso restrito</p></div>
          </div>
        </div>
        <nav className="relative flex-1 overflow-y-auto px-3 pb-4" aria-label="Navegação do painel do admin">{linksNavegacao()}</nav>
        <div className="relative border-t border-white/10 px-3 py-4">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition-all hover:bg-white/[0.06] hover:text-white">
            <ArrowLeft size={17} className="shrink-0" /> Voltar ao site
          </Link>
        </div>
      </aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#14122f]/95 px-4 py-3 shadow-lg backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <Brand compact />
          <div className="border-l border-white/10 pl-3"><p className="text-xs font-semibold text-white">Admin</p><p className="text-[9px] uppercase tracking-widest text-violet-300/70">Central</p></div>
        </div>
        <button
          type="button"
          aria-label={menuMobileAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuMobileAberto}
          aria-controls="menu-admin-mobile"
          onClick={() => setMenuMobileAberto((valor) => !valor)}
          className={`relative grid h-11 w-11 place-items-center rounded-2xl border text-white shadow-lg transition-all duration-200 active:scale-95 ${menuMobileAberto ? "rotate-90 border-violet-300/35 bg-violet-500/20" : "border-white/15 bg-white/[0.06] hover:border-violet-300/30 hover:bg-violet-500/15"}`}
        >
          {menuMobileAberto ? <X size={19} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={`fixed inset-0 z-50 lg:hidden ${menuMobileAberto ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!menuMobileAberto}>
        <button
          type="button"
          aria-label="Fechar menu"
          tabIndex={menuMobileAberto ? 0 : -1}
          onClick={() => setMenuMobileAberto(false)}
          className={`absolute inset-0 bg-[#080716]/65 backdrop-blur-sm transition-opacity duration-300 ${menuMobileAberto ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          id="menu-admin-mobile"
          inert={!menuMobileAberto}
          className={`absolute inset-y-0 right-0 flex w-[min(88vw,370px)] flex-col overflow-hidden border-l border-white/10 bg-[#171432] shadow-[-24px_0_70px_rgb(5_4_20/0.42)] transition-transform duration-300 ease-out ${menuMobileAberto ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="relative border-b border-white/10 px-5 pb-5 pt-5">
            <div className="flex items-center justify-between">
              <Brand compact />
              <button type="button" aria-label="Fechar menu" onClick={() => setMenuMobileAberto(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/75 transition hover:bg-white/10 hover:text-white"><X size={18} /></button>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-violet-200 shadow-inner"><ShieldCheck size={21} /></span>
              <div><p className="font-semibold text-white">Central administrativa</p><p className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-violet-300/65"><Sparkles size={10} /> Acesso geral da plataforma</p></div>
            </div>
          </div>

          <nav className="relative flex-1 overflow-y-auto px-4 py-5" aria-label="Navegação móvel do painel do admin">{linksNavegacao(true)}</nav>

          <div className="relative border-t border-white/10 bg-black/10 p-4">
            <Link href="/" onClick={() => setMenuMobileAberto(false)} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white">
              <ArrowLeft size={16} /> Voltar ao site
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
