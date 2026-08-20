-- CreateTable
CREATE TABLE "tokens_exclusao_conta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_exclusao_conta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_exclusao_conta_usuarioId_key" ON "tokens_exclusao_conta"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_exclusao_conta_tokenHash_key" ON "tokens_exclusao_conta"("tokenHash");

-- AddForeignKey
ALTER TABLE "tokens_exclusao_conta" ADD CONSTRAINT "tokens_exclusao_conta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
