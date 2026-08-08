import { createZodDto } from "nestjs-zod";
import { alterarEmailSchema } from "@events-platform/shared-types";

export class AlterarEmailDto extends createZodDto(alterarEmailSchema) {}
