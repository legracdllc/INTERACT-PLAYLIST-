const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const SERVICE_VARS = [
  ...REQUIRED_VARS,
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

type SupabaseServiceConfig = SupabaseConfig & {
  serviceRoleKey: string;
};

function getPublicSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function getMissingVars(vars: readonly string[]) {
  return vars.filter((name) => !process.env[name]?.trim());
}

function buildMissingEnvMessage(missingVars: readonly string[]) {
  return [
    `Missing Supabase environment variables: ${missingVars.join(", ")}`,
    "Copy .env.example to .env.local and set the real values from Supabase > Project Settings > API.",
  ].join(" ");
}

export function getSupabaseConfig(): SupabaseConfig {
  const missingVars = getMissingVars(REQUIRED_VARS);
  if (missingVars.length > 0) {
    throw new Error(buildMissingEnvMessage(missingVars));
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
  };
}

export function getPublicSupabaseConfig(): SupabaseConfig {
  const { url, anonKey } = getPublicSupabaseEnv();
  const missingVars = [
    !url?.trim() ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !anonKey?.trim() ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
  ].filter((value): value is string => Boolean(value));

  if (missingVars.length > 0) {
    throw new Error(buildMissingEnvMessage(missingVars));
  }

  const safeUrl = url as string;
  const safeAnonKey = anonKey as string;

  return {
    url: safeUrl.trim(),
    anonKey: safeAnonKey.trim(),
  };
}

export function getSupabaseServiceConfig(): SupabaseServiceConfig {
  const missingVars = getMissingVars(SERVICE_VARS);
  if (missingVars.length > 0) {
    throw new Error(buildMissingEnvMessage(missingVars));
  }

  return {
    ...getSupabaseConfig(),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
  };
}
