"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Download, PackageX, Phone, Search } from "lucide-react";
import type { CarrinhoAbandonadoResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Pagination, ITENS_POR_PAGINA } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api-client";
import { baixarCarrinhoAbandonadoCsv, listarCarrinhoAbandonado } from "@/lib/tickets-client";

export default function CarrinhoAbandonadoPage() {
  return <ProtectedPage>{(token) => <PainelCarrinhoAbandonado token={token} />}</ProtectedPage>;
}

function PainelCarrinhoAbandonado({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [itens, setItens] = useState<CarrinhoAbandonadoResponse[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    listarCarrinhoAbandonado(id, token)
      .then(setItens)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o carrinho abandonado."));
  }, [id, token]);

  const itensFiltrados = useMemo(() => {
    if (!itens) return [];
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return itens;
    return itens.filter(
      (item) =>
        (item.compradorNome ?? "").toLocaleLowerCase("pt-BR").includes(termo) ||
        (item.compradorEmail ?? "").toLocaleLowerCase("pt-BR").includes(termo) ||
        (item.compradorTelefone ?? "").toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [itens, busca]);

  const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const itensPaginados = itensFiltrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  async function onExportarCsv() {
    setExportando(true);
    setErro(null);
    try {
      await baixarCarrinhoAbandonadoCsv(id, token);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível exportar o CSV.");
    } finally {
      setExportando(false);
    }
  }

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow">
        <PackageX size={12} /> Carrinho abandonado
      </span>
      <h1 className="page-title">Quem chegou perto e desistiu</h1>
      <p className="page-description">
        Reservas de 15 minutos que venceram sem virar ingresso — contato de quem colocou no carrinho ou
        chegou na etapa de pagamento, mas não finalizou.
      </p>

      <div className="mt-6">
        <Button variant="secondary" loading={exportando} onClick={onExportarCsv} disabled={!itens || itens.length === 0} className="gap-2">
          <Download size={16} /> Exportar (CSV)
        </Button>
      </div>

      {erro && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}

      {itens && itens.length > 0 && (
        <div className="relative mt-6">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nome, email ou telefone..."
            className="h-11 w-full rounded-xl border border-border/15 bg-background/60 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/10 bg-card shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border/10 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Telefone</th>
              <th className="px-5 py-3">Lote</th>
              <th className="px-5 py-3">Iniciado em</th>
            </tr>
          </thead>
          <tbody>
            {itensPaginados.map((item) => (
              <tr key={item.id} className="border-b border-border/10 last:border-0">
                <td className="px-5 py-4 text-foreground">{item.compradorNome ?? "—"}</td>
                <td className="px-5 py-4 text-muted">{item.compradorEmail ?? "—"}</td>
                <td className="px-5 py-4 text-muted">
                  {item.compradorTelefone ? (
                    <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {item.compradorTelefone}</span>
                  ) : "—"}
                </td>
                <td className="px-5 py-4 text-muted">{item.loteNome}</td>
                <td className="px-5 py-4 text-muted">{new Date(item.criadoEm).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {itens === null && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">Carregando...</td></tr>
            )}
            {itens && itens.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">Nenhum carrinho abandonado registrado ainda.</td></tr>
            )}
            {itens && itens.length > 0 && itensFiltrados.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">Nenhum resultado para essa busca.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onMudarPagina={setPagina} />
    </main>
  );
}
