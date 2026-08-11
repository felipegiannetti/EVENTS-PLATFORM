import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CurrentUser } from "../security/decorators/current-user.decorator";
import { Public } from "../security/decorators/public.decorator";
import type { AuthenticatedUser } from "../security/types/authenticated-request";
import { CriarOfertaIndicacaoDto } from "./dto/criar-oferta-indicacao.dto";
import { CriarProgramaIndicacaoDto } from "./dto/criar-programa-indicacao.dto";
import { ReferralsService } from "./referrals.service";

@Controller("referrals")
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Public()
  @Get("ofertas/:codigo")
  buscarOferta(@Param("codigo") codigo: string) {
    return this.referralsService.buscarOfertaPublica(codigo);
  }

  @Get("me")
  painel(@CurrentUser() usuario: AuthenticatedUser) {
    return this.referralsService.buscarPainel(usuario.id);
  }

  @Post("me")
  criarPrograma(@CurrentUser() usuario: AuthenticatedUser, @Body() dto: CriarProgramaIndicacaoDto) {
    return this.referralsService.criarPrograma(usuario.id, dto);
  }

  @Post("me/ofertas")
  criarOferta(@CurrentUser() usuario: AuthenticatedUser, @Body() dto: CriarOfertaIndicacaoDto) {
    return this.referralsService.criarOferta(usuario.id, dto.percentualBeneficioOrganizador);
  }
}
