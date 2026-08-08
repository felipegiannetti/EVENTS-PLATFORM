/**
 * Hoje a plataforma só opera no Brasil — país fica fixo no formulário de criar evento
 * (não é um campo livre nem um select pro usuário mexer). Modelado como lista (não como uma
 * string solta) de propósito: se um dia expandir pra outro país, é só adicionar um item aqui
 * e trocar o valor fixo do formulário por um <Select> de verdade, sem mexer no schema do banco
 * (Evento.pais já é uma coluna de texto livre, pronta pra isso).
 */
export interface PaisSuportado {
  codigo: string;
  nome: string;
}

export const PAISES_SUPORTADOS: PaisSuportado[] = [{ codigo: "BR", nome: "Brasil" }];

export const PAIS_PADRAO = "Brasil";
