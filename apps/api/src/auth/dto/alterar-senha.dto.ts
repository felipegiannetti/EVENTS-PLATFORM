import { createZodDto } from "nestjs-zod";
import { alterarSenhaSchema } from "@events-platform/shared-types";

export class AlterarSenhaDto extends createZodDto(alterarSenhaSchema) {}
