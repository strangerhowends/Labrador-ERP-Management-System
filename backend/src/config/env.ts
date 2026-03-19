import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getEnvAny(names: string[], fallback?: string): string {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined) {
      return value;
    }
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required env var: ${names.join(" or ")}`);
}

export const env = {
  port: Number(getEnv("PORT", "4000")),
  dbHost: getEnvAny(["DB_HOST", "PGHOST"], "localhost"),
  dbPort: Number(getEnvAny(["DB_PORT", "PGPORT"], "5432")),
  dbName: getEnvAny(["DB_NAME", "PGDATABASE"], "labrador_db"),
  dbUser: getEnvAny(["DB_USER", "PGUSER"], "postgres"),
  dbPassword: getEnvAny(["DB_PASSWORD", "PGPASSWORD"]),
  dbSsl: String(getEnv("DB_SSL", "false")).toLowerCase() === "true",
  securityKeySave: getEnv("SECURITY_KEY_SAVE"),
  jwtSecret: getEnv("JWT_SECRET", "labrador-jwt-secret-change-me"),
};
