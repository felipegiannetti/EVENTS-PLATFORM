import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AtualizarListaOffGrupoInput,
  AtualizarPessoaListaOffInput,
  CriarListaOffGrupoInput,
  ImportarPessoasListaOffResponse,
  ListaOffGrupoResponse,
  PessoaListaOffResponse,
  PessoasListaOffPaginadas,
} from "@events-platform/shared-types";
import { validarCpf } from "@events-platform/shared-types";
import { PrismaService } from "../infra/prisma/prisma.service";

const MAXIMO_IMPORTACAO = 1_000;

@Injectable()
export class GuestlistService {
  constructor(private readonly prisma: PrismaService) {}

  async listarListas(eventoId: string): Promise<ListaOffGrupoResponse[]> {
    const listas = await this.prisma.listaOffGrupo.findMany({
      where: { eventoId },
      include: { pessoas: { select: { statusUso: true } } },
      orderBy: { criadoEm: "asc" },
    });
    return listas.map((lista) => ({
      id: lista.id,
      eventoId: lista.eventoId,
      nome: lista.nome,
      entradaAte: lista.entradaAte?.toISOString() ?? null,
      totalPessoas: lista.pessoas.length,
      totalCheckins: lista.pessoas.filter((pessoa) => pessoa.statusUso).length,
      criadoEm: lista.criadoEm.toISOString(),
    }));
  }

  async criarLista(eventoId: string, input: CriarListaOffGrupoInput): Promise<ListaOffGrupoResponse> {
    const existente = await this.prisma.listaOffGrupo.findFirst({
      where: { eventoId, nome: { equals: input.nome.trim(), mode: "insensitive" } },
      select: { id: true },
    });
    if (existente) throw new ConflictException("Já existe uma lista com esse nome neste evento.");

    const lista = await this.prisma.listaOffGrupo.create({
      data: {
        eventoId,
        nome: input.nome.trim(),
        entradaAte: input.entradaAte ? new Date(input.entradaAte) : null,
      },
    });
    return this.mapearLista(lista, 0, 0);
  }

  async atualizarLista(eventoId: string, listaId: string, input: AtualizarListaOffGrupoInput): Promise<ListaOffGrupoResponse> {
    const atual = await this.buscarLista(eventoId, listaId);
    if (input.nome && input.nome.trim().toLocaleLowerCase("pt-BR") !== atual.nome.toLocaleLowerCase("pt-BR")) {
      const duplicada = await this.prisma.listaOffGrupo.findFirst({
        where: { eventoId, id: { not: listaId }, nome: { equals: input.nome.trim(), mode: "insensitive" } },
        select: { id: true },
      });
      if (duplicada) throw new ConflictException("Já existe uma lista com esse nome neste evento.");
    }

    const lista = await this.prisma.listaOffGrupo.update({
      where: { id: listaId },
      data: {
        ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
        ...(input.entradaAte !== undefined ? { entradaAte: input.entradaAte ? new Date(input.entradaAte) : null } : {}),
      },
      include: { pessoas: { select: { statusUso: true } } },
    });
    return this.mapearLista(lista, lista.pessoas.length, lista.pessoas.filter((pessoa) => pessoa.statusUso).length);
  }

  async removerLista(eventoId: string, listaId: string): Promise<void> {
    await this.buscarLista(eventoId, listaId);
    await this.prisma.listaOffGrupo.delete({ where: { id: listaId } });
  }

  async importarPessoas(eventoId: string, listaId: string, conteudo: string): Promise<ImportarPessoasListaOffResponse> {
    await this.buscarLista(eventoId, listaId);
    const linhas = conteudo.split(/\r?\n/).map((linha) => linha.trim()).filter(Boolean);
    if (linhas.length === 0) throw new BadRequestException("Informe ao menos uma pessoa no formato NOME, CPF.");
    if (linhas.length > MAXIMO_IMPORTACAO) throw new BadRequestException(`Adicione no máximo ${MAXIMO_IMPORTACAO} pessoas por vez.`);

    const pessoas = linhas.map((linha, indice) => {
      const separador = linha.lastIndexOf(",");
      if (separador <= 0 || separador === linha.length - 1) {
        throw new BadRequestException(`Linha ${indice + 1}: use exatamente o formato NOME COMPLETO, CPF.`);
      }
      const nomeCompleto = linha.slice(0, separador).trim().replace(/\s+/g, " ");
      const cpfDigitos = this.cpfDigitos(linha.slice(separador + 1));
      if (nomeCompleto.length < 3 || nomeCompleto.length > 160) {
        throw new BadRequestException(`Linha ${indice + 1}: informe um nome completo válido.`);
      }
      if (!validarCpf(cpfDigitos)) throw new BadRequestException(`Linha ${indice + 1}: CPF inválido.`);
      return { nomeCompleto, cpfDigitos, cpf: this.formatarCpf(cpfDigitos) };
    });

    const repetidos = pessoas.filter((pessoa, indice) => pessoas.findIndex((outra) => outra.cpfDigitos === pessoa.cpfDigitos) !== indice);
    if (repetidos.length > 0) throw new BadRequestException(`O CPF ${repetidos[0]!.cpf} aparece mais de uma vez no texto.`);

    const existentes = await this.prisma.listaOff.findMany({
      where: { listaId, cpfDigitos: { in: pessoas.map((pessoa) => pessoa.cpfDigitos) } },
      select: { cpf: true },
    });
    if (existentes.length > 0) throw new ConflictException(`O CPF ${existentes[0]!.cpf} já está nesta lista.`);

    await this.prisma.listaOff.createMany({
      data: pessoas.map((pessoa) => ({ eventoId, listaId, ...pessoa })),
    });
    return { adicionadas: pessoas.length };
  }

