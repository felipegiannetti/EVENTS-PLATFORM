import { Injectable } from "@nestjs/common";
import type { RefreshToken } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { RefreshTokenModel } from "../model/refresh-token.model";
import type {
  CriarRefreshTokenData,
  RefreshTokenRepository,
} from "./refresh-token.repository";

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarRefreshTokenData): Promise<RefreshTokenModel> {
    const token = await this.prisma.refreshToken.create({ data });
    return this.toModel(token);
  }

  async buscarPorHash(tokenHash: string): Promise<RefreshTokenModel | null> {
    const token = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    return token ? this.toModel(token) : null;
  }

  async revogar(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revogadoEm: new Date() },
    });
  }

  async revogarFamilia(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revogadoEm: null },
      data: { revogadoEm: new Date() },
    });
  }

  async revogarTodasDoUsuario(usuarioId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId, revogadoEm: null },
      data: { revogadoEm: new Date() },
    });
  }

  private toModel(token: RefreshToken): RefreshTokenModel {
    return new RefreshTokenModel(
      token.id,
      token.usuarioId,
      token.tokenHash,
      token.familyId,
      token.expiraEm,
      token.revogadoEm,
    );
  }
}
