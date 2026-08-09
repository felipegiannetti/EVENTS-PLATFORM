import { createZodDto } from "nestjs-zod";
import { atualizarIngressoSchema } from "@events-platform/shared-types";

export class AtualizarIngressoDto extends createZodDto(atualizarIngressoSchema) {}
