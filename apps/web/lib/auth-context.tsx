"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginInput, RegisterInput } from "@events-platform/shared-types";
import { loginRequest, logoutRequest, refreshRequest, registerRequest } from "./auth-client";

interface AuthContextValue {
  accessToken: string | null;
  carregando: boolean;
  login: (input: LoginInput) => Promise<void>;
  registrar: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Guarda o access token só em memória (nunca em localStorage — evita exposição a XSS).
 * Ao montar, tenta um refresh silencioso usando o cookie httpOnly — é assim que a sessão
 * de 90 dias (ver docs/architecture/09) sobrevive a um F5 na página sem pedir login de novo.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    refreshRequest()
      .then((sessao) => setAccessToken(sessao.accessToken))
      .catch(() => setAccessToken(null))
      .finally(() => setCarregando(false));
  }, []);

  async function login(input: LoginInput) {
    const sessao = await loginRequest(input);
    setAccessToken(sessao.accessToken);
  }

  async function registrar(input: RegisterInput) {
    const sessao = await registerRequest(input);
    setAccessToken(sessao.accessToken);
  }

  async function logout() {
    if (accessToken) {
      await logoutRequest(accessToken).catch(() => undefined);
    }
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ accessToken, carregando, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  }
  return ctx;
}
