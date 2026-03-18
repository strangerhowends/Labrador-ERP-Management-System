import { deleteCaja, findAllCaja, findCajaById, getPreviousSaldo, insertCaja, updateCaja } from "../repositories/caja.repository.js";
import type { CajaInput, CajaRecord } from "../types/caja.types.js";

export async function createCaja(payload: CajaInput): Promise<CajaRecord> {
  validatePayload(payload);

  const ingresoNeto = payload.total_contado - payload.fondo_siguiente_dia;
  const saldoAnterior = await getPreviousSaldo(payload.fecha);
  const saldoFinal = saldoAnterior + ingresoNeto + payload.otros_ingresos - payload.egresos_retiros;

  return insertCaja(payload, saldoFinal);
}

export async function getHistorialCaja(): Promise<CajaRecord[]> {
  return findAllCaja();
}

export async function editCaja(id: string, payload: CajaInput): Promise<CajaRecord | null> {
  validatePayload(payload);

  const existing = await findCajaById(id);
  if (!existing) return null;

  const ingresoNeto = payload.total_contado - payload.fondo_siguiente_dia;
  const saldoAnterior = await getPreviousSaldo(payload.fecha);
  const saldoFinal = saldoAnterior + ingresoNeto + payload.otros_ingresos - payload.egresos_retiros;

  return updateCaja(id, payload, saldoFinal);
}

export async function removeCaja(id: string): Promise<boolean> {
  return deleteCaja(id);
}

function validatePayload(payload: CajaInput): void {
  const requiredFields: Array<keyof CajaInput> = [
    "fecha",
    "total_contado",
    "fondo_siguiente_dia",
    "egresos_retiros",
    "otros_ingresos",
  ];

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.fecha)) {
    throw new Error("fecha debe tener formato YYYY-MM-DD");
  }

  const numericFields: Array<keyof Omit<CajaInput, "fecha">> = [
    "total_contado",
    "fondo_siguiente_dia",
    "egresos_retiros",
    "otros_ingresos",
  ];

  for (const field of numericFields) {
    const value = Number(payload[field]);
    if (Number.isNaN(value)) {
      throw new Error(`El campo ${field} debe ser numérico`);
    }
    payload[field] = value;
  }
}
