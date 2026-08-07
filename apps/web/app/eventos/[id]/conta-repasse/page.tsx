"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { BANCOS_BRASIL } from "@events-platform/shared-types";
import { ApiError } from "@/lib/api-client";
import { cadastrarContaBancaria } from "@/lib/finance-client";

export default function ContaRepassePage() {
  return <ProtectedPage>{(token) => <FormularioContaRepasse token={token} />}</ProtectedPage>;
}

function FormularioContaRepasse({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [banco, setBanco] = useState(BANCOS_BRASIL[0].codigo);
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [tipoConta, setTipoConta] = useState<"corrente" | "poupanca">("corrente");
  const [titular, setTitular] = useState("");
  const [documentoTitular, setDocumentoTitular] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await cadastrarContaBancaria(
        id,
        { banco, agencia, conta, tipoConta, titular, documentoTitular },
        token,
      );
      router.push(`/eventos/${id}`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar a conta bancária.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="page-shell max-w-2xl">
      <Card className="p-7 sm:p-9">
        <p className="eyebrow">Etapa 2 de 2</p>
        <h1 className="page-title !text-3xl">Conta de repasse</h1>
        <p className="page-description">
          É pra essa conta que o valor das vendas deste evento vai ser repassado. Cada evento tem
          a sua — se você tem outro evento com um repasse diferente, cadastra separado lá.
        </p>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5">
          <Select id="banco" label="Banco" value={banco} onChange={(e) => setBanco(e.target.value)}>
            {BANCOS_BRASIL.map((b) => (
              <option key={b.codigo} value={b.codigo}>
                {b.nome}
              </option>
            ))}
          </Select>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                id="agencia"
                label="Agência"
                required
                placeholder="0001"
                value={agencia}
                onChange={(e) => setAgencia(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                id="conta"
                label="Conta (com dígito)"
                required
                placeholder="12345-6"
                value={conta}
                onChange={(e) => setConta(e.target.value)}
              />
            </div>
          </div>
          <Select
            id="tipoConta"
            label="Tipo de conta"
            value={tipoConta}
            onChange={(e) => setTipoConta(e.target.value as "corrente" | "poupanca")}
          >
            <option value="corrente">Conta corrente</option>
            <option value="poupanca">Poupança</option>
          </Select>
          <Input
            id="titular"
            label="Titular"
            required
            value={titular}
            onChange={(e) => setTitular(e.target.value)}
          />
          <Input
            id="documentoTitular"
            label="CPF ou CNPJ do titular"
            required
            placeholder="000.000.000-00 ou 00.000.000/0001-00"
            value={documentoTitular}
            onChange={(e) => setDocumentoTitular(e.target.value)}
          />
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <Button type="submit" disabled={enviando} className="mt-2 w-full">
            {enviando ? "Salvando..." : "Salvar e concluir"}
          </Button>
        </form>

        <Link
          href={`/eventos/${id}`}
          className="mt-4 block text-center text-sm text-muted hover:text-foreground"
        >
          Cadastrar depois
        </Link>
      </Card>
    </main>
  );
}
