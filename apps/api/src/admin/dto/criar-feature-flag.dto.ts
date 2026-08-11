import { createZodDto } from "nestjs-zod";
import { criarFeatureFlagSchema } from "@events-platform/shared-types";

export class CriarFeatureFlagDto extends createZodDto(criarFeatureFlagSchema) {}
