import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { EventRoleGuard } from "../security/guards/event-role.guard";
import { EmailConfirmadoGuard } from "../security/guards/email-confirmado.guard";
import { EventRoles } from "../security/decorators/roles.decorator";
import { FinanceService } from "./finance.service";
import { ContaBancariaMapper } from "./mapper/conta-bancaria.mapper";
import { CadastrarContaBancariaDto } from "./dto/cadastrar-conta-bancaria.dto";

const PAPEIS_LEITURA = ["owner", "gestor", "view"] as const;

/**
 * Conta de repasse é POR EVENTO, não por organizador — o mesmo organizador pode rodar eventos
 * com contas de repasse diferentes. Cadastrada na 2ª etapa da criação do evento
 * (ver apps/web/app/eventos/novo/conta-repasse/page.tsx).
 */
@Controller("events/:id")
@UseGuards(EventRoleGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly contaBancariaMapper: ContaBancariaMapper,
  ) {}

  @EventRoles("owner")
  @Get("conta-bancaria")
  async buscarContaBancaria(@Param("id") eventoId: string) {
    const conta = await this.financeService.buscarContaBancaria(eventoId);
    return this.contaBancariaMapper.toResponse(conta);
  }

  @EventRoles("owner")
  @UseGuards(EmailConfirmadoGuard)
  @Put("conta-bancaria")
  async cadastrarContaBancaria(
    @Param("id") eventoId: string,
    @Body() dto: CadastrarContaBancariaDto,
  ) {
    const conta = await this.financeService.cadastrarContaBancaria(eventoId, dto);
    return this.contaBancariaMapper.toResponse(conta);
  }

  @EventRoles(...PAPEIS_LEITURA)
  @Get("financeiro/resumo")
  async resumoFinanceiro(@Param("id") eventoId: string) {
    return this.financeService.buscarResumoFinanceiro(eventoId);
  }
}
