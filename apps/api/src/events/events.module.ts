import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { EventoMapper } from "./mapper/evento.mapper";
import { LoteMapper } from "./mapper/lote.mapper";
import { LinkVendaMapper } from "./mapper/link-venda.mapper";
import { PapelAcessoMapper } from "./mapper/papel-acesso.mapper";
import { CupomDescontoMapper } from "./mapper/cupom-desconto.mapper";
import { EVENTO_REPOSITORY } from "./repository/evento.repository";
import { PrismaEventoRepository } from "./repository/prisma-evento.repository";
import { LOTE_REPOSITORY } from "./repository/lote.repository";
import { PrismaLoteRepository } from "./repository/prisma-lote.repository";
import { LINK_VENDA_REPOSITORY } from "./repository/link-venda.repository";
import { PrismaLinkVendaRepository } from "./repository/prisma-link-venda.repository";
import { PAPEL_ACESSO_REPOSITORY } from "./repository/papel-acesso.repository";
import { PrismaPapelAcessoRepository } from "./repository/prisma-papel-acesso.repository";
import { CUPOM_DESCONTO_REPOSITORY } from "./repository/cupom-desconto.repository";
import { PrismaCupomDescontoRepository } from "./repository/prisma-cupom-desconto.repository";

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventoMapper,
    LoteMapper,
    LinkVendaMapper,
    PapelAcessoMapper,
    CupomDescontoMapper,
    { provide: EVENTO_REPOSITORY, useClass: PrismaEventoRepository },
    { provide: LOTE_REPOSITORY, useClass: PrismaLoteRepository },
    { provide: LINK_VENDA_REPOSITORY, useClass: PrismaLinkVendaRepository },
    { provide: PAPEL_ACESSO_REPOSITORY, useClass: PrismaPapelAcessoRepository },
    { provide: CUPOM_DESCONTO_REPOSITORY, useClass: PrismaCupomDescontoRepository },
  ],
  exports: [PAPEL_ACESSO_REPOSITORY, EVENTO_REPOSITORY, LOTE_REPOSITORY],
})
export class EventsModule {}
