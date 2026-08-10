ALTER TABLE "eventos" ADD COLUMN "prazoTransferenciaHoras" INTEGER;
ALTER TABLE "lotes" ADD COLUMN "especial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "cupons_desconto" ADD COLUMN "especial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "cupons_desconto" ADD COLUMN "senhaHash" TEXT;
ALTER TABLE "ingressos" ADD COLUMN "cancelamentoFlexivel" BOOLEAN NOT NULL DEFAULT false;
