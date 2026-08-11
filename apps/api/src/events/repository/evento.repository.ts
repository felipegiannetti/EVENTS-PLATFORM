import type { CategoriaEvento, TaxaPagaPor } from "@events-platform/shared-types";
import type { EventoModel } from "../model/evento.model";

export const EVENTO_REPOSITORY = Symbol("EVENTO_REPOSITORY");

export interface CriarEventoData {
  organizadorId: string;
  nome: string;
  data: Date;
  dataFim?: Date;
  cidade: string;
  estado: string;
  pais: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  somenteMaioresDeIdade: boolean;
  categoria: CategoriaEvento;
  transferivel: boolean;
  prazoTransferenciaHoras?: number | null;
  taxaPagaPor: TaxaPagaPor;
  publicado: boolean;
  descricao?: string;
  contatoNome?: string;
  contatoEmail?: string;
  contatoTelefone?: string;
}

export type AtualizarEventoData = Partial<Omit<CriarEventoData, "organizadorId">>;

export interface BannerEvento {
  bytes: Buffer;
  mimeType: string;
}

export interface EventoRepository {
  criar(data: CriarEventoData): Promise<EventoModel>;
  buscarPorId(id: string): Promise<EventoModel | null>;
  atualizar(id: string, data: AtualizarEventoData): Promise<EventoModel>;
  listarPorUsuario(usuarioId: string): Promise<EventoModel[]>;
  listarPublicos(): Promise<EventoModel[]>;
  /** Bytes salvos direto no Postgres (bytea) — não em storage externo. Ver docs/architecture/04-modelo-de-dados.md. */
  atualizarBanner(id: string, bytes: Buffer, mimeType: string): Promise<void>;
  buscarBanner(id: string): Promise<BannerEvento | null>;
}
