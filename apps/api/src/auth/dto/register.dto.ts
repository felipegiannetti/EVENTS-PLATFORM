import { createZodDto } from "nestjs-zod";
import { registerSchema } from "@events-platform/shared-types";

export class RegisterDto extends createZodDto(registerSchema) {}
