-- AlterTable
ALTER TABLE "ingressos" ADD COLUMN "cupomDescontoId" TEXT;

-- AddForeignKey
ALTER TABLE "ingressos" ADD CONSTRAINT "ingressos_cupomDescontoId_fkey" FOREIGN KEY ("cupomDescontoId") REFERENCES "cupons_desconto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
