import { pool } from "../config/db.js";

export interface ConfigRow {
  id: string;
  clave: string;
  valor: string;
  tipo_dato: "BOOLEAN" | "NUMBER" | "STRING" | "JSON";
  descripcion: string | null;
}

export async function listConfiguraciones(): Promise<ConfigRow[]> {
  const result = await pool.query<ConfigRow>(
    `SELECT id, clave, valor, tipo_dato, descripcion
     FROM configuraciones_globales
     ORDER BY clave ASC`
  );
  return result.rows;
}

export async function getConfigByClave(clave: string): Promise<ConfigRow | null> {
  const result = await pool.query<ConfigRow>(
    `SELECT id, clave, valor, tipo_dato, descripcion
     FROM configuraciones_globales
     WHERE clave = $1`,
    [clave]
  );
  return result.rows[0] ?? null;
}

export async function updateConfiguraciones(items: Array<{ clave: string; valor: string }>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const item of items) {
      await client.query(
        `UPDATE configuraciones_globales SET valor = $2 WHERE clave = $1`,
        [item.clave, item.valor]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return listConfiguraciones();
}
