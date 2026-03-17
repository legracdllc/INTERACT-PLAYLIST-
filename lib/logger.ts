import * as Sentry from "@sentry/nextjs";

export interface LogContext {
  userId?: string;
  email?: string;
  action?: string;
  [key: string]: string | number | boolean | undefined | null | Record<string, unknown>;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...context };

  // Console output
  const consoleLog: Record<LogLevel, (message: string, obj?: LogContext) => void> = {
    debug: console.log,
    info: console.log,
    warn: console.warn,
    error: console.error,
  };

  consoleLog[level](`[${level.toUpperCase()}] ${message}`, context);

  // Sentry integration for errors and warnings in production
  if (
    (level === "error" || level === "warn") &&
    process.env.NODE_ENV === "production" &&
    typeof window === "undefined"
  ) {
    if (level === "error") {
      Sentry.captureMessage(message, "error");
    } else if (level === "warn") {
      Sentry.captureMessage(message, "warning");
    }

    // Attach context
    if (context) {
      Sentry.setContext("logContext", context);
    }
  }

  return logEntry;
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};

// Audit logging for critical actions
export function auditLog(action: string, details: LogContext) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    ...details,
  };

  // In production, send to audit log service (CloudFlare, LogRocket, etc)
  if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
    Sentry.captureMessage(`[AUDIT] ${action}`, "info");
    Sentry.setContext("audit", auditEntry);
  }

  console.log("[AUDIT]", auditEntry);
  return auditEntry;
}
