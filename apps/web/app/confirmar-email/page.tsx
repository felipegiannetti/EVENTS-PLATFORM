"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { confirmarEmail } from "@/lib/auth-client";

export default function ConfirmarEmailPage() {
  return <Suspense fallback={<div className="page-shell"><div className="h-64 animate-pulse rounded-3xl bg-card" /></div>}><Confirmacao /></Suspense>;
}

function Confirmacao() {
  const token = useSearchParams().get("token") ?? "";
  const [estado, setEstado] = useState<"confirmando" | "confirmado" | "erro">("confirmando");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setEstado("erro");
      setErro("Este link de confirmação está incompleto.");
      return;
    }
    confirmarEmail(token)
      .then(() => setEstado("confirmado"))
      .catch((err) => {
        setEstado("erro");
        setErro(err instanceof ApiError ? err.message : "Não foi possível confirmar seu email.");
      });
  }, [token]);

  return (
    <main className="page-shell grid min-h-[65vh] place-items-center">
      <Card className="w-full max-w-lg p-8 text-center sm:p-10">
        <span
          className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${
            estado === "confirmado" ? "bg-success/10 text-success" : estado === "erro" ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
          }`}
        >
          {estado === "confirmado" ? <CheckCircle2 size={28} /> : estado === "erro" ? <XCircle size={28} /> : <Mail size={27} />}
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          {estado === "confirmado" ? "Email confirmado" : estado === "erro" ? "Não foi possível confirmar" : "Confirmando seu email..."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {estado === "confirmado"
            ? "Sua conta já está totalmente liberada."
            : estado === "erro"
              ? erro
              : "Só um instante."}
        </p>
        {estado !== "confirmando" && (
          <Link href="/perfil" className="mt-6 block">
            <Button className="w-full">Ir para minha conta</Button>
          </Link>
        )}
      </Card>
    </main>
  );
}
