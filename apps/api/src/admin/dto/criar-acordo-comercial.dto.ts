import { createZodDto } from "nestjs-zod";
import { criarAcordoComercialSchema } from "@events-platform/shared-types";

export class CriarAcordoComercialDto extends createZodDto(criarAcordoComercialSchema) {}
