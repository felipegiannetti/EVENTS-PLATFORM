import { createZodDto } from "nestjs-zod";
import { emitirIngressoSchema } from "@events-platform/shared-types";

export class EmitirIngressoDto extends createZodDto(emitirIngressoSchema) {}
