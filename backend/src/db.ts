import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const sslEnabled = String(process.env.DB_SSL).toLowerCase() === "true";

export const pool = new Pool({
  host: process.env.DB_HOST ?? process.env.PGHOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? process.env.PGPORT ?? 5432),
  database: process.env.DB_NAME ?? process.env.PGDATABASE ?? "postgres",
  user: process.env.DB_USER ?? process.env.PGUSER ?? "postgres",
  password: process.env.DB_PASSWORD ?? process.env.PGPASSWORD,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});

export async function checkConnection(): Promise<number> {
  const result = await pool.query("SELECT 1 AS ok");
  return result.rows[0].ok as number;
}
