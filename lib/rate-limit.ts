import { headers } from "next/headers";

// Store rate limit attempts in memory (en producción usar Redis o base de datos)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_ATTEMPTS = 5; // máximo de intentos por ventana

export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Nueva ventana
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

export async function getRateLimitIdentifier(): Promise<string> {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "unknown";
  return ip;
}

export function clearRateLimitStore() {
  rateLimitStore.clear();
}
