import { pool } from "../config/db.js";
import type {
  BulkInsertResult,
  CategoriaInput,
  HorarioUpsertInput,
  ProductoBulkInput,
  ProductoBulkInsertResult,
  ProductoInput,
  ProveedorBulkInput,
  ProveedorInput,
  RemuneracionInput,
  ResumenSemanalItem,
  TrabajadorBulkInput,
  TrabajadorInput,
} from "../types/erp.types.js";

export async function listProveedores(activeOnly: boolean) {
  const result = await pool.query(
    `SELECT id, nombre, ruc_dni, contacto, activo
     FROM proveedores
     ${activeOnly ? "WHERE activo = true" : ""}
     ORDER BY nombre ASC`
  );
  return result.rows;
}

export async function createProveedor(input: ProveedorInput) {
  const result = await pool.query(
    `INSERT INTO proveedores (nombre, ruc_dni, contacto, activo)
     VALUES ($1, $2, $3, COALESCE($4, true))
     RETURNING id, nombre, ruc_dni, contacto, activo`,
    [input.nombre, input.ruc_dni ?? null, input.contacto ?? null, input.activo ?? true]
  );
  return result.rows[0];
}

export async function updateProveedor(id: string, input: ProveedorInput) {
  const result = await pool.query(
    `UPDATE proveedores
     SET nombre = $2,
         ruc_dni = $3,
         contacto = $4,
         activo = COALESCE($5, activo)
     WHERE id = $1
     RETURNING id, nombre, ruc_dni, contacto, activo`,
    [id, input.nombre, input.ruc_dni ?? null, input.contacto ?? null, input.activo]
  );
  return result.rows[0] ?? null;
}

