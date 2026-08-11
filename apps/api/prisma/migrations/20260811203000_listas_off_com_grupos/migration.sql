-- Cria as listas nomeadas antes de vincular os convidados existentes.
CREATE TABLE "listas_off_grupos" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "entradaAte" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "listas_off_grupos_pkey" PRIMARY KEY ("id")
);

-- Preserva eventuais registros antigos criando uma lista de importacao para cada evento.
INSERT INTO "listas_off_grupos" ("id", "eventoId", "nome", "atualizadoEm")
SELECT
    SUBSTRING(MD5("eventoId" || ':lista-off-importada'), 1, 8) || '-' ||
    SUBSTRING(MD5("eventoId" || ':lista-off-importada'), 9, 4) || '-' ||
    SUBSTRING(MD5("eventoId" || ':lista-off-importada'), 13, 4) || '-' ||
    SUBSTRING(MD5("eventoId" || ':lista-off-importada'), 17, 4) || '-' ||
    SUBSTRING(MD5("eventoId" || ':lista-off-importada'), 21, 12),
    "eventoId",
    'Lista importada',
    CURRENT_TIMESTAMP
FROM "lista_off"
GROUP BY "eventoId";

ALTER TABLE "lista_off"
ADD COLUMN "atualizadoEm" TIMESTAMP(3),
ADD COLUMN "cpfDigitos" TEXT,
ADD COLUMN "listaId" TEXT,
ADD COLUMN "nomeCompleto" TEXT;

UPDATE "lista_off" AS pessoa
SET
    "listaId" = lista."id",
    "nomeCompleto" = 'Convidado importado',
    "cpfDigitos" = REGEXP_REPLACE(pessoa."cpf", '[^0-9]', '', 'g'),
    "cpf" = CASE
      WHEN LENGTH(REGEXP_REPLACE(pessoa."cpf", '[^0-9]', '', 'g')) = 11 THEN
        SUBSTRING(REGEXP_REPLACE(pessoa."cpf", '[^0-9]', '', 'g'), 1, 3) || '.' ||
        SUBSTRING(REGEXP_REPLACE(pessoa."cpf", '[^0-9]', '', 'g'), 4, 3) || '.' ||
        SUBSTRING(REGEXP_REPLACE(pessoa."cpf", '[^0-9]', '', 'g'), 7, 3) || '-' ||
        SUBSTRING(REGEXP_REPLACE(pessoa."cpf", '[^0-9]', '', 'g'), 10, 2)
      ELSE pessoa."cpf"
    END,
    "atualizadoEm" = pessoa."criadoEm"
FROM "listas_off_grupos" AS lista
WHERE lista."eventoId" = pessoa."eventoId";

ALTER TABLE "lista_off"
ALTER COLUMN "atualizadoEm" SET NOT NULL,
ALTER COLUMN "cpfDigitos" SET NOT NULL,
ALTER COLUMN "listaId" SET NOT NULL,
ALTER COLUMN "nomeCompleto" SET NOT NULL;

DROP INDEX "lista_off_eventoId_cpf_key";

CREATE INDEX "listas_off_grupos_eventoId_idx" ON "listas_off_grupos"("eventoId");
CREATE UNIQUE INDEX "listas_off_grupos_eventoId_nome_key" ON "listas_off_grupos"("eventoId", "nome");
CREATE INDEX "lista_off_eventoId_idx" ON "lista_off"("eventoId");
CREATE INDEX "lista_off_listaId_nomeCompleto_idx" ON "lista_off"("listaId", "nomeCompleto");
CREATE INDEX "lista_off_listaId_cpfDigitos_idx" ON "lista_off"("listaId", "cpfDigitos");
CREATE UNIQUE INDEX "lista_off_listaId_cpfDigitos_key" ON "lista_off"("listaId", "cpfDigitos");

ALTER TABLE "listas_off_grupos"
ADD CONSTRAINT "listas_off_grupos_eventoId_fkey"
FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lista_off"
ADD CONSTRAINT "lista_off_listaId_fkey"
FOREIGN KEY ("listaId") REFERENCES "listas_off_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
