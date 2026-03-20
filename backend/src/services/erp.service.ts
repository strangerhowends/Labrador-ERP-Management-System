import { addDays, format, getISOWeek, getISOWeekYear, parseISO } from "date-fns";
import {
  bulkCreateCategorias,
  bulkCreateProductos,
  bulkCreateProveedores,
  bulkCreateTrabajadores,
  createCategoria,
  createProcesoPagoSemanal,
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
  getWeeklyPaymentPreview,
  getAttendancePreviewByRange,
  listCategorias,
  listProcesosPagoSemanal,
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
  PreviewPagoSemanalRequest,
  PreviewAsistenciaRangoRequest,
  ProcesoPagoSemanalInput,
  ProductoBulkInsertResult,
  ProductoInput,
  ProveedorInput,
  RemuneracionInput,
  TrabajadorInput,
  TrabajadorRol,
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

export async function getPreviewProcesoPagoSemanal(input: PreviewPagoSemanalRequest) {
  requireText(input.fecha_inicio_semana, "fecha_inicio_semana");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha_inicio_semana)) {
    throw new Error("fecha_inicio_semana debe tener formato YYYY-MM-DD");
  }

  const preview = await getWeeklyPaymentPreview(input.fecha_inicio_semana, input.trabajador_ids);
  const grouped = new Map<string, { trabajador_id: string; trabajador_nombre: string; dias: Array<{ fecha: string; trabajo_programado: boolean }> }>();

  for (const row of preview) {
    const key = row.trabajador_id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        trabajador_id: row.trabajador_id,
        trabajador_nombre: row.trabajador_nombre,
        dias: [],
      });
    }

    grouped.get(key)!.dias.push({
      fecha: row.fecha,
      trabajo_programado: row.trabajo_programado,
    });
  }

  return {
    fecha_inicio_semana: input.fecha_inicio_semana,
    fecha_fin_semana: format(addDays(parseISO(input.fecha_inicio_semana), 6), "yyyy-MM-dd"),
    trabajadores: Array.from(grouped.values()),
  };
}

export async function getPreviewAsistenciaRango(input: PreviewAsistenciaRangoRequest) {
  requireText(input.fecha_inicio, "fecha_inicio");
  requireText(input.fecha_fin, "fecha_fin");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha_inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(input.fecha_fin)) {
    throw new Error("fecha_inicio y fecha_fin deben tener formato YYYY-MM-DD");
  }

  const inicio = parseISO(input.fecha_inicio);
  const fin = parseISO(input.fecha_fin);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    throw new Error("fechas invalidas");
  }

  if (inicio > fin) {
    throw new Error("fecha_inicio no puede ser mayor que fecha_fin");
  }

  const diffDays = Math.floor((fin.getTime() - inicio.getTime()) / 86400000) + 1;
  if (diffDays > 62) {
    throw new Error("El rango maximo permitido es de 62 dias");
  }

  const preview = await getAttendancePreviewByRange(
    input.fecha_inicio,
    input.fecha_fin,
    input.periodicidad_pago,
    input.trabajador_ids
  );

  const grouped = new Map<string, { trabajador_id: string; trabajador_nombre: string; dias: Array<{ fecha: string; trabajo_programado: boolean }> }>();

  for (const row of preview) {
    const key = row.trabajador_id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        trabajador_id: row.trabajador_id,
        trabajador_nombre: row.trabajador_nombre,
        dias: [],
      });
    }

    grouped.get(key)!.dias.push({
      fecha: row.fecha,
      trabajo_programado: row.trabajo_programado,
    });
  }

  return {
    fecha_inicio: input.fecha_inicio,
    fecha_fin: input.fecha_fin,
    periodicidad_pago: input.periodicidad_pago,
    trabajadores: Array.from(grouped.values()),
  };
}

export async function addProcesoPagoSemanal(input: ProcesoPagoSemanalInput, creadoPor: string) {
  validateProcesoPagoSemanalInput(input);
  return createProcesoPagoSemanal(input, creadoPor);
}

export async function getProcesosPagoSemanal() {
  return listProcesosPagoSemanal();
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

function validateProcesoPagoSemanalInput(input: ProcesoPagoSemanalInput) {
  if (!Number.isInteger(input.anio_iso) || input.anio_iso < 2000 || input.anio_iso > 3000) {
    throw new Error("anio_iso invalido");
  }

  if (!Number.isInteger(input.semana_iso) || input.semana_iso < 1 || input.semana_iso > 53) {
    throw new Error("semana_iso invalido");
  }

  requireText(input.fecha_inicio_semana, "fecha_inicio_semana");
  requireText(input.fecha_fin_semana, "fecha_fin_semana");

  const inicio = parseISO(input.fecha_inicio_semana);
  const fin = parseISO(input.fecha_fin_semana);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    throw new Error("fechas invalidas");
  }

  const expectedFin = format(addDays(inicio, 6), "yyyy-MM-dd");
  if (format(fin, "yyyy-MM-dd") !== expectedFin) {
    throw new Error("fecha_fin_semana debe ser exactamente 6 dias despues de fecha_inicio_semana");
  }

  if (getISOWeekYear(inicio) !== input.anio_iso || getISOWeek(inicio) !== input.semana_iso) {
    throw new Error("anio_iso/semana_iso no coinciden con fecha_inicio_semana");
  }

  if (!Array.isArray(input.trabajadores) || input.trabajadores.length === 0) {
    throw new Error("trabajadores es requerido y debe tener al menos un item");
  }

  for (const trabajador of input.trabajadores) {
    requireText(trabajador.trabajador_id, "trabajador_id");
    if (!Array.isArray(trabajador.detalles) || trabajador.detalles.length !== 7) {
      throw new Error(`trabajador ${trabajador.trabajador_id} debe tener 7 detalles diarios`);
    }

    for (const d of trabajador.detalles) {
      requireText(d.fecha, "detalle.fecha");

      const base = Number(d.pago_base_dia);
      const extraMonto = Number(d.extra_monto ?? 0);
      const descuentoMonto = Number(d.descuento_monto ?? 0);

      if (Number.isNaN(base) || base < 0) {
        throw new Error("pago_base_dia debe ser mayor o igual a 0");
      }

      if (Number.isNaN(extraMonto) || extraMonto < 0) {
        throw new Error("extra_monto debe ser mayor o igual a 0");
      }

      if (Number.isNaN(descuentoMonto) || descuentoMonto < 0) {
        throw new Error("descuento_monto debe ser mayor o igual a 0");
      }

      if ((d.extra_habilitado ?? false) && extraMonto > 0 && !d.extra_motivo?.trim()) {
        throw new Error("extra_motivo es requerido cuando extra_habilitado es true y extra_monto > 0");
      }

      if ((d.descuento_habilitado ?? false) && descuentoMonto > 0 && !d.descuento_motivo?.trim()) {
        throw new Error("descuento_motivo es requerido cuando descuento_habilitado es true y descuento_monto > 0");
      }
    }
  }
}
