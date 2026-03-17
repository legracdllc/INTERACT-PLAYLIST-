import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AVATAR_OPTIONS, normalizeAvatarForXp } from "@/lib/avatar";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  avatar: z.object({
    hair: z.enum(AVATAR_OPTIONS.hair),
    outfit: z.enum(AVATAR_OPTIONS.outfit),
    shoes: z.enum(AVATAR_OPTIONS.shoes),
    weapon: z.enum(AVATAR_OPTIONS.weapon),
    companion: z.enum(AVATAR_OPTIONS.companion),
  }),
});

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid avatar payload." }, { status: 400 });
  }

  const supabase = await createClient();
  const service = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: xpRow } = await service.from("progress_xp").select("xp").eq("student_id", user.id).maybeSingle<{ xp: number }>();
  const avatar = normalizeAvatarForXp(parsed.data.avatar, xpRow?.xp ?? 0);
  const { error } = await supabase.from("profiles").update({ avatar_json: avatar }).eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, avatar });
}
