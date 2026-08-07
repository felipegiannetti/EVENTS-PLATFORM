import { Injectable } from "@nestjs/common";
import type { LinkVenda } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { LinkVendaModel } from "../model/link-venda.model";
import type { CriarLinkVendaData, LinkVendaRepository } from "./link-venda.repository";

@Injectable()
export class PrismaLinkVendaRepository implements LinkVendaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarLinkVendaData): Promise<LinkVendaModel> {
    const link = await this.prisma.linkVenda.create({ data });
    return this.toModel(link);
  }

  async buscarPorId(id: string): Promise<LinkVendaModel | null> {
    const link = await this.prisma.linkVenda.findUnique({ where: { id } });
    return link ? this.toModel(link) : null;
  }

  async listarPorEvento(eventoId: string): Promise<LinkVendaModel[]> {
    const links = await this.prisma.linkVenda.findMany({
      where: { eventoId },
      orderBy: { criadoEm: "asc" },
    });
    return links.map((link) => this.toModel(link));
  }

  private toModel(link: LinkVenda): LinkVendaModel {
    return new LinkVendaModel(link.id, link.eventoId, link.slug, link.origem);
  }
}
