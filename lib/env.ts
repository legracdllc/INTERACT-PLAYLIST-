import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL").optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Missing Supabase anon key").optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Missing Supabase service role key").optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url("Invalid site URL").optional(),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // In development, allow missing env vars with default values
    if (process.env.NODE_ENV !== "production") {
      console.warn("⚠️  Missing environment variables. Using development defaults.");
      console.warn("Create a .env.local file with your Supabase credentials.");
      return {
        NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-key",
        SUPABASE_SERVICE_ROLE_KEY: "placeholder-service-key",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NODE_ENV: "development",
      };
    }

    const errors = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Environment validation failed:\n${errors}\n\nPlease check your .env.local file.`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

// Export for compatibility - use getEnv instead
export const env = getEnv();
