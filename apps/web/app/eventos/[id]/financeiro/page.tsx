"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { ContaBancariaResponse, ResumoFinanceiroEvento } from "@events-platform/shared-types";
import { nomeDoBanco } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { Stat, formatarReais } from "@/components/ui/stat";
import { ApiError } from "@/lib/api-client";
import { buscarContaBancaria, buscarResumoFinanceiro } from "@/lib/finance-client";

export default function FinanceiroEventoPage() {
  return <ProtectedPage>{(token) => <Financeiro token={token} />}</ProtectedPage>;
}

function Financeiro({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [resumo, setResumo] = useState<ResumoFinanceiroEvento | null>(null);
  const [contaBancaria, setContaBancaria] = useState<ContaBancariaResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarResumoFinanceiro(id, token)
      .then(setResumo)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o financeiro."));
    buscarContaBancaria(id, token)
      .then(setContaBancaria)
      .catch(() => setContaBancaria(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  if (erro) {
    return <p className="p-6 text-sm text-danger">{erro}</p>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold text-foreground">Financeiro</h1>
      <p className="mt-1 text-sm text-muted">
        Números deste evento — vendas manuais/gratuitas emitidas até agora.
      </p>

      {!resumo ? (
        <p className="mt-6 text-sm text-muted">Carregando...</p>
      ) : (
        <>
          <Card className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat label="Vendas brutas" value={formatarReais(resumo.vendasBrutas)} />
            <Stat label="Ticket médio" value={formatarReais(resumo.ticketMedioBruto)} />
            <Stat label="Ingressos válidos" value={String(resumo.ingressosValidos)} />
            <Stat label="Cancelados" value={String(resumo.ingressosCancelados)} />
          </Card>

          <Card className="mt-4">
            <div className="flex items-center justify-between gap-4 rounded bg-warning/10 px-3 py-2 text-sm text-warning">
              <span>
                Repasse (em processamento / total a receber / total recebido) ainda não está
                disponível — só existe de verdade quando o checkout com gateway de pagamento
                estiver integrado.
              </span>
            </div>
          </Card>
        </>
      )}

      <Card className="mt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Conta de repasse
        </h2>
        {contaBancaria ? (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-foreground">
              <p className="font-medium">{nomeDoBanco(contaBancaria.banco)}</p>
              <p className="text-muted">
                Ag. {contaBancaria.agencia} · Conta {contaBancaria.conta} ·{" "}
                {contaBancaria.tipoConta === "corrente" ? "Corrente" : "Poupança"}
              </p>
              <p className="text-muted">{contaBancaria.titular}</p>
            </div>
            <Link href={`/eventos/${id}/conta-repasse`} className="text-sm text-primary hover:underline">
              Editar
            </Link>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted">Nenhuma conta cadastrada ainda.</p>
            <Link href={`/eventos/${id}/conta-repasse`} className="text-sm text-primary hover:underline">
              Cadastrar →
            </Link>
          </div>
        )}
      </Card>
    </main>
  );
}
