"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginInput, RegisterInput, UsuarioResponse } from "@events-platform/shared-types";
import { buscarPerfil, loginRequest, logoutRequest, refreshRequest, registerRequest } from "./auth-client";
import { registrarOuvinteDeRenovacao } from "./token-store";

interface AuthContextValue {
  accessToken: string | null;
  /** null enquanto não resolvido OU deslogado — nunca confundir com "carregando". Alimenta gates por papel (ex: somenteAdmin em ProtectedPage). */
  usuario: UsuarioResponse | null;
  carregando: boolean;
  login: (input: LoginInput) => Promise<void>;
  registrar: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Usado só pela página /entrar-google — o refresh token já veio via cookie no redirect do backend, só falta guardar o access token recebido na query string. */
  definirSessaoExterna: (accessToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Guarda o access token só em memória (nunca em localStorage — evita exposição a XSS).
 * Ao montar, tenta um refresh silencioso usando o cookie httpOnly — é assim que a sessão
 * de 90 dias (ver docs/architecture/09) sobrevive a um F5 na página sem pedir login de novo.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioResponse | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    refreshRequest()
      .then(async (sessao) => {
        setAccessToken(sessao.accessToken);
        setUsuario(await buscarPerfil(sessao.accessToken).catch(() => null));
      })
      .catch(() => setAccessToken(null))
      .finally(() => setCarregando(false));

    registrarOuvinteDeRenovacao(setAccessToken);
    return () => registrarOuvinteDeRenovacao(null);
  }, []);

  async function login(input: LoginInput) {
    const sessao = await loginRequest(input);
    setAccessToken(sessao.accessToken);
    setUsuario(await buscarPerfil(sessao.accessToken).catch(() => null));
  }

  async function registrar(input: RegisterInput) {
    const sessao = await registerRequest(input);
    setAccessToken(sessao.accessToken);
    setUsuario(await buscarPerfil(sessao.accessToken).catch(() => null));
  }

  async function logout() {
    if (accessToken) {
      await logoutRequest(accessToken).catch(() => undefined);
    }
    setAccessToken(null);
    setUsuario(null);
  }

  async function definirSessaoExterna(token: string) {
    setAccessToken(token);
    setUsuario(await buscarPerfil(token).catch(() => null));
  }

  return (
    <AuthContext.Provider value={{ accessToken, usuario, carregando, login, registrar, logout, definirSessaoExterna }}>
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
