import * as Sentry from "@sentry/nextjs";

export type AuditEvent = 
  | "TEACHER_BOOTSTRAP_SUCCESS"
  | "TEACHER_BOOTSTRAP_FAILURE"
  | "TEACHER_LOGIN_SUCCESS"
  | "TEACHER_LOGIN_FAILURE"
  | "STUDENT_LOGIN_SUCCESS"
  | "STUDENT_LOGIN_FAILURE"
  | "RATE_LIMIT_EXCEEDED"
  | "INVALID_CREDENTIALS"
  | "USER_CREATED"
  | "USER_UPDATED";

interface AuditLog {
  event: AuditEvent;
  identifier: string; // email, username, or IP
  details?: Record<string, unknown>;
  severity: "info" | "warning" | "error";
}

export async function logAuditEvent(log: AuditLog) {
  const logEntry = {
    ...log,
    timestamp: new Date().toISOString(),
  };

  // Log en consola (desarrollo)
  if (process.env.NODE_ENV === "development") {
    console.log(`[${logEntry.severity.toUpperCase()}] ${logEntry.event}`, {
      identifier: logEntry.identifier,
      timestamp: logEntry.timestamp,
      details: logEntry.details,
    });
  }

  // Log en Sentry (producción)
  if (process.env.NODE_ENV === "production") {
    Sentry.captureMessage(`[AUDIT] ${logEntry.event}: ${logEntry.identifier}`, {
      level: logEntry.severity === "error" ? "error" : logEntry.severity === "warning" ? "warning" : "info",
      extra: {
        auditLog: logEntry,
      },
    });
  }

  // En producción real, enviar a CloudFlare Logs o servicio externo
  // await sendToLoggingService(logEntry);
}

export async function logAuthAttempt(
  event: "success" | "failure",
  identifier: string,
  reason?: string,
) {
  const auditEvent: AuditEvent = event === "success" ? "TEACHER_BOOTSTRAP_SUCCESS" : "TEACHER_BOOTSTRAP_FAILURE";

  await logAuditEvent({
    event: auditEvent,
    identifier,
    details: reason ? { reason } : undefined,
    severity: event === "success" ? "info" : "warning",
  });
}
