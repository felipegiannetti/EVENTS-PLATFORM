import { createZodDto } from "nestjs-zod";
import { atualizarPerfilSchema } from "@events-platform/shared-types";

export class AtualizarPerfilDto extends createZodDto(atualizarPerfilSchema) {}