export async function deactivateProveedor(id: string) {
  const result = await pool.query(
    `UPDATE proveedores
     SET activo = false
     WHERE id = $1
     RETURNING id, nombre, ruc_dni, contacto, activo`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listCategorias(activeOnly: boolean) {
  const result = await pool.query(
    `SELECT id, nombre, tipo, activo
     FROM categorias
     ${activeOnly ? "WHERE activo = true" : ""}
     ORDER BY nombre ASC`
  );
  return result.rows;
}

export async function createCategoria(input: CategoriaInput) {
  const result = await pool.query(
    `INSERT INTO categorias (nombre, tipo, activo)
     VALUES ($1, $2, COALESCE($3, true))
     RETURNING id, nombre, tipo, activo`,
    [input.nombre, input.tipo, input.activo ?? true]
  );
  return result.rows[0];
}

export async function updateCategoria(id: string, input: CategoriaInput) {
  const result = await pool.query(
    `UPDATE categorias
     SET nombre = $2,
         tipo = $3,
         activo = COALESCE($4, activo)
     WHERE id = $1
     RETURNING id, nombre, tipo, activo`,
    [id, input.nombre, input.tipo, input.activo]
  );
  return result.rows[0] ?? null;
}

export async function deactivateCategoria(id: string) {
  const result = await pool.query(
    `UPDATE categorias
     SET activo = false
     WHERE id = $1
     RETURNING id, nombre, tipo, activo`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listProductos(activeOnly: boolean) {
  const result = await pool.query(
    `SELECT p.id, p.nombre, p.categoria_id, c.nombre AS categoria_nombre, p.activo
     FROM productos p
     LEFT JOIN categorias c ON c.id = p.categoria_id
     ${activeOnly ? "WHERE p.activo = true" : ""}
     ORDER BY p.nombre ASC`
  );
  return result.rows;
}

export async function createProducto(input: ProductoInput) {
  const result = await pool.query(
    `INSERT INTO productos (nombre, categoria_id, activo)
     VALUES ($1, $2, COALESCE($3, true))
     RETURNING id, nombre, categoria_id, activo`,
    [input.nombre, input.categoria_id, input.activo ?? true]
  );
  return result.rows[0];
}

export async function updateProducto(id: string, input: ProductoInput) {
  const result = await pool.query(
    `UPDATE productos
     SET nombre = $2,
         categoria_id = $3,
         activo = COALESCE($4, activo)
     WHERE id = $1
     RETURNING id, nombre, categoria_id, activo`,
    [id, input.nombre, input.categoria_id, input.activo]
  );
  return result.rows[0] ?? null;
}

export async function deactivateProducto(id: string) {
  const result = await pool.query(
    `UPDATE productos
     SET activo = false
     WHERE id = $1
     RETURNING id, nombre, categoria_id, activo`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listTrabajadores(activeOnly: boolean) {
  const result = await pool.query(
    `SELECT id, nombre_completo, rol, dni, telefono, correo, activo, rol_acceso,
            password_hash IS NOT NULL AS tiene_password
     FROM trabajadores
     ${activeOnly ? "WHERE activo = true" : ""}
     ORDER BY nombre_completo ASC`
  );
  return result.rows;
}

export async function createTrabajador(input: TrabajadorInput) {
  const result = await pool.query(
    `INSERT INTO trabajadores (nombre_completo, rol, dni, telefono, correo, activo)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, true))
     RETURNING id, nombre_completo, rol, dni, telefono, correo, activo`,
    [input.nombre_completo, input.rol, input.dni, input.telefono ?? null, input.correo ?? null, input.activo ?? true]
  );
  return result.rows[0];
}

export async function updateTrabajador(id: string, input: TrabajadorInput) {
  const result = await pool.query(
    `UPDATE trabajadores
     SET nombre_completo = $2,
         rol = $3,
         dni = $4,
         telefono = $5,
         correo = $6,
         activo = COALESCE($7, activo)
     WHERE id = $1
     RETURNING id, nombre_completo, rol, dni, telefono, correo, activo`,
    [id, input.nombre_completo, input.rol, input.dni, input.telefono ?? null, input.correo ?? null, input.activo]
  );
  return result.rows[0] ?? null;
}

export async function deactivateTrabajador(id: string) {
  const result = await pool.query(
    `UPDATE trabajadores
     SET activo = false
     WHERE id = $1
     RETURNING id, nombre_completo, rol, dni, telefono, correo, activo`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createRemuneracion(input: RemuneracionInput, semanaDelAnio: number) {
  const result = await pool.query(
    `INSERT INTO pagos_personal (
      trabajador_id,
      monto_pagado,
      fecha_pago,
      semana_del_anio,
      tipo_pago,
      observaciones
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, trabajador_id, monto_pagado, fecha_pago, semana_del_anio, tipo_pago, observaciones`,
    [
      input.trabajador_id,
      input.monto_pagado,
      input.fecha_pago,
      semanaDelAnio,
      input.tipo_pago,
      input.observaciones ?? null,
    ]
  );

  return result.rows[0];
}

export async function updateRemuneracion(
  id: string,
  input: RemuneracionInput,
  semanaDelAnio: number
) {
  const result = await pool.query(
    `UPDATE pagos_personal
     SET trabajador_id  = $2,
         monto_pagado   = $3,
         fecha_pago     = $4,
         semana_del_anio = $5,
         tipo_pago      = $6,
         observaciones  = $7
     WHERE id = $1
     RETURNING id, trabajador_id, monto_pagado, fecha_pago, semana_del_anio, tipo_pago, observaciones`,
    [
      id,
      input.trabajador_id,
      input.monto_pagado,
      input.fecha_pago,
      semanaDelAnio,
      input.tipo_pago,
      input.observaciones ?? null,
    ]
  );
  return result.rows[0] ?? null;
}

export async function deleteRemuneracion(id: string) {
  const result = await pool.query(
    `DELETE FROM pagos_personal WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getRemuneracionesSemanales(): Promise<ResumenSemanalItem[]> {
  const result = await pool.query<{
    semana_del_anio: number;
    total_semana: string;
    pagos: Array<{
      pago_id: string;
      trabajador_id: string;
      trabajador_nombre: string;
      monto_pagado: number;
      fecha_pago: string;
      tipo_pago: "Sueldo" | "Adelanto" | "Bono";
      observaciones: string | null;
    }>;
  }>(
    `SELECT
      p.semana_del_anio,
      ROUND(SUM(p.monto_pagado)::numeric, 2) AS total_semana,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'pago_id', p.id,
          'trabajador_id', t.id,
          'trabajador_nombre', t.nombre_completo,
          'monto_pagado', p.monto_pagado,
          'fecha_pago', p.fecha_pago,
          'tipo_pago', p.tipo_pago,
          'observaciones', p.observaciones
        )
        ORDER BY p.fecha_pago ASC
      ) AS pagos
    FROM pagos_personal p
    INNER JOIN trabajadores t ON t.id = p.trabajador_id
    GROUP BY p.semana_del_anio
    ORDER BY p.semana_del_anio DESC`
  );

  return result.rows.map((row) => ({
    semana_del_anio: Number(row.semana_del_anio),
    total_semana: Number(row.total_semana),
    pagos: row.pagos,
  }));
}

export async function getRemuneracionesByTrabajador(trabajadorId: string): Promise<ResumenSemanalItem[]> {
  const result = await pool.query<{
    semana_del_anio: number;
    total_semana: string;
    pagos: Array<{
      pago_id: string;
      trabajador_id: string;
      trabajador_nombre: string;
      monto_pagado: number;
      fecha_pago: string;
      tipo_pago: "Sueldo" | "Adelanto" | "Bono";
      observaciones: string | null;
    }>;
  }>(
    `SELECT
      p.semana_del_anio,
      ROUND(SUM(p.monto_pagado)::numeric, 2) AS total_semana,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'pago_id', p.id,
          'trabajador_id', t.id,
          'trabajador_nombre', t.nombre_completo,
          'monto_pagado', p.monto_pagado,
          'fecha_pago', p.fecha_pago,
          'tipo_pago', p.tipo_pago,
          'observaciones', p.observaciones
        )
        ORDER BY p.fecha_pago ASC
      ) AS pagos
    FROM pagos_personal p
    INNER JOIN trabajadores t ON t.id = p.trabajador_id
    WHERE p.trabajador_id = $1
    GROUP BY p.semana_del_anio
    ORDER BY p.semana_del_anio DESC`,
    [trabajadorId]
  );

  return result.rows.map((row) => ({
    semana_del_anio: Number(row.semana_del_anio),
    total_semana: Number(row.total_semana),
    pagos: row.pagos,
  }));
}

export async function upsertHorario(payload: HorarioUpsertInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM horarios_turnos
       WHERE fecha = $1::date`,
      [payload.fecha]
    );

    for (const item of payload.asignaciones) {
      await client.query(
        `INSERT INTO horarios_turnos (fecha, trabajador_id, hora_entrada, hora_salida)
         VALUES ($1::date, $2, $3::time, $4::time)`,
        [payload.fecha, item.trabajador_id, item.hora_entrada, item.hora_salida ?? null]
      );
    }

    await client.query("COMMIT");

    return {
      fecha: payload.fecha,
      asignaciones: payload.asignaciones,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getHorariosByMonth(month: string) {
  const result = await pool.query(
    `SELECT h.id, h.fecha, h.hora_entrada, h.hora_salida, h.trabajador_id, t.nombre_completo, t.rol
     FROM horarios_turnos h
     INNER JOIN trabajadores t ON t.id = h.trabajador_id
     WHERE DATE_TRUNC('month', h.fecha) = DATE_TRUNC('month', $1::date)
     ORDER BY h.fecha ASC, h.hora_entrada ASC, t.nombre_completo ASC`,
    [`${month}-01`]
  );

  return result.rows;
}

export async function getHorariosByMonthForWorker(month: string, trabajadorId: string) {
  const result = await pool.query(
    `SELECT h.id, h.fecha, h.hora_entrada, h.hora_salida, h.trabajador_id, t.nombre_completo, t.rol
     FROM horarios_turnos h
     INNER JOIN trabajadores t ON t.id = h.trabajador_id
     WHERE DATE_TRUNC('month', h.fecha) = DATE_TRUNC('month', $1::date)
       AND h.trabajador_id = $2
     ORDER BY h.fecha ASC, h.hora_entrada ASC`,
    [`${month}-01`, trabajadorId]
  );

  return result.rows;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export async function bulkCreateProveedores(items: ProveedorBulkInput[]): Promise<BulkInsertResult> {
  const normalizedRows = items
    .map((item) => ({
      nombre: item.nombre?.trim() ?? "",
      nombre_key: normalizeName(item.nombre ?? ""),
      ruc_dni: item.ruc_dni?.trim() || null,
      contacto: item.contacto?.trim() || null,
    }))
    .filter((item) => item.nombre.length > 0);

  const uniqueRows = new Map<string, { nombre: string; ruc_dni: string | null; contacto: string | null }>();
  for (const row of normalizedRows) {
    if (!uniqueRows.has(row.nombre_key)) {
      uniqueRows.set(row.nombre_key, { nombre: row.nombre, ruc_dni: row.ruc_dni, contacto: row.contacto });
    }
  }

  const keys = Array.from(uniqueRows.keys());
  const existingResult = keys.length
    ? await pool.query<{ nombre_key: string }>(
        `SELECT LOWER(TRIM(nombre)) AS nombre_key
         FROM proveedores
         WHERE LOWER(TRIM(nombre)) = ANY($1::text[])`,
        [keys]
      )
    : { rows: [] as Array<{ nombre_key: string }> };

  const existingKeys = new Set(existingResult.rows.map((row) => row.nombre_key));

  let inserted = 0;
  for (const [key, row] of uniqueRows) {
    if (existingKeys.has(key)) {
      continue;
    }

    await pool.query(
      `INSERT INTO proveedores (nombre, ruc_dni, contacto, activo)
       VALUES ($1, $2, $3, true)`,
      [row.nombre, row.ruc_dni, row.contacto]
    );
    inserted += 1;
  }

  return {
    total: items.length,
    inserted,
    skipped_existing: uniqueRows.size - inserted,
    skipped_invalid: items.length - normalizedRows.length,
  };
}

export async function bulkCreateCategorias(items: Array<{ nombre: string; tipo: string }>): Promise<BulkInsertResult> {
  const normalizedRows = items
    .map((item) => ({
      nombre: item.nombre?.trim() ?? "",
      nombre_key: normalizeName(item.nombre ?? ""),
      tipo: item.tipo,
    }))
    .filter((item) => item.nombre.length > 0);

  const uniqueRows = new Map<string, { nombre: string; tipo: string }>();
  for (const row of normalizedRows) {
    if (!uniqueRows.has(row.nombre_key)) {
      uniqueRows.set(row.nombre_key, { nombre: row.nombre, tipo: row.tipo });
    }
  }

  const keys = Array.from(uniqueRows.keys());
  const existingResult = keys.length
    ? await pool.query<{ nombre_key: string }>(
        `SELECT LOWER(TRIM(nombre)) AS nombre_key
         FROM categorias
         WHERE LOWER(TRIM(nombre)) = ANY($1::text[])`,
        [keys]
      )
    : { rows: [] as Array<{ nombre_key: string }> };

  const existingKeys = new Set(existingResult.rows.map((row) => row.nombre_key));

  let inserted = 0;
  for (const [key, row] of uniqueRows) {
    if (existingKeys.has(key)) {
      continue;
    }

    await pool.query(
      `INSERT INTO categorias (nombre, tipo, activo)
       VALUES ($1, $2::categoria_tipo_enum, true)`,
      [row.nombre, row.tipo]
    );
    inserted += 1;
  }

  return {
    total: items.length,
    inserted,
    skipped_existing: uniqueRows.size - inserted,
    skipped_invalid: items.length - normalizedRows.length,
  };
}

export async function bulkCreateTrabajadores(items: Array<{ nombre_completo: string; rol: string; dni?: string; telefono?: string | null; correo?: string | null }>): Promise<BulkInsertResult> {
  const normalizedRows = items
    .map((item) => ({
      nombre_completo: item.nombre_completo?.trim() ?? "",
      nombre_key: normalizeName(item.nombre_completo ?? ""),
      rol: item.rol,
      dni: item.dni?.trim() ?? "",
      telefono: item.telefono?.trim() || null,
      correo: item.correo?.trim() || null,
    }))
    .filter((item) => item.nombre_completo.length > 0);

  const uniqueRows = new Map<string, { nombre_completo: string; rol: string; dni: string; telefono: string | null; correo: string | null }>();
  for (const row of normalizedRows) {
    if (!uniqueRows.has(row.nombre_key)) {
      uniqueRows.set(row.nombre_key, { nombre_completo: row.nombre_completo, rol: row.rol, dni: row.dni, telefono: row.telefono, correo: row.correo });
    }
  }

  const keys = Array.from(uniqueRows.keys());
  const existingResult = keys.length
    ? await pool.query<{ nombre_key: string }>(
        `SELECT LOWER(TRIM(nombre_completo)) AS nombre_key
         FROM trabajadores
         WHERE LOWER(TRIM(nombre_completo)) = ANY($1::text[])`,
        [keys]
      )
    : { rows: [] as Array<{ nombre_key: string }> };

  const existingKeys = new Set(existingResult.rows.map((row) => row.nombre_key));

  let inserted = 0;
  for (const [key, row] of uniqueRows) {
    if (existingKeys.has(key)) {
      continue;
    }

    await pool.query(
      `INSERT INTO trabajadores (nombre_completo, rol, dni, telefono, correo, activo)
       VALUES ($1, $2::trabajador_rol_enum, $3, $4, $5, true)`,
      [row.nombre_completo, row.rol, row.dni || null, row.telefono, row.correo]
    );
    inserted += 1;
  }

  return {
    total: items.length,
    inserted,
    skipped_existing: uniqueRows.size - inserted,
    skipped_invalid: items.length - normalizedRows.length,
  };
}

export async function bulkCreateProductos(items: ProductoBulkInput[]): Promise<ProductoBulkInsertResult> {
  const normalizedRows = items
    .map((item) => ({
      nombre: item.nombre?.trim() ?? "",
      nombre_key: normalizeName(item.nombre ?? ""),
      categoria: item.categoria?.trim() ?? "",
      categoria_key: normalizeName(item.categoria ?? ""),
    }))
    .filter((item) => item.nombre.length > 0 && item.categoria.length > 0);

  const uniqueRows = new Map<string, { nombre: string; categoria: string; categoria_key: string }>();
  for (const row of normalizedRows) {
    if (!uniqueRows.has(row.nombre_key)) {
      uniqueRows.set(row.nombre_key, {
        nombre: row.nombre,
        categoria: row.categoria,
        categoria_key: row.categoria_key,
      });
    }
  }

  const categoriaKeys = Array.from(new Set(Array.from(uniqueRows.values()).map((row) => row.categoria_key)));
  const categoriasResult = categoriaKeys.length
    ? await pool.query<{ id: string; nombre_key: string }>(
        `SELECT id, LOWER(TRIM(nombre)) AS nombre_key
         FROM categorias
         WHERE LOWER(TRIM(nombre)) = ANY($1::text[])
           AND activo = true`,
        [categoriaKeys]
      )
    : { rows: [] as Array<{ id: string; nombre_key: string }> };

  const categoriaMap = new Map(categoriasResult.rows.map((row) => [row.nombre_key, row.id]));

  const productKeys = Array.from(uniqueRows.keys());
  const existingProductsResult = productKeys.length
    ? await pool.query<{ nombre_key: string }>(
        `SELECT LOWER(TRIM(nombre)) AS nombre_key
         FROM productos
         WHERE LOWER(TRIM(nombre)) = ANY($1::text[])`,
        [productKeys]
      )
    : { rows: [] as Array<{ nombre_key: string }> };

  const existingProductKeys = new Set(existingProductsResult.rows.map((row) => row.nombre_key));
  const skippedMissingCategory: Array<{ nombre: string; categoria: string }> = [];

  let inserted = 0;
  let skippedExisting = 0;
  for (const [key, row] of uniqueRows) {
    if (existingProductKeys.has(key)) {
      skippedExisting += 1;
      continue;
    }

    const categoriaId = categoriaMap.get(row.categoria_key);
    if (!categoriaId) {
      skippedMissingCategory.push({ nombre: row.nombre, categoria: row.categoria });
      continue;
    }

    await pool.query(
      `INSERT INTO productos (nombre, categoria_id, activo)
       VALUES ($1, $2, true)`,
      [row.nombre, categoriaId]
    );
    inserted += 1;
  }

  return {
    total: items.length,
    inserted,
    skipped_existing: skippedExisting,
    skipped_invalid: items.length - normalizedRows.length,
    skipped_missing_category: skippedMissingCategory,
  };
}
