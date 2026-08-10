import { Body, Controller, Get, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { EventRoleGuard } from "../security/guards/event-role.guard";
import { EventRoles } from "../security/decorators/roles.decorator";
import { CurrentUser } from "../security/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../security/types/authenticated-request";
import { TicketsService } from "./tickets.service";
import { ParticipantesService } from "./participantes.service";
import { IngressoMapper } from "./mapper/ingresso.mapper";
import { EmitirIngressoDto } from "./dto/emitir-ingresso.dto";
import { AtualizarIngressoDto } from "./dto/atualizar-ingresso.dto";
import { CheckinDto } from "./dto/checkin.dto";
import { EnviarEmailParticipantesDto } from "./dto/enviar-email-participantes.dto";
import { TransferirIngressoDto } from "./dto/transferir-ingresso.dto";

const PAPEIS_LEITURA = ["owner", "gestor", "view", "checkin_operator"] as const;
const PAPEIS_EDICAO = ["owner", "gestor"] as const;
const PAPEIS_CHECKIN = ["owner", "gestor", "checkin_operator"] as const;

/**
 * Rotas aninhadas em /events/:id (em vez de /tickets/:id soltas) porque o EventRoleGuard
 * precisa do eventoId na própria rota para checar o papel do usuário naquele evento.
 */
@Controller("events/:id")
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly participantesService: ParticipantesService,
    private readonly ingressoMapper: IngressoMapper,
  ) {}

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_EDICAO)
  @Post("lotes/:loteId/ingressos")
  async emitir(
    @Param("id") eventoId: string,
    @Param("loteId") loteId: string,
    @Body() dto: EmitirIngressoDto,
  ) {
    const ingresso = await this.ticketsService.emitir(eventoId, loteId, dto);
    return this.ingressoMapper.toResponse(ingresso);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_LEITURA)
  @Get("ingressos")
  async listar(@Param("id") eventoId: string) {
    const ingressos = await this.ticketsService.listarPorEvento(eventoId);
    return ingressos.map((ingresso) => this.ingressoMapper.toResponse(ingresso));
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_LEITURA)
  @Get("ingressos/:ticketId")
  async buscar(@Param("id") eventoId: string, @Param("ticketId") ticketId: string) {
    const ingresso = await this.ticketsService.buscarDoEvento(eventoId, ticketId);
    return this.ingressoMapper.toResponse(ingresso);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_EDICAO)
  @Patch("ingressos/:ticketId/status")
  async cancelar(@Param("id") eventoId: string, @Param("ticketId") ticketId: string) {
    const ingresso = await this.ticketsService.cancelar(eventoId, ticketId);
    return this.ingressoMapper.toResponse(ingresso);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_EDICAO)
  @Patch("ingressos/:ticketId")
  async atualizar(@Param("id") eventoId: string, @Param("ticketId") ticketId: string, @Body() dto: AtualizarIngressoDto) {
    const ingresso = await this.ticketsService.atualizar(eventoId, ticketId, dto);
    return this.ingressoMapper.toResponse(ingresso);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_EDICAO)
  @Post("ingressos/:ticketId/reenviar")
  async reenviar(@Param("id") eventoId: string, @Param("ticketId") ticketId: string) {
    await this.ticketsService.reenviarEmail(eventoId, ticketId);
    return { enviado: true };
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_CHECKIN)
  @Post("checkin")
  async checkin(@Param("id") eventoId: string, @Body() dto: CheckinDto) {
    const ingresso = await this.ticketsService.checkin(eventoId, dto.qrToken);
    return this.ingressoMapper.toResponse(ingresso);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_LEITURA)
  @Get("participantes/csv")
  async exportarParticipantesCsv(@Param("id") eventoId: string, @Res() res: Response) {
    const csv = await this.participantesService.gerarCsvParticipantes(eventoId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="participantes-${eventoId}.csv"`);
    res.send(csv);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_EDICAO)
  @Post("participantes/email")
  async enviarEmailParticipantes(@Param("id") eventoId: string, @Body() dto: EnviarEmailParticipantesDto) {
    return this.participantesService.enviarEmailParticipantes(eventoId, dto.mensagem);
  }
}

/** Fora de /events/:id de propósito — é uma listagem cross-evento a partir do email do usuário logado, não algo escopado a um evento específico. */
@Controller("tickets")
export class MeusIngressosController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly ingressoMapper: IngressoMapper,
  ) {}

  @Get("meus")
  async meusIngressos(@CurrentUser() usuario: AuthenticatedUser) {
    const ingressos = await this.ticketsService.listarPorCompradorEmail(usuario.email);
    return ingressos.map((ingresso) => this.ingressoMapper.toMeuIngressoResponse(ingresso));
  }

  @Post(":ticketId/transferir")
  async transferir(
    @Param("ticketId") ticketId: string,
    @Body() dto: TransferirIngressoDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    await this.ticketsService.transferir(ticketId, usuario.id, dto.destinatarioEmail);
    return { transferido: true };
  }

  @Post(":ticketId/cancelar")
  async cancelar(@Param("ticketId") ticketId: string, @CurrentUser() usuario: AuthenticatedUser) {
    await this.ticketsService.cancelarSeProprio(ticketId, usuario.id);
    return { cancelado: true };
  }
}
