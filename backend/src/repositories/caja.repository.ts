import { pool } from "../config/db.js";
import type { CajaInput, CajaRecord } from "../types/caja.types.js";

export async function getPreviousSaldo(fecha: string): Promise<number> {
  const result = await pool.query<{ saldo_acumulado_final: string }>(
    `SELECT saldo_acumulado_final
     FROM caja_diaria
     WHERE fecha < $1
     ORDER BY fecha DESC
     LIMIT 1`,
    [fecha]
  );

  if (result.rowCount === 0) {
    return 0;
  }

  return Number(result.rows[0].saldo_acumulado_final);
}

export async function insertCaja(payload: CajaInput, saldoFinal: number): Promise<CajaRecord> {
  const result = await pool.query<CajaRecord>(
    `INSERT INTO caja_diaria (
      fecha,
      total_contado,
      fondo_siguiente_dia,
      egresos_retiros,
      otros_ingresos,
      saldo_acumulado_final
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      fecha,
      total_contado,
      fondo_siguiente_dia,
      ingreso_neto_caja_fuerte,
      egresos_retiros,
      otros_ingresos,
      saldo_acumulado_final`,
    [
      payload.fecha,
      payload.total_contado,
      payload.fondo_siguiente_dia,
      payload.egresos_retiros,
      payload.otros_ingresos,
      saldoFinal,
    ]
  );

  return normalizeRow(result.rows[0]);
}

export async function findAllCaja(): Promise<CajaRecord[]> {
  const result = await pool.query<CajaRecord>(
    `SELECT
      id,
      fecha,
      total_contado,
      fondo_siguiente_dia,
      ingreso_neto_caja_fuerte,
      egresos_retiros,
      otros_ingresos,
      saldo_acumulado_final
     FROM caja_diaria
     ORDER BY fecha DESC`
  );

  return result.rows.map(normalizeRow);
}

export async function updateCaja(id: string, payload: CajaInput, saldoFinal: number): Promise<CajaRecord | null> {
  const result = await pool.query<CajaRecord>(
    `UPDATE caja_diaria
     SET fecha = $2,
         total_contado = $3,
         fondo_siguiente_dia = $4,
         egresos_retiros = $5,
         otros_ingresos = $6,
         saldo_acumulado_final = $7
     WHERE id = $1
     RETURNING
       id, fecha, total_contado, fondo_siguiente_dia,
       ingreso_neto_caja_fuerte, egresos_retiros, otros_ingresos,
       saldo_acumulado_final`,
    [id, payload.fecha, payload.total_contado, payload.fondo_siguiente_dia, payload.egresos_retiros, payload.otros_ingresos, saldoFinal]
  );
  return result.rows[0] ? normalizeRow(result.rows[0]) : null;
}

export async function deleteCaja(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM caja_diaria WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function findCajaById(id: string): Promise<CajaRecord | null> {
  const result = await pool.query<CajaRecord>(
    `SELECT id, fecha, total_contado, fondo_siguiente_dia, ingreso_neto_caja_fuerte,
            egresos_retiros, otros_ingresos, saldo_acumulado_final
     FROM caja_diaria WHERE id = $1`,
    [id]
  );
  return result.rows[0] ? normalizeRow(result.rows[0]) : null;
}

function normalizeRow(row: CajaRecord): CajaRecord {
  return {
    ...row,
    total_contado: Number(row.total_contado),
    fondo_siguiente_dia: Number(row.fondo_siguiente_dia),
    ingreso_neto_caja_fuerte: Number(row.ingreso_neto_caja_fuerte),
    egresos_retiros: Number(row.egresos_retiros),
    otros_ingresos: Number(row.otros_ingresos),
    saldo_acumulado_final: Number(row.saldo_acumulado_final),
  };
}
