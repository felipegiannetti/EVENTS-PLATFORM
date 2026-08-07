import { createZodDto } from "nestjs-zod";
import { cadastrarContaBancariaSchema } from "@events-platform/shared-types";

export class CadastrarContaBancariaDto extends createZodDto(cadastrarContaBancariaSchema) {}
