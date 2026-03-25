import { NextResponse } from "next/server";
import {
  canonicalizeStudentId,
  computeLookupHash,
  decryptString,
  encryptString,
  generateAnonymousId,
} from "@/lib/crypto";
import { getLookupKey, getRedisClient } from "@/lib/redis";

export const runtime = "nodejs";

type StoredEncryptedAnonId = {
  anon_id_ciphertext: string;
  anon_id_iv: string;
  anon_id_tag: string;
};

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    let msg = err.message || "Unknown error";
    if (msg.startsWith("Missing required environment variable:")) {
      msg = `${msg} Add it in Vercel: Project → Settings → Environment Variables (Production), then redeploy. Required: HMAC_SECRET, ENC_KEY, AID_KV_REST_API_URL, AID_KV_REST_API_TOKEN.`;
    }
    if (msg.length > 500) return `${msg.slice(0, 497)}...`;
    return msg;
  }
  return "Unexpected error generating anonymous ID";
}

export async function POST(req: Request) {
  try {
    let body: { studentId?: string };
    try {
      body = (await req.json()) as { studentId?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const rawStudentId = body.studentId;

    if (!rawStudentId || typeof rawStudentId !== "string") {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 },
      );
    }

    const canonicalStudentId = canonicalizeStudentId(rawStudentId);
    if (!canonicalStudentId) {
      return NextResponse.json(
        { error: "studentId is empty" },
        { status: 400 },
      );
    }

    const lookupHash = computeLookupHash(canonicalStudentId);
    const redis = getRedisClient();
    const lookupKey = getLookupKey(lookupHash);

    const existing = await redis.get<StoredEncryptedAnonId>(lookupKey);
    if (existing) {
      const row = existing as StoredEncryptedAnonId;
      const anonymousId = decryptString({
        ciphertextB64: row.anon_id_ciphertext,
        ivB64: row.anon_id_iv,
        tagB64: row.anon_id_tag,
      });

      return NextResponse.json({ anonymousId });
    }

    // Create a new 6-char anonymous id (a-z, 0-9) and encrypt before storing.
    const anonymousId = generateAnonymousId();
    const encrypted = encryptString(anonymousId);

    const toStore: StoredEncryptedAnonId = {
      anon_id_ciphertext: encrypted.ciphertextB64,
      anon_id_iv: encrypted.ivB64,
      anon_id_tag: encrypted.tagB64,
    };

    // SET NX ensures "first writer wins" and avoids overwriting on races.
    await redis.set(lookupKey, toStore, { nx: true });

    const stored = await redis.get<StoredEncryptedAnonId>(lookupKey);
    if (!stored) {
      return NextResponse.json(
        { error: "Stored anonymous ID could not be retrieved" },
        { status: 500 },
      );
    }

    const storedRow = stored as StoredEncryptedAnonId;
    const storedAnonymousId = decryptString({
      ciphertextB64: storedRow.anon_id_ciphertext,
      ivB64: storedRow.anon_id_iv,
      tagB64: storedRow.anon_id_tag,
    });

    return NextResponse.json({ anonymousId: storedAnonymousId });
  } catch (err) {
    console.error("[anon-id]", err);
    return NextResponse.json(
      { error: safeErrorMessage(err) },
      { status: 500 },
    );
  }
}

