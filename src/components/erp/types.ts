export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type CategoriaTipo = "Insumo" | "Gasto Operativo";
export type TrabajadorRol = "Cocina" | "Atencion" | "Limpieza" | "Administracion";
export type TipoPago = "Sueldo" | "Adelanto" | "Bono";
export type PeriodicidadPago = "SEMANAL" | "MENSUAL";

export interface Proveedor {
  id: string;
  nombre: string;
  ruc_dni: string | null;
  contacto: string | null;
  activo: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
  tipo: CategoriaTipo;
  activo: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria_id: string;
  categoria_nombre?: string;
  activo: boolean;
}

export type RolAcceso = "ADMIN" | "TRABAJADOR";

export interface Trabajador {
  id: string;
  nombre_completo: string;
  rol: TrabajadorRol;
  dni: string;
  telefono: string | null;
  correo: string | null;
  periodicidad_pago: PeriodicidadPago;
  activo: boolean;
  rol_acceso: RolAcceso;
  tiene_password: boolean;
}

export interface PagoDetalle {
  pago_id: string;
  trabajador_id: string;
  trabajador_nombre: string;
  monto_pagado: number;
  fecha_pago: string;
  tipo_pago: TipoPago;
  observaciones: string | null;
}

export interface ResumenSemanal {
  semana_del_anio: number;
  total_semana: number;
  pagos: PagoDetalle[];
}

export interface HorarioItem {
  id: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string | null;
  trabajador_id: string;
  nombre_completo: string;
  rol: TrabajadorRol;
}

export interface HorarioAsignacionInput {
  trabajador_id: string;
  hora_entrada: string;
  hora_salida?: string | null;
}

export interface PreviewProcesoPagoDia {
  fecha: string;
  trabajo_programado: boolean;
}

export interface PreviewProcesoPagoTrabajador {
  trabajador_id: string;
  trabajador_nombre: string;
  dias: PreviewProcesoPagoDia[];
}

export interface PreviewProcesoPagoResponse {
  fecha_inicio_semana: string;
  fecha_fin_semana: string;
  trabajadores: PreviewProcesoPagoTrabajador[];
}

export interface PreviewAsistenciaRangoResponse {
  fecha_inicio: string;
  fecha_fin: string;
  periodicidad_pago: PeriodicidadPago;
  trabajadores: PreviewProcesoPagoTrabajador[];
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

export interface ProcesoPagoSemanalPayload {
  anio_iso: number;
  semana_iso: number;
  fecha_inicio_semana: string;
  fecha_fin_semana: string;
  observaciones?: string | null;
  trabajadores: Array<{
    trabajador_id: string;
    detalles: ProcesoPagoDetalleDiaInput[];
  }>;
}

export interface ProcesoPagoSemanalResumen {
  proceso_id: string;
  anio_iso: number;
  semana_iso: number;
  fecha_inicio_semana: string;
  fecha_fin_semana: string;
  estado: "BORRADOR" | "CERRADO" | "ANULADO";
  observaciones: string | null;
  total_neto: number;
  created_at: string;
}
