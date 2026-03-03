export type Role = "student" | "teacher";

export type DbJson = string | number | boolean | null | { [key: string]: DbJson | undefined } | DbJson[];

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  school_id: string | null;
  avatar_json: Record<string, DbJson>;
  settings_json: Record<string, DbJson>;
  created_at: string;
};

export type StudentProgressStatus = "not_started" | "in_progress" | "submitted" | "graded";
