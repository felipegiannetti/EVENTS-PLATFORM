import { Body, Controller, Get, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
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
@ApiTags("tickets")
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
  @Get("checkin/leituras")
  listarLeiturasCheckin(@Param("id") eventoId: string) {
    return this.ticketsService.listarLeiturasCheckin(eventoId);
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

  /** Reservas de 15min que nunca viraram ingresso — quem chegou perto de comprar e desistiu. */
  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_LEITURA)
  @Get("carrinho-abandonado")
  async carrinhoAbandonado(@Param("id") eventoId: string) {
    return this.ticketsService.listarCarrinhoAbandonado(eventoId);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_LEITURA)
  @Get("carrinho-abandonado/csv")
  async exportarCarrinhoAbandonadoCsv(@Param("id") eventoId: string, @Res() res: Response) {
    const csv = await this.ticketsService.gerarCsvCarrinhoAbandonado(eventoId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="carrinho-abandonado-${eventoId}.csv"`);
    res.send(csv);
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

  /** Transferências que outras pessoas enviaram pra esse usuário e ainda esperam aceite dele. */
  @Get("recebidas")
  async transferenciasRecebidas(@CurrentUser() usuario: AuthenticatedUser) {
    const ingressos = await this.ticketsService.listarTransferenciasRecebidas(usuario.id);
    return ingressos.map((ingresso) => this.ingressoMapper.toMeuIngressoResponse(ingresso));
  }

  /** Só inicia — o ingresso vai pra 'aguardando_aceite', não muda de dono até o destinatário aceitar. */
  @Post(":ticketId/transferir")
  async transferir(
    @Param("ticketId") ticketId: string,
    @Body() dto: TransferirIngressoDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    await this.ticketsService.iniciarTransferencia(ticketId, usuario.id, dto.destinatarioEmail);
    return { iniciada: true };
  }

  /** Remetente desiste antes do aceite — volta pra carteira de quem enviou. */
  @Post(":ticketId/transferir/cancelar")
  async cancelarTransferencia(@Param("ticketId") ticketId: string, @CurrentUser() usuario: AuthenticatedUser) {
    await this.ticketsService.cancelarTransferencia(ticketId, usuario.id);
    return { cancelada: true };
  }

  /** Destinatário aceita — só agora o ingresso muda de dono de verdade. */
  @Post(":ticketId/aceitar")
  async aceitarTransferencia(@Param("ticketId") ticketId: string, @CurrentUser() usuario: AuthenticatedUser) {
    const ingresso = await this.ticketsService.aceitarTransferencia(ticketId, usuario.id);
    return this.ingressoMapper.toResponse(ingresso);
  }

  /** Destinatário recusa — mesmo efeito de cancelarTransferencia, mas iniciado por quem recebeu. */
  @Post(":ticketId/recusar")
  async recusarTransferencia(@Param("ticketId") ticketId: string, @CurrentUser() usuario: AuthenticatedUser) {
    await this.ticketsService.recusarTransferencia(ticketId, usuario.id);
    return { recusada: true };
  }

  @Post(":ticketId/cancelar")
  async cancelar(@Param("ticketId") ticketId: string, @CurrentUser() usuario: AuthenticatedUser) {
    await this.ticketsService.cancelarSeProprio(ticketId, usuario.id);
    return { cancelado: true };
  }
}
