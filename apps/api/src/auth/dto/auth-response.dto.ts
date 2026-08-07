import { createZodDto } from "nestjs-zod";
import { authResponseSchema, usuarioResponseSchema } from "@events-platform/shared-types";

export class AuthResponseDto extends createZodDto(authResponseSchema) {}
export class UsuarioResponseDto extends createZodDto(usuarioResponseSchema) {}
