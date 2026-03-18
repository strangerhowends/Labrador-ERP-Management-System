import { pool } from "./db.js";

try {
  const result = await pool.query(`
    SELECT column_name, data_type, is_generated
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'caja_diaria'
    ORDER BY ordinal_position
  `);

  console.log("Columnas en caja_diaria:");
  for (const row of result.rows) {
    console.log(`- ${row.column_name} | ${row.data_type} | generated: ${row.is_generated}`);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
