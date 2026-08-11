import { createZodDto } from "nestjs-zod";
import { confirmarContaIndicacaoSchema } from "@events-platform/shared-types";

export class ConfirmarContaIndicacaoDto extends createZodDto(confirmarContaIndicacaoSchema) {}
