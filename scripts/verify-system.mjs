import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  const env = {};
  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function requireEnv(env, key) {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing .env.local");
  }

  const env = loadEnvFile(envPath);
  const url = requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = requireEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const service = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const expectedTables = [
    "schools",
    "profiles",
    "classes",
    "class_students",
    "daily_playlists",
    "daily_playlist_items",
    "daily_progress",
    "wallets",
    "progress_xp",
    "student_inventory",
    "daily_playlist_winners",
  ];

  const tableCounts = {};
  for (const table of expectedTables) {
    const { count, error } = await service.from(table).select("*", { count: "exact", head: true });
    if (error) {
      throw new Error(`Table check failed for ${table}: ${error.message}`);
    }
    tableCounts[table] = count ?? 0;
  }

  const stamp = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const teacherEmail = `t-verify-${stamp}@mathplaylist.app`;
  const studentEmail = `s-verify-${stamp}@mathplaylist.app`;
  const password = "123456";

  const teacherResult = await service.auth.admin.createUser({
    email: teacherEmail,
    password,
    email_confirm: true,
    user_metadata: { role: "teacher", full_name: `Verify Teacher ${stamp}` },
  });
  if (teacherResult.error) throw teacherResult.error;
  const teacherId = teacherResult.data.user.id;

  const studentResult = await service.auth.admin.createUser({
    email: studentEmail,
    password,
    email_confirm: true,
    user_metadata: { role: "student", full_name: `Verify Student ${stamp}` },
  });
  if (studentResult.error) throw studentResult.error;
  const studentId = studentResult.data.user.id;

  await new Promise((resolve) => setTimeout(resolve, 1200));

  const { data: teacherProfile } = await service
    .from("profiles")
    .select("id,role,full_name")
    .eq("id", teacherId)
    .maybeSingle();
  const { data: studentProfile } = await service
    .from("profiles")
    .select("id,role,full_name")
    .eq("id", studentId)
    .maybeSingle();

  if (!teacherProfile || !studentProfile) {
    throw new Error("Profile sync did not create teacher/student profiles.");
  }

  const { data: classRow, error: classError } = await service
    .from("classes")
    .insert({ teacher_id: teacherId, name: `Verify Class ${stamp}` })
    .select("id,name")
    .single();
  if (classError) throw classError;

  const { error: rosterError } = await service
    .from("class_students")
    .insert({ class_id: classRow.id, student_id: studentId });
  if (rosterError) throw rosterError;

  const { data: dailyRow, error: dailyError } = await service
    .from("daily_playlists")
    .insert({
      class_id: classRow.id,
      date: today,
      title: `Verify Playlist ${today}`,
      instructions: "Verify the board end to end.",
      student_objective: "Solve and show your work.",
      teks: "4.4A",
      published: true,
      created_by: teacherId,
    })
    .select("id,title")
    .single();
  if (dailyError) throw dailyError;

  const { data: items, error: itemError } = await service
    .from("daily_playlist_items")
    .insert([
      {
        daily_playlist_id: dailyRow.id,
        order_index: 1,
        skill_name: "Verify Fractions",
        teks: "4.4A",
        type: "mini",
        url: "https://example.com/fractions",
        xp: 15,
        max_score: 100,
      },
      {
        daily_playlist_id: dailyRow.id,
        order_index: 2,
        skill_name: "Verify Graphs",
        teks: "4.9A",
        type: "challenge",
        url: "https://example.com/graphs",
        xp: 20,
        max_score: 100,
      },
    ])
    .select("id,skill_name,order_index")
    .order("order_index", { ascending: true });
  if (itemError) throw itemError;

  const avatar = {
    hair: "sunburst-mane",
    outfit: "graph-guardian",
    shoes: "rocket-sneaks",
    weapon: "plus-saber",
    companion: "star-cub",
  };
  const { error: avatarError } = await service.from("profiles").update({ avatar_json: avatar }).eq("id", studentId);
  if (avatarError) throw avatarError;

  await service.from("progress_xp").upsert({ student_id: studentId, xp: 75 });
  await service.from("wallets").upsert({ student_id: studentId, coins: 260 });
  await service.from("student_inventory").upsert(
    [
      { student_id: studentId, item_key: "comet-helmet", item_type: "helmet", cost_coins: 120, source: "verify", is_equipped: true },
      { student_id: studentId, item_key: "galaxy-cape", item_type: "cape", cost_coins: 180, source: "verify", is_equipped: true },
      { student_id: studentId, item_key: "turbo-trail", item_type: "trail", cost_coins: 150, source: "verify", is_equipped: true },
    ],
    { onConflict: "student_id,item_key" },
  );

  await service.from("daily_progress").upsert(
    [
      {
        daily_playlist_id: dailyRow.id,
        daily_playlist_item_id: items[0].id,
        student_id: studentId,
        status: "submitted",
        completed: true,
        score: 95,
        evidence_url: "Verified with model drawing.",
        started_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
      },
      {
        daily_playlist_id: dailyRow.id,
        daily_playlist_item_id: items[1].id,
        student_id: studentId,
        status: "in_progress",
        completed: false,
        started_at: new Date().toISOString(),
      },
    ],
    { onConflict: "daily_playlist_item_id,student_id" },
  );

  const teacherLogin = await client.auth.signInWithPassword({ email: teacherEmail, password });
  if (teacherLogin.error || !teacherLogin.data.session) {
    throw teacherLogin.error ?? new Error("Teacher auth verification failed.");
  }
  await client.auth.signOut();

  const studentLogin = await client.auth.signInWithPassword({ email: studentEmail, password });
  if (studentLogin.error || !studentLogin.data.session) {
    throw studentLogin.error ?? new Error("Student auth verification failed.");
  }
  await client.auth.signOut();

  const summary = {
    ok: true,
    today,
    tables: tableCounts,
    teacher: { id: teacherId, email: teacherEmail },
    student: { id: studentId, email: studentEmail },
    class: classRow,
    daily: dailyRow,
    itemsCreated: items.length,
    verified: {
      profileSync: true,
      authTeacher: true,
      authStudent: true,
      classRoster: true,
      playlistBuilder: true,
      avatarSave: true,
      walletsXp: true,
      inventory: true,
      progress: true,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
