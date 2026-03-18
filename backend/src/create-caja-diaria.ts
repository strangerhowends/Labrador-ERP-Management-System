import { pool } from "./db.js";

const sql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS caja_diaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE UNIQUE NOT NULL,
  total_contado DECIMAL(10,2) NOT NULL DEFAULT 0,
  fondo_siguiente_dia DECIMAL(10,2) NOT NULL DEFAULT 0,
  ingreso_neto_caja_fuerte DECIMAL(10,2) GENERATED ALWAYS AS (total_contado - fondo_siguiente_dia) STORED,
  egresos_retiros DECIMAL(10,2) NOT NULL DEFAULT 0,
  otros_ingresos DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_acumulado_final DECIMAL(10,2) NOT NULL DEFAULT 0
);
`;

try {
  await pool.query(sql);
  const check = await pool.query(
    "SELECT to_regclass('public.caja_diaria')::text AS table_name"
  );
  console.log("Tabla creada/verificada:", check.rows[0].table_name);
} catch (error) {
  console.error("Error al crear tabla caja_diaria:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
