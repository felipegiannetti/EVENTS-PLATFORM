import { Module } from "@nestjs/common";
import { EventsModule } from "../events/events.module";
import { MailModule } from "../infra/mail/mail.module";
import { MeusIngressosController, TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";
import { ParticipantesService } from "./participantes.service";
import { IngressoMapper } from "./mapper/ingresso.mapper";
import { INGRESSO_REPOSITORY } from "./repository/ingresso.repository";
import { PrismaIngressoRepository } from "./repository/prisma-ingresso.repository";

@Module({
  imports: [EventsModule, MailModule],
  controllers: [TicketsController, MeusIngressosController],
  providers: [
    TicketsService,
    ParticipantesService,
    IngressoMapper,
    { provide: INGRESSO_REPOSITORY, useClass: PrismaIngressoRepository },
  ],
})
export class TicketsModule {}
