"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ImagePlus, Sparkles } from "lucide-react";
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

  // Banner, descrição e contato — sempre editáveis (etapa opcional do assistente ou Configurações)
  const [descricao, setDescricao] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [contatoEmail, setContatoEmail] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");

  const [enviandoBanner, setEnviandoBanner] = useState(false);
  const [versaoBanner, setVersaoBanner] = useState(0);
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

              <div className="border-t border-border/10 pt-5">
                <label className="group relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/25 bg-background/60">
                  {evento?.temBanner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${urlBannerEvento(id)}?v=${versaoBanner}`}
                      alt="Banner do evento"
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
    </main>
  );
}
