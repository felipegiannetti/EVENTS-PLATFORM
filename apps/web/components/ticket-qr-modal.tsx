"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ArrowLeft, CalendarDays, CheckCircle2, Mail, MoreHorizontal, Send, ShieldCheck, Ticket, X } from "lucide-react";
import type { MeuIngressoResponse } from "@events-platform/shared-types";
import { ApiError } from "@/lib/api-client";
import { transferirIngresso } from "@/lib/tickets-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TicketQrModalProps {
  ingresso: MeuIngressoResponse;
  token: string;
  onFechar: () => void;
  onTransferido: () => void;
}

type Tela = "ingresso" | "transferir" | "sucesso";

/** Carteira em bottom sheet: QR assinado e transferência segura para outra conta cadastrada. */
export function TicketQrModal({ ingresso, token, onFechar, onTransferido }: TicketQrModalProps) {
  const [aberto, setAberto] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [tela, setTela] = useState<Tela>("ingresso");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fecharTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAberto(true));
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = overflowAnterior;
      if (fecharTimer.current) clearTimeout(fecharTimer.current);
    };
  }, []);

  useEffect(() => {
    QRCode.toDataURL(ingresso.qrToken, { width: 260, margin: 1, color: { dark: "#161526", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [ingresso.qrToken]);

  useEffect(() => {
    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        if (menuAberto) setMenuAberto(false);
        else if (tela === "transferir") setTela("ingresso");
        else fechar();
      }
    }
    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
  });

  function fechar() {
    if (enviando) return;
    setAberto(false);
    fecharTimer.current = setTimeout(onFechar, 200);
  }

  async function confirmarTransferencia(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await transferirIngresso(ingresso.id, email.trim(), token);
      setTela("sucesso");
      onTransferido();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível transferir o ingresso.");
    } finally {
      setEnviando(false);
    }
  }

  const podeTransferir = ingresso.transferivel && ingresso.status === "valido";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-[#0f0d1f]/65 backdrop-blur-[2px] transition-opacity duration-200 ${aberto ? "opacity-100" : "opacity-0"}`}
      onMouseDown={(evento) => evento.target === evento.currentTarget && fechar()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-ingresso"
        className={`max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-white/10 bg-background shadow-2xl transition-transform duration-300 ease-out sm:mb-4 sm:rounded-[2rem] ${
          aberto ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/10 bg-background/90 px-5 py-3 backdrop-blur-xl">
          <div className="relative">
            {tela === "transferir" ? (
              <button
                type="button"
                onClick={() => { setTela("ingresso"); setErro(null); }}
                aria-label="Voltar para o ingresso"
                className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-card hover:text-foreground"
              >
                <ArrowLeft size={19} />
              </button>
            ) : tela === "ingresso" ? (
              <button
                type="button"
                onClick={() => setMenuAberto((atual) => !atual)}
                aria-label="Mais opções"
                aria-expanded={menuAberto}
                className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-card hover:text-foreground"
              >
                <MoreHorizontal size={22} />
              </button>
            ) : <span className="block h-10 w-10" />}

            {menuAberto && (
              <div className="absolute left-0 top-11 w-64 overflow-hidden rounded-2xl border border-border/10 bg-card p-1.5 shadow-xl">
                <button
                  type="button"
                  disabled={!podeTransferir}
                  onClick={() => { setMenuAberto(false); setTela("transferir"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-primary/8 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send size={17} className="text-primary" /> Transferir ingresso
                </button>
                {!podeTransferir && (
                  <p className="px-3 pb-2 pt-1 text-xs leading-5 text-muted">
                    Este ingresso não permite transferência ou já foi utilizado.
                  </p>
                )}
              </div>
            )}
          </div>

          <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Ingresso digital</span>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-card hover:text-foreground"
          >
            <X size={19} />
          </button>
        </div>

        {tela === "ingresso" && (
          <div className="p-4 sm:p-6">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-card shadow-[0_18px_55px_rgb(46_40_88/0.14)]">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#4c1d95] via-primary to-[#8b5cf6] px-6 pb-7 pt-8 text-white">
                <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-16 left-16 h-36 w-36 rounded-full bg-fuchsia-300/10" />
                <span className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur">
                  <Ticket size={12} /> {ingresso.loteNome}
                </span>
                <h2 id="titulo-ingresso" className="relative mt-4 text-2xl font-bold leading-tight tracking-[-0.035em]">{ingresso.eventoNome}</h2>
                <p className="relative mt-3 flex items-center gap-2 text-sm text-white/80">
                  <CalendarDays size={15} />
                  {new Date(ingresso.eventoData).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
                </p>
              </div>

              <div className="relative border-t-2 border-dashed border-background bg-white px-6 py-7">
                <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" />
                <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" />
                <div className="flex flex-col items-center">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="QR code do ingresso" className="h-60 w-60 rounded-2xl border border-border/10 p-2" />
                  ) : (
                    <div className="grid h-60 w-60 place-items-center rounded-2xl bg-surface text-xs text-muted">Gerando QR...</div>
                  )}
                  <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">#{ingresso.id.slice(0, 8)}</p>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-surface/80 p-4 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Titular</dt>
                    <dd className="mt-1 truncate font-semibold text-foreground">{ingresso.compradorNome ?? "Não informado"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Status</dt>
                    <dd className="mt-1 font-semibold capitalize text-success">{ingresso.status}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted">
              <ShieldCheck size={15} className="text-success" /> QR code seguro e válido para uma única entrada
            </p>
          </div>
        )}

        {tela === "transferir" && (
          <form onSubmit={confirmarTransferencia} className="px-6 pb-8 pt-7 sm:px-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Send size={21} /></span>
            <h2 id="titulo-ingresso" className="mt-5 text-2xl font-bold tracking-[-0.035em] text-foreground">Transferir ingresso</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Envie este ingresso para outra pessoa. O destinatário precisa ter uma conta cadastrada na RARO Tickets.
            </p>
            <div className="mt-6 rounded-2xl border border-border/10 bg-card p-4">
              <p className="text-sm font-semibold text-foreground">{ingresso.eventoNome}</p>
              <p className="mt-1 text-xs text-muted">{ingresso.loteNome} · #{ingresso.id.slice(0, 8)}</p>
            </div>
            <div className="mt-6">
              <Input
                id="destinatario-email"
                label="Email do destinatário"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="pessoa@email.com"
                autoComplete="email"
                autoFocus
                required
                error={erro ?? undefined}
              />
            </div>
            <div className="mt-6 rounded-2xl bg-warning/10 px-4 py-3 text-xs leading-5 text-warning">
              Depois da transferência, o ingresso sairá da sua carteira e o QR atual será invalidado.
            </div>
            <Button type="submit" loading={enviando} className="mt-6 w-full" disabled={!email.trim()}>
              <Mail size={17} /> Confirmar transferência
            </Button>
          </form>
        )}

        {tela === "sucesso" && (
          <div className="px-7 pb-10 pt-9 text-center sm:px-10">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success"><CheckCircle2 size={31} /></span>
            <h2 id="titulo-ingresso" className="mt-5 text-2xl font-bold tracking-[-0.035em] text-foreground">Ingresso transferido</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              O ingresso foi enviado para <strong className="text-foreground">{email.trim()}</strong> e já saiu da sua carteira.
            </p>
            <Button type="button" onClick={fechar} className="mt-7 w-full">Concluir</Button>
          </div>
        )}
      </section>
    </div>
  );
}
