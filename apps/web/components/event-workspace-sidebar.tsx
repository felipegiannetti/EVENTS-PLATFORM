"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  LayoutDashboard,
  Menu,
  QrCode,
  Ticket,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Brand } from "@/components/header";

interface ItemFolha {
  href: string;
  label: string;
}

interface GrupoNav {
  label: string;
  icon: typeof LayoutDashboard;
  itens: ItemFolha[];
}

function montarGrupos(eventoId: string): GrupoNav[] {
  const base = `/eventos/${eventoId}`;
  return [
    {
      label: "Painel do evento",
      icon: LayoutDashboard,
      itens: [
        { href: base, label: "Visão geral" },
        { href: `${base}/acesso`, label: "Quem tem acesso" },
        { href: `${base}/detalhes`, label: "Configurações" },
      ],
    },
    {
      label: "Ingressos",
      icon: Ticket,
      itens: [
        { href: `${base}/ingressos`, label: "Lotes e ingressos" },
        { href: `${base}/cupons`, label: "Cupons de desconto" },
      ],
    },
    {
      label: "Participantes",
      icon: Users,
      itens: [{ href: `${base}/participantes`, label: "Participantes" }],
    },
    {
      label: "Check-in",
      icon: QrCode,
      itens: [{ href: `${base}/checkin`, label: "Check-in via scanner" }],
    },
    {
      label: "Financeiro",
      icon: Wallet,
      itens: [{ href: `${base}/financeiro`, label: "Financeiro" }],
    },
  ];
}

export function EventWorkspaceSidebar({ eventoId, nomeEvento }: { eventoId: string; nomeEvento?: string }) {
  const pathname = usePathname();
  const grupos = montarGrupos(eventoId);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set());

  function alternarGrupo(label: string) {
    setGruposFechados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(label)) proximo.delete(label);
      else proximo.add(label);
      return proximo;
    });
  }

  const conteudo = (
    <>
      <div className="px-5 pb-6 pt-6">
        <Brand compact />
        {nomeEvento && (
          <p className="mt-4 truncate text-sm font-semibold text-white/90" title={nomeEvento}>
            {nomeEvento}
          </p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Navegação do painel do evento">
        {grupos.map((grupo) => {
          const Icon = grupo.icon;
          const grupoAberto = grupo.itens.length === 1 || !gruposFechados.has(grupo.label);
          const grupoAtivo = grupo.itens.some((item) => pathname === item.href);

          return (
            <div key={grupo.label} className="mb-1">
              {grupo.itens.length > 1 ? (
                <button
                  type="button"
                  onClick={() => alternarGrupo(grupo.label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    grupoAtivo ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="flex-1 text-left">{grupo.label}</span>
                  <ChevronDown size={15} className={`shrink-0 transition-transform ${grupoAberto ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <Link
                  href={grupo.itens[0]!.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    pathname === grupo.itens[0]!.href ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                  {grupo.label}
                </Link>
              )}

              {grupo.itens.length > 1 && grupoAberto && (
                <div className="ml-[1.65rem] mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-4">
                  {grupo.itens.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                        pathname === item.href
                          ? "bg-white/10 font-semibold text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <Link
          href="/eventos"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft size={17} className="shrink-0" />
          Área do produtor
        </Link>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#161532] lg:flex">{conteudo}</aside>

      <div className="sticky top-0 z-40 flex items-center justify-between bg-[#161532] px-4 py-3 lg:hidden">
        <Brand compact />
        <button
          type="button"
          aria-label={menuMobileAberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuMobileAberto((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-white"
        >
          {menuMobileAberto ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {menuMobileAberto && (
        <div className="fixed inset-0 z-40 flex flex-col bg-[#161532] lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Brand compact />
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMenuMobileAberto(false)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-white"
            >
              <X size={19} />
            </button>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto" onClick={() => setMenuMobileAberto(false)}>
            {conteudo}
          </div>
        </div>
      )}
    </>
  );
}
