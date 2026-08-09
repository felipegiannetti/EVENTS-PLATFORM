"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, CalendarDays, MapPin, Search, SlidersHorizontal, Sparkles, X,
} from "lucide-react";
import {
  CATEGORIA_EVENTO,
  formatarLocalizacaoEvento,
  ROTULO_CATEGORIA_EVENTO,
  type CategoriaEvento,
  type EventoResponse,
} from "@events-platform/shared-types";
import { listarEventosPublicos, urlBannerEvento } from "@/lib/events-client";
import { LocationFilterModal } from "@/components/location-filter-modal";

const categoryImages: Record<CategoriaEvento, string> = {
  shows: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85",
  festivais: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85",
  negocios: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=85",
  esportes: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=85",
  cursos: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=85",
  tecnologia: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=85",
  outros: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85",
};

type Ordenacao = "data_asc" | "data_desc" | "nome";

function dataLocalParaFiltro(valor: string): string {
  const data = new Date(valor);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export default function TodosEventosPage() {
  return <Suspense fallback={<CatalogSkeleton />}><CatalogoEventos /></Suspense>;
}

function CatalogoEventos() {
  const params = useSearchParams();
  const categoriaParam = params.get("categoria");
  const categoriaInicial = CATEGORIA_EVENTO.includes(categoriaParam as CategoriaEvento)
    ? categoriaParam as CategoriaEvento
    : "";
  const [eventos, setEventos] = useState<EventoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState(params.get("q") ?? "");
  const [categoria, setCategoria] = useState<CategoriaEvento | "">(categoriaInicial);
  const [localizacao, setLocalizacao] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("data_asc");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listarEventosPublicos().then(setEventos).catch(() => setEventos([])).finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (params.get("foco") === "busca") searchRef.current?.focus();
  }, [params]);

  const categoriasDisponiveis = useMemo(() => CATEGORIA_EVENTO.map((item) => ({
    valor: item,
    quantidade: eventos.filter((evento) => evento.categoria === item).length,
  })).filter((item) => item.quantidade > 0), [eventos]);

  const localizacoesDisponiveis = useMemo(() => Array.from(new Set(
    eventos
      .filter((evento) => evento.cidade && evento.estado && evento.pais)
      .map(formatarLocalizacaoEvento),
  )).sort((a, b) => a.localeCompare(b, "pt-BR")), [eventos]);

  const eventosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return eventos
      .filter((evento) => {
        const localizacaoEvento = formatarLocalizacaoEvento(evento);
        const correspondeBusca = !termo || `${evento.nome} ${localizacaoEvento}`.toLocaleLowerCase("pt-BR").includes(termo);
        const correspondeCategoria = !categoria || evento.categoria === categoria;
        const correspondeLocal = !localizacao || localizacaoEvento === localizacao;
        const correspondeData = !dataSelecionada || dataLocalParaFiltro(evento.data) === dataSelecionada;
        return correspondeBusca && correspondeCategoria && correspondeLocal && correspondeData;
      })
      .sort((a, b) => ordenacao === "nome" ? a.nome.localeCompare(b.nome, "pt-BR") : ordenacao === "data_desc" ? new Date(b.data).getTime() - new Date(a.data).getTime() : new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [busca, categoria, dataSelecionada, eventos, localizacao, ordenacao]);

  const filtrosAtivos = Boolean(busca || categoria || localizacao || dataSelecionada || ordenacao !== "data_asc");
  function limparFiltros() { setBusca(""); setCategoria(""); setLocalizacao(""); setDataSelecionada(""); setOrdenacao("data_asc"); searchRef.current?.focus(); }

  return (
    <main className="page-shell min-h-[70vh]">
      <div className="mx-auto max-w-6xl">
        <span className="eyebrow"><Sparkles size={12} /> Catálogo RARO Tickets</span>
        <h1 className="page-title">Todos os eventos</h1>
        <p className="page-description">Encontre experiências por nome, cidade, estado, país, categoria ou data.</p>

        <div className="mt-8 rounded-[1.6rem] border border-border/10 bg-card p-2 shadow-card">
          <div className="search-shell flex items-center gap-2 rounded-2xl border border-transparent bg-[#f0eff7] px-3 sm:px-5">
            <Search size={22} className="shrink-0 text-muted" />
            <input ref={searchRef} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar eventos por nome ou cidade..." aria-label="Buscar eventos por nome ou cidade" className="h-16 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted/70" />
            {busca && <button onClick={() => setBusca("")} aria-label="Limpar busca" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-white hover:text-foreground"><X size={17} /></button>}
            <button aria-label="Pesquisar" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-glow"><ArrowRight size={21} /></button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border/10 bg-card/80 p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-semibold text-foreground"><SlidersHorizontal size={17} className="text-primary" /> Filtros</p>{filtrosAtivos && <button onClick={limparFiltros} className="text-xs font-semibold text-primary hover:underline">Limpar tudo</button>}</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5 text-xs font-semibold text-muted"><span>Categoria</span><select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaEvento | "")} className="h-11 w-full rounded-xl border border-border/15 bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary"><option value="">Todas as categorias</option>{categoriasDisponiveis.map(({ valor, quantidade }) => <option key={valor} value={valor}>{ROTULO_CATEGORIA_EVENTO[valor]} ({quantidade})</option>)}</select></label>
            <label className="space-y-1.5 text-xs font-semibold text-muted"><span>Cidade, estado e país</span><LocationFilterModal localizacoes={localizacoesDisponiveis} valor={localizacao} onSelecionar={setLocalizacao} /></label>
            <label className="space-y-1.5 text-xs font-semibold text-muted"><span>Data do evento</span><input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} className="h-11 w-full rounded-xl border border-border/15 bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary" /></label>
            <label className="space-y-1.5 text-xs font-semibold text-muted"><span>Ordenar por</span><select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as Ordenacao)} className="h-11 w-full rounded-xl border border-border/15 bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary"><option value="data_asc">Data mais próxima</option><option value="data_desc">Data mais distante</option><option value="nome">Nome do evento</option></select></label>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between"><h2 className="section-title">{categoria ? ROTULO_CATEGORIA_EVENTO[categoria] : "Eventos encontrados"}</h2><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{eventosFiltrados.length} {eventosFiltrados.length === 1 ? "resultado" : "resultados"}</span></div>

        {carregando ? <CatalogSkeleton compact /> : eventosFiltrados.length > 0 ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{eventosFiltrados.map((evento) => <EventCard key={evento.id} evento={evento} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-6 py-14 text-center"><Search className="mx-auto text-primary" size={28} /><h3 className="mt-4 font-semibold text-foreground">Nenhum evento encontrado</h3><p className="mt-2 text-sm text-muted">Tente remover um filtro ou usar outro termo de busca.</p>{filtrosAtivos && <button onClick={limparFiltros} className="mt-5 text-sm font-semibold text-primary hover:underline">Limpar filtros</button>}</div>}
      </div>
    </main>
  );
}

function EventCard({ evento }: { evento: EventoResponse }) {
  const date = new Date(evento.data);
  const imagemFundo = evento.temBanner ? urlBannerEvento(evento.id) : categoryImages[evento.categoria];
  return <Link href={`/e/${evento.id}`} className="group block overflow-hidden rounded-2xl border border-border/10 bg-card shadow-card transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-glow"><div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${imagemFundo})` }}>{/* evento.temBanner: imagem própria salva como bytes no banco; senão foto de estoque por categoria */}<div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-900">{ROTULO_CATEGORIA_EVENTO[evento.categoria]}</span></div><div className="p-5"><h3 className="text-lg font-semibold tracking-tight text-foreground">{evento.nome}</h3><p className="mt-4 flex items-center gap-2 text-sm text-muted"><CalendarDays size={15} className="text-primary" />{date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p><p className="mt-2 flex items-center gap-2 text-sm text-muted"><MapPin size={15} className="text-primary" />{formatarLocalizacaoEvento(evento)}</p></div></Link>;
}

function CatalogSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={`${compact ? "mt-6" : "page-shell"} grid gap-5 sm:grid-cols-2 lg:grid-cols-4`}>{[1, 2, 3, 4].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-card shadow-card" />)}</div>;
}
