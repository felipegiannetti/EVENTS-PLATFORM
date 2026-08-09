"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Eye, EyeOff, MapPin, Sparkles } from "lucide-react";
import {
  CATEGORIA_EVENTO,
  PAIS_PADRAO,
  ROTULO_CATEGORIA_EVENTO,
  type CategoriaEvento,
} from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { DateTimeInput } from "@/components/ui/date-time-input";
import { ApiError } from "@/lib/api-client";
import { useNavigationLoading } from "@/lib/navigation-loading";
import { criarEvento } from "@/lib/events-client";
import { listarCidadesPorEstado, listarEstadosBrasil, type EstadoIbge } from "@/lib/ibge-client";
import { formatarCep } from "@/lib/formatters";

export default function NovoEventoPage() {
  return <ProtectedPage>{(token) => <FormularioEvento token={token} />}</ProtectedPage>;
}

function FormularioEvento({ token }: { token: string }) {
  const router = useRouter();
  const { iniciar } = useNavigationLoading();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaEvento>("shows");
  const [data, setData] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [estados, setEstados] = useState<EstadoIbge[]>([]);
  const [estadoSigla, setEstadoSigla] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [cidade, setCidade] = useState("");
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [somenteMaioresDeIdade, setSomenteMaioresDeIdade] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mostrarPopupVisibilidade, setMostrarPopupVisibilidade] = useState(false);

  useEffect(() => {
    listarEstadosBrasil()
      .then(setEstados)
      .catch(() => setErro("Não foi possível carregar a lista de estados — tente recarregar a página."));
  }, []);

  useEffect(() => {
    if (!estadoSigla) {
      setCidades([]);
      setCidade("");
      return;
    }
    setCarregandoCidades(true);
    setCidade("");
    listarCidadesPorEstado(estadoSigla)
      .then(setCidades)
      .catch(() => setErro("Não foi possível carregar as cidades desse estado."))
      .finally(() => setCarregandoCidades(false));
  }, [estadoSigla]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (dataFim && new Date(dataFim) <= new Date(data)) {
      setErro("O horário de término precisa ser depois do início.");
      return;
    }
    setMostrarPopupVisibilidade(true);
  }

  async function finalizarCriacao(publicado: boolean) {
    setEnviando(true);
    try {
      const evento = await criarEvento(
        {
          nome,
          categoria,
          data: new Date(data).toISOString(),
          dataFim: dataFim ? new Date(dataFim).toISOString() : undefined,
          cidade,
          estado: estadoSigla,
          pais: PAIS_PADRAO,
          rua,
          numero,
          complemento: complemento || undefined,
          bairro,
          cep,
          somenteMaioresDeIdade,
          transferivel: false,
          taxaPagaPor: "comprador",
          publicado,
        },
        token,
      );
      iniciar();
      router.push(`/eventos/${evento.id}/conta-repasse?wizard=1`);
    } catch (err) {
      setMostrarPopupVisibilidade(false);
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar o evento.");
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
              <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Etapa 1 de 4</p><h2 className="mt-2 text-xl font-semibold">Dados do evento</h2></div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarDays size={21} /></span>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <Input id="nome" label="Nome do evento" placeholder="Ex.: Festival de Inverno 2026" required value={nome} onChange={(e) => setNome(e.target.value)} />
              <Select id="categoria" label="Categoria" required value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaEvento)}>
                {CATEGORIA_EVENTO.map((valor) => <option key={valor} value={valor}>{ROTULO_CATEGORIA_EVENTO[valor]}</option>)}
              </Select>
              <p className="-mt-3 text-xs text-muted">Selecione “Outros” quando nenhuma categoria representar o evento. Não será necessário informar um tipo adicional.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <DateTimeInput idPrefix="data" label="Início" required value={data} onChange={setData} />
                <DateTimeInput idPrefix="dataFim" label="Término (opcional)" minDate={data ? data.split("T")[0] : undefined} value={dataFim} onChange={setDataFim} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Select
                  id="estado"
                  label="Estado"
                  required
                  value={estadoSigla}
                  onChange={(e) => setEstadoSigla(e.target.value)}
                >
                  <option value="">{estados.length ? "Selecione o estado" : "Carregando..."}</option>
                  {estados.map((estado) => (
                    <option key={estado.sigla} value={estado.sigla}>
                      {estado.nome}
                    </option>
                  ))}
                </Select>
                <Select
                  id="cidade"
                  label="Cidade"
                  required
                  disabled={!estadoSigla || carregandoCidades}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                >
                  <option value="">
                    {!estadoSigla ? "Escolha o estado primeiro" : carregandoCidades ? "Carregando..." : "Selecione a cidade"}
                  </option>
                  {cidades.map((nomeCidade) => (
                    <option key={nomeCidade} value={nomeCidade}>
                      {nomeCidade}
                    </option>
                  ))}
                </Select>
              </div>
              <p className="-mt-3 text-xs text-muted">
                País: {PAIS_PADRAO} (por enquanto a plataforma só opera no Brasil).
              </p>

              <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
                <Input id="rua" label="Rua" required value={rua} onChange={(e) => setRua(e.target.value)} />
                <Input id="numero" label="Número" required value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  id="complemento"
                  label="Complemento (opcional)"
                  placeholder="Bloco, sala, referência..."
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                />
                <Input id="bairro" label="Bairro" required value={bairro} onChange={(e) => setBairro(e.target.value)} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  id="cep"
                  label="CEP"
                  required
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => setCep(formatarCep(e.target.value))}
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-border/15 bg-background/60 px-4 py-3">
                <input
                  type="checkbox"
                  checked={somenteMaioresDeIdade}
                  onChange={(e) => setSomenteMaioresDeIdade(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm text-foreground">Evento somente para maiores de 18 anos</span>
              </label>

              {erro && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}
              <Button type="submit" className="mt-2 w-full">Continuar para o financeiro</Button>
            </form>
          </Card>
          <aside className="h-fit rounded-2xl border border-primary/15 bg-primary/5 p-6">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white shadow-glow"><MapPin size={20} /></span>
            <h3 className="mt-5 font-semibold">O que vem depois?</h3>
            <div className="mt-4 space-y-4">{["Configure a conta de repasse", "Compartilhe com sua equipe", "Adicione banner e descrição"].map((item) => <p key={item} className="flex gap-3 text-sm text-muted"><Check size={16} className="mt-0.5 shrink-0 text-success" />{item}</p>)}</div>
          </aside>
        </div>
      </div>

      {mostrarPopupVisibilidade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-7">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Eye size={21} /></span>
            <h2 className="mt-4 text-xl font-semibold">Compradores já podem ver esse evento?</h2>
            <p className="mt-2 text-sm text-muted">
              O evento vai ser criado de qualquer jeito — essa escolha só decide se ele já aparece
              no catálogo público pros compradores, ou se fica privado (visível só pra você e sua
              equipe) até você liberar, por exemplo pra terminar de configurar alguma coisa antes.
              Dá pra mudar isso a qualquer momento depois, pelo painel do evento.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button loading={enviando} onClick={() => finalizarCriacao(true)} className="w-full">
                <Eye size={16} /> Sim, deixar visível para compradores
              </Button>
              <Button
                variant="secondary"
                disabled={enviando}
                onClick={() => finalizarCriacao(false)}
                className="w-full"
              >
                <EyeOff size={16} /> Não, manter privado por enquanto
              </Button>
            </div>
            <button
              type="button"
              disabled={enviando}
              onClick={() => setMostrarPopupVisibilidade(false)}
              className="mt-4 w-full text-center text-sm text-muted hover:text-foreground disabled:opacity-50"
            >
              Voltar e revisar os dados
            </button>
          </Card>
        </div>
      )}
    </main>
  );
}
