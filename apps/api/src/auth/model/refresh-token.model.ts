export class RefreshTokenModel {
  constructor(
    public readonly id: string,
    public readonly usuarioId: string,
    public readonly tokenHash: string,
    public readonly familyId: string,
    public readonly expiraEm: Date,
    public readonly revogadoEm: Date | null,
  ) {}

  get expirado(): boolean {
    return this.expiraEm.getTime() < Date.now();
  }

  get revogado(): boolean {
    return this.revogadoEm !== null;
  }
}
