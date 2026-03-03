import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[,"\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export async function GET(_: Request, { params }: { params: Promise<{ dailyId: string }> }) {
  const { dailyId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: teacher } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  if (teacher?.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows } = await supabase
    .from("daily_progress")
    .select(
      "status,score,teacher_note,submitted_at,graded_at,profiles!daily_progress_student_id_fkey(full_name),daily_playlist_items!daily_progress_daily_playlist_item_id_fkey(skill_name,teks),daily_playlists!inner(id,class_id,classes!inner(teacher_id))",
    )
    .eq("daily_playlist_id", dailyId)
    .eq("daily_playlists.classes.teacher_id", user.id);

  const header = ["student", "skill", "teks", "status", "score", "teacher_note", "submitted_at", "graded_at"];
  const lines = [header.join(",")];

  for (const row of rows ?? []) {
    const student = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const item = Array.isArray(row.daily_playlist_items) ? row.daily_playlist_items[0] : row.daily_playlist_items;
    const line = [
      student?.full_name,
      item?.skill_name,
      item?.teks,
      row.status,
      row.score,
      row.teacher_note,
      row.submitted_at,
      row.graded_at,
    ]
      .map(csvEscape)
      .join(",");
    lines.push(line);
  }

  const body = `${lines.join("\n")}\n`;
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="tracker-${dailyId}.csv"`,
    },
  });
}
