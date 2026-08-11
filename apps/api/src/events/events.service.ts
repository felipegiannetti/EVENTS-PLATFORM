import { Inject, Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import {
  TAMANHO_MAXIMO_BANNER_BYTES,
  TIPOS_MIME_BANNER_ACEITOS,
  type AtualizarCupomDescontoInput,
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
import { CupomComUsosException } from "./exceptions/cupom-com-usos.exception";
import { SenhaCupomInvalidaException } from "./exceptions/senha-cupom-invalida.exception";
import { QuantidadeLoteInvalidaException } from "./exceptions/quantidade-lote-invalida.exception";
import { PrismaService } from "../infra/prisma/prisma.service";
import type { UsuarioAcessoSugestao } from "@events-platform/shared-types";

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
    private readonly prisma: PrismaService,
  ) {}

  async criarEvento(usuarioId: string, input: CriarEventoInput): Promise<EventoModel> {
    const evento = await this.eventoRepository.criar({
      organizadorId: usuarioId,
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
      prazoTransferenciaHoras: input.prazoTransferenciaHoras,
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

  /** Página pública do evento (compradores) — só existe se `publicado`, senão é como se não existisse (mesmo 404 de um id inválido, não vaza que o evento existe mas está privado). */
  async buscarEventoPublico(eventoId: string): Promise<EventoModel> {
    const evento = await this.eventoRepository.buscarPorId(eventoId);
    if (!evento || !evento.publicado) {
      throw new EventoNaoEncontradoException();
    }
    return evento;
  }

  /** Usado pela página pública do evento pra mostrar "cupom aplicado" sem inventar — valida de verdade contra os cupons cadastrados. */
  async validarCupomPublico(eventoId: string, codigo: string): Promise<CupomDescontoModel> {
    await this.buscarEventoPublico(eventoId);
    const cupons = await this.cupomDescontoRepository.listarPorEvento(eventoId);
    const cupom = cupons.find((c) => c.codigo === codigo.toUpperCase() && c.ativo);
    if (!cupom) {
      throw new CupomNaoEncontradoException();
    }
    return cupom;
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
    if (input.quantidade !== undefined && input.quantidade < lote.quantidadeEmitida) {
      throw new QuantidadeLoteInvalidaException(lote.quantidadeEmitida);
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

  async buscarUsuariosParaAcesso(eventoId: string, busca: string): Promise<UsuarioAcessoSugestao[]> {
    await this.buscarEvento(eventoId);
    const termo = busca.trim();
    if (termo.length < 2) return [];
    return this.prisma.usuario.findMany({
      where: {
        email: { contains: termo, mode: "insensitive" },
        papeisAcesso: { none: { eventoId } },
      },
      orderBy: { email: "asc" },
      take: 8,
      select: { id: true, nome: true, email: true },
    });
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
    const { senha, ...dados } = input;
    const senhaHash = senha ? await argon2.hash(senha, { type: argon2.argon2id }) : undefined;
    return this.cupomDescontoRepository.criar({ eventoId, ...dados, senhaHash });
  }

  async listarCupons(eventoId: string): Promise<CupomDescontoModel[]> {
    await this.buscarEvento(eventoId);
    return this.cupomDescontoRepository.listarPorEvento(eventoId);
  }

  async atualizarCupom(eventoId: string, cupomId: string, input: AtualizarCupomDescontoInput): Promise<CupomDescontoModel> {
    const cupom = await this.cupomDescontoRepository.buscarPorId(cupomId);
    if (!cupom || cupom.eventoId !== eventoId) {
      throw new CupomNaoEncontradoException();
    }
    const { senha, ...dados } = input;
    // Senha ausente na edição = mantém o hash já salvo — só troca se uma nova senha for enviada.
    const senhaHash = senha ? await argon2.hash(senha, { type: argon2.argon2id }) : undefined;
    return this.cupomDescontoRepository.atualizar(cupomId, { ...dados, senhaHash });
  }

  /** Desbloqueio público de um cupom especial — comprador digita a senha na página do evento. */
  async desbloquearCupom(eventoId: string, codigo: string, senha: string): Promise<CupomDescontoModel> {
    const cupom = await this.validarCupomPublico(eventoId, codigo);
    if (!cupom.especial || !cupom.senhaHash) {
      // Cupom normal não tem senha pra "desbloquear" — trata como já desbloqueado.
      return cupom;
    }
    const senhaValida = await argon2.verify(cupom.senhaHash, senha);
    if (!senhaValida) {
      throw new SenhaCupomInvalidaException();
    }
    return cupom;
  }

  async removerCupom(eventoId: string, cupomId: string): Promise<void> {
    const cupom = await this.cupomDescontoRepository.buscarPorId(cupomId);
    if (!cupom || cupom.eventoId !== eventoId) {
      throw new CupomNaoEncontradoException();
    }
    if (cupom.usos > 0) {
      throw new CupomComUsosException();
    }
    await this.cupomDescontoRepository.remover(cupomId);
  }
}