  async listarPessoas(
    eventoId: string,
    listaId: string,
    filtros: { nome?: string; cpf?: string; pagina?: number; limite?: number },
  ): Promise<PessoasListaOffPaginadas> {
    await this.buscarLista(eventoId, listaId);
    const paginaInformada = Number.isFinite(filtros.pagina) ? Math.trunc(filtros.pagina!) : 1;
    const limiteInformado = Number.isFinite(filtros.limite) ? Math.trunc(filtros.limite!) : 20;
    const pagina = Math.max(1, paginaInformada);
    const limite = Math.min(100, Math.max(1, limiteInformado));
    const cpf = this.cpfDigitos(filtros.cpf ?? "");
    const where = {
      eventoId,
      listaId,
      ...(filtros.nome?.trim() ? { nomeCompleto: { contains: filtros.nome.trim(), mode: "insensitive" as const } } : {}),
      ...(cpf ? { cpfDigitos: { contains: cpf } } : {}),
    };
    const [itens, total] = await Promise.all([
      this.prisma.listaOff.findMany({ where, orderBy: [{ statusUso: "asc" }, { nomeCompleto: "asc" }], skip: (pagina - 1) * limite, take: limite }),
      this.prisma.listaOff.count({ where }),
    ]);
    return {
      itens: itens.map((pessoa) => this.mapearPessoa(pessoa)),
      total,
      pagina,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
    };
  }

  async atualizarPessoa(eventoId: string, listaId: string, pessoaId: string, input: AtualizarPessoaListaOffInput): Promise<PessoaListaOffResponse> {
    await this.buscarPessoa(eventoId, listaId, pessoaId);
    const cpfDigitos = this.cpfDigitos(input.cpf);
    if (!validarCpf(cpfDigitos)) throw new BadRequestException("CPF inválido.");
    const duplicada = await this.prisma.listaOff.findFirst({
      where: { listaId, cpfDigitos, id: { not: pessoaId } },
      select: { id: true },
    });
    if (duplicada) throw new ConflictException("Esse CPF já está cadastrado nesta lista.");
    const pessoa = await this.prisma.listaOff.update({
      where: { id: pessoaId },
      data: { nomeCompleto: input.nomeCompleto.trim().replace(/\s+/g, " "), cpfDigitos, cpf: this.formatarCpf(cpfDigitos) },
    });
    return this.mapearPessoa(pessoa);
  }

  async removerPessoa(eventoId: string, listaId: string, pessoaId: string): Promise<void> {
    await this.buscarPessoa(eventoId, listaId, pessoaId);
    await this.prisma.listaOff.delete({ where: { id: pessoaId } });
  }

  async fazerCheckin(eventoId: string, listaId: string, pessoaId: string): Promise<PessoaListaOffResponse> {
    const pessoa = await this.prisma.listaOff.findFirst({
      where: { id: pessoaId, eventoId, listaId },
      include: { lista: { select: { entradaAte: true } } },
    });
    if (!pessoa) throw new NotFoundException("Pessoa não encontrada nesta lista.");
    if (pessoa.statusUso) throw new ConflictException("O check-in desta pessoa já foi realizado.");
    if (pessoa.lista.entradaAte && pessoa.lista.entradaAte.getTime() < Date.now()) {
      throw new ConflictException("O horário limite de entrada desta lista já encerrou.");
    }
    const usadoEm = new Date();
    const alterado = await this.prisma.listaOff.updateMany({ where: { id: pessoaId, statusUso: false }, data: { statusUso: true, usadoEm } });
    if (alterado.count !== 1) throw new ConflictException("O check-in desta pessoa já foi realizado.");
    const atualizado = await this.prisma.listaOff.findUniqueOrThrow({ where: { id: pessoaId } });
    return this.mapearPessoa(atualizado);
  }

  private async buscarLista(eventoId: string, listaId: string) {
    const lista = await this.prisma.listaOffGrupo.findFirst({ where: { id: listaId, eventoId } });
    if (!lista) throw new NotFoundException("Lista não encontrada neste evento.");
    return lista;
  }

  private async buscarPessoa(eventoId: string, listaId: string, pessoaId: string) {
    const pessoa = await this.prisma.listaOff.findFirst({ where: { id: pessoaId, eventoId, listaId } });
    if (!pessoa) throw new NotFoundException("Pessoa não encontrada nesta lista.");
    return pessoa;
  }

  private cpfDigitos(cpf: string): string {
    return cpf.replace(/\D/g, "").slice(0, 11);
  }

  private formatarCpf(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  private mapearLista(lista: { id: string; eventoId: string; nome: string; entradaAte: Date | null; criadoEm: Date }, totalPessoas: number, totalCheckins: number): ListaOffGrupoResponse {
    return { id: lista.id, eventoId: lista.eventoId, nome: lista.nome, entradaAte: lista.entradaAte?.toISOString() ?? null, totalPessoas, totalCheckins, criadoEm: lista.criadoEm.toISOString() };
  }

  private mapearPessoa(pessoa: { id: string; listaId: string; nomeCompleto: string; cpf: string; statusUso: boolean; usadoEm: Date | null; criadoEm: Date }): PessoaListaOffResponse {
    return { id: pessoa.id, listaId: pessoa.listaId, nomeCompleto: pessoa.nomeCompleto, cpf: pessoa.cpf, statusUso: pessoa.statusUso, usadoEm: pessoa.usadoEm?.toISOString() ?? null, criadoEm: pessoa.criadoEm.toISOString() };
  }
}
