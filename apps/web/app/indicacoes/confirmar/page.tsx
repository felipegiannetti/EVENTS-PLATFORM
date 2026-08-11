"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { confirmarContaIndicacao } from "@/lib/referrals-client";

export default function ConfirmarContaIndicacaoPage() {
  return <Suspense fallback={<div className="page-shell"><div className="h-64 animate-pulse rounded-3xl bg-card" /></div>}><Confirmacao /></Suspense>;
}

function Confirmacao() {
  const token = useSearchParams().get("token") ?? "";
  const [confirmado, setConfirmado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    if (!token) {
      setErro("Este link de confirmação está incompleto.");
      return;
    }
    setConfirmando(true);
    setErro(null);
    try {
      await confirmarContaIndicacao(token);
      setConfirmado(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível confirmar essa conta.");
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <main className="page-shell grid min-h-[65vh] place-items-center">
      <Card className="w-full max-w-lg p-8 text-center sm:p-10">
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${confirmado ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
          {confirmado ? <CheckCircle2 size={28} /> : <Landmark size={27} />}
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">{confirmado ? "Conta confirmada" : "Confirme sua conta de recebimento"}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {confirmado ? "A conta já está ativa no programa de indicação." : "Só confirme se você solicitou este cadastro ou alteração. Até a confirmação, nenhuma conta ativa é substituída."}
        </p>
        {erro && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}
        {!confirmado ? (
          <Button onClick={confirmar} loading={confirmando} className="mt-6 w-full">Confirmar conta</Button>
        ) : (
          <Link href="/indicacoes" className="mt-6 block"><Button className="w-full">Voltar para indicações</Button></Link>
        )}
      </Card>
    </main>
  );
}
