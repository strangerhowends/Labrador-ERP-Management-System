import type { PoolClient } from "pg";
import { pool } from "../config/db.js";
import type {
  DocumentoConDetalles,
  GastoDetalleInput,
  GastoDetalleRow,
  GastoDocumentoResponseItem,
  GastoDocumentoInput,
  GastoLoteResumen,
  GastoPayload,
  GastoResumenFecha,
  GastoResumenDocumentoFecha,
  GastoResumenDiario,
  GastoResponse,
  UpdateDocumentoPayload,
} from "../types/gastos.types.js";

export async function createGastoTransaccional(payload: GastoPayload): Promise<GastoResponse> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const loteId = await insertLote(client, payload);
    const documentoResults: GastoDocumentoResponseItem[] = [];
    let totalLote = 0;

    for (const documento of payload.documentos) {
      const documentoId = await insertDocumento(client, loteId, documento);

      let totalDocumento = 0;
      for (const detalle of documento.detalles) {
        totalDocumento += await insertDetalle(client, documentoId, detalle);
      }

      const updatedDocumento = await updateDocumentoTotal(client, documentoId, documento.numero_documento, totalDocumento);
      totalLote += updatedDocumento.total_documento;
      documentoResults.push(updatedDocumento);
    }

    await client.query("COMMIT");

    return {
      lote_id: loteId,
      documentos: documentoResults,
      total_lote: round2(totalLote),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function insertLote(client: PoolClient, payload: GastoPayload): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO gastos_lotes (
      nombre_descriptivo,
      tiene_presupuesto,
      monto_presupuesto,
      fecha_creacion
    ) VALUES ($1, $2, $3, $4)
    RETURNING id`,
    [
      payload.lote.nombre_descriptivo,
      payload.lote.tiene_presupuesto,
      payload.lote.monto_presupuesto,
      payload.lote.fecha_creacion,
    ]
  );

  return result.rows[0].id;
}

async function insertDocumento(client: PoolClient, loteId: string, documento: GastoDocumentoInput): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO gastos_documentos (
      lote_id,
      referencia_factura,
      tipo_documento,
      numero_documento,
      fecha_emision,
      proveedor_id,
      total_documento
    ) VALUES ($1, $2, $3, $4, $5, $6, 0)
    RETURNING id`,
    [
      loteId,
      documento.referencia_factura,
      documento.tipo_documento,
      documento.numero_documento,
      documento.fecha_emision,
      documento.proveedor_id,
    ]
  );

  return result.rows[0].id;
}

