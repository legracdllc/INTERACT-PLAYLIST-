import { NextRequest } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

// Simple in-memory rate limiter
// For production, use Upstash Redis or similar
const store: RateLimitStore = {};

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip.trim();
}

export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = getClientIp(request);
  const now = Date.now();

  // Clean up expired entries
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });

  const record = store[ip];

  // New entry or window has expired
  if (!record || record.resetTime < now) {
    store[ip] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: store[ip].resetTime,
    };
  }

  // Increment counter
  record.count += 1;
  const allowed = record.count <= config.maxRequests;

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetTime: record.resetTime,
  };
}

export function getRateLimitHeaders(
  allowed: boolean,
  remaining: number,
  resetTime: number,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": "10",
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
    "Retry-After": allowed ? "" : Math.ceil((resetTime - Date.now()) / 1000).toString(),
  };
}
