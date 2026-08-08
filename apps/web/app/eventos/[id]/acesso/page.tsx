"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ConvidarAcessoInput, PapelAcessoResponse } from "@events-platform/shared-types";

type PapelConvidavel = ConvidarAcessoInput["papel"];
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { useNavigationLoading } from "@/lib/navigation-loading";
import { convidarAcesso, listarAcessos, removerAcesso } from "@/lib/events-client";

const PAPEIS_CONVIDAVEIS: { valor: PapelConvidavel; rotulo: string }[] = [
  { valor: "gestor", rotulo: "Gestor (edita o evento)" },
  { valor: "view", rotulo: "Visualizador (só vê relatórios)" },
  { valor: "checkin_operator", rotulo: "Operador de check-in" },
];

export default function AcessoEventoPage() {
  return <ProtectedPage>{(token) => <GestaoAcesso token={token} />}</ProtectedPage>;
}

function GestaoAcesso({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emAssistente = searchParams.get("wizard") === "1";
  const proximaEtapa = `/eventos/${id}/detalhes${emAssistente ? "?wizard=1" : ""}`;
  const { iniciar } = useNavigationLoading();
  const [acessos, setAcessos] = useState<PapelAcessoResponse[] | null>(null);
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<PapelConvidavel>("gestor");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function recarregar() {
    setAcessos(await listarAcessos(id, token));
  }

  useEffect(() => {
    recarregar().catch((err) =>
      setErro(err instanceof ApiError ? err.message : "Não foi possível carregar os acessos."),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  async function onConvidar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await convidarAcesso(id, { usuarioEmail: email, papel }, token);
      setEmail("");
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível convidar esse usuário.");
    } finally {
      setEnviando(false);
    }
  }

  async function onRemover(usuarioId: string) {
    try {
      await removerAcesso(id, usuarioId, token);
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível remover o acesso.");
    }
  }

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow">{emAssistente ? "Etapa 3 de 4 · Equipe" : "Equipe"}</span>
      <h1 className="page-title">Quem tem acesso</h1>
      <p className="page-description">
        Convide gestores, visualizadores ou operadores de check-in — cada um só enxerga e faz o
        que o papel dele permite.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {acessos?.map((acesso) => (
          <Card key={acesso.usuarioId} className="flex items-center justify-between p-5 hover:border-primary/20">
            <div>
              <p className="font-medium text-foreground">{acesso.usuarioNome}</p>
              <p className="text-sm text-muted">{acesso.usuarioEmail}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
                {acesso.papel === "checkin_operator" ? "check-in" : acesso.papel}
              </span>
              {acesso.papel !== "owner" && (
                <button
                  type="button"
                  onClick={() => onRemover(acesso.usuarioId)}
                  className="text-sm text-danger hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          </Card>
        ))}
        {acessos === null && <p className="text-sm text-muted">Carregando...</p>}
      </div>

      <Card className="mt-8 p-7">
        <h2 className="section-title !text-lg">
          Convidar alguém
        </h2>
        <form onSubmit={onConvidar} className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <Input
              id="email-convite"
              label="Email da pessoa"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="min-w-40">
            <Select
              id="papel-convite"
              label="Papel"
              value={papel}
              onChange={(e) => setPapel(e.target.value as PapelConvidavel)}
            >
              {PAPEIS_CONVIDAVEIS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.rotulo}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" loading={enviando}>
            Convidar
          </Button>
        </form>
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
        <p className="mt-3 text-xs text-muted">
          A pessoa precisa já ter uma conta criada no RARO Tickets com esse email.
        </p>
      </Card>

      {emAssistente && (
        <div className="mt-6 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <Link href={proximaEtapa} onClick={() => iniciar()} className="text-sm text-muted hover:text-foreground">
            Pular por enquanto
          </Link>
          <Button
            onClick={() => {
              iniciar();
              router.push(proximaEtapa);
            }}
          >
            Continuar
          </Button>
        </div>
      )}
    </main>
  );
}
