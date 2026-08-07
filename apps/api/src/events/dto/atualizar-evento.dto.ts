import { createZodDto } from "nestjs-zod";
import { atualizarEventoSchema } from "@events-platform/shared-types";

export class AtualizarEventoDto extends createZodDto(atualizarEventoSchema) {}
