import { createZodDto } from "nestjs-zod";
import { criarEventoSchema } from "@events-platform/shared-types";

export class CriarEventoDto extends createZodDto(criarEventoSchema) {}
