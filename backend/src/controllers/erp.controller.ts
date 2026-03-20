import type { Request, Response } from "express";
import {
  addCategoriasBulk,
  addProductosBulk,
  addProveedoresBulk,
  addCategoria,
  addProducto,
  addProveedor,
  addRemuneracion,
  addTrabajadoresBulk,
  addTrabajador,
  disableCategoria,
  disableProducto,
  disableProveedor,
  disableTrabajador,
  editCategoria,
  editProducto,
  editProveedor,
  editRemuneracion,
  editTrabajador,
  getCategorias,
  getHorarios,
  getHorariosForWorker,
  getProductos,
  getProveedores,
  getResumenRemuneracionesSemanales,
  getResumenRemuneracionesPorTrabajador,
  getPreviewProcesoPagoSemanal,
  getPreviewAsistenciaRango,
  addProcesoPagoSemanal,
  getProcesosPagoSemanal,
  getTrabajadores,
  removeRemuneracion,
  saveHorario,
} from "../services/erp.service.js";
import { getConfigValue } from "../services/config.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as Record<string, unknown>).code === "23505";
}

function handleError(res: Response, error: unknown, status = 400) {
  if (isUniqueViolation(error)) {
    const detail = (error as Record<string, unknown>).detail as string | undefined;
    const message = detail?.includes("dni") ? "El DNI ya esta registrado" : "Ya existe un registro con ese valor unico";
    res.status(409).json({ message });
    return;
  }
  const message = error instanceof Error ? error.message : "Error inesperado";
  res.status(status).json({ message });
}

function activeOnlyFromQuery(req: Request) {
  const raw = req.query.active;
  if (raw === "false") return false;
  return true;
}

function idFromParams(req: Request) {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new Error("id es requerido");
  }
  return id;
}

export async function getProveedoresController(req: Request, res: Response) {
  try {
    res.json(await getProveedores(activeOnlyFromQuery(req)));
  } catch (error) {
    handleError(res, error);
  }
}

export async function postProveedorController(req: Request, res: Response) {
  try {
    res.status(201).json(await addProveedor(req.body));
  } catch (error) {
    handleError(res, error);
  }
}

export async function postProveedorBulkController(req: Request, res: Response) {
  try {
    res.status(201).json(await addProveedoresBulk(req.body));
  } catch (error) {
    handleError(res, error);
  }
}

