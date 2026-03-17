import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit, getRateLimitHeaders, getClientIp } from "@/lib/ratelimit";
import { logger, auditLog } from "@/lib/logger";

const TEACHER_USERNAME_REGEX = /^[A-Z][0-9]{7}$/;
const TEACHER_PASSWORD_REGEX = /^[0-9]{6}$/;
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin1";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  fullName: z.string().optional(),
});

const teacherEmail = (username: string) => `t-${username}@mathplaylist.app`;

function isAdminCredential(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

// UUID v4 validation
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

async function findUserIdByEmail(email: string) {
  const service = createServiceClient();
  let page = 1;
  const perPage = 200;

  while (page < 10) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }

    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      return found.id;
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request, { maxRequests: 10, windowMs: 60 * 1000 });
    const rateLimitHeaders = getRateLimitHeaders(
      rateLimitResult.allowed,
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
    );

    if (!rateLimitResult.allowed) {
      const ip = getClientIp(request);
      logger.warn("Teacher bootstrap rate limit exceeded", {
        ip,
      });

      return new NextResponse(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            ...rateLimitHeaders,
          },
        },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      logger.warn("Invalid teacher credentials format", {
        errorCount: parsed.error.issues.length,
      });

      return NextResponse.json(
        { error: "Invalid teacher credentials format." },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    const rawUsername = parsed.data.username.trim();
    const rawPassword = parsed.data.password.trim();
    const normalizedUsername = rawUsername.toLowerCase() === ADMIN_USERNAME ? ADMIN_USERNAME : rawUsername.toUpperCase();
    const isAdmin = isAdminCredential(normalizedUsername, rawPassword);

    if (!isAdmin && (!TEACHER_USERNAME_REGEX.test(normalizedUsername) || !TEACHER_PASSWORD_REGEX.test(rawPassword))) {
      logger.warn("Invalid teacher credentials format", {
        username: normalizedUsername,
      });

      return NextResponse.json(
        { error: "Teacher username must look like A1234567 and password must be 6 digits, or use admin / admin." },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    const username = normalizedUsername;
    const password = rawPassword;
    const fullName = parsed.data.fullName?.trim() || (isAdmin ? "Admin" : username);
    const email = teacherEmail(username);

    const service = createServiceClient();
    const existingId = await findUserIdByEmail(email);

    let userId = existingId;

    if (existingId) {
      // Validate UUID
      if (!isValidUUID(existingId)) {
        logger.error("Invalid user ID returned from Supabase", { userId: existingId });
        return NextResponse.json(
          { error: "Database error. Please contact support." },
          { status: 500, headers: rateLimitHeaders },
        );
      }

      const { error } = await service.auth.admin.updateUserById(existingId, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: "teacher" },
      });

      if (error) {
        logger.error("Failed to update teacher user", {
          email,
          errorMessage: error.message,
        });

        return NextResponse.json(
          { error: error.message },
          { status: 400, headers: rateLimitHeaders },
        );
      }

      auditLog("teacher_account_updated", {
        userId: existingId,
        email,
        username,
      });
    } else {
      const { data, error } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: "teacher" },
      });

      if (error || !data.user) {
        logger.error("Failed to create teacher user", {
          email,
          errorMessage: error?.message,
        });

        return NextResponse.json(
          { error: error?.message ?? "Could not create teacher user." },
          { status: 400, headers: rateLimitHeaders },
        );
      }

      userId = data.user.id;

      // Validate UUID
      if (!isValidUUID(userId)) {
        logger.error("Invalid user ID returned from Supabase", { userId });
        return NextResponse.json(
          { error: "Database error. Please contact support." },
          { status: 500, headers: rateLimitHeaders },
        );
      }

      auditLog("teacher_account_created", {
        userId,
        email,
        username,
      });
    }

    if (!userId) {
      logger.error("Teacher user ID not found after creation", { email });
      return NextResponse.json(
        { error: "Teacher user id not found." },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    const { error: profileError } = await service.from("profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
      role: "teacher",
    });

    if (profileError) {
      const msg = profileError.message.toLowerCase();
      if (msg.includes("profiles") && msg.includes("schema cache")) {
        logger.error("Database tables missing", { errorMessage: profileError.message });
        return NextResponse.json(
          { error: "Database tables are missing. Run the SQL migration in supabase/migrations first." },
          { status: 400, headers: rateLimitHeaders },
        );
      }

      logger.error("Failed to upsert teacher profile", {
        userId,
        errorMessage: profileError.message,
      });

      return NextResponse.json(
        { error: profileError.message },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    logger.info("Teacher bootstrap completed successfully", { userId, email });
    return NextResponse.json({ ok: true }, { headers: rateLimitHeaders });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Bootstrap failed";
    logger.error("Unexpected error in teacher bootstrap", {
      errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
