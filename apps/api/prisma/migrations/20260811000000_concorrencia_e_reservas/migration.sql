-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('ativa', 'confirmada', 'expirada', 'cancelada');

-- AlterTable: quantidadeEmitida vira contador real (era derivado de _count.ingressos) + vagasReservadas
ALTER TABLE "lotes" ADD COLUMN "quantidadeEmitida" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "lotes" ADD COLUMN "vagasReservadas" INTEGER NOT NULL DEFAULT 0;

-- Backfill: quantidadeEmitida passa a refletir a contagem real de ingressos já emitidos por lote.
UPDATE "lotes" AS l
SET "quantidadeEmitida" = sub.contagem
FROM (SELECT "loteId", COUNT(*) AS contagem FROM "ingressos" GROUP BY "loteId") AS sub
WHERE l.id = sub."loteId";

-- CreateTable
CREATE TABLE "reservas_ingresso" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'ativa',
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "compradorEmail" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_ingresso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reservas_ingresso" ADD CONSTRAINT "reservas_ingresso_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
