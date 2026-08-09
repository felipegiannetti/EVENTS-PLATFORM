-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "contatoEmail" TEXT,
ADD COLUMN     "contatoNome" TEXT,
ADD COLUMN     "contatoTelefone" TEXT,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "publicado" BOOLEAN NOT NULL DEFAULT false;
