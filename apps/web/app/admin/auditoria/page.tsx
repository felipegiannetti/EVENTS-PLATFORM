"use client";

import { useEffect, useRef, useState } from "react";
import { ListChecks, Search, UserX } from "lucide-react";
import type { AuditLogResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api-client";
import { listarAuditoria } from "@/lib/admin-client";

const REGISTROS_POR_PAGINA = 15;

export default function AuditoriaAdminPage() {
  return <ProtectedPage>{(token) => <PainelAuditoria token={token} />}</ProtectedPage>;
}

function PainelAuditoria({ token }: { token: string }) {
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<AuditLogResponse[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const requisicaoAtual = useRef(0);

  async function pesquisar(termo: string) {
    const requisicao = ++requisicaoAtual.current;
    setCarregando(true);
    setErro(null);
    try {
      const encontrados = await listarAuditoria(termo, token);
      if (requisicao !== requisicaoAtual.current) return;
      setRegistros(encontrados);
      setPagina(1);
    } catch (err) {
      if (requisicao !== requisicaoAtual.current) return;
      setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o histórico de auditoria.");
    } finally {
      if (requisicao === requisicaoAtual.current) setCarregando(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void pesquisar(busca); }, 300);
    return () => window.clearTimeout(timer);
  }, [busca, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPaginas = Math.max(1, Math.ceil((registros?.length ?? 0) / REGISTROS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const registrosPaginados = registros?.slice((paginaAtual - 1) * REGISTROS_POR_PAGINA, paginaAtual * REGISTROS_POR_PAGINA) ?? [];

  return (
    <main className="page-shell max-w-4xl">
      <span className="eyebrow"><ListChecks size={12} /> Auditoria</span>
      <h1 className="page-title">Histórico de ações</h1>
      <p className="page-description">
        Ações administrativas e eventos de autenticação sensíveis, mais recentes primeiro (últimos 200 registros).
      </p>

      <div className="relative mt-6">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Ação, entidade, nome ou email do autor..."
          aria-label="Pesquisar na auditoria"
          className="h-12 w-full rounded-xl border border-border/15 bg-background/60 pl-11 pr-4 text-sm text-foreground shadow-inner outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <p className="mt-2 text-xs text-muted">{carregando ? "Buscando..." : "A busca é atualizada automaticamente enquanto você digita."}</p>

      {erro && <p className="mt-4 text-sm text-danger">{erro}</p>}

      <div className="mt-6 flex flex-col gap-2">
        {carregando && !registros && [0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />)}

        {registrosPaginados.map((registro) => (
          <Card key={registro.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold text-foreground">{registro.acao}</p>
              <p className="mt-0.5 text-xs text-muted">{registro.entidade} · {registro.entidadeId}</p>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                {registro.autorNome ? (
                  `${registro.autorNome} (${registro.autorEmail})`
                ) : (
                  <><UserX size={13} /> Conta excluída</>
                )}
              </span>
              <span>{new Date(registro.criadoEm).toLocaleString("pt-BR")}</span>
            </div>
          </Card>
        ))}

        {registros && registros.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted">Nenhum registro de auditoria encontrado.</Card>
        )}
      </div>

      <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onMudarPagina={setPagina} />
    </main>
  );
}
