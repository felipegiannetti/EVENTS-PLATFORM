import { Injectable } from "@nestjs/common";
import type { PapelAcesso, PapelEvento, Usuario } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PapelAcessoModel } from "../model/papel-acesso.model";
import type { PapelAcessoRepository } from "./papel-acesso.repository";

type PapelAcessoComUsuario = PapelAcesso & { usuario: Pick<Usuario, "nome" | "email"> };

const INCLUDE_USUARIO = { usuario: { select: { nome: true, email: true } } } as const;

@Injectable()
export class PrismaPapelAcessoRepository implements PapelAcessoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(
    usuarioId: string,
    eventoId: string,
    papel: PapelEvento,
  ): Promise<PapelAcessoModel> {
    const registro = await this.prisma.papelAcesso.upsert({
      where: { usuarioId_eventoId: { usuarioId, eventoId } },
      update: { papel },
      create: { usuarioId, eventoId, papel },
      include: INCLUDE_USUARIO,
    });
    return this.toModel(registro);
  }

  async remover(usuarioId: string, eventoId: string): Promise<void> {
    await this.prisma.papelAcesso.delete({
      where: { usuarioId_eventoId: { usuarioId, eventoId } },
    });
  }

  async buscar(usuarioId: string, eventoId: string): Promise<PapelAcessoModel | null> {
    const registro = await this.prisma.papelAcesso.findUnique({
      where: { usuarioId_eventoId: { usuarioId, eventoId } },
      include: INCLUDE_USUARIO,
    });
    return registro ? this.toModel(registro) : null;
  }

  async listarPorEvento(eventoId: string): Promise<PapelAcessoModel[]> {
    const registros = await this.prisma.papelAcesso.findMany({
      where: { eventoId },
      include: INCLUDE_USUARIO,
      orderBy: { criadoEm: "asc" },
    });
    return registros.map((registro) => this.toModel(registro));
  }

  async listarPorUsuario(usuarioId: string): Promise<PapelAcessoModel[]> {
    const registros = await this.prisma.papelAcesso.findMany({
      where: { usuarioId },
      include: INCLUDE_USUARIO,
    });
    return registros.map((registro) => this.toModel(registro));
  }

  private toModel(registro: PapelAcessoComUsuario): PapelAcessoModel {
    return new PapelAcessoModel(
      registro.usuarioId,
      registro.eventoId,
      registro.papel,
      registro.usuario.nome,
      registro.usuario.email,
    );
  }
}
