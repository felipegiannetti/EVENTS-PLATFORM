-- CreateEnum
CREATE TYPE "CategoriaEvento" AS ENUM ('shows', 'festivais', 'negocios', 'esportes', 'cursos', 'tecnologia', 'outros');

-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "categoria" "CategoriaEvento" NOT NULL DEFAULT 'outros';
