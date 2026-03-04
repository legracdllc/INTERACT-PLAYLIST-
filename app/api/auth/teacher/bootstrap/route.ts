import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  username: z.string().regex(/^[A-Z][0-9]{7}$/),
  password: z.string().regex(/^[0-9]{6}$/),
  fullName: z.string().optional(),
});

const teacherEmail = (username: string) => `t-${username}@mathplaylist.app`;

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

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid teacher credentials format." }, { status: 400 });
  }

  const username = parsed.data.username.toUpperCase();
  const password = parsed.data.password;
  const fullName = parsed.data.fullName?.trim() || username;
  const email = teacherEmail(username);

  try {
    const service = createServiceClient();
    const existingId = await findUserIdByEmail(email);

    let userId = existingId;

    if (existingId) {
      const { error } = await service.auth.admin.updateUserById(existingId, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: "teacher" },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      const { data, error } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: "teacher" },
      });

      if (error || !data.user) {
        return NextResponse.json({ error: error?.message ?? "Could not create teacher user." }, { status: 400 });
      }

      userId = data.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Teacher user id not found." }, { status: 400 });
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
        return NextResponse.json(
          { error: "Database tables are missing. Run the SQL migration in supabase/migrations first." },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bootstrap failed" },
      { status: 500 },
    );
  }
}
