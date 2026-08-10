import type { StatusReserva } from "@events-platform/shared-types";

export class ReservaModel {
  constructor(
    public readonly id: string,
    public readonly loteId: string,
    public readonly status: StatusReserva,
    public readonly expiraEm: Date,
    public readonly compradorEmail: string | null,
    public readonly criadoEm: Date,
  ) {}
}
