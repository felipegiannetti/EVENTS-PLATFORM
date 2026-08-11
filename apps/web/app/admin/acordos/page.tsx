"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { BadgePercent, CalendarRange, Power, ShieldCheck, Users } from "lucide-react";
import type { EscopoAcordoComercial, OrganizadorAdminResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { criarAcordoAdmin, desativarAcordoAdmin, listarOrganizadoresAdmin } from "@/lib/admin-client";

const POR_PAGINA = 15;

export default function AcordosAdminPage() {
  return <ProtectedPage>{(token) => <PainelAdmin token={token} />}</ProtectedPage>;
}

function PainelAdmin({ token }: { token: string }) {
  const [organizadores, setOrganizadores] = useState<OrganizadorAdminResponse[] | null>(null);
  const [selecionadoId, setSelecionadoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  const recarregar = useCallback(async () => {
    try {
      const dados = await listarOrganizadoresAdmin(token);
      setOrganizadores(dados);
      setSelecionadoId((atual) => atual || dados[0]?.id || "");
      setErro(null);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o painel administrativo.");
    }
  }, [token]);

  useEffect(() => { void recarregar(); }, [recarregar]);

  if (erro && !organizadores) {
    return (
      <main className="page-shell max-w-3xl">
        <Card className="border-danger/20 bg-danger/5 p-8 text-center">
          <ShieldCheck className="mx-auto text-danger" />
          <h1 className="mt-3 text-xl font-bold">Acesso administrativo necessário</h1>
          <p className="mt-2 text-sm text-muted">{erro}</p>
        </Card>
      </main>
    );
  }

  if (!organizadores) return <div className="page-shell"><div className="h-72 animate-pulse rounded-3xl bg-card" /></div>;

  const selecionado = organizadores.find((item) => item.id === selecionadoId) ?? null;
  const totalPaginas = Math.max(1, Math.ceil(organizadores.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const organizadoresPaginados = organizadores.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  return (
    <main className="page-shell max-w-6xl">
      <div className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-slate-950 via-violet-950 to-primary p-8 text-white shadow-glow sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"><ShieldCheck size={12} /> Administração geral</span>
        <h1 className="mt-5 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Acordos comerciais</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Defina quanto da taxa de 12% será destinado ao organizador, sem interferir nas regras permanentes do programa de indicação.</p>
      </div>

      {organizadores.length === 0 ? (
        <Card className="mt-7 p-10 text-center text-sm text-muted">Ainda não há usuários com eventos organizados.</Card>
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="h-fit overflow-hidden p-3">
            <div className="px-3 py-3">
              <p className="flex items-center gap-2 text-sm font-bold"><Users size={16} className="text-primary" /> Organizadores</p>
              <p className="mt-1 text-xs text-muted">{organizadores.length} cadastrados</p>
            </div>
            <div className="flex max-h-[600px] flex-col gap-1 overflow-y-auto">
              {organizadoresPaginados.map((organizador) => (
                <button key={organizador.id} type="button" onClick={() => setSelecionadoId(organizador.id)} className={`rounded-xl px-3 py-3 text-left transition-colors ${selecionadoId === organizador.id ? "bg-primary/10" : "hover:bg-background/70"}`}>
                  <p className={`truncate text-sm font-semibold ${selecionadoId === organizador.id ? "text-primary" : "text-foreground"}`}>{organizador.nome}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{organizador.email}</p>
                </button>
              ))}
            </div>
            <div className="px-2">
              <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onMudarPagina={setPagina} />
            </div>
          </Card>

          {selecionado && <DetalheOrganizador organizador={selecionado} token={token} onAtualizado={recarregar} />}
        </div>
      )}
    </main>
  );
}

function DetalheOrganizador({ organizador, token, onAtualizado }: { organizador: OrganizadorAdminResponse; token: string; onAtualizado: () => Promise<void> }) {
  const [percentual, setPercentual] = useState("0");
  const [escopo, setEscopo] = useState<EscopoAcordoComercial>("todos_eventos");
  const [eventosRestantes, setEventosRestantes] = useState("1");
  const [eventoId, setEventoId] = useState(organizador.eventos[0]?.id ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [desativando, setDesativando] = useState<string | null>(null);
  const [paginaAcordos, setPaginaAcordos] = useState(1);

  useEffect(() => {
    setEventoId(organizador.eventos[0]?.id ?? "");
    setPercentual("0");
    setEscopo("todos_eventos");
    setPaginaAcordos(1);
  }, [organizador.id, organizador.eventos]);

  const bonusIndicador = organizador.indicado ? (2 - organizador.percentualBeneficioIndicacao) * 0.25 : 0;
  const limiteAdmin = useMemo(
    () => 12 - organizador.percentualBeneficioIndicacao - (organizador.indicado ? 0.25 + bonusIndicador : 0),
    [organizador.indicado, organizador.percentualBeneficioIndicacao, bonusIndicador],
  );
  const ativo = organizador.acordos.find((acordo) => acordo.ativo);
  const totalPaginasAcordos = Math.max(1, Math.ceil(organizador.acordos.length / POR_PAGINA));
  const paginaAcordosAtual = Math.min(paginaAcordos, totalPaginasAcordos);
  const acordosPaginados = organizador.acordos.slice((paginaAcordosAtual - 1) * POR_PAGINA, paginaAcordosAtual * POR_PAGINA);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await criarAcordoAdmin({
        organizadorId: organizador.id,
        percentualOrganizador: Number(percentual.replace(",", ".")),
        escopo,
        eventoId: escopo === "evento_especifico" ? eventoId : undefined,
        eventosRestantes: escopo === "proximos_n_eventos" ? Number(eventosRestantes) : undefined,
      }, token);
      await onAtualizado();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o acordo.");
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(id: string) {
    setErro(null);
    setDesativando(id);
    try {
      await desativarAcordoAdmin(id, token);
      await onAtualizado();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível desativar o acordo.");
    } finally {
      setDesativando(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="eyebrow"><BadgePercent size={12} /> Novo acordo</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">{organizador.nome}</h2>
            <p className="mt-1 text-sm text-muted">{organizador.email} · {organizador.eventos.length} evento(s)</p>
          </div>
          <div className="rounded-2xl border border-border/10 bg-background/50 px-4 py-3 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Máximo disponível ao ADMIN</p>
            <p className="mt-1 text-xl font-bold text-primary">{limiteAdmin.toFixed(2)}%</p>
          </div>
        </div>

        {organizador.indicado && (
          <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm">
            <p className="font-semibold text-primary">Organizador vindo por indicação</p>
            <p className="mt-1 leading-6 text-muted">Benefício permanente negociado: {organizador.percentualBeneficioIndicacao.toFixed(2)}%. O indicador recebe {(0.25 + bonusIndicador).toFixed(2)}% em todos os eventos pagos; por isso o limite administrativo já foi reduzido automaticamente.</p>
          </div>
        )}

        <form onSubmit={salvar} className="mt-6 grid gap-5 sm:grid-cols-2">
          <Input id="percentualAdmin" label="Percentual para o organizador (%)" type="number" min="0" max={limiteAdmin} step="0.01" required value={percentual} onChange={(e) => setPercentual(e.target.value)} />
          <Select id="escopoAdmin" label="Duração do acordo" value={escopo} onChange={(e) => setEscopo(e.target.value as EscopoAcordoComercial)}>
            <option value="todos_eventos">Para sempre</option>
            <option value="proximos_n_eventos">Próximos X eventos pagos</option>
            <option value="evento_especifico">Somente um evento</option>
          </Select>
          {escopo === "proximos_n_eventos" && <Input id="eventosRestantesAdmin" label="Quantidade de eventos pagos" type="number" min="1" step="1" required value={eventosRestantes} onChange={(e) => setEventosRestantes(e.target.value)} />}
          {escopo === "evento_especifico" && (
            <Select id="eventoAdmin" label="Evento" value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
              {organizador.eventos.map((evento) => <option key={evento.id} value={evento.id}>{evento.nome} · {new Date(evento.data).toLocaleDateString("pt-BR")}</option>)}
            </Select>
          )}
          {erro && <p className="text-sm text-danger sm:col-span-2">{erro}</p>}
          <Button type="submit" loading={salvando} className="sm:col-span-2">Salvar acordo comercial</Button>
        </form>
      </Card>

      <Card className="p-7">
        <h2 className="flex items-center gap-2 text-lg font-bold"><CalendarRange size={18} className="text-primary" /> Histórico de acordos</h2>
        <div className="mt-5 flex flex-col gap-3">
          {acordosPaginados.map((acordo) => (
            <div key={acordo.id} className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${acordo.ativo ? "border-success/20 bg-success/5" : "border-border/10 bg-background/40 opacity-70"}`}>
              <div>
                <p className="font-semibold">{acordo.percentualOrganizador.toFixed(2)}% para o organizador</p>
                <p className="mt-1 text-xs text-muted">{rotuloEscopo(acordo.escopo, acordo.eventosRestantes)} · criado em {new Date(acordo.criadoEm).toLocaleDateString("pt-BR")}</p>
              </div>
              {acordo.ativo ? (
                <Button type="button" variant="secondary" loading={desativando === acordo.id} onClick={() => desativar(acordo.id)} className="gap-2 text-danger"><Power size={15} /> Desativar</Button>
              ) : <span className="rounded-full bg-background px-3 py-1 text-[10px] font-bold uppercase text-muted">Inativo</span>}
            </div>
          ))}
          {organizador.acordos.length === 0 && <p className="rounded-2xl border border-dashed border-border/20 p-7 text-center text-sm text-muted">Nenhum acordo criado para este organizador.</p>}
        </div>
        <Pagination pagina={paginaAcordosAtual} totalPaginas={totalPaginasAcordos} onMudarPagina={setPaginaAcordos} />
        {ativo && <p className="mt-4 text-xs text-muted">Criar um novo acordo desativa o acordo ativo atual, mantendo o histórico e a auditoria.</p>}
      </Card>
    </div>
  );
}

function rotuloEscopo(escopo: EscopoAcordoComercial, quantidade: number | null) {
  if (escopo === "todos_eventos") return "Todos os eventos, permanentemente";
  if (escopo === "evento_especifico") return "Evento específico";
  return `Próximos ${quantidade ?? 0} eventos pagos`;
}
