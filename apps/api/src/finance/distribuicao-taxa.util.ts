export const TAXA_SERVICO_PERCENTUAL = 12;
export const ACORDO_ADMIN_MAXIMO_PERCENTUAL = 4;
export const BENEFICIO_MAXIMO_INDICACAO_ORGANIZADOR = 2;
export const BONUS_ECONOMIA_INDICADOR = 0.25;

/**
 * Ingresso anunciado abaixo de R$50 paga, além da taxa de serviço normal, um adicional fixo de
 * R$0,49 por ingresso — repassado à plataforma pra cobrir o custo fixo do gateway de pagamento
 * (que cobra mais que 12% em cima de um valor baixo). 100% desse valor fica com a NOVYX: nunca
 * passa pelo AcordoComercial nem pelo programa de indicação, mesmo racional do adicional de 10%
 * do cancelamento flexível (ver docs/architecture/12-pagamentos-e-repasses.md).
 */
export const LIMITE_PRECO_TAXA_FIXA_GATEWAY = 50;
export const TAXA_FIXA_GATEWAY_INGRESSO_BAIXO_VALOR = 0.49;

export interface PartesProgramaIndicacao {
  percentualBeneficioOrganizador: number;
  percentualIndicadorBase: number;
  percentualBonusIndicador: number;
  percentualTotalIndicador: number;
}

export function calcularPartesProgramaIndicacao(
  percentualBeneficioOrganizador: number | null,
): PartesProgramaIndicacao {
  if (percentualBeneficioOrganizador === null) {
    return {
      percentualBeneficioOrganizador: 0,
      percentualIndicadorBase: 0,
      percentualBonusIndicador: 0,
      percentualTotalIndicador: 0,
    };
  }
  const beneficio = Math.min(BENEFICIO_MAXIMO_INDICACAO_ORGANIZADOR, Math.max(0, percentualBeneficioOrganizador));
  const base = 0.25;
  const bonus = (BENEFICIO_MAXIMO_INDICACAO_ORGANIZADOR - beneficio) * BONUS_ECONOMIA_INDICADOR;
  return {
    percentualBeneficioOrganizador: beneficio,
    percentualIndicadorBase: base,
    percentualBonusIndicador: bonus,
    percentualTotalIndicador: base + bonus,
  };
}

export function percentualMaximoAcordoAdmin(percentualBeneficioOrganizador: number | null): number {
  const programa = calcularPartesProgramaIndicacao(percentualBeneficioOrganizador);
  const disponivel = TAXA_SERVICO_PERCENTUAL - programa.percentualBeneficioOrganizador - programa.percentualTotalIndicador;
  return Math.min(ACORDO_ADMIN_MAXIMO_PERCENTUAL, disponivel);
}
