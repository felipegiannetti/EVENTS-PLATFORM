import { createZodDto } from "nestjs-zod";
import { loginSchema } from "@events-platform/shared-types";

export class LoginDto extends createZodDto(loginSchema) {}
