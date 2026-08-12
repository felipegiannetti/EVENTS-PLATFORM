import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Public } from "../security/decorators/public.decorator";
import { TicketsService } from "./tickets.service";
import { ReservaMapper } from "./mapper/reserva.mapper";
import { IngressoMapper } from "./mapper/ingresso.mapper";
import { CriarReservaDto } from "./dto/criar-reserva.dto";
import { ConfirmarReservaDto } from "./dto/confirmar-reserva.dto";

/**
 * Infraestrutura de reserva (hold de 15min) pra quando existir checkout self-service — ver
 * docs/architecture/11-roadmap.md. Público de propósito (o comprador não precisa estar logado pra
 * reservar/confirmar), igual ao padrão já usado pra validação pública de cupom em EventsController.
 * Ainda sem nenhuma tela — só os endpoints, testáveis via API.
 */
@Controller("events/public/:id")
export class ReservasPublicasController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly reservaMapper: ReservaMapper,
    private readonly ingressoMapper: IngressoMapper,
  ) {}

  @Public()
  @Post("lotes/:loteId/reservas")
  async reservar(@Param("id") eventoId: string, @Param("loteId") loteId: string, @Body() dto: CriarReservaDto) {
    const reserva = await this.ticketsService.reservar(eventoId, loteId, dto);
    return this.reservaMapper.toResponse(reserva);
  }

  @Public()
  @Get("reservas/:reservaId")
  async buscar(@Param("id") eventoId: string, @Param("reservaId") reservaId: string) {
    const reserva = await this.ticketsService.buscarReserva(reservaId);
    return this.reservaMapper.toResponse(reserva);
  }

  @Public()
  @Post("reservas/:reservaId/confirmar")
  async confirmar(
    @Param("id") eventoId: string,
    @Param("reservaId") reservaId: string,
    @Body() dto: ConfirmarReservaDto,
  ) {
    const ingresso = await this.ticketsService.confirmarReserva(eventoId, reservaId, dto);
    return this.ingressoMapper.toResponse(ingresso);
  }

  @Public()
  @Post("reservas/:reservaId/cancelar")
  async cancelar(@Param("id") eventoId: string, @Param("reservaId") reservaId: string) {
    await this.ticketsService.cancelarReserva(eventoId, reservaId);
    return { cancelada: true };
  }
}
