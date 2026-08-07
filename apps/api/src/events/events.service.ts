import { Inject, Injectable } from "@nestjs/common";
import type { CriarEventoInput, CriarLoteInput } from "@events-platform/shared-types";
import { EVENTO_REPOSITORY, type EventoRepository } from "./repository/evento.repository";
import { LOTE_REPOSITORY, type LoteRepository } from "./repository/lote.repository";
import {
  LINK_VENDA_REPOSITORY,
  type LinkVendaRepository,
} from "./repository/link-venda.repository";
import {
  PAPEL_ACESSO_REPOSITORY,
  type PapelAcessoRepository,
} from "./repository/papel-acesso.repository";
import { USUARIO_REPOSITORY, type UsuarioRepository } from "../auth/repository/usuario.repository";
import { EventoModel } from "./model/evento.model";
import { LoteModel } from "./model/lote.model";
import { LinkVendaModel } from "./model/link-venda.model";
import { PapelAcessoModel } from "./model/papel-acesso.model";
import { EventoNaoEncontradoException } from "./exceptions/evento-nao-encontrado.exception";
import { LoteNaoEncontradoException } from "./exceptions/lote-nao-encontrado.exception";
import { UsuarioNaoEncontradoException } from "./exceptions/usuario-nao-encontrado.exception";

@Injectable()
export class EventsService {
  constructor(
    @Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepository,
    @Inject(LOTE_REPOSITORY) private readonly loteRepository: LoteRepository,
    @Inject(LINK_VENDA_REPOSITORY) private readonly linkVendaRepository: LinkVendaRepository,
    @Inject(PAPEL_ACESSO_REPOSITORY)
    private readonly papelAcessoRepository: PapelAcessoRepository,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async criarEvento(usuarioId: string, input: CriarEventoInput): Promise<EventoModel> {
    const evento = await this.eventoRepository.criar({
      nome: input.nome,
      data: new Date(input.data),
      cidade: input.cidade,
      estado: input.estado,
      pais: input.pais,
      categoria: input.categoria,
      transferivel: input.transferivel,
      taxaPagaPor: input.taxaPagaPor,
    });
    await this.papelAcessoRepository.criar(usuarioId, evento.id, "owner");
    return evento;
  }

  async listarEventosDoUsuario(usuarioId: string): Promise<EventoModel[]> {
    return this.eventoRepository.listarPorUsuario(usuarioId);
  }

  async listarEventosPublicos(): Promise<EventoModel[]> {
    return this.eventoRepository.listarPublicos();
  }

  async buscarEvento(eventoId: string): Promise<EventoModel> {
    const evento = await this.eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new EventoNaoEncontradoException();
    }
    return evento;
  }

  async atualizarEvento(
    eventoId: string,
    input: Partial<CriarEventoInput>,
  ): Promise<EventoModel> {
    await this.buscarEvento(eventoId);
    return this.eventoRepository.atualizar(eventoId, {
      ...input,
      data: input.data ? new Date(input.data) : undefined,
    });
  }

  async criarLote(eventoId: string, input: CriarLoteInput): Promise<LoteModel> {
    await this.buscarEvento(eventoId);
    return this.loteRepository.criar({ eventoId, ...input });
  }

  async atualizarLote(
    eventoId: string,
    loteId: string,
    input: Partial<CriarLoteInput>,
  ): Promise<LoteModel> {
    const lote = await this.loteRepository.buscarPorId(loteId);
    if (!lote || lote.eventoId !== eventoId) {
      throw new LoteNaoEncontradoException();
    }
    return this.loteRepository.atualizar(loteId, input);
  }

  async listarLotes(eventoId: string): Promise<LoteModel[]> {
    await this.buscarEvento(eventoId);
    return this.loteRepository.listarPorEvento(eventoId);
  }

  async criarLinkVenda(
    eventoId: string,
    slug: string,
    origem: string,
  ): Promise<LinkVendaModel> {
    await this.buscarEvento(eventoId);
    return this.linkVendaRepository.criar({ eventoId, slug, origem });
  }

  async listarLinksVenda(eventoId: string): Promise<LinkVendaModel[]> {
    await this.buscarEvento(eventoId);
    return this.linkVendaRepository.listarPorEvento(eventoId);
  }

  async convidarAcesso(
    eventoId: string,
    usuarioEmail: string,
    papel: PapelAcessoModel["papel"],
  ): Promise<PapelAcessoModel> {
    await this.buscarEvento(eventoId);
    const usuario = await this.usuarioRepository.buscarPorEmail(usuarioEmail);
    if (!usuario) {
      throw new UsuarioNaoEncontradoException();
    }
    return this.papelAcessoRepository.criar(usuario.id, eventoId, papel);
  }

  async removerAcesso(eventoId: string, usuarioId: string): Promise<void> {
    await this.buscarEvento(eventoId);
    await this.papelAcessoRepository.remover(usuarioId, eventoId);
  }

  async listarAcessos(eventoId: string): Promise<PapelAcessoModel[]> {
    await this.buscarEvento(eventoId);
    return this.papelAcessoRepository.listarPorEvento(eventoId);
  }
}
