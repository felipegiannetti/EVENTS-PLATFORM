import {
  calcularPartesProgramaIndicacao,
  percentualMaximoAcordoAdmin,
} from "./distribuicao-taxa.util";

describe("distribuição da taxa do programa de indicação", () => {
  it("não cria parcelas de indicação para organizador sem vínculo", () => {
    expect(calcularPartesProgramaIndicacao(null)).toEqual({
      percentualBeneficioOrganizador: 0,
      percentualIndicadorBase: 0,
      percentualBonusIndicador: 0,
      percentualTotalIndicador: 0,
    });
  });

  it("aplica 0,25% fixos desde o primeiro evento e bônus sobre a economia negociada", () => {
    expect(calcularPartesProgramaIndicacao(1)).toEqual({
      percentualBeneficioOrganizador: 1,
      percentualIndicadorBase: 0.25,
      percentualBonusIndicador: 0.25,
      percentualTotalIndicador: 0.5,
    });
  });

  it("mantém 0,25% de base em todos os eventos", () => {
    expect(calcularPartesProgramaIndicacao(1)).toEqual({
      percentualBeneficioOrganizador: 1,
      percentualIndicadorBase: 0.25,
      percentualBonusIndicador: 0.25,
      percentualTotalIndicador: 0.5,
    });
  });

  it("reserva a comissão fixa e o bônus ao limitar o acordo do ADMIN", () => {
    expect(percentualMaximoAcordoAdmin(1)).toBe(10.5);
    expect(percentualMaximoAcordoAdmin(2)).toBe(9.75);
    expect(percentualMaximoAcordoAdmin(null)).toBe(12);
  });
});
