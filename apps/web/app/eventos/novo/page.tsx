"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, MapPin, Sparkles } from "lucide-react";
import {
  CATEGORIA_EVENTO,
  ROTULO_CATEGORIA_EVENTO,
  type CategoriaEvento,
} from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { criarEvento } from "@/lib/events-client";

export default function NovoEventoPage() {
  return <ProtectedPage>{(token) => <FormularioEvento token={token} />}</ProtectedPage>;
}

function FormularioEvento({ token }: { token: string }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaEvento>("shows");
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
          categoria,
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
    <main className="page-shell">
      <div className="mx-auto max-w-4xl">
        <span className="eyebrow"><Sparkles size={12} /> Novo evento</span>
        <h1 className="page-title">Dê vida à sua próxima experiência</h1>
        <p className="page-description">Comece com o essencial. Você poderá configurar ingressos, equipe e financeiro depois.</p>

        <div className="mt-9 grid gap-6 lg:grid-cols-[1fr_300px]">
          <Card className="p-7 sm:p-9">
            <div className="mb-7 flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Etapa 1 de 2</p><h2 className="mt-2 text-xl font-semibold">Dados do evento</h2></div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarDays size={21} /></span>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <Input id="nome" label="Nome do evento" placeholder="Ex.: Festival de Inverno 2026" required value={nome} onChange={(e) => setNome(e.target.value)} />
              <Select id="categoria" label="Categoria" required value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaEvento)}>
                {CATEGORIA_EVENTO.map((valor) => <option key={valor} value={valor}>{ROTULO_CATEGORIA_EVENTO[valor]}</option>)}
              </Select>
              <p className="-mt-3 text-xs text-muted">Selecione “Outros” quando nenhuma categoria representar o evento. Não será necessário informar um tipo adicional.</p>
              <Input id="data" label="Data e horário" type="datetime-local" required value={data} onChange={(e) => setData(e.target.value)} />
              <Input id="local" label="Local" placeholder="Espaço ou endereço do evento" required value={local} onChange={(e) => setLocal(e.target.value)} />
              {erro && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}
              <Button type="submit" disabled={enviando} className="mt-2 w-full">{enviando ? "Salvando..." : "Continuar para o financeiro"}</Button>
            </form>
          </Card>
          <aside className="h-fit rounded-2xl border border-primary/15 bg-primary/5 p-6">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white shadow-glow"><MapPin size={20} /></span>
            <h3 className="mt-5 font-semibold">O que vem depois?</h3>
            <div className="mt-4 space-y-4">{["Configure a conta de repasse", "Crie lotes e preços", "Convide sua equipe"].map((item) => <p key={item} className="flex gap-3 text-sm text-muted"><Check size={16} className="mt-0.5 shrink-0 text-success" />{item}</p>)}</div>
          </aside>
        </div>
      </div>
    </main>
  );
}
