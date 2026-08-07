import { SetMetadata } from "@nestjs/common";
import type { PapelEvento, PapelGlobal } from "@events-platform/shared-types";

export const ROLES_KEY = "roles";
export const EVENT_ROLES_KEY = "eventRoles";

/** Usado com RolesGuard — restringe a rota por Usuario.papelGlobal (hoje só "admin_geral"). */
export const Roles = (...roles: PapelGlobal[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Usado com EventRoleGuard — restringe a rota pelo papel mínimo do usuário no evento (via PapelAcesso).
 * A rota precisa ter um param `:id` ou `:eventoId` identificando o evento.
 */
export const EventRoles = (...roles: PapelEvento[]) => SetMetadata(EVENT_ROLES_KEY, roles);
