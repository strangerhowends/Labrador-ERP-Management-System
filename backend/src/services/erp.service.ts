import { getISOWeek, parseISO } from "date-fns";
import {
  bulkCreateCategorias,
  bulkCreateProductos,
  bulkCreateProveedores,
  bulkCreateTrabajadores,
  createCategoria,
  createProducto,
  createProveedor,
  createRemuneracion,
  createTrabajador,
  deactivateCategoria,
  deactivateProducto,
  deactivateProveedor,
  deactivateTrabajador,
  deleteRemuneracion,
  getHorariosByMonth,
  getHorariosByMonthForWorker,
  getRemuneracionesByTrabajador,
  getRemuneracionesSemanales,
  listCategorias,
  listProductos,
  listProveedores,
  listTrabajadores,
  updateCategoria,
  updateProducto,
  updateProveedor,
  updateRemuneracion,
  updateTrabajador,
  upsertHorario,
} from "../repositories/erp.repository.js";
import type {
  BulkInsertResult,
  CategoriaInput,
  CategoriaTipo,
  HorarioUpsertInput,
  ProductoBulkInsertResult,
  ProductoInput,
  ProveedorInput,
  RemuneracionInput,
  TrabajadorRol,
  TrabajadorInput,
} from "../types/erp.types.js";

export async function getProveedores(activeOnly: boolean) {
  return listProveedores(activeOnly);
}

export async function addProveedor(input: ProveedorInput) {
  requireText(input.nombre, "nombre");
  return createProveedor(input);
}

export async function editProveedor(id: string, input: ProveedorInput) {
  requireText(input.nombre, "nombre");
  return updateProveedor(id, input);
}

export async function disableProveedor(id: string) {
  return deactivateProveedor(id);
}

export async function addProveedoresBulk(payload: unknown): Promise<BulkInsertResult> {
  const rows = requireArrayPayload(payload, "proveedores");

  return bulkCreateProveedores(
    rows.map((item) => ({
      nombre: getString(item, "nombre"),
      ruc_dni: optionalString(item, "ruc_dni"),
      contacto: optionalString(item, "contacto"),
    }))
  );
}

export async function getCategorias(activeOnly: boolean) {
  return listCategorias(activeOnly);
}

export async function addCategoria(input: CategoriaInput) {
  requireText(input.nombre, "nombre");
  return createCategoria(input);
}

export async function editCategoria(id: string, input: CategoriaInput) {
  requireText(input.nombre, "nombre");
  return updateCategoria(id, input);
}

export async function disableCategoria(id: string) {
  return deactivateCategoria(id);
}

export async function addCategoriasBulk(payload: unknown): Promise<BulkInsertResult> {
  const rows = requireArrayPayload(payload, "categorias");

  return bulkCreateCategorias(
    rows.map((item) => ({
      nombre: getString(item, "nombre"),
      tipo: normalizeCategoriaTipo(optionalString(item, "tipo") ?? "Insumo"),
    }))
  );
}

export async function getProductos(activeOnly: boolean) {
  return listProductos(activeOnly);
}

export async function addProducto(input: ProductoInput) {
  requireText(input.nombre, "nombre");
  requireText(input.categoria_id, "categoria_id");
  return createProducto(input);
}

export async function editProducto(id: string, input: ProductoInput) {
  requireText(input.nombre, "nombre");
  requireText(input.categoria_id, "categoria_id");
  return updateProducto(id, input);
}

export async function disableProducto(id: string) {
  return deactivateProducto(id);
}

export async function addProductosBulk(payload: unknown): Promise<ProductoBulkInsertResult> {
  const rows = requireArrayPayload(payload, "productos");

  return bulkCreateProductos(
    rows.map((item) => ({
      nombre: getString(item, "nombre"),
      categoria: getString(item, "categoria"),
    }))
  );
}

export async function getTrabajadores(activeOnly: boolean) {
  return listTrabajadores(activeOnly);
}

export async function addTrabajador(input: TrabajadorInput) {
  requireText(input.nombre_completo, "nombre_completo");
  requireText(input.dni, "dni");
  return createTrabajador(input);
}

export async function editTrabajador(id: string, input: TrabajadorInput) {
  requireText(input.nombre_completo, "nombre_completo");
  requireText(input.dni, "dni");
  return updateTrabajador(id, input);
}

