import type {
  AlterarEmailInput,
  AlterarSenhaInput,
  AtualizarPerfilInput,
  AuthResponse,
  DeletarContaInput,
  LoginInput,
  ReenviarConfirmacaoEmailResponse,
  RegisterInput,
  UsuarioResponse,
} from "@events-platform/shared-types";
import { apiFetch } from "./api-client";

export function registerRequest(input: RegisterInput) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginRequest(input: LoginInput) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function refreshRequest() {
  return apiFetch<AuthResponse>("/auth/refresh", { method: "POST", body: JSON.stringify({}) });
}

export function logoutRequest(accessToken: string) {
  return apiFetch<void>(
    "/auth/logout",
    { method: "POST", body: JSON.stringify({}) },
    accessToken,
  );
}

export function buscarPerfil(token: string) {
  return apiFetch<UsuarioResponse>("/auth/me", {}, token);
}

export function atualizarPerfil(input: AtualizarPerfilInput, token: string) {
  return apiFetch<UsuarioResponse>(
    "/auth/me",
    { method: "PATCH", body: JSON.stringify(input) },
    token,
  );
}

export function alterarEmail(input: AlterarEmailInput, token: string) {
  return apiFetch<UsuarioResponse>(
    "/auth/me/email",
    { method: "PATCH", body: JSON.stringify(input) },
    token,
  );
}

export function alterarSenha(input: AlterarSenhaInput, token: string) {
  return apiFetch<void>(
    "/auth/me/senha",
    { method: "PATCH", body: JSON.stringify(input) },
    token,
  );
}

export function deletarConta(input: DeletarContaInput, token: string) {
  return apiFetch<void>(
    "/auth/me",
    { method: "DELETE", body: JSON.stringify(input) },
    token,
  );
}

export function confirmarEmail(token: string) {
  return apiFetch<void>("/auth/confirmar-email", { method: "POST", body: JSON.stringify({ token }) });
}

export function reenviarConfirmacaoEmail(token: string) {
  return apiFetch<ReenviarConfirmacaoEmailResponse>(
    "/auth/reenviar-confirmacao",
    { method: "POST", body: JSON.stringify({}) },
    token,
  );
}
