import { BadRequestException, ConflictException } from "@nestjs/common";
import { GuestlistService } from "./guestlist.service";
import type { PrismaService } from "../infra/prisma/prisma.service";

function criarPrismaFake() {
  return {
    listaOffGrupo: {
      findFirst: jest.fn().mockResolvedValue({ id: "lista-1", eventoId: "evento-1", nome: "Convidados", entradaAte: null }),
    },
    listaOff: {
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
}

describe("GuestlistService", () => {
  it("importa várias linhas, aceita CPF sem máscara e persiste todos formatados", async () => {
    const prisma = criarPrismaFake();
    const service = new GuestlistService(prisma as unknown as PrismaService);

    await expect(service.importarPessoas(
      "evento-1",
      "lista-1",
      "Maria da Silva, 111.444.777-35\nJoão Souza, 52998224725",
    )).resolves.toEqual({ adicionadas: 2 });

    expect(prisma.listaOff.createMany).toHaveBeenCalledWith({
      data: [
        { eventoId: "evento-1", listaId: "lista-1", nomeCompleto: "Maria da Silva", cpfDigitos: "11144477735", cpf: "111.444.777-35" },
        { eventoId: "evento-1", listaId: "lista-1", nomeCompleto: "João Souza", cpfDigitos: "52998224725", cpf: "529.982.247-25" },
      ],
    });
  });

  it("rejeita toda a importação quando uma linha não segue NOME, CPF", async () => {
    const prisma = criarPrismaFake();
    const service = new GuestlistService(prisma as unknown as PrismaService);

    await expect(service.importarPessoas("evento-1", "lista-1", "Maria da Silva 11144477735"))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.listaOff.createMany).not.toHaveBeenCalled();
  });

  it("bloqueia check-in depois do horário limite da lista", async () => {
    const prisma = criarPrismaFake();
    prisma.listaOff.findFirst.mockResolvedValue({
      id: "pessoa-1",
      eventoId: "evento-1",
      listaId: "lista-1",
      statusUso: false,
      lista: { entradaAte: new Date(Date.now() - 60_000) },
    });
    const service = new GuestlistService(prisma as unknown as PrismaService);

    await expect(service.fazerCheckin("evento-1", "lista-1", "pessoa-1"))
      .rejects.toBeInstanceOf(ConflictException);
    expect(prisma.listaOff.updateMany).not.toHaveBeenCalled();
  });
});
