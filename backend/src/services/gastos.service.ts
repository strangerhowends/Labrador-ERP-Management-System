import { getCatalogos as getCatalogosRepo } from "../repositories/catalogos.repository.js";
import {
  createGastoTransaccional,
  findDocumentoConDetalles,
  getGastosResumenDiario,
  getLotesResumenByMonth,
  getResumenComprasPorFecha,
  updateDocumentoTransaccional,
} from "../repositories/gastos.repository.js";
import { env } from "../config/env.js";
import type {
  DocumentoConDetalles,
  GastoDocumentoInput,
  GastoDetalleInput,
  GastoLoteResumen,
  GastoResumenFecha,
  GastoPayload,
  GastoResumenDiario,
  GastoResponse,
  GastoLoteInput,
  TipoDocumento,
  UpdateDocumentoPayload,
} from "../types/gastos.types.js";

const TIPOS: TipoDocumento[] = ["Factura", "Boleta"];

export async function createGasto(payload: GastoPayload): Promise<GastoResponse> {
  validatePayload(payload);
  return createGastoTransaccional(payload);
}

export async function getCatalogos() {
  return getCatalogosRepo();
}

export async function getResumenDiario(month?: string): Promise<GastoResumenDiario[]> {
  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("month debe tener formato YYYY-MM");
  }
  return getGastosResumenDiario(month);
}

export async function getResumenPorFecha(date: string): Promise<GastoResumenFecha> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date debe tener formato YYYY-MM-DD");
  }
  return getResumenComprasPorFecha(date);
}

export async function getLotesResumen(month?: string): Promise<GastoLoteResumen[]> {
  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("month debe tener formato YYYY-MM");
  }
  return getLotesResumenByMonth(month);
}

export async function getDocumentoConDetalles(id: string): Promise<DocumentoConDetalles | null> {
  return findDocumentoConDetalles(id);
}

export async function updateDocumento(id: string, payload: UpdateDocumentoPayload): Promise<DocumentoConDetalles> {
  validateUpdatePayload(payload);
  return updateDocumentoTransaccional(id, payload);
}

function validateUpdatePayload(payload: UpdateDocumentoPayload): void {
  if (!payload.referencia_factura?.trim()) throw new Error("referencia_factura es requerida");
  if (!TIPOS.includes(payload.tipo_documento)) throw new Error("tipo_documento inválido");
  if (!payload.numero_documento?.trim()) throw new Error("numero_documento es requerido");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.fecha_emision)) throw new Error("fecha_emision inválida");
  if (!payload.proveedor_id) throw new Error("proveedor_id es requerido");

  if (!Array.isArray(payload.detalles) || payload.detalles.length === 0) {
    throw new Error("detalles debe contener al menos un item");
  }

  payload.detalles.forEach((detalle, i) => validateDetalle(detalle, 1, i));
}

function validatePayload(payload: GastoPayload): void {
  if (!payload?.security_key) {
    throw new Error("security_key es requerida");
  }

  if (payload.security_key !== env.securityKeySave) {
    throw new Error("security_key inválida");
  }

  if (!payload?.lote) {
    throw new Error("lote es requerido");
  }

  if (!Array.isArray(payload.documentos) || payload.documentos.length === 0) {
    throw new Error("documentos debe contener al menos un documento");
  }

  validateLote(payload.lote);
  payload.documentos.forEach((documento, index) => validateDocumento(documento, index));
}

function validateLote(lote: GastoLoteInput): void {
  if (!lote.nombre_descriptivo?.trim()) throw new Error("nombre_descriptivo es requerido");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lote.fecha_creacion)) throw new Error("fecha_creacion inválida");

  if (lote.tiene_presupuesto) {
    lote.monto_presupuesto = Number(lote.monto_presupuesto);
    if (Number.isNaN(lote.monto_presupuesto) || lote.monto_presupuesto < 0) {
      throw new Error("monto_presupuesto inválido");
    }
  } else {
    lote.monto_presupuesto = null;
  }
}

function validateDocumento(documento: GastoDocumentoInput, index: number): void {
  const row = index + 1;

  if (!documento.referencia_factura?.trim()) throw new Error(`referencia_factura requerida en documento ${row}`);
  if (!TIPOS.includes(documento.tipo_documento)) throw new Error(`tipo_documento inválido en documento ${row}`);
  if (!documento.numero_documento?.trim()) throw new Error(`numero_documento requerido en documento ${row}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(documento.fecha_emision)) throw new Error(`fecha_emision inválida en documento ${row}`);
  if (!documento.proveedor_id) throw new Error(`proveedor_id requerido en documento ${row}`);

  if (!Array.isArray(documento.detalles) || documento.detalles.length === 0) {
    throw new Error(`detalles debe contener al menos un item en documento ${row}`);
  }

  documento.detalles.forEach((detalle, detalleIndex) => validateDetalle(detalle, row, detalleIndex));
}

function validateDetalle(detalle: GastoDetalleInput, documentoRow: number, detalleIndex: number): void {
  const row = detalleIndex + 1;

  if (!detalle.producto_id) throw new Error(`producto_id requerido en documento ${documentoRow}, fila ${row}`);
  if (!detalle.categoria_id) throw new Error(`categoria_id requerido en documento ${documentoRow}, fila ${row}`);

  detalle.cantidad = Number(detalle.cantidad);
  detalle.precio_unitario_lista = Number(detalle.precio_unitario_lista);
  detalle.descuento = Number(detalle.descuento);

  if (Number.isNaN(detalle.cantidad) || detalle.cantidad <= 0) {
    throw new Error(`cantidad inválida en documento ${documentoRow}, fila ${row}`);
  }

  if (Number.isNaN(detalle.precio_unitario_lista) || detalle.precio_unitario_lista < 0) {
    throw new Error(`precio_unitario_lista inválido en documento ${documentoRow}, fila ${row}`);
  }

  if (Number.isNaN(detalle.descuento) || detalle.descuento < 0) {
    throw new Error(`descuento inválido en documento ${documentoRow}, fila ${row}`);
  }
}
