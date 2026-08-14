import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Usuario } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { criptografar, descriptografar, hashDeterministico } from "../../infra/crypto/campo-criptografado.util";
import { UsuarioModel } from "../model/usuario.model";
import type { AtualizarUsuarioData, CriarUsuarioData, UsuarioRepository } from "./usuario.repository";

/** documento (CPF/CNPJ) é criptografado (AES-256-GCM) — documentoHash é o índice determinístico usado pra busca/unicidade. Ver campo-criptografado.util.ts. */
@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async criar(data: CriarUsuarioData): Promise<UsuarioModel> {
    const chave = this.chave();
    const usuario = await this.prisma.usuario.create({
      data: {
        ...data,
        documento: data.documento ? criptografar(data.documento, chave) : undefined,
        documentoHash: data.documento ? hashDeterministico(data.documento, chave) : undefined,
      },
    });
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
    const usuario = await this.prisma.usuario.findUnique({
      where: { documentoHash: hashDeterministico(documento, this.chave()) },
    });
    return usuario ? this.toModel(usuario) : null;
  }

  async buscarPorGoogleId(googleId: string): Promise<UsuarioModel | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { googleId } });
    return usuario ? this.toModel(usuario) : null;
  }

  async atualizar(id: string, data: AtualizarUsuarioData): Promise<UsuarioModel> {
    const usuario = await this.prisma.usuario.update({ where: { id }, data });
    return this.toModel(usuario);
  }

  async remover(id: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }

  async incrementarTentativasFalhas(id: string): Promise<UsuarioModel> {
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: { tentativasFalhas: { increment: 1 } },
    });
    return this.toModel(usuario);
  }

  async bloquearAte(id: string, ate: Date): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: { bloqueadoAte: ate, tentativasFalhas: 0 },
    });
  }

  async resetarTentativasFalhas(id: string): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: { tentativasFalhas: 0, bloqueadoAte: null },
    });
  }

  private chave(): string {
    return this.config.getOrThrow<string>("DOCUMENTO_ENCRYPTION_KEY");
  }

  private toModel(usuario: Usuario): UsuarioModel {
    return new UsuarioModel(
      usuario.id,
      usuario.nome,
      usuario.email,
      usuario.senhaHash,
      usuario.papelGlobal,
      usuario.tipoPessoa,
      usuario.documento ? descriptografar(usuario.documento, this.chave()) : null,
      usuario.dataNascimento,
      usuario.telefone,
      usuario.googleId,
      usuario.criadoEm,
      usuario.tentativasFalhas,
      usuario.bloqueadoAte,
    );
  }
}
