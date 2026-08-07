import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { EventRoleGuard } from "../security/guards/event-role.guard";
import { EventRoles } from "../security/decorators/roles.decorator";
import { CurrentUser } from "../security/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../security/types/authenticated-request";
import { EventsService } from "./events.service";
import { EventoMapper } from "./mapper/evento.mapper";
import { LoteMapper } from "./mapper/lote.mapper";
import { LinkVendaMapper } from "./mapper/link-venda.mapper";
import { PapelAcessoMapper } from "./mapper/papel-acesso.mapper";
import { CriarEventoDto } from "./dto/criar-evento.dto";
import { AtualizarEventoDto } from "./dto/atualizar-evento.dto";
import { AtualizarLoteDto, CriarLoteDto } from "./dto/criar-lote.dto";
import { CriarLinkVendaDto } from "./dto/criar-link-venda.dto";
import { ConvidarAcessoDto } from "./dto/convidar-acesso.dto";

const PAPEIS_LEITURA = ["owner", "gestor", "view", "checkin_operator"] as const;
const PAPEIS_EDICAO = ["owner", "gestor"] as const;

@Controller("events")
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventoMapper: EventoMapper,
    private readonly loteMapper: LoteMapper,
    private readonly linkVendaMapper: LinkVendaMapper,
    private readonly papelAcessoMapper: PapelAcessoMapper,
  ) {}

  @Post()
  async criar(@Body() dto: CriarEventoDto, @CurrentUser() usuario: AuthenticatedUser) {
    const evento = await this.eventsService.criarEvento(usuario.id, dto);
    return this.eventoMapper.toResponse(evento);
  }

  @Get()
  async listar(@CurrentUser() usuario: AuthenticatedUser) {
    const eventos = await this.eventsService.listarEventosDoUsuario(usuario.id);
    return eventos.map((evento) => this.eventoMapper.toResponse(evento));
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_LEITURA)
  @Get(":id")
  async buscar(@Param("id") id: string) {
    const evento = await this.eventsService.buscarEvento(id);
    return this.eventoMapper.toResponse(evento);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_EDICAO)
  @Patch(":id")
  async atualizar(@Param("id") id: string, @Body() dto: AtualizarEventoDto) {
    const evento = await this.eventsService.atualizarEvento(id, dto);
    return this.eventoMapper.toResponse(evento);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_LEITURA)
  @Get(":id/lotes")
  async listarLotes(@Param("id") id: string) {
    const lotes = await this.eventsService.listarLotes(id);
    return lotes.map((lote) => this.loteMapper.toResponse(lote));
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_EDICAO)
  @Post(":id/lotes")
  async criarLote(@Param("id") id: string, @Body() dto: CriarLoteDto) {
    const lote = await this.eventsService.criarLote(id, dto);
    return this.loteMapper.toResponse(lote);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_EDICAO)
  @Patch(":id/lotes/:loteId")
  async atualizarLote(
    @Param("id") id: string,
    @Param("loteId") loteId: string,
    @Body() dto: AtualizarLoteDto,
  ) {
    const lote = await this.eventsService.atualizarLote(id, loteId, dto);
    return this.loteMapper.toResponse(lote);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_LEITURA)
  @Get(":id/links-venda")
  async listarLinksVenda(@Param("id") id: string) {
    const links = await this.eventsService.listarLinksVenda(id);
    return links.map((link) => this.linkVendaMapper.toResponse(link));
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_EDICAO)
  @Post(":id/links-venda")
  async criarLinkVenda(@Param("id") id: string, @Body() dto: CriarLinkVendaDto) {
    const link = await this.eventsService.criarLinkVenda(id, dto.slug, dto.origem);
    return this.linkVendaMapper.toResponse(link);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles("owner")
  @Get(":id/acesso")
  async listarAcessos(@Param("id") id: string) {
    const acessos = await this.eventsService.listarAcessos(id);
    return acessos.map((acesso) => this.papelAcessoMapper.toResponse(acesso));
  }

  @UseGuards(EventRoleGuard)
  @EventRoles("owner")
  @Post(":id/acesso")
  async convidarAcesso(@Param("id") id: string, @Body() dto: ConvidarAcessoDto) {
    const acesso = await this.eventsService.convidarAcesso(id, dto.usuarioEmail, dto.papel);
    return this.papelAcessoMapper.toResponse(acesso);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles("owner")
  @Delete(":id/acesso/:usuarioId")
  async removerAcesso(@Param("id") id: string, @Param("usuarioId") usuarioId: string) {
    await this.eventsService.removerAcesso(id, usuarioId);
  }
}
