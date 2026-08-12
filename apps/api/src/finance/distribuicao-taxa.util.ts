export const TAXA_SERVICO_PERCENTUAL = 12;
export const ACORDO_ADMIN_MAXIMO_PERCENTUAL = 4;
export const BENEFICIO_MAXIMO_INDICACAO_ORGANIZADOR = 2;
export const BONUS_ECONOMIA_INDICADOR = 0.25;

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
