import crypto from "crypto";

export class Encryption {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;

  private getEncryptionKey(version: number): Buffer {
    const key = process.env[`MASTER_ENCRYPTION_KEY_V${version}`];

    if (!key) {
      throw new Error(`Encryption key version ${version} not found`);
    }

    const salt = Buffer.from(process.env.ENCRYPTION_SALT!, "hex");
    return crypto.pbkdf2Sync(key, salt, 100000, this.keyLength, "sha512");
  }

  encrypt(plaintext: string, version: number) {
    const key = this.getEncryptionKey(version);

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return iv.toString("hex") + authTag.toString("hex") + encrypted;
  }

  decrypt(encrypted: string, version: number): string {
    const key = this.getEncryptionKey(version);

    const ivHex = encrypted.slice(0, this.ivLength * 2);
    const authTagHex = encrypted.slice(
      this.ivLength * 2,
      (this.ivLength + this.tagLength) * 2
    );
    const encryptedHex = encrypted.slice((this.ivLength + this.tagLength) * 2);

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  reencrypt(encrypted: string, oldVersion: number, newVersion: number): string {
    const decrypted = this.decrypt(encrypted, oldVersion);
    return this.encrypt(decrypted, newVersion);
  }
}

export const encryption = new Encryption();
