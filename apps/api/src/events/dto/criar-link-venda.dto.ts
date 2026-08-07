import { createZodDto } from "nestjs-zod";
import { criarLinkVendaSchema } from "@events-platform/shared-types";

export class CriarLinkVendaDto extends createZodDto(criarLinkVendaSchema) {}
