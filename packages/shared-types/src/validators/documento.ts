/**
 * Validação de CPF/CNPJ com dígito verificador real (algoritmo oficial da Receita Federal),
 * não só checagem de tamanho — pega documento com dígitos trocados/inventados antes de ir pro banco.
 * Usado em conta-bancaria.schema.ts (titular pode ser PF ou PJ).
 */

/** Normaliza CPF/CNPJ pra só dígitos — forma canônica usada antes de criptografar/hashear no backend, pra "123.456.789-00" e "12345678900" não virarem registros diferentes. */
export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function validarCpf(valor: string): boolean {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digitos = cpf.split("").map(Number);
  const calcular = (fatorInicial: number) => {
    let soma = 0;
    for (let i = 0; i < fatorInicial - 1; i++) {
      soma += (digitos[i] ?? 0) * (fatorInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcular(10) === digitos[9] && calcular(11) === digitos[10];
}

export function validarCnpj(valor: string): boolean {
  const cnpj = apenasDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const digitos = cnpj.split("").map(Number);
  const calcular = (pesos: number[]) => {
    const soma = pesos.reduce((acc, peso, i) => acc + peso * (digitos[i] ?? 0), 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcular([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const digito2 = calcular([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return digito1 === digitos[12] && digito2 === digitos[13];
}

/** PF (CPF) ou PJ (CNPJ) — decide qual algoritmo aplicar pela quantidade de dígitos. */
export function validarCpfOuCnpj(valor: string): boolean {
  const digitos = apenasDigitos(valor);
  if (digitos.length === 11) return validarCpf(digitos);
  if (digitos.length === 14) return validarCnpj(digitos);
  return false;
}
