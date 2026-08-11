import {
  calcularPartesProgramaIndicacao,
  percentualMaximoAcordoAdmin,
} from "./distribuicao-taxa.util";

describe("distribuição da taxa do programa de indicação", () => {
  it("não cria parcelas de indicação para organizador sem vínculo", () => {
    expect(calcularPartesProgramaIndicacao(null, true)).toEqual({
      percentualBeneficioOrganizador: 0,
      percentualIndicadorBase: 0,
      percentualBonusIndicador: 0,
      percentualTotalIndicador: 0,
    });
  });

  it("aplica 1% de base no primeiro evento e bônus sobre a economia negociada", () => {
    expect(calcularPartesProgramaIndicacao(1, true)).toEqual({
      percentualBeneficioOrganizador: 1,
      percentualIndicadorBase: 1,
      percentualBonusIndicador: 0.25,
      percentualTotalIndicador: 1.25,
    });
  });

  it("aplica 0,25% de base nos eventos seguintes para sempre", () => {
    expect(calcularPartesProgramaIndicacao(1, false)).toEqual({
      percentualBeneficioOrganizador: 1,
      percentualIndicadorBase: 0.25,
      percentualBonusIndicador: 0.25,
      percentualTotalIndicador: 0.5,
    });
  });

  it("reserva o pior caso do primeiro evento ao limitar o acordo do ADMIN", () => {
    expect(percentualMaximoAcordoAdmin(1)).toBe(9.75);
    expect(percentualMaximoAcordoAdmin(2)).toBe(9);
    expect(percentualMaximoAcordoAdmin(null)).toBe(12);
  });
});
