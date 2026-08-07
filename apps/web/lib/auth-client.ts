import type { AuthResponse, LoginInput, RegisterInput } from "@events-platform/shared-types";
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
