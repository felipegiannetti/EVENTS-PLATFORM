/**
 * Escapa texto antes de interpolar em um template de email HTML. Necessário pra qualquer valor
 * que venha de input do organizador (nome do evento, endereço, nome do lote, nome do comprador)
 * — sem isso, um organizador mal-intencionado poderia injetar HTML/script nos emails que a
 * plataforma manda pros compradores de verdade.
 */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
