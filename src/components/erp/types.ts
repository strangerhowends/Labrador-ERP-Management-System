export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type CategoriaTipo = "Insumo" | "Gasto Operativo";
export type TrabajadorRol = "Cocina" | "Atencion" | "Limpieza" | "Administracion";
export type TipoPago = "Sueldo" | "Adelanto" | "Bono";

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
