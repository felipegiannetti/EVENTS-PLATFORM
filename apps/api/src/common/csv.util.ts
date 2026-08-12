/** Escapa um campo pra CSV (aspas duplas se tiver vírgula/aspas/quebra de linha) — usado por qualquer exportação CSV do sistema. */
export function escaparCampoCsv(valor: string): string {
  if (valor.includes(",") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/** Monta o texto CSV completo (cabeçalho + linhas) a partir de arrays de campos já na ordem certa. */
export function montarCsv(cabecalho: string[], linhas: string[][]): string {
  const todasAsLinhas = [cabecalho, ...linhas];
  return todasAsLinhas.map((linha) => linha.map(escaparCampoCsv).join(",")).join("\r\n");
}
