import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITMO = "aes-256-gcm";

/**
 * Criptografia reversível (não hash) para campos sensíveis que o app precisa reler em texto puro
 * mais tarde (ex: enviar pro gateway de pagamento) — diferente de senha, que é hash de mão única.
 * Formato de saída: `iv.authTag.ciphertext`, tudo hex. A chave nunca fica no banco — só em
 * CONTA_BANCARIA_ENCRYPTION_KEY (32 bytes; gerar com `openssl rand -hex 32`).
 */
export function criptografar(textoPuro: string, chaveHex: string): string {
  const chave = Buffer.from(chaveHex, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITMO, chave, iv);
  const ciphertext = Buffer.concat([cipher.update(textoPuro, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${authTag.toString("hex")}.${ciphertext.toString("hex")}`;
}

export function descriptografar(valorCriptografado: string, chaveHex: string): string {
  const [ivHex, authTagHex, ciphertextHex] = valorCriptografado.split(".");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Valor criptografado em formato inesperado (esperava iv.authTag.ciphertext).");
  }
  const chave = Buffer.from(chaveHex, "hex");
  const decipher = createDecipheriv(ALGORITMO, chave, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const textoPuro = Buffer.concat([decipher.update(Buffer.from(ciphertextHex, "hex")), decipher.final()]);
  return textoPuro.toString("utf8");
}
