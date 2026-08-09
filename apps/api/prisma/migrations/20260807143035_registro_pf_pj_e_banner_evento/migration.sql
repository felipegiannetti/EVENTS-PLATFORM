-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('fisica', 'juridica');

-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "imagemBanner" BYTEA,
ADD COLUMN     "imagemBannerTipo" TEXT;

-- AlterTable (dataNascimento e tipoPessoa sem problema; documento entra nullable, é
-- backfillado com um placeholder único pra linha de teste existente, e só depois vira NOT NULL)
ALTER TABLE "usuarios" ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "documento" TEXT,
ADD COLUMN     "tipoPessoa" "TipoPessoa" NOT NULL DEFAULT 'fisica';

UPDATE "usuarios" SET "documento" = 'PENDENTE-' || "id" WHERE "documento" IS NULL;

ALTER TABLE "usuarios" ALTER COLUMN "documento" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_documento_key" ON "usuarios"("documento");
