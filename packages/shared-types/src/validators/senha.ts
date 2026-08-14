/** Lista curta das senhas mais comuns/óbvias — bloqueio simples, não substitui checagem contra vazamentos reais (fora de escopo). */
const SENHAS_COMUNS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "senha123",
  "qwerty123",
  "abc12345",
  "11111111",
  "00000000",
  "87654321",
]);

/** Exige minúscula + maiúscula + número, e recusa as senhas mais óbvias — não pede caractere especial pra não frustrar o usuário à toa. */
export function senhaEhForte(senha: string): boolean {
  if (SENHAS_COMUNS.has(senha.toLowerCase())) return false;
  if (!/[a-z]/.test(senha)) return false;
  if (!/[A-Z]/.test(senha)) return false;
  if (!/[0-9]/.test(senha)) return false;
  return true;
}

export const MENSAGEM_SENHA_FRACA =
  "A senha deve ter ao menos uma letra maiúscula, uma minúscula e um número, e não pode ser uma senha óbvia.";
