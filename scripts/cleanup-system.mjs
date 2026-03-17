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

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const testUsers = (users.users ?? []).filter((user) => {
    const email = user.email ?? "";
    return (
      email.includes("t-smoke-") ||
      email.includes("s-smoke-") ||
      email.includes("t-verify-") ||
      email.includes("s-verify-")
    );
  });

  const userIds = testUsers.map((user) => user.id);

  if (userIds.length) {
    await supabase.from("daily_progress").delete().in("student_id", userIds);
    await supabase.from("student_inventory").delete().in("student_id", userIds);
    await supabase.from("wallets").delete().in("student_id", userIds);
    await supabase.from("progress_xp").delete().in("student_id", userIds);
    await supabase.from("class_students").delete().in("student_id", userIds);
    await supabase.from("daily_playlist_winners").delete().in("student_id", userIds);
  }

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id,name,teacher_id")
    .ilike("name", "Smoke Class %");
  if (classesError) throw classesError;

  const { data: verifyClasses, error: verifyClassesError } = await supabase
    .from("classes")
    .select("id,name,teacher_id")
    .ilike("name", "Verify Class %");
  if (verifyClassesError) throw verifyClassesError;

  const allClasses = [...(classes ?? []), ...(verifyClasses ?? [])];
  const classIds = allClasses.map((row) => row.id);

  if (classIds.length) {
    const { data: dailies } = await supabase
      .from("daily_playlists")
      .select("id")
      .in("class_id", classIds);
    const dailyIds = (dailies ?? []).map((row) => row.id);

    if (dailyIds.length) {
      await supabase.from("daily_playlist_winners").delete().in("daily_playlist_id", dailyIds);
      await supabase.from("daily_progress").delete().in("daily_playlist_id", dailyIds);
      await supabase.from("daily_playlist_items").delete().in("daily_playlist_id", dailyIds);
      await supabase.from("daily_playlists").delete().in("id", dailyIds);
    }

    await supabase.from("class_students").delete().in("class_id", classIds);
    await supabase.from("classes").delete().in("id", classIds);
  }

  for (const user of testUsers) {
    const result = await supabase.auth.admin.deleteUser(user.id);
    if (result.error) {
      throw result.error;
    }
  }

  console.log(JSON.stringify({
    ok: true,
    removedUsers: testUsers.length,
    removedClasses: classIds.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
