"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X } from "lucide-react";
import type { MeuIngressoResponse } from "@events-platform/shared-types";

/** Bottom sheet com animação de baixo pra cima — mostra o QR real do ingresso (mesmo qrToken assinado que o check-in valida). */
export function TicketQrModal({ ingresso, onFechar }: { ingresso: MeuIngressoResponse; onFechar: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAberto(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    QRCode.toDataURL(ingresso.qrToken, { width: 240, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [ingresso.qrToken]);

  function fechar() {
    setAberto(false);
    setTimeout(onFechar, 200);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/50 transition-opacity duration-200 ${aberto ? "opacity-100" : "opacity-0"}`}
      onClick={fechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-t-3xl bg-card p-6 pb-8 shadow-2xl transition-transform duration-300 ease-out ${
          aberto ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-background/60 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <h2 className="text-center text-lg font-bold uppercase tracking-wide text-foreground">{ingresso.eventoNome}</h2>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div className="col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Código da compra</dt>
            <dd className="mt-0.5 font-mono text-foreground">{ingresso.id}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Nome</dt>
            <dd className="mt-0.5 text-foreground">{ingresso.compradorNome ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-0.5 truncate text-foreground">{ingresso.compradorEmail ?? "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Data de compra</dt>
            <dd className="mt-0.5 text-foreground">{new Date(ingresso.criadoEm).toLocaleString("pt-BR")}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col items-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR code do ingresso" className="h-56 w-56 rounded-xl border border-border/15" />
          ) : (
            <div className="grid h-56 w-56 place-items-center rounded-xl border border-border/15 bg-background/40 text-xs text-muted">
              Gerando QR...
            </div>
          )}
          <p className="mt-2 max-w-[220px] break-all text-center font-mono text-[11px] text-muted">{ingresso.id}</p>
        </div>

        <p className="mt-5 text-center text-xs text-muted">Apresente este QR code na entrada do evento.</p>
      </div>
    </div>
  );
}
