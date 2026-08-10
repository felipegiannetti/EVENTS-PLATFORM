import { createZodDto } from "nestjs-zod";
import { transferirIngressoSchema } from "@events-platform/shared-types";

export class TransferirIngressoDto extends createZodDto(transferirIngressoSchema) {}
