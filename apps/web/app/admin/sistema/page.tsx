"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Plus, ToggleLeft } from "lucide-react";
import type { FeatureFlagResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api-client";
import { alternarFeatureFlag, criarFeatureFlag, listarFeatureFlags } from "@/lib/admin-client";

const FLAGS_POR_PAGINA = 15;

export default function SistemaAdminPage() {
  return <ProtectedPage>{(token) => <PainelSistema token={token} />}</ProtectedPage>;
}

function PainelSistema({ token }: { token: string }) {
  const [flags, setFlags] = useState<FeatureFlagResponse[] | null>(null);
  const [chave, setChave] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [alternando, setAlternando] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  async function recarregar() {
    try {
      setFlags(await listarFeatureFlags(token));
      setErro(null);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível carregar as funcionalidades.");
    }
  }

  useEffect(() => { void recarregar(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function aoCriar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCriando(true);
    try {
      await criarFeatureFlag(chave.trim(), token);
      setChave("");
      setPagina(1);
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar a funcionalidade.");
    } finally {
      setCriando(false);
    }
  }

  async function aoAlternar(id: string) {
    setErro(null);
    setAlternando(id);
    try {
      await alternarFeatureFlag(id, token);
      await recarregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível alternar a funcionalidade.");
    } finally {
      setAlternando(null);
    }
  }

  const totalPaginas = Math.max(1, Math.ceil((flags?.length ?? 0) / FLAGS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);

  return (
    <main className="page-shell max-w-3xl">
      <span className="eyebrow"><ToggleLeft size={12} /> Sistema</span>
      <h1 className="page-title">Funcionalidades</h1>
      <p className="page-description">Ligue e desligue funcionalidades da plataforma, e reative quando quiser.</p>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-warning/10 px-4 py-3 text-xs leading-5 text-warning">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>Essas chaves ainda não são checadas por nenhuma funcionalidade do sistema hoje — é só o registro/controle. Conectar isso ao comportamento real de cada funcionalidade é um passo futuro.</span>
      </div>

      <Card className="mt-6 p-6">
        <form onSubmit={aoCriar} className="flex items-end gap-3">
          <div className="flex-1">
            <Input id="chaveFlag" label="Nova chave" placeholder="ex: transferencia_ingressos" value={chave} onChange={(e) => setChave(e.target.value)} required minLength={2} maxLength={80} />
          </div>
          <Button type="submit" loading={criando} className="gap-2"><Plus size={16} /> Criar</Button>
        </form>
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {!flags && [0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />)}

        {flags?.slice((paginaAtual - 1) * FLAGS_POR_PAGINA, paginaAtual * FLAGS_POR_PAGINA).map((flag) => (
          <Card key={flag.id} className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="font-mono text-sm font-semibold text-foreground">{flag.chave}</p>
              <p className="mt-0.5 text-xs text-muted">Criada em {new Date(flag.criadoEm).toLocaleDateString("pt-BR")}</p>
            </div>
            <button
              type="button"
              disabled={alternando === flag.id}
              onClick={() => aoAlternar(flag.id)}
              aria-pressed={flag.ativo}
              aria-label={flag.ativo ? "Desativar" : "Ativar"}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${flag.ativo ? "bg-success" : "bg-border/40"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${flag.ativo ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </Card>
        ))}

        {flags && flags.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted">Nenhuma funcionalidade cadastrada ainda.</Card>
        )}
      </div>

      <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onMudarPagina={setPagina} />
    </main>
  );
}
