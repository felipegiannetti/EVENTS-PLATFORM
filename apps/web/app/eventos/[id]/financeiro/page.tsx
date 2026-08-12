"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { ContaBancariaResponse, ResumoFinanceiroEvento } from "@events-platform/shared-types";
import { nomeDoBanco } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { Stat, formatarReais } from "@/components/ui/stat";
import { HelpTooltip } from "@/components/ui/help-tooltip";
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

  const percentualOrganizador = resumo
    ? resumo.percentualDevolvidoAoOrganizador + resumo.percentualBeneficioIndicacaoOrganizador
    : 0;

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow">Performance</span>
      <h1 className="page-title">Financeiro</h1>
      <p className="page-description">
        Números deste evento — vendas manuais/gratuitas emitidas até agora.
      </p>

      {!resumo ? (
        <p className="mt-6 text-sm text-muted">Carregando...</p>
      ) : (
        <>
          <Card className="mt-8 grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
            <Stat
              label="Vendas brutas"
              value={formatarReais(resumo.vendasBrutas)}
              ajuda={
                resumo.taxaPagaPor === "organizador"
                  ? "Esse evento está configurado pra você absorver a taxa de serviço: ela é descontada do valor do ingresso, então vendas brutas aqui é só o valor dos ingressos."
                  : "Esse evento está configurado pra o comprador pagar a taxa de serviço por fora: ela é somada ao preço do ingresso, então vendas brutas aqui já inclui esse acréscimo."
              }
            />
            <Stat
              label="Venda líquida"
              value={formatarReais(resumo.vendaLiquida)}
              ajuda={`Estimativa do repasse do organizador depois da taxa de ${resumo.percentualTaxaServico}% e de eventual benefício recebido por ele. Ainda não é saldo real: depende do checkout e do gateway.`}
            />
            <Stat label="Ticket médio" value={formatarReais(resumo.ticketMedioBruto)} />
            <Stat label="Ingressos válidos" value={String(resumo.ingressosValidos)} />
          </Card>

          {percentualOrganizador > 0 && (
            <Card className="mt-5 overflow-hidden border-primary/15 bg-gradient-to-r from-primary/10 to-blue-500/5 p-6">
              <p className="eyebrow">Benefício do organizador</p>
              <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Parcela recebida da taxa da plataforma</h2>
                  <p className="mt-1 text-xs text-muted">Aplicada aos eventos pagos elegíveis.</p>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-primary sm:mt-0">
                  {percentualOrganizador.toFixed(2)}% <span className="text-sm font-medium text-muted">dos 12%</span>
                </p>
              </div>
            </Card>
          )}

          {resumo.quantidadeComTaxaFixaGateway > 0 && (
            <Card className="mt-5 border-border/10 bg-background/40 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                Taxa fixa de gateway (ingressos abaixo de R$50)
                <HelpTooltip texto="Ingresso anunciado abaixo de R$50 tem um adicional fixo de R$0,49, junto com a taxa de serviço — cobre o custo fixo do gateway de pagamento sobre um valor baixo. 100% fica com a plataforma, nunca é dividido com o organizador." />
              </p>
              <p className="mt-1 text-sm text-muted">
                {resumo.quantidadeComTaxaFixaGateway} ingresso(s) elegível(is) · {formatarReais(resumo.valorTaxaFixaGateway)} no total, já incluído na taxa retida acima.
              </p>
            </Card>
          )}

          <Card className="mt-5 border-warning/20 bg-warning/5">
            <div className="flex items-center gap-2 rounded bg-warning/10 px-3 py-2 text-sm text-warning">
              <span>Repasse (em processamento / total a receber / total recebido) ainda não está disponível.</span>
              <HelpTooltip texto="Só existe de verdade quando o checkout com gateway de pagamento estiver integrado — hoje não há venda paga self-service na plataforma." />
            </div>
          </Card>
        </>
      )}

      <Card className="mt-5 p-7">
        <h2 className="section-title !text-lg">
          Conta de repasse
        </h2>
        {contaBancaria ? (
          <div className="mt-5 flex items-center justify-between rounded-xl bg-background/50 p-4">
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
          <div className="mt-5 flex items-center justify-between rounded-xl bg-background/50 p-4">
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
