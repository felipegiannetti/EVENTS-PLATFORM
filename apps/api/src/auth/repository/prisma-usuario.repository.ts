import { Injectable } from "@nestjs/common";
import type { Usuario } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { UsuarioModel } from "../model/usuario.model";
import type { AtualizarUsuarioData, CriarUsuarioData, UsuarioRepository } from "./usuario.repository";

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarUsuarioData): Promise<UsuarioModel> {
    const usuario = await this.prisma.usuario.create({ data });
    return this.toModel(usuario);
  }

  async buscarPorEmail(email: string): Promise<UsuarioModel | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    return usuario ? this.toModel(usuario) : null;
  }

  async buscarPorId(id: string): Promise<UsuarioModel | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    return usuario ? this.toModel(usuario) : null;
  }

  async buscarPorDocumento(documento: string): Promise<UsuarioModel | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { documento } });
    return usuario ? this.toModel(usuario) : null;
  }

  async atualizar(id: string, data: AtualizarUsuarioData): Promise<UsuarioModel> {
    const usuario = await this.prisma.usuario.update({ where: { id }, data });
    return this.toModel(usuario);
  }

  async remover(id: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }

  private toModel(usuario: Usuario): UsuarioModel {
    return new UsuarioModel(
      usuario.id,
      usuario.nome,
      usuario.email,
      usuario.senhaHash,
      usuario.papelGlobal,
      usuario.tipoPessoa,
      usuario.documento,
      usuario.dataNascimento,
      usuario.criadoEm,
    );
  }
}
