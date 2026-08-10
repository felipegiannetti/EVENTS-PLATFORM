-- Ingressos antigos eram emitidos sempre como não transferíveis, mesmo quando o evento permitia.
UPDATE "ingressos" AS ingresso
SET "transferivel" = evento."transferivel"
FROM "eventos" AS evento
WHERE ingresso."eventoId" = evento."id";