export async function putProveedorController(req: Request, res: Response) {
  try {
    const updated = await editProveedor(idFromParams(req), req.body);
    if (!updated) {
      res.status(404).json({ message: "Proveedor no encontrado" });
      return;
    }
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function patchProveedorController(req: Request, res: Response) {
  try {
    const updated = await disableProveedor(idFromParams(req));
    if (!updated) {
      res.status(404).json({ message: "Proveedor no encontrado" });
      return;
    }
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getCategoriasController(req: Request, res: Response) {
  try {
    res.json(await getCategorias(activeOnlyFromQuery(req)));
  } catch (error) {
    handleError(res, error);
  }
}

export async function postCategoriaController(req: Request, res: Response) {
  try {
    res.status(201).json(await addCategoria(req.body));
  } catch (error) {
    handleError(res, error);
  }
}

export async function postCategoriaBulkController(req: Request, res: Response) {
  try {
    res.status(201).json(await addCategoriasBulk(req.body));
  } catch (error) {
    handleError(res, error);
  }
}

export async function putCategoriaController(req: Request, res: Response) {
  try {
    const updated = await editCategoria(idFromParams(req), req.body);
    if (!updated) {
      res.status(404).json({ message: "Categoria no encontrada" });
      return;
    }
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function patchCategoriaController(req: Request, res: Response) {
  try {
    const updated = await disableCategoria(idFromParams(req));
    if (!updated) {
      res.status(404).json({ message: "Categoria no encontrada" });
      return;
    }
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getProductosController(req: Request, res: Response) {
  try {
    res.json(await getProductos(activeOnlyFromQuery(req)));
  } catch (error) {
    handleError(res, error);
  }
}

export async function postProductoController(req: Request, res: Response) {
  try {
    res.status(201).json(await addProducto(req.body));
  } catch (error) {
    handleError(res, error);
  }
}

export async function postProductoBulkController(req: Request, res: Response) {
  try {
    res.status(201).json(await addProductosBulk(req.body));
  } catch (error) {
    handleError(res, error);
  }
}

export async function putProductoController(req: Request, res: Response) {
  try {
    const updated = await editProducto(idFromParams(req), req.body);
    if (!updated) {
      res.status(404).json({ message: "Producto no encontrado" });
      return;
    }
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function patchProductoController(req: Request, res: Response) {
  try {
    const updated = await disableProducto(idFromParams(req));
    if (!updated) {
      res.status(404).json({ message: "Producto no encontrado" });
      return;
    }
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getTrabajadoresController(req: Request, res: Response) {
  try {
    res.json(await getTrabajadores(activeOnlyFromQuery(req)));
  } catch (error) {
    handleError(res, error);
  }
}

export async function postTrabajadorController(req: Request, res: Response) {
  try {
    res.status(201).json(await addTrabajador(req.body));
  } catch (error) {
    handleError(res, error);
  }
}

export async function postTrabajadorBulkController(req: Request, res: Response) {
  try {
    res.status(201).json(await addTrabajadoresBulk(req.body));
  } catch (error) {
    handleError(res, error);
  }
}

export async function putTrabajadorController(req: Request, res: Response) {
  try {
    const updated = await editTrabajador(idFromParams(req), req.body);
    if (!updated) {
      res.status(404).json({ message: "Trabajador no encontrado" });
      return;
    }
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function patchTrabajadorController(req: Request, res: Response) {
  try {
    const updated = await disableTrabajador(idFromParams(req));
    if (!updated) {
      res.status(404).json({ message: "Trabajador no encontrado" });
      return;
    }
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function postRemuneracionController(req: Request, res: Response) {
  try {
    res.status(201).json(await addRemuneracion(req.body));
  } catch (error) {
    handleError(res, error);
  }
}

export async function putRemuneracionController(req: Request, res: Response) {
  try {
    const updated = await editRemuneracion(idFromParams(req), req.body);
    if (!updated) {
      res.status(404).json({ message: "Remuneracion no encontrada" });
      return;
    }
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteRemuneracionController(req: Request, res: Response) {
  try {
    const deleted = await removeRemuneracion(idFromParams(req));
    if (!deleted) {
      res.status(404).json({ message: "Remuneracion no encontrada" });
      return;
    }
    res.json({ message: "Eliminado correctamente" });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getRemuneracionesSemanalController(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.rol_acceso === "TRABAJADOR") {
      res.json(await getResumenRemuneracionesPorTrabajador(req.user.id));
    } else {
      res.json(await getResumenRemuneracionesSemanales());
    }
  } catch (error) {
    handleError(res, error, 500);
  }
}

export async function getPreviewProcesoPagoSemanalController(req: Request, res: Response) {
  try {
    const fechaInicio = typeof req.query.fecha_inicio_semana === "string" ? req.query.fecha_inicio_semana : "";
    const rawIds = typeof req.query.trabajador_ids === "string" ? req.query.trabajador_ids : "";
    const trabajador_ids = rawIds
      ? rawIds.split(",").map((id) => id.trim()).filter((id) => id.length > 0)
      : undefined;

    res.json(await getPreviewProcesoPagoSemanal({
      fecha_inicio_semana: fechaInicio,
      trabajador_ids,
    }));
  } catch (error) {
    handleError(res, error);
  }
}

export async function getPreviewAsistenciaRangoController(req: Request, res: Response) {
  try {
    const fechaInicio = typeof req.query.fecha_inicio === "string" ? req.query.fecha_inicio : "";
    const fechaFin = typeof req.query.fecha_fin === "string" ? req.query.fecha_fin : "";
    const periodicidadRaw = typeof req.query.periodicidad_pago === "string" ? req.query.periodicidad_pago : "SEMANAL";
    const periodicidad_pago = periodicidadRaw === "MENSUAL" ? "MENSUAL" : "SEMANAL";

    const rawIds = typeof req.query.trabajador_ids === "string" ? req.query.trabajador_ids : "";
    const trabajador_ids = rawIds
      ? rawIds.split(",").map((id) => id.trim()).filter((id) => id.length > 0)
      : undefined;

    res.json(await getPreviewAsistenciaRango({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      periodicidad_pago,
      trabajador_ids,
    }));
  } catch (error) {
    handleError(res, error);
  }
}

export async function postProcesoPagoSemanalController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    res.status(201).json(await addProcesoPagoSemanal(req.body, req.user.id));
  } catch (error) {
    handleError(res, error);
  }
}

export async function getProcesosPagoSemanalController(_req: Request, res: Response) {
  try {
    res.json(await getProcesosPagoSemanal());
  } catch (error) {
    handleError(res, error, 500);
  }
}

export async function upsertHorarioController(req: Request, res: Response) {
  try {
    res.json(await saveHorario(req.body));
  } catch (error) {
    handleError(res, error);
  }
}

export async function getHorariosController(req: AuthenticatedRequest, res: Response) {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : "";
    const visibilidad = await getConfigValue("visibilidad_horarios_global");
    const visibilidadGlobal = visibilidad === "true";

    // ADMIN always sees everything
    if (req.user?.rol_acceso === "ADMIN") {
      const rows = await getHorarios(month);
      res.json({ rows, visibilidad_global: true });
      return;
    }

    // TRABAJADOR: check visibilidad_horarios_global
    if (visibilidadGlobal) {
      const rows = await getHorarios(month);
      res.json({ rows, visibilidad_global: true });
    } else {
      const rows = await getHorariosForWorker(month, req.user!.id);
      res.json({ rows, visibilidad_global: false });
    }
  } catch (error) {
    handleError(res, error);
  }
}