export async function disableTrabajador(id: string) {
  return deactivateTrabajador(id);
}

export async function addTrabajadoresBulk(payload: unknown): Promise<BulkInsertResult> {
  const rows = requireArrayPayload(payload, "trabajadores");

  return bulkCreateTrabajadores(
    rows.map((item) => ({
      nombre_completo: getString(item, "nombre_completo"),
      rol: normalizeTrabajadorRol(optionalString(item, "rol") ?? "Cocina"),
      dni: getString(item, "dni"),
      telefono: optionalString(item, "telefono"),
      correo: optionalString(item, "correo"),
    }))
  );
}

export async function addRemuneracion(input: RemuneracionInput) {
  requireText(input.trabajador_id, "trabajador_id");
  requireText(input.fecha_pago, "fecha_pago");

  const monto = Number(input.monto_pagado);
  if (Number.isNaN(monto) || monto <= 0) {
    throw new Error("monto_pagado debe ser mayor que 0");
  }

  const fecha = parseISO(input.fecha_pago);
  const semanaDelAnio = getISOWeek(fecha);

  return createRemuneracion(
    {
      ...input,
      monto_pagado: monto,
    },
    semanaDelAnio
  );
}

export async function getResumenRemuneracionesSemanales() {
  return getRemuneracionesSemanales();
}

export async function getResumenRemuneracionesPorTrabajador(trabajadorId: string) {
  return getRemuneracionesByTrabajador(trabajadorId);
}

export async function editRemuneracion(id: string, input: RemuneracionInput) {
  requireText(input.trabajador_id, "trabajador_id");
  requireText(input.fecha_pago, "fecha_pago");

  const monto = Number(input.monto_pagado);
  if (Number.isNaN(monto) || monto <= 0) {
    throw new Error("monto_pagado debe ser mayor que 0");
  }

  const fecha = parseISO(input.fecha_pago);
  const semanaDelAnio = getISOWeek(fecha);

  return updateRemuneracion(id, { ...input, monto_pagado: monto }, semanaDelAnio);
}

export async function removeRemuneracion(id: string) {
  return deleteRemuneracion(id);
}

export async function saveHorario(payload: HorarioUpsertInput) {
  requireText(payload.fecha, "fecha");
  if (!Array.isArray(payload.asignaciones)) {
    throw new Error("asignaciones debe ser un arreglo");
  }

  for (const item of payload.asignaciones) {
    requireText(item.trabajador_id, "trabajador_id");
    validateTime(item.hora_entrada, "hora_entrada");
    if (item.hora_salida) {
      validateTime(item.hora_salida, "hora_salida");
    }
  }

  return upsertHorario(payload);
}

export async function getHorarios(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("month debe tener formato YYYY-MM");
  }

  return getHorariosByMonth(month);
}

export async function getHorariosForWorker(month: string, trabajadorId: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("month debe tener formato YYYY-MM");
  }

  return getHorariosByMonthForWorker(month, trabajadorId);
}

function requireText(value: string | undefined | null, field: string) {
  if (!value || !value.trim()) {
    throw new Error(`${field} es requerido`);
  }
}

function validateTime(value: string, field: string) {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
    throw new Error(`${field} debe tener formato HH:mm`);
  }
}

function requireArrayPayload(payload: unknown, field: string): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") {
    throw new Error(`${field} es requerido`);
  }

  const value = (payload as { items?: unknown[] }).items;
  if (!Array.isArray(value)) {
    throw new Error(`items (${field}) debe ser un arreglo`);
  }

  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}

function getString(obj: Record<string, unknown>, field: string) {
  const raw = obj[field];
  if (typeof raw !== "string") {
    return "";
  }
  return raw;
}

function optionalString(obj: Record<string, unknown>, field: string) {
  const raw = obj[field];
  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim();
  return value.length > 0 ? value : null;
}

function normalizeCategoriaTipo(value: string): CategoriaTipo {
  if (value === "Gasto Operativo") {
    return "Gasto Operativo";
  }
  return "Insumo";
}

function normalizeTrabajadorRol(value: string): TrabajadorRol {
  switch (value) {
    case "Atencion":
      return "Atencion";
    case "Limpieza":
      return "Limpieza";
    case "Administracion":
      return "Administracion";
    default:
      return "Cocina";
  }
}
