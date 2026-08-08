import { Inject, Injectable } from "@nestjs/common";
import {
  TAMANHO_MAXIMO_BANNER_BYTES,
  TIPOS_MIME_BANNER_ACEITOS,
  type CriarCupomDescontoInput,
  type CriarEventoInput,
  type CriarLoteInput,
} from "@events-platform/shared-types";
import {
  EVENTO_REPOSITORY,
  type BannerEvento,
  type EventoRepository,
} from "./repository/evento.repository";
import { LOTE_REPOSITORY, type LoteRepository } from "./repository/lote.repository";
import {
  LINK_VENDA_REPOSITORY,
  type LinkVendaRepository,
} from "./repository/link-venda.repository";
import {
  PAPEL_ACESSO_REPOSITORY,
  type PapelAcessoRepository,
} from "./repository/papel-acesso.repository";
import {
  CUPOM_DESCONTO_REPOSITORY,
  type CupomDescontoRepository,
} from "./repository/cupom-desconto.repository";
import { USUARIO_REPOSITORY, type UsuarioRepository } from "../auth/repository/usuario.repository";
import { EventoModel } from "./model/evento.model";
import { LoteModel } from "./model/lote.model";
import { LinkVendaModel } from "./model/link-venda.model";
import { PapelAcessoModel } from "./model/papel-acesso.model";
import { CupomDescontoModel } from "./model/cupom-desconto.model";
import { EventoNaoEncontradoException } from "./exceptions/evento-nao-encontrado.exception";
import { LoteNaoEncontradoException } from "./exceptions/lote-nao-encontrado.exception";
import { UsuarioNaoEncontradoException } from "./exceptions/usuario-nao-encontrado.exception";
import { BannerInvalidoException } from "./exceptions/banner-invalido.exception";
import { CupomNaoEncontradoException } from "./exceptions/cupom-nao-encontrado.exception";

@Injectable()
export class EventsService {
  constructor(
    @Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepository,
    @Inject(LOTE_REPOSITORY) private readonly loteRepository: LoteRepository,
    @Inject(LINK_VENDA_REPOSITORY) private readonly linkVendaRepository: LinkVendaRepository,
    @Inject(PAPEL_ACESSO_REPOSITORY)
    private readonly papelAcessoRepository: PapelAcessoRepository,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository,
    @Inject(CUPOM_DESCONTO_REPOSITORY)
    private readonly cupomDescontoRepository: CupomDescontoRepository,
  ) {}

  async criarEvento(usuarioId: string, input: CriarEventoInput): Promise<EventoModel> {
    const evento = await this.eventoRepository.criar({
      nome: input.nome,
      data: new Date(input.data),
      dataFim: input.dataFim ? new Date(input.dataFim) : undefined,
      cidade: input.cidade,
      estado: input.estado,
      pais: input.pais,
      rua: input.rua,
      numero: input.numero,
      complemento: input.complemento,
      bairro: input.bairro,
      cep: input.cep,
      somenteMaioresDeIdade: input.somenteMaioresDeIdade,
      categoria: input.categoria,
      transferivel: input.transferivel,
      taxaPagaPor: input.taxaPagaPor,
      publicado: input.publicado,
      descricao: input.descricao,
      contatoNome: input.contatoNome,
      contatoEmail: input.contatoEmail,
      contatoTelefone: input.contatoTelefone,
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
      dataFim: input.dataFim ? new Date(input.dataFim) : undefined,
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

  /** Banner salvo como bytes direto no Postgres — ver docs/architecture/04-modelo-de-dados.md. */
  async atualizarBanner(eventoId: string, bytes: Buffer, mimeType: string): Promise<void> {
    await this.buscarEvento(eventoId);
    if (!TIPOS_MIME_BANNER_ACEITOS.includes(mimeType as (typeof TIPOS_MIME_BANNER_ACEITOS)[number])) {
      throw new BannerInvalidoException(
        `Formato de imagem não aceito (use ${TIPOS_MIME_BANNER_ACEITOS.join(", ")}).`,
      );
    }
    if (bytes.byteLength > TAMANHO_MAXIMO_BANNER_BYTES) {
      throw new BannerInvalidoException(
        `Imagem muito grande — o máximo é ${TAMANHO_MAXIMO_BANNER_BYTES / (1024 * 1024)}MB.`,
      );
    }
    await this.eventoRepository.atualizarBanner(eventoId, bytes, mimeType);
  }

  async buscarBanner(eventoId: string): Promise<BannerEvento | null> {
    return this.eventoRepository.buscarBanner(eventoId);
  }

  async criarCupom(eventoId: string, input: CriarCupomDescontoInput): Promise<CupomDescontoModel> {
    await this.buscarEvento(eventoId);
    return this.cupomDescontoRepository.criar({ eventoId, ...input });
  }

  async listarCupons(eventoId: string): Promise<CupomDescontoModel[]> {
    await this.buscarEvento(eventoId);
    return this.cupomDescontoRepository.listarPorEvento(eventoId);
  }

  async atualizarCupom(eventoId: string, cupomId: string, ativo: boolean): Promise<CupomDescontoModel> {
    const cupom = await this.cupomDescontoRepository.buscarPorId(cupomId);
    if (!cupom || cupom.eventoId !== eventoId) {
      throw new CupomNaoEncontradoException();
    }
    return this.cupomDescontoRepository.atualizarAtivo(cupomId, ativo);
  }

  async removerCupom(eventoId: string, cupomId: string): Promise<void> {
    const cupom = await this.cupomDescontoRepository.buscarPorId(cupomId);
    if (!cupom || cupom.eventoId !== eventoId) {
      throw new CupomNaoEncontradoException();
    }
    await this.cupomDescontoRepository.remover(cupomId);
  }
}
