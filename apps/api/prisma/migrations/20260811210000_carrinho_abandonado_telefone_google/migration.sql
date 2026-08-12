-- AlterTable: Usuario — nulável pra suportar contas criadas via Google (sem senha, sem documento
-- até completar cadastro), + telefone (obrigatório no cadastro normal) + googleId (vínculo OAuth).
ALTER TABLE "usuarios" ALTER COLUMN "senhaHash" DROP NOT NULL;
ALTER TABLE "usuarios" ALTER COLUMN "documento" DROP NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN "telefone" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "usuarios_googleId_key" ON "usuarios"("googleId");

-- AlterTable: ReservaIngresso — nome/telefone do comprador, base do relatório de carrinho abandonado.
ALTER TABLE "reservas_ingresso" ADD COLUMN "compradorNome" TEXT;
ALTER TABLE "reservas_ingresso" ADD COLUMN "compradorTelefone" TEXT;
