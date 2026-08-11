"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ImagePlus, Sparkles, X } from "lucide-react";
import {
  CATEGORIA_EVENTO,
  ROTULO_CATEGORIA_EVENTO,
  type CategoriaEvento,
  type EventoResponse,
} from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { DateTimeInput } from "@/components/ui/date-time-input";
import { ApiError } from "@/lib/api-client";
import { useNavigationLoading } from "@/lib/navigation-loading";
import { formatarCep, formatarTelefone } from "@/lib/formatters";
import { listarCidadesPorEstado, listarEstadosBrasil, type EstadoIbge } from "@/lib/ibge-client";
import {
  atualizarEvento,
  buscarEvento,
  enviarBannerEvento,
  urlBannerEvento,
} from "@/lib/events-client";

export default function DetalhesEventoPage() {
  return <ProtectedPage>{(token) => <FormularioDetalhes token={token} />}</ProtectedPage>;
}

function FormularioDetalhes({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emAssistente = searchParams.get("wizard") === "1";
  const { iniciar } = useNavigationLoading();
  const [evento, setEvento] = useState<EventoResponse | null>(null);

  // Dados do evento (só editável fora do assistente — ver "Configurações")
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaEvento>("shows");
  const [data, setData] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [estados, setEstados] = useState<EstadoIbge[]>([]);
  const [estadoSigla, setEstadoSigla] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [cidade, setCidade] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [somenteMaioresDeIdade, setSomenteMaioresDeIdade] = useState(false);
  const [transferivel, setTransferivel] = useState(false);
  const [prazoTransferenciaValor, setPrazoTransferenciaValor] = useState("");
  const [prazoTransferenciaUnidade, setPrazoTransferenciaUnidade] = useState<"horas" | "dias">("horas");

  // Banner, descrição e contato — sempre editáveis (etapa opcional do assistente ou Configurações)
  const [descricao, setDescricao] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [contatoEmail, setContatoEmail] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");

  const [enviandoBanner, setEnviandoBanner] = useState(false);
  const [versaoBanner, setVersaoBanner] = useState(0);
  const [bannerAmpliado, setBannerAmpliado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [carregouEstadoInicial, setCarregouEstadoInicial] = useState(false);

  useEffect(() => {
    buscarEvento(id, token)
      .then((atual) => {
        setEvento(atual);
        setNome(atual.nome);
        setCategoria(atual.categoria);
        setData(atual.data.slice(0, 16));
        setDataFim(atual.dataFim ? atual.dataFim.slice(0, 16) : "");
        setEstadoSigla(atual.estado ?? "");
        setCidade(atual.cidade ?? "");
        setRua(atual.rua ?? "");
        setNumero(atual.numero ?? "");
        setComplemento(atual.complemento ?? "");
        setBairro(atual.bairro ?? "");
        setCep(atual.cep ?? "");
        setSomenteMaioresDeIdade(atual.somenteMaioresDeIdade);
        setTransferivel(atual.transferivel);
        if (atual.prazoTransferenciaHoras != null) {
          // Exibe em dias quando dá uma divisão exata (ex.: 48h -> "2 dias"), senão em horas.
          if (atual.prazoTransferenciaHoras % 24 === 0) {
            setPrazoTransferenciaValor(String(atual.prazoTransferenciaHoras / 24));
            setPrazoTransferenciaUnidade("dias");
          } else {
            setPrazoTransferenciaValor(String(atual.prazoTransferenciaHoras));
            setPrazoTransferenciaUnidade("horas");
          }
        } else {
          setPrazoTransferenciaValor("");
          setPrazoTransferenciaUnidade("horas");
        }
        setDescricao(atual.descricao ?? "");
        setContatoNome(atual.contatoNome ?? "");
        setContatoEmail(atual.contatoEmail ?? "");
        setContatoTelefone(atual.contatoTelefone ?? "");
      })
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o evento."));
  }, [id, token]);

  useEffect(() => {
    if (emAssistente) return;
    listarEstadosBrasil()
      .then(setEstados)
      .catch(() => setErro("Não foi possível carregar a lista de estados."));
  }, [emAssistente]);

  useEffect(() => {
    if (emAssistente || !estadoSigla) return;
    setCarregandoCidades(true);
    listarCidadesPorEstado(estadoSigla)
      .then((lista) => {
        setCidades(lista);
        // Só limpa a cidade quando o usuário troca de estado manualmente, não no carregamento inicial.
        if (carregouEstadoInicial && !lista.includes(cidade)) setCidade("");
        setCarregouEstadoInicial(true);
      })
      .catch(() => setErro("Não foi possível carregar as cidades desse estado."))
      .finally(() => setCarregandoCidades(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoSigla, emAssistente]);

  async function onSelecionarBanner(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErro(null);
    setEnviandoBanner(true);
    try {
      await enviarBannerEvento(id, arquivo, token);
      setVersaoBanner((v) => v + 1);
      setEvento((atual) => (atual ? { ...atual, temBanner: true } : atual));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setEnviandoBanner(false);
      e.target.value = "";
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const payload = emAssistente
        ? {
            descricao: descricao || undefined,
            contatoNome: contatoNome || undefined,
            contatoEmail: contatoEmail || undefined,
            contatoTelefone: contatoTelefone || undefined,
          }
        : {
            nome,
            categoria,
            data: new Date(data).toISOString(),
            dataFim: dataFim ? new Date(dataFim).toISOString() : undefined,
            estado: estadoSigla,
            cidade,
            rua,
            numero,
            complemento: complemento || undefined,
            bairro,
            cep,
            somenteMaioresDeIdade,
            transferivel,
            prazoTransferenciaHoras:
              transferivel && prazoTransferenciaValor
                ? Number(prazoTransferenciaValor) * (prazoTransferenciaUnidade === "dias" ? 24 : 1)
                : null,
            descricao: descricao || undefined,
            contatoNome: contatoNome || undefined,
            contatoEmail: contatoEmail || undefined,
            contatoTelefone: contatoTelefone || undefined,
          };
      await atualizarEvento(id, payload, token);
      iniciar();
      router.push(`/eventos/${id}`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar os detalhes.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="page-shell max-w-2xl">
      <Card className="p-7 sm:p-9">
        <p className="eyebrow"><Sparkles size={12} /> {emAssistente ? "Etapa 4 de 4" : "Configurações"}</p>
        <h1 className="page-title !text-3xl">{emAssistente ? "Banner, descrição e contato" : "Configurações do evento"}</h1>
        <p className="page-description">
          {emAssistente
            ? "Última etapa, e ela é totalmente opcional — você pode preencher tudo isso depois, a qualquer momento, por aqui."
            : "Edite qualquer informação do evento — dados básicos, localização, banner, descrição e contato."}
        </p>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5">
          {!emAssistente && (
            <>
              <Input id="nome" label="Nome do evento" required value={nome} onChange={(e) => setNome(e.target.value)} />
              <Select id="categoria" label="Categoria" required value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaEvento)}>
                {CATEGORIA_EVENTO.map((valor) => (
                  <option key={valor} value={valor}>
                    {ROTULO_CATEGORIA_EVENTO[valor]}
                  </option>
                ))}
              </Select>
              <div className="grid gap-5 sm:grid-cols-2">
                <DateTimeInput idPrefix="data" label="Início" required value={data} onChange={setData} />
                <DateTimeInput idPrefix="dataFim" label="Término (opcional)" minDate={data ? data.split("T")[0] : undefined} value={dataFim} onChange={setDataFim} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Select id="estado" label="Estado" required value={estadoSigla} onChange={(e) => setEstadoSigla(e.target.value)}>
                  <option value="">{estados.length ? "Selecione o estado" : "Carregando..."}</option>
                  {estados.map((estado) => (
                    <option key={estado.sigla} value={estado.sigla}>
                      {estado.nome}
                    </option>
                  ))}
                </Select>
                <Select id="cidade" label="Cidade" required disabled={!estadoSigla || carregandoCidades} value={cidade} onChange={(e) => setCidade(e.target.value)}>
                  <option value="">{carregandoCidades ? "Carregando..." : "Selecione a cidade"}</option>
                  {cidades.map((nomeCidade) => (
                    <option key={nomeCidade} value={nomeCidade}>
                      {nomeCidade}
                    </option>
                  ))}
                  {cidade && !cidades.includes(cidade) && <option value={cidade}>{cidade}</option>}
                </Select>
              </div>
              <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
                <Input id="rua" label="Rua" required value={rua} onChange={(e) => setRua(e.target.value)} />
                <Input id="numero" label="Número" required value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input id="complemento" label="Complemento (opcional)" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
                <Input id="bairro" label="Bairro" required value={bairro} onChange={(e) => setBairro(e.target.value)} />
              </div>
              <Input id="cep" label="CEP" required placeholder="00000-000" value={cep} onChange={(e) => setCep(formatarCep(e.target.value))} />

              <label className="flex items-center gap-3 rounded-xl border border-border/15 bg-background/60 px-4 py-3">
                <input
                  type="checkbox"
                  checked={somenteMaioresDeIdade}
                  onChange={(e) => setSomenteMaioresDeIdade(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm text-foreground">Evento somente para maiores de 18 anos</span>
              </label>

              <div className="rounded-xl border border-border/15 bg-background/60 px-4 py-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={transferivel}
                    onChange={(e) => setTransferivel(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">Permitir que o comprador transfira o ingresso para outra pessoa</span>
                </label>
                {transferivel && (
                  <div className="mt-3">
                    <span className="text-sm font-semibold text-foreground/80">
                      Bloquear transferência a partir de quanto tempo antes do evento (opcional)
                    </span>
                    <div className="mt-2 flex max-w-xs gap-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="Sem limite"
                        value={prazoTransferenciaValor}
                        onChange={(e) => setPrazoTransferenciaValor(e.target.value)}
                        className="h-12 w-28 rounded-xl border border-border/15 bg-background/60 px-4 text-sm text-foreground shadow-inner outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                      <select
                        value={prazoTransferenciaUnidade}
                        onChange={(e) => setPrazoTransferenciaUnidade(e.target.value as "horas" | "dias")}
                        className="h-12 flex-1 rounded-xl border border-border/15 bg-background/60 px-3 text-sm text-foreground shadow-inner outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      >
                        <option value="horas">Horas antes</option>
                        <option value="dias">Dias antes</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border/10 pt-5">
                <label className="group relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/25 bg-background/60">
                  {evento?.temBanner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${urlBannerEvento(id)}?v=${versaoBanner}`}
                      alt="Banner do evento"
                      onClick={(e) => { e.preventDefault(); setBannerAmpliado(true); }}
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-70"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-sm text-muted">
                      <ImagePlus size={22} /> Clique para adicionar o banner do evento
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {enviandoBanner ? "Enviando..." : evento?.temBanner ? "Trocar imagem" : "Enviar imagem"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onSelecionarBanner}
                    disabled={enviandoBanner}
                  />
                </label>
              </div>
            </>
          )}

          {emAssistente && (
            <label className="group relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/25 bg-background/60">
              {evento?.temBanner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${urlBannerEvento(id)}?v=${versaoBanner}`}
                  alt="Banner do evento"
                  onClick={(e) => { e.preventDefault(); setBannerAmpliado(true); }}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-70"
                />
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm text-muted">
                  <ImagePlus size={22} /> Clique para adicionar o banner do evento
                </span>
              )}
              <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {enviandoBanner ? "Enviando..." : evento?.temBanner ? "Trocar imagem" : "Enviar imagem"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onSelecionarBanner}
                disabled={enviandoBanner}
              />
            </label>
          )}

          <Textarea
            id="descricao"
            label="Descrição do evento"
            placeholder="Conte para os compradores o que esperar desse evento..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <Input
            id="contatoNome"
            label="Responsável pelo evento"
            placeholder="Nome de quem responde por esse evento"
            value={contatoNome}
            onChange={(e) => setContatoNome(e.target.value)}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="contatoEmail"
              label="Email de contato"
              type="email"
              value={contatoEmail}
              onChange={(e) => setContatoEmail(e.target.value)}
            />
            <Input
              id="contatoTelefone"
              label="Telefone de contato"
              placeholder="(11) 90000-0000"
              value={contatoTelefone}
              onChange={(e) => setContatoTelefone(formatarTelefone(e.target.value))}
            />
          </div>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <Button type="submit" loading={salvando} className="mt-2 w-full">
            {emAssistente ? "Concluir" : "Salvar"}
          </Button>
        </form>

        {emAssistente && (
          <Link
            href={`/eventos/${id}`}
            onClick={() => iniciar()}
            className="mt-4 block text-center text-sm text-muted hover:text-foreground"
          >
            Concluir depois
          </Link>
        )}
      </Card>
      {bannerAmpliado && evento?.temBanner && (
        <div role="dialog" aria-modal="true" aria-label="Banner do evento em tamanho ampliado" className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-4" onClick={() => setBannerAmpliado(false)}>
          <button type="button" aria-label="Fechar imagem" onClick={() => setBannerAmpliado(false)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"><X size={22} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${urlBannerEvento(id)}?v=${versaoBanner}`} alt="Banner completo do evento" onClick={(e) => e.stopPropagation()} className="max-h-[88vh] max-w-[94vw] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </main>
  );
}
