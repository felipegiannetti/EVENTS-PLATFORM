import { createZodDto } from "nestjs-zod";
import { convidarAcessoSchema } from "@events-platform/shared-types";

export class ConvidarAcessoDto extends createZodDto(convidarAcessoSchema) {}
