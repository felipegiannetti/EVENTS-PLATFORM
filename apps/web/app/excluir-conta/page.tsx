"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { confirmarExclusaoConta } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";

export default function ExcluirContaPage() {
  return <Suspense fallback={<div className="page-shell"><div className="h-64 animate-pulse rounded-3xl bg-card" /></div>}><Confirmacao /></Suspense>;
}

function Confirmacao() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const { logout } = useAuth();
  const [excluida, setExcluida] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    if (!token) {
      setErro("Este link de confirmação está incompleto.");
      return;
    }
    setExcluindo(true);
    setErro(null);
    try {
      await confirmarExclusaoConta(token);
      await logout();
      setExcluida(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível excluir a conta.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <main className="page-shell grid min-h-[65vh] place-items-center">
      <Card className="w-full max-w-lg p-8 text-center sm:p-10">
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${excluida ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
          {excluida ? <CheckCircle2 size={28} /> : <AlertTriangle size={27} />}
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">{excluida ? "Conta excluída" : "Excluir sua conta?"}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {excluida
            ? "Sua conta foi excluída permanentemente."
            : "Essa ação é permanente e não pode ser desfeita. Só confirme se você mesmo pediu essa exclusão."}
        </p>
        {erro && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}
        {!excluida ? (
          <Button onClick={confirmar} loading={excluindo} className="mt-6 w-full !bg-danger !bg-none">
            Confirmar exclusão
          </Button>
        ) : (
          <Button onClick={() => router.push("/")} className="mt-6 w-full">Ir para o início</Button>
        )}
      </Card>
    </main>
  );
}
