export type TipoDocumento = "Factura" | "Boleta";

export interface CatalogItem {
  id: string;
  nombre: string;
}

export interface GastoLoteInput {
  nombre_descriptivo: string;
  tiene_presupuesto: boolean;
  monto_presupuesto?: number | null;
  fecha_creacion: string;
}

export interface GastoDocumentoInput {
  referencia_factura: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  fecha_emision: string;
  proveedor_id: string;
  detalles: GastoDetalleInput[];
}

export interface GastoDetalleInput {
  producto_id: string;
  categoria_id: string;
  cantidad: number;
  precio_unitario_lista: number;
  descuento: number;
}

export interface GastoPayload {
  security_key: string;
  lote: GastoLoteInput;
  documentos: GastoDocumentoInput[];
}

export interface GastoDocumentoResponseItem {
  documento_id: string;
  numero_documento: string;
  total_documento: number;
}

export interface GastoResponse {
  lote_id: string;
  documentos: GastoDocumentoResponseItem[];
  total_lote: number;
}

export interface GastoResumenDiario {
  fecha: string;
  total_gastado: number;
}

export interface GastoResumenDocumentoFecha {
  documento_id: string;
  referencia_factura: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  proveedor_nombre: string;
  total_documento: number;
  items_count: number;
}

export interface GastoResumenFecha {
  fecha: string;
  total_gastado: number;
  total_documentos: number;
  documentos: GastoResumenDocumentoFecha[];
}

export interface GastoLoteResumen {
  lote_id: string;
  nombre_descriptivo: string;
  fecha_creacion: string;
  total_lote: number;
  documentos_count: number;
  items_count: number;
}

export interface GastoDetalleRow {
  id: string;
  producto_id: string;
  categoria_id: string;
  cantidad: number;
  precio_unitario_lista: number;
  descuento: number;
  subtotal: number;
  total_pagado: number;
  precio_unitario_real: number;
}

export interface DocumentoConDetalles {
  id: string;
  lote_id: string;
  referencia_factura: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  fecha_emision: string;
  proveedor_id: string;
  total_documento: number;
  detalles: GastoDetalleRow[];
}

export interface UpdateDocumentoPayload {
  referencia_factura: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  fecha_emision: string;
  proveedor_id: string;
  detalles: GastoDetalleInput[];
}
