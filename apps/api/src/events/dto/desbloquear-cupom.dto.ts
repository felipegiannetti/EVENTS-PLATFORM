import { createZodDto } from "nestjs-zod";
import { desbloquearCupomSchema } from "@events-platform/shared-types";

export class DesbloquearCupomDto extends createZodDto(desbloquearCupomSchema) {}
