"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu, Plus, Search, Ticket, User, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useIsEventWorkspace } from "@/lib/event-workspace";
import { Button } from "@/components/ui/button";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="RARO Tickets — início">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 via-primary to-blue-600 text-white shadow-glow transition-transform group-hover:rotate-3 group-hover:scale-105">
        <Ticket size={19} strokeWidth={2.2} />
        <span className="absolute inset-0 bg-white/10 [clip-path:polygon(0_0,100%_0,0_100%)]" />
      </span>
      {!compact && (
        <span className="text-xl font-bold tracking-[-0.045em] text-foreground">
          RARO <span className="text-primary">Tickets</span>
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const { accessToken, carregando, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const emWorkspaceDeEvento = useIsEventWorkspace();

  if (emWorkspaceDeEvento) {
    return null;
  }

  const navPublico = [
    { href: "/eventos/todos", label: "Eventos" },
    { href: "/#categorias", label: "Categorias" },
    { href: "/#como-funciona", label: "Como funciona" },
  ];
  const navLogado = [
    { href: "/eventos", label: "Espaço do organizador" },
    { href: "/meus-ingressos", label: "Meus ingressos" },
    { href: "/indicacoes", label: "Indique e ganhe" },
  ];

  // Navbar completa sempre — logado só ganha itens extras (ex: "Espaço do organizador"), não perde os públicos.
  const navItems = accessToken ? [...navLogado, ...navPublico] : navPublico;

  return (
    <header className="sticky top-0 z-50 border-b border-border/10 bg-background/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <Brand />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/eventos/todos?foco=busca"
            aria-label="Pesquisar eventos"
            title="Pesquisar eventos"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border/15 bg-card/70 text-muted shadow-sm transition-all hover:border-primary/30 hover:text-primary"
          >
            <Search size={18} />
          </Link>
          {!carregando && accessToken ? (
            <>
              <Link href="/eventos/novo" className="hidden sm:block">
                <Button className="gap-2"><Plus size={16} />Criar evento</Button>
              </Link>
              <Link
                href="/perfil"
                aria-label="Perfil"
                title="Perfil"
                className="hidden h-10 w-10 place-items-center rounded-xl border border-border/15 bg-card/70 text-muted shadow-sm transition-all hover:border-primary/30 hover:text-primary sm:grid"
              >
                <User size={18} />
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:bg-danger/10 hover:text-danger sm:flex"
              >
                <LogOut size={16} /> Sair
              </button>
            </>
          ) : !carregando ? (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="secondary">Entrar</Button>
              </Link>
              <Link href="/registro" className="hidden sm:block">
                <Button>Criar evento</Button>
              </Link>
            </>
          ) : null}
          <button
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border/15 text-foreground lg:hidden"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border/10 bg-card/95 px-5 py-5 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-primary/10">
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-border/10 pt-4 sm:hidden">
              {accessToken ? (
                <>
                  <Link href="/eventos/novo" className="flex-1"><Button className="w-full">Criar evento</Button></Link>
                  <Link href="/perfil"><Button variant="secondary">Perfil</Button></Link>
                  <Button variant="secondary" onClick={() => logout()}>Sair</Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex-1"><Button variant="secondary" className="w-full">Entrar</Button></Link>
                  <Link href="/registro" className="flex-1"><Button className="w-full">Começar</Button></Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
