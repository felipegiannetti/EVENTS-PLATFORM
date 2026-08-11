-- CreateEnum
CREATE TYPE "StatusComissaoIndicacao" AS ENUM ('estimada', 'confirmada', 'elegivel', 'processando', 'paga', 'bloqueada', 'revertida');

-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "organizadorId" TEXT;

-- Eventos anteriores não tinham um responsável financeiro explícito. Usa o primeiro owner
-- cadastrado como criador/responsável para manter acordos e indicações estáveis.
UPDATE "eventos" AS evento
SET "organizadorId" = (
  SELECT papel."usuarioId"
  FROM "papeis_acesso" AS papel
  WHERE papel."eventoId" = evento."id" AND papel."papel" = 'owner'
  ORDER BY papel."criadoEm" ASC
  LIMIT 1
);

-- CreateTable
CREATE TABLE "programas_indicacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "conta" TEXT NOT NULL,
    "tipoConta" "TipoContaBancaria" NOT NULL,
    "titular" TEXT NOT NULL,
    "documentoTitular" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programas_indicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ofertas_indicacao" (
    "id" TEXT NOT NULL,
    "programaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "percentualBeneficioOrganizador" DECIMAL(4,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ofertas_indicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicacoes" (
    "id" TEXT NOT NULL,
    "indicadorId" TEXT NOT NULL,
    "indicadoId" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "percentualBeneficioOrganizador" DECIMAL(4,2) NOT NULL,
    "primeiroEventoPagoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes_indicacao" (
    "id" TEXT NOT NULL,
    "indicacaoId" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "transacaoId" TEXT,
    "percentualBase" DECIMAL(4,2) NOT NULL,
    "percentualBonus" DECIMAL(4,2) NOT NULL,
    "baseCalculo" DECIMAL(12,2) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" "StatusComissaoIndicacao" NOT NULL DEFAULT 'estimada',
    "chaveIdempotencia" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_indicacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programas_indicacao_usuarioId_key" ON "programas_indicacao"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ofertas_indicacao_codigo_key" ON "ofertas_indicacao"("codigo");

-- CreateIndex
CREATE INDEX "ofertas_indicacao_programaId_idx" ON "ofertas_indicacao"("programaId");

-- CreateIndex
CREATE UNIQUE INDEX "indicacoes_indicadoId_key" ON "indicacoes"("indicadoId");

-- CreateIndex
CREATE UNIQUE INDEX "indicacoes_primeiroEventoPagoId_key" ON "indicacoes"("primeiroEventoPagoId");

-- CreateIndex
CREATE INDEX "indicacoes_indicadorId_idx" ON "indicacoes"("indicadorId");

-- CreateIndex
CREATE UNIQUE INDEX "comissoes_indicacao_transacaoId_key" ON "comissoes_indicacao"("transacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "comissoes_indicacao_chaveIdempotencia_key" ON "comissoes_indicacao"("chaveIdempotencia");

-- CreateIndex
CREATE INDEX "comissoes_indicacao_indicacaoId_status_idx" ON "comissoes_indicacao"("indicacaoId", "status");

-- CreateIndex
CREATE INDEX "comissoes_indicacao_eventoId_idx" ON "comissoes_indicacao"("eventoId");

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_organizadorId_fkey" FOREIGN KEY ("organizadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programas_indicacao" ADD CONSTRAINT "programas_indicacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas_indicacao" ADD CONSTRAINT "ofertas_indicacao_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas_indicacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicacoes" ADD CONSTRAINT "indicacoes_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicacoes" ADD CONSTRAINT "indicacoes_indicadoId_fkey" FOREIGN KEY ("indicadoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicacoes" ADD CONSTRAINT "indicacoes_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "ofertas_indicacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicacoes" ADD CONSTRAINT "indicacoes_primeiroEventoPagoId_fkey" FOREIGN KEY ("primeiroEventoPagoId") REFERENCES "eventos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes_indicacao" ADD CONSTRAINT "comissoes_indicacao_indicacaoId_fkey" FOREIGN KEY ("indicacaoId") REFERENCES "indicacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes_indicacao" ADD CONSTRAINT "comissoes_indicacao_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes_indicacao" ADD CONSTRAINT "comissoes_indicacao_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
