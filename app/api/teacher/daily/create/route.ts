import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ classId: z.string().uuid(), date: z.string().date() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("daily_playlists")
    .upsert(
      {
        class_id: parsed.data.classId,
        date: parsed.data.date,
        title: `Math Playlist ${parsed.data.date}`,
        created_by: user.id,
      },
      { onConflict: "class_id,date" },
    )
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create" }, { status: 400 });
  }

  return NextResponse.json({ id: data.id });
}
