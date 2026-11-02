export class AdtunisActionError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AdtunisActionError";
    this.status = status;
  }
}
