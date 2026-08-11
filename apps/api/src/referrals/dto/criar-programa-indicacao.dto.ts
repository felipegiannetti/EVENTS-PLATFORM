import { createZodDto } from "nestjs-zod";
import { criarProgramaIndicacaoSchema } from "@events-platform/shared-types";

export class CriarProgramaIndicacaoDto extends createZodDto(criarProgramaIndicacaoSchema) {}
