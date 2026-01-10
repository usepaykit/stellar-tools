import jwt from "jsonwebtoken";

export class JWT {
  constructor() {}

  async sign(
    payload: string | object | Buffer<ArrayBufferLike>,
    expiresIn: Parameters<typeof jwt.sign>[2]["expiresIn"]
  ) {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn,
      issuer: process.env.JWT_ISSUER!,
      audience: process.env.JWT_AUDIENCE!,
    });
  }

  async verify(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: process.env.JWT_ISSUER!,
      audience: process.env.JWT_AUDIENCE!,
    });
  }
}
