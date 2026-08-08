import { createZodDto } from "nestjs-zod";
import { criarCupomDescontoSchema, atualizarCupomDescontoSchema } from "@events-platform/shared-types";

export class CriarCupomDescontoDto extends createZodDto(criarCupomDescontoSchema) {}
export class AtualizarCupomDescontoDto extends createZodDto(atualizarCupomDescontoSchema) {}
