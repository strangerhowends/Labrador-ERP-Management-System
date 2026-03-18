import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:labrador2026@localhost:5432/postgres",
  ssl: false,
});

const dbName = "labrador_db";

try {
  await client.connect();
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount && exists.rowCount > 0) {
    console.log(`Database ${dbName} already exists.`);
  } else {
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database ${dbName} created.`);
  }
} catch (error) {
  console.error("Failed creating database:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
