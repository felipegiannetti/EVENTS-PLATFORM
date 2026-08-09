import { avisarTokenRenovado } from "./token-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

interface Envelope<T> {
  data: T;
}

interface ErrorEnvelope {
  error: { code: string; message: string };
}

let renovacaoEmAndamento: Promise<string | null> | null = null;

/** Um refresh por vez mesmo se várias chamadas 401-arem ao mesmo tempo (ex: Promise.all de uma página). */
function renovarAccessToken(): Promise<string | null> {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) return null;
        const body = (await res.json().catch(() => null)) as Envelope<{ accessToken: string }> | null;
        const novoToken = body?.data?.accessToken;
        if (!novoToken) return null;
        avisarTokenRenovado(novoToken);
        return novoToken;
      } catch {
        return null;
      } finally {
        renovacaoEmAndamento = null;
      }
    })();
  }
  return renovacaoEmAndamento;
}

/**
 * Se o access token (15min) expirou enquanto a página ficou aberta sem navegar, a primeira
 * chamada 401 dispara uma renovação silenciosa via cookie httpOnly e refaz a chamada uma vez —
 * sem isso, qualquer tela aberta por mais de 15min passa a falhar com "Unauthorized" até um F5.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
  _tentandoNovamente = false,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && accessToken && !_tentandoNovamente) {
    const novoToken = await renovarAccessToken();
    if (novoToken) {
      return apiFetch<T>(path, init, novoToken, true);
    }
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = body as ErrorEnvelope | null;
    throw new ApiError(err?.error?.code ?? "ERRO_DESCONHECIDO", err?.error?.message ?? "Falha na requisição.");
  }

  return (body as Envelope<T>).data;
}
