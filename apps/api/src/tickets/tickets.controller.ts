import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { EventRoleGuard } from "../security/guards/event-role.guard";
import { EventRoles } from "../security/decorators/roles.decorator";
import { TicketsService } from "./tickets.service";
import { IngressoMapper } from "./mapper/ingresso.mapper";
import { EmitirIngressoDto } from "./dto/emitir-ingresso.dto";

const PAPEIS_LEITURA = ["owner", "gestor", "view", "checkin_operator"] as const;
const PAPEIS_EDICAO = ["owner", "gestor"] as const;

/**
 * Rotas aninhadas em /events/:id (em vez de /tickets/:id soltas) porque o EventRoleGuard
 * precisa do eventoId na própria rota para checar o papel do usuário naquele evento.
 */
@Controller("events/:id")
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
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
    const ingresso = await this.ticketsService.emitir(eventoId, loteId, dto.linkVendaId);
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
  async buscar(@Param("ticketId") ticketId: string) {
    const ingresso = await this.ticketsService.buscar(ticketId);
    return this.ingressoMapper.toResponse(ingresso);
  }

  @UseGuards(EventRoleGuard)
  @EventRoles(...PAPEIS_EDICAO)
  @Patch("ingressos/:ticketId/status")
  async cancelar(@Param("ticketId") ticketId: string) {
    const ingresso = await this.ticketsService.cancelar(ticketId);
    return this.ingressoMapper.toResponse(ingresso);
  }
}
