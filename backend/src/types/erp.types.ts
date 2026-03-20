export type CategoriaTipo = "Insumo" | "Gasto Operativo";
export type TrabajadorRol = "Cocina" | "Atencion" | "Limpieza" | "Administracion";
export type TipoPago = "Sueldo" | "Adelanto" | "Bono";
export type PeriodicidadPago = "SEMANAL" | "MENSUAL";
export type EstadoProcesoPago = "BORRADOR" | "CERRADO" | "ANULADO";

export interface ProveedorInput {
  nombre: string;
  ruc_dni?: string | null;
  contacto?: string | null;
  activo?: boolean;
}

export interface ProveedorBulkInput {
  nombre: string;
  ruc_dni?: string | null;
  contacto?: string | null;
}

export interface CategoriaInput {
  nombre: string;
  tipo: CategoriaTipo;
  activo?: boolean;
}

export interface CategoriaBulkInput {
  nombre: string;
  tipo?: CategoriaTipo;
}

export interface ProductoInput {
  nombre: string;
  categoria_id: string;
  activo?: boolean;
}

export interface ProductoBulkInput {
  nombre: string;
  categoria: string;
}

export interface TrabajadorInput {
  nombre_completo: string;
  rol: TrabajadorRol;
  dni: string;
  telefono?: string | null;
  correo?: string | null;
  periodicidad_pago?: PeriodicidadPago;
  activo?: boolean;
}

export interface TrabajadorBulkInput {
  nombre_completo: string;
  rol?: TrabajadorRol;
  dni?: string;
  telefono?: string | null;
  correo?: string | null;
}

export interface BulkInsertResult {
  total: number;
  inserted: number;
  skipped_existing: number;
  skipped_invalid: number;
}

export interface ProductoBulkInsertResult extends BulkInsertResult {
  skipped_missing_category: Array<{ nombre: string; categoria: string }>;
}

export interface RemuneracionInput {
  trabajador_id: string;
  monto_pagado: number;
  fecha_pago: string;
  tipo_pago: TipoPago;
  observaciones?: string | null;
}

export interface HorarioAsignacionInput {
  trabajador_id: string;
  hora_entrada: string;
  hora_salida?: string | null;
}

export interface HorarioUpsertInput {
  fecha: string;
  asignaciones: HorarioAsignacionInput[];
}

export interface ResumenSemanalItem {
  semana_del_anio: number;
  total_semana: number;
  pagos: Array<{
    pago_id: string;
    trabajador_id: string;
    trabajador_nombre: string;
    monto_pagado: number;
    fecha_pago: string;
    tipo_pago: TipoPago;
    observaciones: string | null;
  }>;
}

export interface ProcesoPagoDetalleDiaInput {
  fecha: string;
  trabajo_programado: boolean;
  pago_base_dia: number;
  extra_habilitado?: boolean;
  extra_monto?: number;
  extra_motivo?: string | null;
  descuento_habilitado?: boolean;
  descuento_monto?: number;
  descuento_motivo?: string | null;
}

export interface ProcesoPagoTrabajadorInput {
  trabajador_id: string;
  detalles: ProcesoPagoDetalleDiaInput[];
}

export interface ProcesoPagoSemanalInput {
  anio_iso: number;
  semana_iso: number;
  fecha_inicio_semana: string;
  fecha_fin_semana: string;
  observaciones?: string | null;
  trabajadores: ProcesoPagoTrabajadorInput[];
}

export interface PreviewPagoSemanalRequest {
  fecha_inicio_semana: string;
  trabajador_ids?: string[];
}

export interface PreviewPagoSemanalItem {
  trabajador_id: string;
  trabajador_nombre: string;
  fecha: string;
  trabajo_programado: boolean;
}

export interface ProcesoPagoSemanalResumenItem {
  proceso_id: string;
  anio_iso: number;
  semana_iso: number;
  fecha_inicio_semana: string;
  fecha_fin_semana: string;
  estado: EstadoProcesoPago;
  observaciones: string | null;
  total_neto: number;
  created_at: string;
}

export interface PreviewAsistenciaRangoRequest {
  fecha_inicio: string;
  fecha_fin: string;
  periodicidad_pago: PeriodicidadPago;
  trabajador_ids?: string[];
}
