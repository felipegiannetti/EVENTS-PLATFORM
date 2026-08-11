import { createZodDto } from "nestjs-zod";
import {
  atualizarListaOffGrupoSchema,
  atualizarPessoaListaOffSchema,
  criarListaOffGrupoSchema,
  importarPessoasListaOffSchema,
} from "@events-platform/shared-types";

export class CriarListaOffGrupoDto extends createZodDto(criarListaOffGrupoSchema) {}
export class AtualizarListaOffGrupoDto extends createZodDto(atualizarListaOffGrupoSchema) {}
export class ImportarPessoasListaOffDto extends createZodDto(importarPessoasListaOffSchema) {}
export class AtualizarPessoaListaOffDto extends createZodDto(atualizarPessoaListaOffSchema) {}
