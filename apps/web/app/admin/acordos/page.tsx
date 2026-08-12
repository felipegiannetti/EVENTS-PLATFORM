"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, BadgePercent, CalendarRange, Power, RefreshCcw, Search, ShieldCheck, Users, X } from "lucide-react";
import type { AcordoComercialResponse, EscopoAcordoComercial, OrganizadorAdminResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { criarAcordoAdmin, desativarAcordoAdmin, listarOrganizadoresAdmin, reativarAcordoAdmin } from "@/lib/admin-client";

const POR_PAGINA = 15;
type AcaoAcordoPendente =
  | { tipo: "criar" }
  | { tipo: "desativar" | "reativar"; acordo: AcordoComercialResponse };

export default function AcordosAdminPage() {
  return <ProtectedPage>{(token) => <PainelAdmin token={token} />}</ProtectedPage>;
}

function PainelAdmin({ token }: { token: string }) {
  const [organizadores, setOrganizadores] = useState<OrganizadorAdminResponse[] | null>(null);
  const [selecionadoId, setSelecionadoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [buscaOrganizador, setBuscaOrganizador] = useState("");

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

  const organizadoresFiltrados = useMemo(() => {
    const termo = buscaOrganizador.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return organizadores ?? [];
    return (organizadores ?? []).filter((organizador) =>
      organizador.nome.toLocaleLowerCase("pt-BR").includes(termo)
      || organizador.email.toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [buscaOrganizador, organizadores]);

  useEffect(() => {
    setPagina(1);
    if (!organizadoresFiltrados.some((organizador) => organizador.id === selecionadoId)) {
      setSelecionadoId(organizadoresFiltrados[0]?.id ?? "");
    }
  }, [organizadoresFiltrados, selecionadoId]);

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
  const totalPaginas = Math.max(1, Math.ceil(organizadoresFiltrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const organizadoresPaginados = organizadoresFiltrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

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
              <p className="mt-1 text-xs text-muted">{organizadoresFiltrados.length} de {organizadores.length} cadastrados</p>
              <div className="relative mt-4">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={buscaOrganizador}
                  onChange={(evento) => setBuscaOrganizador(evento.target.value)}
                  placeholder="Nome ou email..."
                  aria-label="Pesquisar organizador"
                  className="h-10 w-full rounded-xl border border-border/15 bg-background/60 pl-9 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>
            <div className="flex max-h-[600px] flex-col gap-1 overflow-y-auto">
              {organizadoresPaginados.map((organizador) => (
                <button key={organizador.id} type="button" onClick={() => setSelecionadoId(organizador.id)} className={`rounded-xl px-3 py-3 text-left transition-colors ${selecionadoId === organizador.id ? "bg-primary/10" : "hover:bg-background/70"}`}>
                  <p className={`truncate text-sm font-semibold ${selecionadoId === organizador.id ? "text-primary" : "text-foreground"}`}>{organizador.nome}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{organizador.email}</p>
                </button>
              ))}
              {organizadoresPaginados.length === 0 && (
                <p className="px-3 py-8 text-center text-xs leading-5 text-muted">Nenhum organizador corresponde à busca.</p>
              )}
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
  const [acaoPendente, setAcaoPendente] = useState<AcaoAcordoPendente | null>(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [paginaAcordos, setPaginaAcordos] = useState(1);

  useEffect(() => {
    const acordoAtivo = organizador.acordos.find((acordo) => acordo.ativo);
    setEventoId(acordoAtivo?.eventoId ?? organizador.eventos[0]?.id ?? "");
    setPercentual(acordoAtivo?.percentualOrganizador.toFixed(2) ?? "0");
    setEscopo(acordoAtivo?.escopo ?? "todos_eventos");
    setEventosRestantes(String(acordoAtivo?.eventosRestantes ?? 1));
    setPaginaAcordos(1);
  }, [organizador.id, organizador.eventos, organizador.acordos]);

  const limiteAdmin = 4;
  const percentualInformado = Math.max(0, Number(percentual.replace(",", ".")) || 0);
  const beneficioIndicacao = numeroSeguro(organizador.percentualBeneficioIndicacao);
  const percentualIndicadorCalculado = organizador.indicado
    ? 0.25 + (2 - Math.min(2, Math.max(0, beneficioIndicacao))) * 0.25
    : 0;
  const percentualIndicador = numeroSeguro(organizador.percentualIndicador, percentualIndicadorCalculado);
  const percentualPlataforma = Math.max(
    0,
    12 - percentualInformado - beneficioIndicacao - percentualIndicador,
  );
  const ativo = organizador.acordos.find((acordo) => acordo.ativo);
  const totalPaginasAcordos = Math.max(1, Math.ceil(organizador.acordos.length / POR_PAGINA));
  const paginaAcordosAtual = Math.min(paginaAcordos, totalPaginasAcordos);
  const acordosPaginados = organizador.acordos.slice((paginaAcordosAtual - 1) * POR_PAGINA, paginaAcordosAtual * POR_PAGINA);

  function solicitarCriacao(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setAcaoPendente({ tipo: "criar" });
  }

  async function confirmarAcao() {
    if (!acaoPendente) return;
    setErro(null);
    setProcessandoAcao(true);
    try {
      if (acaoPendente.tipo === "criar") {
        await criarAcordoAdmin({
          organizadorId: organizador.id,
          percentualOrganizador: percentualInformado,
          escopo,
          eventoId: escopo === "evento_especifico" ? eventoId : undefined,
          eventosRestantes: escopo === "proximos_n_eventos" ? Number(eventosRestantes) : undefined,
        }, token);
      } else if (acaoPendente.tipo === "desativar") {
        await desativarAcordoAdmin(acaoPendente.acordo.id, token);
      } else {
        await reativarAcordoAdmin(acaoPendente.acordo.id, token);
      }
      await onAtualizado();
      setAcaoPendente(null);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível concluir a alteração do acordo.");
    } finally {
      setProcessandoAcao(false);
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
            <p className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              Limite do acordo
              <HelpTooltip texto="O ADMIN pode conceder ao organizador no máximo 4% dos 12% da taxa da plataforma." />
            </p>
            <p className="mt-1 text-xl font-bold text-primary">{limiteAdmin.toFixed(2)}%</p>
            <p className="mt-0.5 text-[10px] text-muted">dos 12% da taxa</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className={`rounded-2xl border p-4 text-sm ${organizador.indicado ? "border-primary/15 bg-primary/5" : "border-border/10 bg-background/40"}`}>
            <p className={`flex items-center gap-1.5 font-semibold ${organizador.indicado ? "text-primary" : "text-foreground"}`}>
              {organizador.indicado ? "Indicação vinculada" : "Sem indicador vinculado"}
              <HelpTooltip texto="Mostra se este organizador entrou por um link de indicação. Quando existe vínculo, o indicador e o organizador podem receber percentuais permanentes nos eventos pagos." />
            </p>
            {organizador.indicado ? (
              <>
                <p className="mt-1 truncate text-xs text-muted">
                  {organizador.indicadorNome || "Indicador cadastrado"}{organizador.indicadorEmail ? ` · ${organizador.indicadorEmail}` : ""}
                </p>
                <p className="mt-2 leading-5 text-muted">
                  Indicador: <strong className="text-foreground">{percentualIndicador.toFixed(2)}%</strong> · benefício do organizador: <strong className="text-foreground">{beneficioIndicacao.toFixed(2)}%</strong>
                </p>
              </>
            ) : <p className="mt-1 text-xs leading-5 text-muted">Nenhum percentual do programa de indicação será descontado.</p>}
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4 text-sm">
            <p className="flex items-center gap-1.5 font-semibold text-success">
              Parcela da plataforma
              <HelpTooltip texto="É quanto dos 12% permanece com a plataforma depois de descontar o acordo comercial, o benefício do organizador indicado e a comissão do indicador." />
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{percentualPlataforma.toFixed(2)}% <span className="text-xs font-medium text-muted">dos 12%</span></p>
            <p className="mt-1 text-xs leading-5 text-muted">Valor líquido após o acordo informado e, quando houver, o programa de indicação.</p>
          </div>
        </div>

        <form onSubmit={solicitarCriacao} className="mt-6 grid gap-5 sm:grid-cols-2">
          <Input id="percentualAdmin" label="Percentual para o organizador (%)" ajuda="Parcela dos 12% concedida diretamente pelo ADMIN. Ela é independente de qualquer benefício que o organizador já receba pelo programa de indicação." type="number" min="0" max={limiteAdmin} step="0.01" required value={percentual} onChange={(e) => setPercentual(e.target.value)} />
          <Select id="escopoAdmin" label="Duração do acordo" ajuda="Define se o percentual valerá para sempre, somente para os próximos eventos pagos ou apenas para um evento específico." value={escopo} onChange={(e) => setEscopo(e.target.value as EscopoAcordoComercial)}>
            <option value="todos_eventos">Para sempre</option>
            <option value="proximos_n_eventos">Próximos X eventos pagos</option>
            <option value="evento_especifico">Somente um evento</option>
          </Select>
          {escopo === "proximos_n_eventos" && <Input id="eventosRestantesAdmin" label="Quantidade de eventos pagos" ajuda="Somente eventos com ingressos pagos consomem essa quantidade. Eventos gratuitos não entram na contagem." type="number" min="1" step="1" required value={eventosRestantes} onChange={(e) => setEventosRestantes(e.target.value)} />}
          {escopo === "evento_especifico" && (
            <Select id="eventoAdmin" label="Evento" ajuda="O percentual será aplicado exclusivamente ao evento escolhido e não afetará os demais eventos deste organizador." value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
              {organizador.eventos.map((evento) => <option key={evento.id} value={evento.id}>{evento.nome} · {new Date(evento.data).toLocaleDateString("pt-BR")}</option>)}
            </Select>
          )}
          {erro && <p className="text-sm text-danger sm:col-span-2">{erro}</p>}
          <Button type="submit" className="sm:col-span-2">Revisar e salvar acordo</Button>
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
                <Button type="button" variant="secondary" disabled={processandoAcao} onClick={() => setAcaoPendente({ tipo: "desativar", acordo })} className="gap-2 text-danger"><Power size={15} /> Desativar</Button>
              ) : (
                <Button type="button" variant="secondary" disabled={processandoAcao} onClick={() => setAcaoPendente({ tipo: "reativar", acordo })} className="gap-2 text-primary"><RefreshCcw size={15} /> Reativar</Button>
              )}
            </div>
          ))}
          {organizador.acordos.length === 0 && <p className="rounded-2xl border border-dashed border-border/20 p-7 text-center text-sm text-muted">Nenhum acordo criado para este organizador.</p>}
        </div>
        <Pagination pagina={paginaAcordosAtual} totalPaginas={totalPaginasAcordos} onMudarPagina={setPaginaAcordos} />
        {ativo && <p className="mt-4 text-xs text-muted">Criar um novo acordo desativa o acordo ativo atual, mantendo o histórico e a auditoria.</p>}
      </Card>

      {acaoPendente && (
        <ModalConfirmarAcordo
          acao={acaoPendente}
          organizador={organizador}
          percentualNovo={percentualInformado}
          escopoNovo={escopo}
          eventosRestantesNovo={Number(eventosRestantes)}
          eventoIdNovo={eventoId}
          beneficioIndicacao={beneficioIndicacao}
          percentualIndicador={percentualIndicador}
          processando={processandoAcao}
          erro={erro}
          onFechar={() => !processandoAcao && setAcaoPendente(null)}
          onConfirmar={confirmarAcao}
        />
      )}
    </div>
  );
}

function ModalConfirmarAcordo({
  acao,
  organizador,
  percentualNovo,
  escopoNovo,
  eventosRestantesNovo,
  eventoIdNovo,
  beneficioIndicacao,
  percentualIndicador,
  processando,
  erro,
  onFechar,
  onConfirmar,
}: {
  acao: AcaoAcordoPendente;
  organizador: OrganizadorAdminResponse;
  percentualNovo: number;
  escopoNovo: EscopoAcordoComercial;
  eventosRestantesNovo: number;
  eventoIdNovo: string;
  beneficioIndicacao: number;
  percentualIndicador: number;
  processando: boolean;
  erro: string | null;
  onFechar: () => void;
  onConfirmar: () => Promise<void>;
}) {
  const acordo = acao.tipo === "criar" ? null : acao.acordo;
  const percentualOrganizador = acordo?.percentualOrganizador ?? percentualNovo;
  const escopo = acordo?.escopo ?? escopoNovo;
  const eventosRestantes = acordo?.eventosRestantes ?? eventosRestantesNovo;
  const eventoId = acordo?.eventoId ?? eventoIdNovo;
  const evento = organizador.eventos.find((item) => item.id === eventoId);
  const percentualPlataforma = Math.max(0, 12 - percentualOrganizador - beneficioIndicacao - percentualIndicador);
  const titulo = acao.tipo === "criar" ? "Confirmar novo acordo" : acao.tipo === "desativar" ? "Confirmar desativação" : "Confirmar reativação";
  const descricao = acao.tipo === "criar"
    ? "Revise a distribuição antes de criar o acordo. Se já existir um acordo ativo, ele será desativado."
    : acao.tipo === "desativar"
      ? "Este acordo deixará de ser aplicado aos próximos eventos elegíveis. O histórico será mantido."
      : "Este acordo voltará a valer e substituirá qualquer outro acordo atualmente ativo deste organizador.";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b0920]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmacao-acordo" onClick={onFechar}>
      <Card className="w-full max-w-xl overflow-hidden p-0 shadow-2xl" onClick={(eventoClique) => eventoClique.stopPropagation()}>
        <div className="border-b border-border/10 bg-gradient-to-br from-primary/10 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${acao.tipo === "desativar" ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}>
              {acao.tipo === "desativar" ? <AlertTriangle size={21} /> : <BadgePercent size={21} />}
            </span>
            <button type="button" aria-label="Fechar confirmação" disabled={processando} onClick={onFechar} className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-background hover:text-foreground disabled:opacity-40"><X size={18} /></button>
          </div>
          <h3 id="titulo-confirmacao-acordo" className="mt-4 text-2xl font-bold tracking-tight text-foreground">{titulo}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{descricao}</p>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-2xl border border-border/10 bg-background/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Organizador</p>
            <p className="mt-1 font-semibold text-foreground">{organizador.nome}</p>
            <p className="text-xs text-muted">{organizador.email}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ResumoConfirmacao rotulo="Organizador pelo acordo" valor={`${percentualOrganizador.toFixed(2)}%`} ajuda="Percentual dos 12% concedido diretamente pelo ADMIN neste acordo. Não inclui o benefício recebido pelo programa de indicação." />
            <ResumoConfirmacao rotulo="Plataforma" valor={`${percentualPlataforma.toFixed(2)}% dos 12%`} ajuda="Parcela líquida que permanece com a plataforma depois de descontar o acordo, o benefício da indicação e a comissão do indicador." destaque />
            <ResumoConfirmacao rotulo="Indicador" valor={`${percentualIndicador.toFixed(2)}%`} ajuda="Comissão permanente de quem indicou o organizador: 0,25% fixos mais o eventual bônus da negociação, apenas em eventos pagos." />
            <ResumoConfirmacao rotulo="Benefício da indicação" valor={`${beneficioIndicacao.toFixed(2)}%`} ajuda="Percentual negociado no link de indicação que o organizador recebe em todos os eventos pagos, independentemente deste acordo comercial." />
          </div>
          <div className="rounded-2xl border border-border/10 p-4 text-sm">
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
              Aplicação do acordo
              <HelpTooltip texto="Indica em quais eventos este acordo será considerado pelo cálculo financeiro." />
            </p>
            <p className="font-semibold text-foreground">{rotuloEscopo(escopo, eventosRestantes)}</p>
            {escopo === "evento_especifico" && <p className="mt-1 text-xs text-muted">Evento: {evento?.nome ?? "Evento não encontrado"}</p>}
          </div>
          {erro && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button type="button" variant="secondary" disabled={processando} onClick={onFechar} className="flex-1">Voltar</Button>
            <Button type="button" loading={processando} onClick={() => void onConfirmar()} className={`flex-1 ${acao.tipo === "desativar" ? "!bg-danger !bg-none" : ""}`}>
              {acao.tipo === "criar" ? "Criar acordo" : acao.tipo === "desativar" ? "Desativar acordo" : "Reativar acordo"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ResumoConfirmacao({ rotulo, valor, ajuda, destaque = false }: { rotulo: string; valor: string; ajuda: string; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${destaque ? "border-success/20 bg-success/5" : "border-border/10 bg-background/40"}`}>
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
        {rotulo}
        <HelpTooltip texto={ajuda} />
      </p>
      <p className={`mt-1 text-lg font-bold ${destaque ? "text-success" : "text-foreground"}`}>{valor}</p>
    </div>
  );
}

function numeroSeguro(valor: unknown, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

function rotuloEscopo(escopo: EscopoAcordoComercial, quantidade: number | null) {
  if (escopo === "todos_eventos") return "Todos os eventos, permanentemente";
  if (escopo === "evento_especifico") return "Evento específico";
  return `Próximos ${quantidade ?? 0} eventos pagos`;
}
