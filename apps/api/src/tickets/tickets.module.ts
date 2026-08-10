import { Module } from "@nestjs/common";
import { EventsModule } from "../events/events.module";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../infra/mail/mail.module";
import { MeusIngressosController, TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";
import { ParticipantesService } from "./participantes.service";
import { IngressoMapper } from "./mapper/ingresso.mapper";
import { ReservaMapper } from "./mapper/reserva.mapper";
import { INGRESSO_REPOSITORY } from "./repository/ingresso.repository";
import { PrismaIngressoRepository } from "./repository/prisma-ingresso.repository";
import { RESERVA_REPOSITORY } from "./repository/reserva.repository";
import { PrismaReservaRepository } from "./repository/prisma-reserva.repository";
import { ReservasPublicasController } from "./reservas-publicas.controller";

@Module({
  imports: [EventsModule, AuthModule, MailModule],
  controllers: [TicketsController, MeusIngressosController, ReservasPublicasController],
  providers: [
    TicketsService,
    ParticipantesService,
    IngressoMapper,
    ReservaMapper,
    { provide: INGRESSO_REPOSITORY, useClass: PrismaIngressoRepository },
    { provide: RESERVA_REPOSITORY, useClass: PrismaReservaRepository },
  ],
})
export class TicketsModule {}
