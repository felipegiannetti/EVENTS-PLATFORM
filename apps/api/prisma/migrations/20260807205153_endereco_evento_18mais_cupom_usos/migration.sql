-- AlterTable
ALTER TABLE "cupons_desconto" ADD COLUMN     "usos" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "rua" TEXT,
ADD COLUMN     "somenteMaioresDeIdade" BOOLEAN NOT NULL DEFAULT false;
