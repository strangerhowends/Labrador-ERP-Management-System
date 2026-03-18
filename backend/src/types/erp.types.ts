export type CategoriaTipo = "Insumo" | "Gasto Operativo";
export type TrabajadorRol = "Cocina" | "Atencion" | "Limpieza" | "Administracion";
export type TipoPago = "Sueldo" | "Adelanto" | "Bono";

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
