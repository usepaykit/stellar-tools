export class SignatureVerificationError extends Error {
  constructor(message: string) {
    super();
    this.name = "SignatureVerificationError";
    this.message = message;
  }
}
