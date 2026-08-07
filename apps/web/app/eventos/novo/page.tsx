"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { criarEvento } from "@/lib/events-client";

export default function NovoEventoPage() {
  return <ProtectedPage>{(token) => <FormularioEvento token={token} />}</ProtectedPage>;
}

function FormularioEvento({ token }: { token: string }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const evento = await criarEvento(
        {
          nome,
          data: new Date(data).toISOString(),
          local,
          transferivel: false,
          taxaPagaPor: "comprador",
        },
        token,
      );
      router.push(`/eventos/${evento.id}/conta-repasse`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar o evento.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Etapa 1 de 2</p>
        <h1 className="text-xl font-semibold text-foreground">Dados do evento</h1>
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <Input id="nome" label="Nome do evento" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input
            id="data"
            label="Data"
            type="datetime-local"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
          <Input id="local" label="Local" required value={local} onChange={(e) => setLocal(e.target.value)} />
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <Button type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : "Continuar"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
