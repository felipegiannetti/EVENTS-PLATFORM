import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../security/decorators/current-user.decorator";
import { Roles } from "../security/decorators/roles.decorator";
import { RolesGuard } from "../security/guards/roles.guard";
import type { AuthenticatedUser } from "../security/types/authenticated-request";
import { AdminService } from "./admin.service";
import { CriarAcordoComercialDto } from "./dto/criar-acordo-comercial.dto";

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
}
