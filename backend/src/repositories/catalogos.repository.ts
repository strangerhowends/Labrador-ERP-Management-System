import { pool } from "../config/db.js";
import type { CatalogItem } from "../types/gastos.types.js";

export async function getCatalogo(table: "productos" | "proveedores" | "categorias"): Promise<CatalogItem[]> {
  const result = await pool.query<CatalogItem>(`SELECT id, nombre FROM ${table} ORDER BY nombre ASC`);
  return result.rows;
}

export async function getCatalogos() {
  const [productosRaw, proveedores, categorias] = await Promise.all([
    pool.query<CatalogItem & { categoria_id: string }>(
      `SELECT id, nombre, categoria_id FROM productos WHERE activo = true ORDER BY nombre ASC`
    ),
    getCatalogo("proveedores"),
    getCatalogo("categorias"),
  ]);

  return {
    productos: productosRaw.rows,
    proveedores,
    categorias,
  };
}
