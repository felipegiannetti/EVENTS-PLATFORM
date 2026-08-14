-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_usuarioId_fkey";

-- DropIndex
DROP INDEX "usuarios_documento_key";

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "usuarioId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "bloqueadoAte" TIMESTAMP(3),
ADD COLUMN     "documentoHash" TEXT,
ADD COLUMN     "tentativasFalhas" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_documentoHash_key" ON "usuarios"("documentoHash");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
