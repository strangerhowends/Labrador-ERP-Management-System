import type { Request, Response } from "express";
import { createGasto, getCatalogos, getDocumentoConDetalles, getLotesResumen, getResumenDiario, getResumenPorFecha, updateDocumento } from "../services/gastos.service.js";

export async function postGastos(req: Request, res: Response): Promise<void> {
  try {
    const documento = await createGasto(req.body);
    res.status(201).json(documento);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";

    if (message.includes("security_key inválida")) {
      res.status(401).json({ message });
      return;
    }

    res.status(400).json({ message });
  }
}

export async function getCatalogosController(_req: Request, res: Response): Promise<void> {
  try {
    const catalogos = await getCatalogos();
    res.json(catalogos);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(500).json({ message });
  }
}

export async function getResumenDiarioController(req: Request, res: Response): Promise<void> {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const resumen = await getResumenDiario(month);
    res.json(resumen);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(400).json({ message });
  }
}

export async function getResumenPorFechaController(req: Request, res: Response): Promise<void> {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : "";
    const resumen = await getResumenPorFecha(date);
    res.json(resumen);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(400).json({ message });
  }
}

export async function getLotesResumenController(req: Request, res: Response): Promise<void> {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const lotes = await getLotesResumen(month);
    res.json(lotes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(400).json({ message });
  }
}

export async function getDocumentoController(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const doc = await getDocumentoConDetalles(id);
    if (!doc) {
      res.status(404).json({ message: "Documento no encontrado" });
      return;
    }
    res.json(doc);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(500).json({ message });
  }
}

export async function putDocumentoController(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const updated = await updateDocumento(id, req.body);
    res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    if (message === "DOCUMENTO_NOT_FOUND") {
      res.status(404).json({ message: "Documento no encontrado" });
      return;
    }
    res.status(400).json({ message });
  }
}
