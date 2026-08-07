import type { Request } from "express";
import type { PapelGlobal } from "@events-platform/shared-types";

export interface AuthenticatedUser {
  id: string;
  email: string;
  papelGlobal: PapelGlobal;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
