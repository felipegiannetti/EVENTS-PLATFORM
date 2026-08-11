import { createZodDto } from "nestjs-zod";
import { criarOfertaIndicacaoSchema } from "@events-platform/shared-types";

export class CriarOfertaIndicacaoDto extends createZodDto(criarOfertaIndicacaoSchema) {}
