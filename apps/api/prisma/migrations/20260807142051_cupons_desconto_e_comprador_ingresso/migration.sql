-- CreateEnum
CREATE TYPE "TipoDescontoCupom" AS ENUM ('percentual', 'valor_fixo');

-- AlterTable
ALTER TABLE "ingressos" ADD COLUMN     "compradorDocumento" TEXT,
ADD COLUMN     "compradorEmail" TEXT,
ADD COLUMN     "compradorNome" TEXT;

-- CreateTable
CREATE TABLE "cupons_desconto" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoDescontoCupom" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupons_desconto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cupons_desconto_eventoId_codigo_key" ON "cupons_desconto"("eventoId", "codigo");

-- AddForeignKey
ALTER TABLE "cupons_desconto" ADD CONSTRAINT "cupons_desconto_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
