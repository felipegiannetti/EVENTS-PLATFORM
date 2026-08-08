import { z } from "zod";
import { CATEGORIA_EVENTO, PAPEL_EVENTO, TAXA_PAGA_POR } from "../enums";

const eventoBaseSchema = z.object({
  nome: z.string().min(2).max(160),
  data: z.string().datetime(),
  /** Opcional — evento sem horário de término definido ainda é válido. Quando informado, tem que ser depois do início. */
  dataFim: z.string().datetime().optional(),
  cidade: z.string().min(2).max(100),
  estado: z.string().min(2).max(100),
  pais: z.string().min(2).max(100),
  /** Endereço detalhado — exibido como "cidade, estado - rua + número + complemento, bairro - CEP: xxxxx-xxx" (ver formatarEnderecoEvento). Só complemento é opcional. */
  rua: z.string().min(2).max(160),
  numero: z.string().min(1).max(20),
  complemento: z.string().max(80).optional(),
  bairro: z.string().min(2).max(100),
  cep: z.string().min(8).max(9),
  /** true = evento restrito a maiores de 18 anos. */
  somenteMaioresDeIdade: z.boolean().default(false),
  categoria: z.enum(CATEGORIA_EVENTO),
  transferivel: z.boolean().default(false),
  taxaPagaPor: z.enum(TAXA_PAGA_POR).default("comprador"),
  /** O evento é criado por completo de qualquer forma — isso só controla se compradores já enxergam ele em GET /events/public. Privado (false) por padrão; o organizador libera quando quiser, e pode voltar a esconder depois. */
  publicado: z.boolean().default(false),
  /** Preenchidos na etapa opcional "banner, descrição e contato" do assistente de criação — nenhum é obrigatório na criação. */
  descricao: z.string().max(5000).optional(),
  contatoNome: z.string().max(160).optional(),
  contatoEmail: z.string().email().optional(),
  contatoTelefone: z.string().max(30).optional(),
});

export const criarEventoSchema = eventoBaseSchema.refine(
  (dados) => !dados.dataFim || new Date(dados.dataFim) > new Date(dados.data),
  { message: "O término deve ser depois do início do evento", path: ["dataFim"] },
);
export type CriarEventoInput = z.infer<typeof criarEventoSchema>;

export const atualizarEventoSchema = eventoBaseSchema.partial();
export type AtualizarEventoInput = z.infer<typeof atualizarEventoSchema>;

export const eventoResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  data: z.string().datetime(),
  dataFim: z.string().datetime().nullable(),
  cidade: z.string().nullable(),
  estado: z.string().nullable(),
  pais: z.string().nullable(),
  rua: z.string().nullable(),
  numero: z.string().nullable(),
  complemento: z.string().nullable(),
  bairro: z.string().nullable(),
  cep: z.string().nullable(),
  somenteMaioresDeIdade: z.boolean(),
  categoria: z.enum(CATEGORIA_EVENTO),
  transferivel: z.boolean(),
  taxaPagaPor: z.enum(TAXA_PAGA_POR),
  publicado: z.boolean(),
  descricao: z.string().nullable(),
  contatoNome: z.string().nullable(),
  contatoEmail: z.string().nullable(),
  contatoTelefone: z.string().nullable(),
  /** Só indica se existe banner cadastrado — os bytes em si vêm de GET /events/:id/banner, nunca no JSON. */
  temBanner: z.boolean(),
  criadoEm: z.string().datetime(),
});
export type EventoResponse = z.infer<typeof eventoResponseSchema>;

export const TAMANHO_MAXIMO_BANNER_BYTES = 5 * 1024 * 1024;
export const TIPOS_MIME_BANNER_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;

export function formatarLocalizacaoEvento(
  evento: Pick<EventoResponse, "cidade" | "estado" | "pais">,
): string {
  const partes = [evento.cidade, evento.estado, evento.pais].filter(
    (parte): parte is string => Boolean(parte?.trim()),
  );
  return partes.length > 0 ? partes.join(", ") : "Localização não informada";
}

/** "cidade, estado - rua + número + complemento, bairro - CEP: xxxxx-xxx" — formato padrão exibido em todo lugar que mostra o endereço completo do evento. */
export function formatarEnderecoEvento(
  evento: Pick<EventoResponse, "cidade" | "estado" | "rua" | "numero" | "complemento" | "bairro" | "cep">,
): string {
  if (!evento.cidade || !evento.estado || !evento.rua || !evento.numero || !evento.bairro || !evento.cep) {
    return formatarLocalizacaoEvento(evento as Parameters<typeof formatarLocalizacaoEvento>[0]);
  }
  const ruaCompleta = [evento.rua, evento.numero, evento.complemento].filter(Boolean).join(" + ");
  return `${evento.cidade}, ${evento.estado} - ${ruaCompleta}, ${evento.bairro} - CEP: ${evento.cep}`;
}

export const convidarAcessoSchema = z.object({
  usuarioEmail: z.string().email(),
  papel: z.enum(PAPEL_EVENTO).exclude(["owner"]),
});
export type ConvidarAcessoInput = z.infer<typeof convidarAcessoSchema>;
