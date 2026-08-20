import { createZodDto } from "nestjs-zod";
import { confirmarExclusaoContaSchema } from "@events-platform/shared-types";

export class ConfirmarExclusaoContaDto extends createZodDto(confirmarExclusaoContaSchema) {}
