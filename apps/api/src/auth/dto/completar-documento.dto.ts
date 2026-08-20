import { createZodDto } from "nestjs-zod";
import { completarDocumentoSchema } from "@events-platform/shared-types";

export class CompletarDocumentoDto extends createZodDto(completarDocumentoSchema) {}
