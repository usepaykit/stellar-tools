import crypto from "crypto";

export class WebhooksExternal {
  constructor() {}

  generateSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;

    const hmac = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    return `t=${timestamp},v1=${hmac}`;
  }

  verifySignature(
    payload: string,
    signature: string,
    secret: string,
    tolerance: number = 300
  ): boolean {
    try {
      const parts = signature.split(",");
      const timestamp = parseInt(parts[0].split("=")[1]);
      const receivedSignature = parts[1].split("=")[1];

      const now = Math.floor(Date.now() / 1000);

      if (Math.abs(now - timestamp) > tolerance) return false;

      const signedPayload = `${timestamp}.${payload}`;

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(signedPayload)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }
}
