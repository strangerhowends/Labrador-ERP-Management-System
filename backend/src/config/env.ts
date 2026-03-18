import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(getEnv("PORT", "4000")),
  dbHost: getEnv("DB_HOST", "localhost"),
  dbPort: Number(getEnv("DB_PORT", "5432")),
  dbName: getEnv("DB_NAME", "labrador_db"),
  dbUser: getEnv("DB_USER", "postgres"),
  dbPassword: getEnv("DB_PASSWORD"),
  dbSsl: String(getEnv("DB_SSL", "false")).toLowerCase() === "true",
  securityKeySave: getEnv("SECURITY_KEY_SAVE"),
  jwtSecret: getEnv("JWT_SECRET", "labrador-jwt-secret-change-me"),
};
