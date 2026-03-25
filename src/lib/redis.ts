import { Redis } from "@upstash/redis";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

let cachedRedis: Redis | undefined;

export function getRedisClient(): Redis {
  if (cachedRedis) return cachedRedis;

  const url = requireEnv("AID_KV_REST_API_URL");
  const token = requireEnv("AID_KV_REST_API_TOKEN");

  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

export function getLookupKey(lookupHash: string): string {
  return `anonid:v1:${lookupHash}`;
}

