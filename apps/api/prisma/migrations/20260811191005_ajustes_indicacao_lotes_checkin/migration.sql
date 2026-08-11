/*
  Warnings:

  - You are about to drop the column `primeiroEventoPagoId` on the `indicacoes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "indicacoes" DROP CONSTRAINT "indicacoes_primeiroEventoPagoId_fkey";

-- DropIndex
DROP INDEX "indicacoes_primeiroEventoPagoId_key";

-- AlterTable
ALTER TABLE "indicacoes" DROP COLUMN "primeiroEventoPagoId";

-- AlterTable
ALTER TABLE "ingressos" ADD COLUMN     "usadoEm" TIMESTAMP(3);

-- Preserva o horario aproximado de check-ins feitos antes desta coluna existir.
UPDATE "ingressos" SET "usadoEm" = "atualizadoEm" WHERE "status" = 'usado';

-- AlterTable
ALTER TABLE "lotes" ADD COLUMN     "oculto" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "solicitacoes_conta_indicacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "conta" TEXT NOT NULL,
    "tipoConta" "TipoContaBancaria" NOT NULL,
    "titular" TEXT NOT NULL,
    "documentoTitular" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_conta_indicacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_conta_indicacao_usuarioId_key" ON "solicitacoes_conta_indicacao"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_conta_indicacao_tokenHash_key" ON "solicitacoes_conta_indicacao"("tokenHash");

-- AddForeignKey
ALTER TABLE "solicitacoes_conta_indicacao" ADD CONSTRAINT "solicitacoes_conta_indicacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
