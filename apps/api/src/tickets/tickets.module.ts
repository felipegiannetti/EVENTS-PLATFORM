import { Module } from "@nestjs/common";
import { EventsModule } from "../events/events.module";
import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";
import { IngressoMapper } from "./mapper/ingresso.mapper";
import { INGRESSO_REPOSITORY } from "./repository/ingresso.repository";
import { PrismaIngressoRepository } from "./repository/prisma-ingresso.repository";

@Module({
  imports: [EventsModule],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    IngressoMapper,
    { provide: INGRESSO_REPOSITORY, useClass: PrismaIngressoRepository },
  ],
})
export class TicketsModule {}