async function insertDetalle(client: PoolClient, documentoId: string, detalle: GastoDetalleInput): Promise<number> {
  const subtotal = round2(detalle.cantidad * detalle.precio_unitario_lista);
  const totalPagado = round2(subtotal - detalle.descuento);
  const precioUnitarioReal = detalle.cantidad > 0 ? round2(totalPagado / detalle.cantidad) : 0;

  await client.query(
    `INSERT INTO gastos_detalles (
      documento_id,
      producto_id,
      categoria_id,
      cantidad,
      precio_unitario_lista,
      descuento,
      subtotal,
      total_pagado,
      precio_unitario_real
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      documentoId,
      detalle.producto_id,
      detalle.categoria_id,
      detalle.cantidad,
      detalle.precio_unitario_lista,
      detalle.descuento,
      subtotal,
      totalPagado,
      precioUnitarioReal,
    ]
  );

  return totalPagado;
}

async function updateDocumentoTotal(
  client: PoolClient,
  documentoId: string,
  numeroDocumento: string,
  totalDocumento: number
): Promise<GastoDocumentoResponseItem> {
  const result = await client.query<{ id: string; total_documento: number }>(
    `UPDATE gastos_documentos
     SET total_documento = $2
     WHERE id = $1
     RETURNING id, total_documento`,
    [documentoId, round2(totalDocumento)]
  );

  return {
    documento_id: result.rows[0].id,
    numero_documento: numeroDocumento,
    total_documento: Number(result.rows[0].total_documento),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getGastosResumenDiario(month?: string): Promise<GastoResumenDiario[]> {
  const hasMonth = Boolean(month && /^\d{4}-\d{2}$/.test(month));

  const baseQuery = `
    SELECT
      d.fecha_emision::text AS fecha,
      ROUND(SUM(d.total_documento)::numeric, 2) AS total_gastado
    FROM gastos_documentos d
  `;

  const monthQuery = `
    ${baseQuery}
    WHERE DATE_TRUNC('month', d.fecha_emision) = DATE_TRUNC('month', $1::date)
    GROUP BY d.fecha_emision
    ORDER BY d.fecha_emision ASC
  `;

  const allQuery = `
    ${baseQuery}
    GROUP BY d.fecha_emision
    ORDER BY d.fecha_emision ASC
  `;

  const result = hasMonth
    ? await pool.query<{ fecha: string; total_gastado: string }>(monthQuery, [`${month}-01`])
    : await pool.query<{ fecha: string; total_gastado: string }>(allQuery);

  return result.rows.map((row) => ({
    fecha: row.fecha,
    total_gastado: Number(row.total_gastado),
  }));
}

export async function getResumenComprasPorFecha(fecha: string): Promise<GastoResumenFecha> {
  const documentosResult = await pool.query<{
    documento_id: string;
    referencia_factura: string;
    tipo_documento: "Factura" | "Boleta";
    numero_documento: string;
    proveedor_nombre: string;
    total_documento: string;
    items_count: string;
  }>(
    `SELECT
      d.id AS documento_id,
      d.referencia_factura,
      d.tipo_documento,
      d.numero_documento,
      p.nombre AS proveedor_nombre,
      d.total_documento,
      COUNT(det.id) AS items_count
    FROM gastos_documentos d
    INNER JOIN proveedores p ON p.id = d.proveedor_id
    LEFT JOIN gastos_detalles det ON det.documento_id = d.id
    WHERE d.fecha_emision = $1::date
    GROUP BY d.id, p.nombre
    ORDER BY d.created_at ASC`,
    [fecha]
  );

  const documentos: GastoResumenDocumentoFecha[] = documentosResult.rows.map((row) => ({
    documento_id: row.documento_id,
    referencia_factura: row.referencia_factura,
    tipo_documento: row.tipo_documento,
    numero_documento: row.numero_documento,
    proveedor_nombre: row.proveedor_nombre,
    total_documento: Number(row.total_documento),
    items_count: Number(row.items_count),
  }));

  const total_gastado = documentos.reduce((acc, doc) => acc + doc.total_documento, 0);

  return {
    fecha,
    total_gastado: round2(total_gastado),
    total_documentos: documentos.length,
    documentos,
  };
}

export async function getLotesResumenByMonth(month?: string): Promise<GastoLoteResumen[]> {
  const hasMonth = Boolean(month && /^\d{4}-\d{2}$/.test(month));

  const baseQuery = `
    SELECT
      l.id AS lote_id,
      l.nombre_descriptivo,
      l.fecha_creacion::text AS fecha_creacion,
      ROUND(COALESCE(SUM(d.total_documento), 0)::numeric, 2) AS total_lote,
      COUNT(DISTINCT d.id) AS documentos_count,
      COUNT(det.id) AS items_count
    FROM gastos_lotes l
    LEFT JOIN gastos_documentos d ON d.lote_id = l.id
    LEFT JOIN gastos_detalles det ON det.documento_id = d.id
  `;

  const monthQuery = `
    ${baseQuery}
    WHERE DATE_TRUNC('month', l.fecha_creacion) = DATE_TRUNC('month', $1::date)
    GROUP BY l.id
    ORDER BY l.fecha_creacion ASC, l.created_at ASC
  `;

  const allQuery = `
    ${baseQuery}
    GROUP BY l.id
    ORDER BY l.fecha_creacion ASC, l.created_at ASC
  `;

  const result = hasMonth
    ? await pool.query<{
        lote_id: string;
        nombre_descriptivo: string;
        fecha_creacion: string;
        total_lote: string;
        documentos_count: string;
        items_count: string;
      }>(monthQuery, [`${month}-01`])
    : await pool.query<{
        lote_id: string;
        nombre_descriptivo: string;
        fecha_creacion: string;
        total_lote: string;
        documentos_count: string;
        items_count: string;
      }>(allQuery);

  return result.rows.map((row) => ({
    lote_id: row.lote_id,
    nombre_descriptivo: row.nombre_descriptivo,
    fecha_creacion: row.fecha_creacion,
    total_lote: Number(row.total_lote),
    documentos_count: Number(row.documentos_count),
    items_count: Number(row.items_count),
  }));
}

export async function findDocumentoConDetalles(documentoId: string): Promise<DocumentoConDetalles | null> {
  const docResult = await pool.query<{
    id: string;
    lote_id: string;
    referencia_factura: string;
    tipo_documento: string;
    numero_documento: string;
    fecha_emision: string;
    proveedor_id: string;
    total_documento: string;
  }>(
    `SELECT id, lote_id, referencia_factura, tipo_documento, numero_documento,
            fecha_emision::text, proveedor_id, total_documento
     FROM gastos_documentos WHERE id = $1`,
    [documentoId]
  );

  if (docResult.rows.length === 0) return null;

  const doc = docResult.rows[0];

  const detResult = await pool.query<{
    id: string;
    producto_id: string;
    categoria_id: string;
    cantidad: string;
    precio_unitario_lista: string;
    descuento: string;
    subtotal: string;
    total_pagado: string;
    precio_unitario_real: string;
  }>(
    `SELECT id, producto_id, categoria_id, cantidad, precio_unitario_lista,
            descuento, subtotal, total_pagado, precio_unitario_real
     FROM gastos_detalles WHERE documento_id = $1 ORDER BY created_at ASC`,
    [documentoId]
  );

  const detalles: GastoDetalleRow[] = detResult.rows.map((r) => ({
    id: r.id,
    producto_id: r.producto_id,
    categoria_id: r.categoria_id,
    cantidad: Number(r.cantidad),
    precio_unitario_lista: Number(r.precio_unitario_lista),
    descuento: Number(r.descuento),
    subtotal: Number(r.subtotal),
    total_pagado: Number(r.total_pagado),
    precio_unitario_real: Number(r.precio_unitario_real),
  }));

  return {
    id: doc.id,
    lote_id: doc.lote_id,
    referencia_factura: doc.referencia_factura,
    tipo_documento: doc.tipo_documento as DocumentoConDetalles["tipo_documento"],
    numero_documento: doc.numero_documento,
    fecha_emision: doc.fecha_emision,
    proveedor_id: doc.proveedor_id,
    total_documento: Number(doc.total_documento),
    detalles,
  };
}

export async function updateDocumentoTransaccional(
  documentoId: string,
  payload: UpdateDocumentoPayload
): Promise<DocumentoConDetalles> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verify the document exists and get its lote_id
    const existing = await client.query<{ lote_id: string }>(
      "SELECT lote_id FROM gastos_documentos WHERE id = $1 FOR UPDATE",
      [documentoId]
    );
    if (existing.rows.length === 0) throw new Error("DOCUMENTO_NOT_FOUND");

    const loteId = existing.rows[0].lote_id;

    // 2. Delete all previous detalles (CASCADE would also work, but explicit is clearer)
    await client.query("DELETE FROM gastos_detalles WHERE documento_id = $1", [documentoId]);

    // 3. Insert new detalles and calculate total
    let totalDocumento = 0;
    for (const detalle of payload.detalles) {
      totalDocumento += await insertDetalle(client, documentoId, detalle);
    }

    // 4. Update the document header
    await client.query(
      `UPDATE gastos_documentos
       SET referencia_factura = $2,
           tipo_documento     = $3,
           numero_documento   = $4,
           fecha_emision      = $5,
           proveedor_id       = $6,
           total_documento    = $7
       WHERE id = $1`,
      [
        documentoId,
        payload.referencia_factura,
        payload.tipo_documento,
        payload.numero_documento,
        payload.fecha_emision,
        payload.proveedor_id,
        round2(totalDocumento),
      ]
    );

    // Lote total is computed dynamically (SUM of documents) — no update needed

    await client.query("COMMIT");

    // Re-read the full document with new detalles
    const result = await findDocumentoConDetalles(documentoId);
    return result!;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
