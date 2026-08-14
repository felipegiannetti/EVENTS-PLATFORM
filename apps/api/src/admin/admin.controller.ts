import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../security/decorators/current-user.decorator";
import { Roles } from "../security/decorators/roles.decorator";
import { RolesGuard } from "../security/guards/roles.guard";
import type { AuthenticatedUser } from "../security/types/authenticated-request";
import { AdminService } from "./admin.service";
import { CriarAcordoComercialDto } from "./dto/criar-acordo-comercial.dto";
import { CriarFeatureFlagDto } from "./dto/criar-feature-flag.dto";

@Controller("admin")
@UseGuards(RolesGuard)
@Roles("admin_geral")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("organizadores")
  listarOrganizadores() {
    return this.adminService.listarOrganizadores();
  }

  @Post("acordos")
  criarAcordo(@Body() dto: CriarAcordoComercialDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.criarAcordo(dto, admin.id);
  }

  @Patch("acordos/:id/desativar")
  desativarAcordo(@Param("id") id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.desativarAcordo(id, admin.id);
  }

  @Patch("acordos/:id/reativar")
  reativarAcordo(@Param("id") id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.reativarAcordo(id, admin.id);
  }

  @Get("eventos")
  listarEventos(@Query("busca") busca?: string) {
    return this.adminService.listarEventos(busca);
  }

  @Get("feature-flags")
  listarFeatureFlags() {
    return this.adminService.listarFeatureFlags();
  }

  @Post("feature-flags")
  criarFeatureFlag(@Body() dto: CriarFeatureFlagDto) {
    return this.adminService.criarFeatureFlag(dto);
  }

  @Patch("feature-flags/:id/alternar")
  alternarFeatureFlag(@Param("id") id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.alternarFeatureFlag(id, admin.id);
  }

  @Get("financeiro")
  buscarFinanceiro() {
    return this.adminService.buscarFinanceiro();
  }

  @Get("auditoria")
  listarAuditoria(@Query("busca") busca?: string) {
    return this.adminService.listarAuditoria(busca);
  }
}
