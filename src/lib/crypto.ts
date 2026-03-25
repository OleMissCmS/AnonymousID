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

function trimEnvQuotes(value: string): string {
  const t = value.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/**
 * HMAC key: base64 raw bytes if that decodes to a non-empty buffer; otherwise UTF-8 bytes of the string.
 * (Plain passphrases in Vercel env are common and should work.)
 */
export function getHmacSecret(): Buffer {
  const raw = trimEnvQuotes(requireEnv("HMAC_SECRET"));
  const fromB64 = Buffer.from(raw, "base64");
  if (fromB64.length > 0) return fromB64;
  return Buffer.from(raw, "utf8");
}

/**
 * AES-256 key (32 bytes): base64 if it decodes to 32 bytes; else 64-char hex; else SHA-256(UTF-8).
 */
export function getEncKey(): Buffer {
  const raw = trimEnvQuotes(requireEnv("ENC_KEY"));
  const fromB64 = Buffer.from(raw, "base64");
  if (fromB64.length === 32) return fromB64;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return crypto.createHash("sha256").update(raw, "utf8").digest();
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

