import {
  getConfigByClave,
  listConfiguraciones,
  updateConfiguraciones,
} from "../repositories/config.repository.js";

export async function getConfiguraciones() {
  return listConfiguraciones();
}

export async function saveConfiguraciones(items: Array<{ clave: string; valor: string }>) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Se requiere al menos una configuracion");
  }

  for (const item of items) {
    if (!item.clave || typeof item.clave !== "string") {
      throw new Error("Cada item debe tener una clave valida");
    }
  }

  return updateConfiguraciones(items);
}

export async function getConfigValue(clave: string): Promise<string | null> {
  const row = await getConfigByClave(clave);
  return row?.valor ?? null;
}
