import type { Request, Response } from "express";
import { getConfiguraciones, saveConfiguraciones } from "../services/config.service.js";

export async function getConfiguracionesController(_req: Request, res: Response) {
  try {
    res.json(await getConfiguraciones());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(500).json({ message });
  }
}

export async function putConfiguracionesController(req: Request, res: Response) {
  try {
    const items = req.body as Array<{ clave: string; valor: string }>;
    res.json(await saveConfiguraciones(items));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(400).json({ message });
  }
}
