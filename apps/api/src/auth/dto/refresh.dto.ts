import { createZodDto } from "nestjs-zod";
import { refreshSchema } from "@events-platform/shared-types";

/** refreshToken é opcional no corpo — o mobile manda aqui, o web manda via cookie httpOnly (ver auth.controller.ts). */
export class RefreshDto extends createZodDto(refreshSchema) {}
