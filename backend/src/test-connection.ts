import { checkConnection, pool } from "./db.js";

async function main() {
  try {
    const value = await checkConnection();
    console.log("PostgreSQL conectado correctamente. Resultado SELECT 1:", value);
  } catch (error) {
    console.error("Error al conectar con PostgreSQL:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
