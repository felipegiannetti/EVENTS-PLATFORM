-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "emailConfirmado" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "tokens_confirmacao_email" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_confirmacao_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_confirmacao_email_usuarioId_key" ON "tokens_confirmacao_email"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_confirmacao_email_tokenHash_key" ON "tokens_confirmacao_email"("tokenHash");

-- AddForeignKey
ALTER TABLE "tokens_confirmacao_email" ADD CONSTRAINT "tokens_confirmacao_email_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
