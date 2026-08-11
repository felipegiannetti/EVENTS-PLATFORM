-- AlterEnum
ALTER TYPE "StatusIngresso" ADD VALUE 'aguardando_aceite';

-- AlterTable
ALTER TABLE "ingressos" ADD COLUMN "destinatarioTransferenciaEmail" TEXT;
