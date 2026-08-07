import { createZodDto } from "nestjs-zod";
import { atualizarLoteSchema, criarLoteSchema } from "@events-platform/shared-types";

export class CriarLoteDto extends createZodDto(criarLoteSchema) {}
export class AtualizarLoteDto extends createZodDto(atualizarLoteSchema) {}
