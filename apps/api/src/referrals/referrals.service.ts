import { createHash, randomBytes } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  ConfirmarContaIndicacaoResponse,
  CriarProgramaIndicacaoInput,
  OfertaIndicacaoPublicaResponse,
  OfertaIndicacaoResponse,
  PainelIndicacaoResponse,
  ProgramaIndicacaoResponse,
  SolicitarConfirmacaoContaIndicacaoResponse,
} from "@events-platform/shared-types";
import { PrismaService } from "../infra/prisma/prisma.service";
import { MailService } from "../infra/mail/mail.service";
import { criptografar, descriptografar } from "../infra/crypto/campo-criptografado.util";

const BENEFICIO_MAXIMO_ORGANIZADOR = 2;
const PARTICIPACAO_BONUS_INDICADOR = 0.25;
const PRAZO_CONFIRMACAO_CONTA_HORAS = 24;

type OfertaComUso = {
  id: string;
  codigo: string;
  percentualBeneficioOrganizador: unknown;
  ativo: boolean;
  criadoEm: Date;
  _count: { indicacoes: number };
};

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async solicitarConfirmacaoConta(
    usuarioId: string,
    input: CriarProgramaIndicacaoInput,
  ): Promise<SolicitarConfirmacaoContaIndicacaoResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nome: true, email: true },
    });
    if (!usuario) throw new NotFoundException("Usuário não encontrado.");

    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hashToken(token);
    const chave = this.chave();
    await this.prisma.solicitacaoContaIndicacao.upsert({
      where: { usuarioId },
      create: {
        usuarioId,
        banco: input.banco,
        tipoConta: input.tipoConta,
        agencia: criptografar(input.agencia, chave),
        conta: criptografar(input.conta, chave),
        titular: criptografar(input.titular, chave),
        documentoTitular: criptografar(input.documentoTitular, chave),
        tokenHash,
        expiraEm: new Date(Date.now() + PRAZO_CONFIRMACAO_CONTA_HORAS * 60 * 60 * 1000),
      },
      update: {
        banco: input.banco,
        tipoConta: input.tipoConta,
        agencia: criptografar(input.agencia, chave),
        conta: criptografar(input.conta, chave),
        titular: criptografar(input.titular, chave),
        documentoTitular: criptografar(input.documentoTitular, chave),
        tokenHash,
        expiraEm: new Date(Date.now() + PRAZO_CONFIRMACAO_CONTA_HORAS * 60 * 60 * 1000),
      },
    });

    const origemWeb = (this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3001").split(",")[0]!.replace(/\/$/, "");
    const link = `${origemWeb}/indicacoes/confirmar?token=${encodeURIComponent(token)}`;
    try {
      await this.mail.enviar({
        para: [usuario.email],
        assunto: "[RARO Tickets] Confirme sua conta de recebimento",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#16152a"><h1 style="font-size:22px">Confirme sua conta de recebimento</h1><p>Olá, ${this.escaparHtml(usuario.nome)}. Recebemos uma solicitação para cadastrar ou alterar a conta do seu programa de indicação.</p><p><a href="${link}" style="display:inline-block;background:#6d28d9;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold">Revisar e confirmar conta</a></p><p style="font-size:12px;color:#6b6880">O link expira em 24 horas. Se você não fez essa solicitação, ignore este email; a conta ativa atual não será alterada.</p></div>`,
      });
    } catch (erro) {
      await this.prisma.solicitacaoContaIndicacao.deleteMany({ where: { usuarioId, tokenHash } });
      throw erro;
    }
    return {
      mensagem: "Enviamos um link de confirmação para o email da sua conta.",
      emailMascarado: this.mascararEmail(usuario.email),
    };
  }

  async confirmarConta(token: string): Promise<ConfirmarContaIndicacaoResponse> {
    const solicitacao = await this.prisma.solicitacaoContaIndicacao.findFirst({
      where: { tokenHash: this.hashToken(token), expiraEm: { gt: new Date() } },
    });
    if (!solicitacao) throw new BadRequestException("Link de confirmação inválido ou expirado.");

    await this.prisma.$transaction(async (tx) => {
      await tx.programaIndicacao.upsert({
        where: { usuarioId: solicitacao.usuarioId },
        create: {
          usuarioId: solicitacao.usuarioId,
          banco: solicitacao.banco,
          agencia: solicitacao.agencia,
          conta: solicitacao.conta,
          tipoConta: solicitacao.tipoConta,
          titular: solicitacao.titular,
          documentoTitular: solicitacao.documentoTitular,
          ativo: true,
        },
        update: {
          banco: solicitacao.banco,
          agencia: solicitacao.agencia,
          conta: solicitacao.conta,
          tipoConta: solicitacao.tipoConta,
          titular: solicitacao.titular,
          documentoTitular: solicitacao.documentoTitular,
          ativo: true,
        },
      });
      await tx.solicitacaoContaIndicacao.delete({ where: { id: solicitacao.id } });
    });
    return { confirmado: true };
  }

  async criarOferta(usuarioId: string, percentual: number): Promise<OfertaIndicacaoResponse> {
    this.validarPercentual(percentual);
    const programa = await this.prisma.programaIndicacao.findUnique({ where: { usuarioId } });
    if (!programa?.ativo) throw new BadRequestException("Confirme sua conta de recebimento antes de criar um link.");
    const oferta = await this.prisma.ofertaIndicacao.create({
      data: {
        programaId: programa.id,
        codigo: randomBytes(12).toString("base64url"),
        percentualBeneficioOrganizador: percentual,
      },
      include: { _count: { select: { indicacoes: true } } },
    });
    return this.mapearOferta(oferta);
  }

  async editarOferta(usuarioId: string, ofertaId: string, percentual: number): Promise<OfertaIndicacaoResponse> {
    this.validarPercentual(percentual);
    const oferta = await this.buscarOfertaDoUsuario(usuarioId, ofertaId);
    if (oferta._count.indicacoes > 0) throw new ConflictException("Links utilizados não podem mais ser editados.");
    const atualizada = await this.prisma.ofertaIndicacao.update({
      where: { id: ofertaId },
      data: { percentualBeneficioOrganizador: percentual },
      include: { _count: { select: { indicacoes: true } } },
    });
    return this.mapearOferta(atualizada);
  }

  async removerOferta(usuarioId: string, ofertaId: string): Promise<{ removido: true }> {
    const oferta = await this.buscarOfertaDoUsuario(usuarioId, ofertaId);
    if (oferta._count.indicacoes > 0) throw new ConflictException("Links utilizados não podem ser removidos.");
    await this.prisma.ofertaIndicacao.delete({ where: { id: ofertaId } });
    return { removido: true };
  }

  async buscarOfertaPublica(codigo: string): Promise<OfertaIndicacaoPublicaResponse> {
    const oferta = await this.prisma.ofertaIndicacao.findFirst({
      where: { codigo, ativo: true, programa: { ativo: true } },
      select: {
        percentualBeneficioOrganizador: true,
        programa: { select: { usuario: { select: { nome: true } } } },
      },
    });
    if (!oferta) throw new NotFoundException("Link de indicação inválido ou desativado.");
    return {
      indicadorNome: oferta.programa.usuario.nome.split(" ")[0] ?? oferta.programa.usuario.nome,
      percentualBeneficioOrganizador: Number(oferta.percentualBeneficioOrganizador),
    };
  }

  async buscarPainel(usuarioId: string): Promise<PainelIndicacaoResponse> {
    const [programa, indicacoes, confirmacaoContaPendente] = await Promise.all([
      this.prisma.programaIndicacao.findUnique({
        where: { usuarioId },
        include: {
          ofertas: { orderBy: { criadoEm: "desc" }, include: { _count: { select: { indicacoes: true } } } },
        },
      }),
      this.prisma.indicacao.findMany({
        where: { indicadorId: usuarioId },
        include: {
          indicado: {
            select: {
              nome: true,
              eventosOrganizados: {
                orderBy: [{ data: "asc" }, { id: "asc" }],
                select: {
                  id: true,
                  nome: true,
                  ingressos: {
                    where: { status: { not: "cancelado" }, lote: { preco: { gt: 0 } } },
                    select: { lote: { select: { preco: true } } },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.solicitacaoContaIndicacao.findUnique({ where: { usuarioId }, select: { id: true } }),
    ]);

    const eventos = indicacoes.flatMap((indicacao) => {
      const elegiveis = indicacao.indicado.eventosOrganizados
        .map((evento) => ({ ...evento, baseCalculo: evento.ingressos.reduce((soma, ingresso) => soma + Number(ingresso.lote.preco), 0) }))
        .filter((evento) => evento.baseCalculo > 0);
      const beneficio = Number(indicacao.percentualBeneficioOrganizador);
      const percentualBonus = this.percentualBonus(beneficio);
      return elegiveis.map((evento) => {
        const percentualBase = 0.25;
        const percentualTotal = percentualBase + percentualBonus;
        return {
          eventoId: evento.id,
          eventoNome: evento.nome,
          organizadorNome: indicacao.indicado.nome,
          percentualBase,
          percentualBonus,
          percentualTotal,
          percentualBeneficioOrganizador: beneficio,
          baseCalculo: evento.baseCalculo,
          valorEstimado: evento.baseCalculo * (percentualTotal / 100),
        };
      });
    });

    return {
      programa: programa ? this.mapearPrograma(programa) : null,
      confirmacaoContaPendente: Boolean(confirmacaoContaPendente),
      totalIndicados: indicacoes.length,
      totalEventosPagos: eventos.length,
      totalEstimado: eventos.reduce((soma, evento) => soma + evento.valorEstimado, 0),
      eventos,
    };
  }

  percentualBonus(percentualBeneficioOrganizador: number): number {
    return (BENEFICIO_MAXIMO_ORGANIZADOR - percentualBeneficioOrganizador) * PARTICIPACAO_BONUS_INDICADOR;
  }

  private async buscarOfertaDoUsuario(usuarioId: string, ofertaId: string): Promise<OfertaComUso> {
    const oferta = await this.prisma.ofertaIndicacao.findFirst({
      where: { id: ofertaId, programa: { usuarioId } },
      include: { _count: { select: { indicacoes: true } } },
    });
    if (!oferta) throw new NotFoundException("Link de indicação não encontrado.");
    return oferta;
  }

  private validarPercentual(percentual: number) {
    if (percentual < 0 || percentual > BENEFICIO_MAXIMO_ORGANIZADOR) {
      throw new BadRequestException("O benefício do organizador deve ficar entre 0% e 2%.");
    }
  }

  private mapearPrograma(programa: {
    id: string;
    banco: string;
    conta: string;
    tipoConta: "corrente" | "poupanca";
    titular: string;
    ativo: boolean;
    ofertas: OfertaComUso[];
  }): ProgramaIndicacaoResponse {
    const chave = this.chave();
    const conta = descriptografar(programa.conta, chave).replace(/\D/g, "");
    return {
      id: programa.id,
      banco: programa.banco,
      contaFinal: conta.slice(-4).padStart(4, "•"),
      tipoConta: programa.tipoConta,
      titular: descriptografar(programa.titular, chave),
      ativo: programa.ativo,
      ofertas: programa.ofertas.map((oferta) => this.mapearOferta(oferta)),
    };
  }

  private mapearOferta(oferta: OfertaComUso): OfertaIndicacaoResponse {
    return {
      id: oferta.id,
      codigo: oferta.codigo,
      percentualBeneficioOrganizador: Number(oferta.percentualBeneficioOrganizador),
      ativo: oferta.ativo,
      utilizado: oferta._count.indicacoes > 0,
      totalUtilizacoes: oferta._count.indicacoes,
      criadoEm: oferta.criadoEm.toISOString(),
    };
  }

  private mascararEmail(email: string): string {
    const [nome, dominio] = email.split("@");
    return `${nome?.slice(0, 2) ?? "**"}***@${dominio ?? "***"}`;
  }

  private escaparHtml(valor: string): string {
    return valor.replace(/[&<>"']/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[caractere]!);
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private chave(): string {
    return this.config.getOrThrow<string>("CONTA_BANCARIA_ENCRYPTION_KEY");
  }
}
