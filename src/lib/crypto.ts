import crypto from "node:crypto";

const TEXT_ENCODER = new TextEncoder();

export function canonicalizeStudentId(studentId: string): string {
  // Keep canonicalization consistent so the same ID always produces the same lookup hash.
  return studentId.trim().normalize("NFC");
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function decodeBase64ToBuffer(name: string, expectedBytes?: number): Buffer {
  // Expect base64-encoded raw bytes.
  const value = requireEnv(name);
  const buf = Buffer.from(value, "base64");

  if (buf.length === 0) {
    throw new Error(`${name} did not decode from base64`);
  }
  if (expectedBytes != null && buf.length !== expectedBytes) {
    throw new Error(`${name} must decode to exactly ${expectedBytes} bytes (got ${buf.length})`);
  }

  return buf;
}

export function getHmacSecret(): Buffer {
  // No strict length requirement for HMAC; we just validate it decodes.
  return decodeBase64ToBuffer("HMAC_SECRET");
}

export function getEncKey(): Buffer {
  // AES-256-GCM key size is 32 bytes.
  return decodeBase64ToBuffer("ENC_KEY", 32);
}

export function computeLookupHash(canonicalStudentId: string): string {
  const secret = getHmacSecret();

  return crypto
    .createHmac("sha256", secret)
    .update(canonicalStudentId, "utf8")
    .digest("hex");
}

export type EncryptedString = {
  ciphertextB64: string;
  ivB64: string;
  tagB64: string;
};

export function encryptString(plaintext: string): EncryptedString {
  const key = getEncKey();

  // 96-bit IV is recommended for GCM.
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(TEXT_ENCODER.encode(plaintext)),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    ciphertextB64: ciphertext.toString("base64"),
    ivB64: iv.toString("base64"),
    tagB64: tag.toString("base64"),
  };
}

export function decryptString(enc: EncryptedString): string {
  const key = getEncKey();

  const iv = Buffer.from(enc.ivB64, "base64");
  const tag = Buffer.from(enc.tagB64, "base64");
  const ciphertext = Buffer.from(enc.ciphertextB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return new TextDecoder().decode(plaintext);
}

