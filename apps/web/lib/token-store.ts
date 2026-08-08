/**
 * Ponte fora do React entre apiFetch (função pura, sem acesso a contexto) e o AuthProvider —
 * quando apiFetch renova o access token sozinho (ver api-client.ts), avisa aqui pra o
 * AuthProvider atualizar o estado em memória também, senão a próxima chamada explícita que uma
 * página fizer usaria o token antigo de novo (funcionaria, só faria uma renovação redundante).
 */
type Ouvinte = (token: string) => void;

let ouvinte: Ouvinte | null = null;

export function registrarOuvinteDeRenovacao(fn: Ouvinte | null): void {
  ouvinte = fn;
}

export function avisarTokenRenovado(token: string): void {
  ouvinte?.(token);
}
