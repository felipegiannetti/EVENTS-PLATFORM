import { createZodDto } from "nestjs-zod";
import { criarReservaSchema } from "@events-platform/shared-types";

export class CriarReservaDto extends createZodDto(criarReservaSchema) {}
