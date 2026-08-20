import { createZodDto } from "nestjs-zod";
import { confirmarEmailSchema } from "@events-platform/shared-types";

export class ConfirmarEmailDto extends createZodDto(confirmarEmailSchema) {}
