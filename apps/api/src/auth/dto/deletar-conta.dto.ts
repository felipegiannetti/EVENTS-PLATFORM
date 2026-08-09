import { createZodDto } from "nestjs-zod";
import { deletarContaSchema } from "@events-platform/shared-types";

export class DeletarContaDto extends createZodDto(deletarContaSchema) {}
