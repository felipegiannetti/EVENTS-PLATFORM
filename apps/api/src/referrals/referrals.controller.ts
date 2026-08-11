import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "../security/decorators/current-user.decorator";
import { Public } from "../security/decorators/public.decorator";
import type { AuthenticatedUser } from "../security/types/authenticated-request";
import { CriarOfertaIndicacaoDto } from "./dto/criar-oferta-indicacao.dto";
import { CriarProgramaIndicacaoDto } from "./dto/criar-programa-indicacao.dto";
import { ReferralsService } from "./referrals.service";
import { ConfirmarContaIndicacaoDto } from "./dto/confirmar-conta-indicacao.dto";

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

  @Post("me/conta")
  solicitarConta(@CurrentUser() usuario: AuthenticatedUser, @Body() dto: CriarProgramaIndicacaoDto) {
    return this.referralsService.solicitarConfirmacaoConta(usuario.id, dto);
  }

  @Public()
  @Post("conta/confirmar")
  confirmarConta(@Body() dto: ConfirmarContaIndicacaoDto) {
    return this.referralsService.confirmarConta(dto.token);
  }

  @Post("me/ofertas")
  criarOferta(@CurrentUser() usuario: AuthenticatedUser, @Body() dto: CriarOfertaIndicacaoDto) {
    return this.referralsService.criarOferta(usuario.id, dto.percentualBeneficioOrganizador);
  }

  @Patch("me/ofertas/:id")
  editarOferta(@CurrentUser() usuario: AuthenticatedUser, @Param("id") id: string, @Body() dto: CriarOfertaIndicacaoDto) {
    return this.referralsService.editarOferta(usuario.id, id, dto.percentualBeneficioOrganizador);
  }

  @Delete("me/ofertas/:id")
  removerOferta(@CurrentUser() usuario: AuthenticatedUser, @Param("id") id: string) {
    return this.referralsService.removerOferta(usuario.id, id);
  }
}
