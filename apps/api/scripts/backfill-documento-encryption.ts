/**
 * One-off: criptografa Usuario.documento e Ingresso.compradorDocumento gravados em texto puro
 * antes da migração `security_hardening` — sem isso, PrismaUsuarioRepository/PrismaIngressoRepository
 * tentam descriptografar valor que não está no formato iv.authTag.ciphertext e derrubam a leitura.
 * Idempotente: só toca linhas cujo valor ainda não parece ciphertext (sem os dois pontos esperados).
 */
import { PrismaClient } from "@prisma/client";
import { criptografar, hashDeterministico } from "../src/infra/crypto/campo-criptografado.util";

const prisma = new PrismaClient();

function pareceCiphertext(valor: string): boolean {
  const partes = valor.split(".");
  return partes.length === 3 && partes.every((parte) => /^[0-9a-f]+$/i.test(parte));
}

async function main() {
  const chaveDocumento = process.env.DOCUMENTO_ENCRYPTION_KEY;
  if (!chaveDocumento) throw new Error("DOCUMENTO_ENCRYPTION_KEY não definida.");

  const usuarios = await prisma.usuario.findMany({
    where: { documento: { not: null } },
    select: { id: true, documento: true },
  });
  let usuariosMigrados = 0;
  for (const usuario of usuarios) {
    if (!usuario.documento || pareceCiphertext(usuario.documento)) continue;
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        documento: criptografar(usuario.documento, chaveDocumento),
        documentoHash: hashDeterministico(usuario.documento, chaveDocumento),
      },
    });
    usuariosMigrados++;
  }

  const ingressos = await prisma.ingresso.findMany({
    where: { compradorDocumento: { not: null } },
    select: { id: true, compradorDocumento: true },
  });
  let ingressosMigrados = 0;
  for (const ingresso of ingressos) {
    if (!ingresso.compradorDocumento || pareceCiphertext(ingresso.compradorDocumento)) continue;
    await prisma.ingresso.update({
      where: { id: ingresso.id },
      data: { compradorDocumento: criptografar(ingresso.compradorDocumento, chaveDocumento) },
    });
    ingressosMigrados++;
  }

  console.log(`Usuarios migrados: ${usuariosMigrados}/${usuarios.length}`);
  console.log(`Ingressos migrados: ${ingressosMigrados}/${ingressos.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
