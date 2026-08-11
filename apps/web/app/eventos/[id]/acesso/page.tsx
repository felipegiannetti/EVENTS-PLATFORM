"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ConvidarAcessoInput, PapelAcessoResponse, UsuarioAcessoSugestao } from "@events-platform/shared-types";

type PapelConvidavel = ConvidarAcessoInput["papel"];
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { useNavigationLoading } from "@/lib/navigation-loading";
import { buscarUsuariosParaAcesso, convidarAcesso, listarAcessos, removerAcesso } from "@/lib/events-client";

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
  const [sugestoes, setSugestoes] = useState<UsuarioAcessoSugestao[]>([]);
  const [buscandoSugestoes, setBuscandoSugestoes] = useState(false);

  async function recarregar() {
    setAcessos(await listarAcessos(id, token));
  }

  useEffect(() => {
    recarregar().catch((err) =>
      setErro(err instanceof ApiError ? err.message : "Não foi possível carregar os acessos."),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  useEffect(() => {
    const termo = email.trim();
    if (termo.length < 2) {
      setSugestoes([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setBuscandoSugestoes(true);
      buscarUsuariosParaAcesso(id, termo, token)
        .then(setSugestoes)
        .catch(() => setSugestoes([]))
        .finally(() => setBuscandoSugestoes(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [email, id, token]);

  async function onConvidar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await convidarAcesso(id, { usuarioEmail: email, papel }, token);
      setEmail("");
      setSugestoes([]);
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

      <div className="mt-8 overflow-x-auto rounded-2xl border border-border/10 bg-card shadow-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border/10 text-[10px] font-bold uppercase tracking-wider text-muted">
            <tr><th className="px-5 py-3">Pessoa</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Permissão</th><th className="px-5 py-3 text-right">Ação</th></tr>
          </thead>
          <tbody>
            {acessos?.map((acesso) => (
              <tr key={acesso.usuarioId} className="border-b border-border/10 last:border-0">
                <td className="px-5 py-4 font-semibold text-foreground">{acesso.usuarioNome}</td>
                <td className="px-5 py-4 text-muted">{acesso.usuarioEmail}</td>
                <td className="px-5 py-4"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{rotuloPapel(acesso.papel)}</span></td>
                <td className="px-5 py-4 text-right">{acesso.papel !== "owner" ? <button type="button" onClick={() => onRemover(acesso.usuarioId)} className="text-sm font-semibold text-danger hover:underline">Remover</button> : <span className="text-xs text-muted">Responsável</span>}</td>
              </tr>
            ))}
            {acessos === null && <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">Carregando...</td></tr>}
          </tbody>
        </table>
      </div>

      <Card className="mt-8 p-7">
        <h2 className="section-title !text-lg">
          Convidar alguém
        </h2>
        <form onSubmit={onConvidar} className="mt-5 flex flex-wrap items-end gap-3">
          <div className="relative min-w-52 flex-1">
            <Input
              id="email-convite"
              label="Email da pessoa"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
            {(sugestoes.length > 0 || buscandoSugestoes) && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border/15 bg-card shadow-xl">
                {buscandoSugestoes && sugestoes.length === 0 ? <p className="px-4 py-3 text-xs text-muted">Buscando usuários...</p> : sugestoes.map((usuario) => (
                  <button key={usuario.id} type="button" onClick={() => { setEmail(usuario.email); setSugestoes([]); }} className="flex w-full items-center justify-between gap-4 border-b border-border/10 px-4 py-3 text-left last:border-0 hover:bg-primary/5">
                    <span className="text-sm font-semibold text-foreground">{usuario.nome}</span><span className="text-xs text-muted">{usuario.email}</span>
                  </button>
                ))}
              </div>
            )}
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

function rotuloPapel(papel: PapelAcessoResponse["papel"]) {
  if (papel === "owner") return "Organizador responsável";
  if (papel === "gestor") return "Gestor · pode editar";
  if (papel === "view") return "Visualizador · somente leitura";
  return "Operador de check-in";
}
