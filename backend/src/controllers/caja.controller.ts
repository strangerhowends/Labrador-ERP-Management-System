import type { Request, Response } from "express";
import { createCaja, editCaja, getHistorialCaja, removeCaja } from "../services/caja.service.js";

export async function postCaja(req: Request, res: Response): Promise<void> {
  try {
    const created = await createCaja(req.body);
    res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";

    if (message.includes("duplicate key") || message.includes("caja_diaria_fecha_key")) {
      res.status(409).json({ message: "Ya existe un registro para esta fecha" });
      return;
    }

    res.status(400).json({ message });
  }
}

export async function getCaja(req: Request, res: Response): Promise<void> {
  try {
    const rows = await getHistorialCaja();
    res.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(500).json({ message });
  }
}

export async function putCaja(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ message: "id es requerido" });
      return;
    }
    const updated = await editCaja(String(id), req.body);
    if (!updated) {
      res.status(404).json({ message: "Registro de caja no encontrado" });
      return;
    }
    res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    if (message.includes("duplicate key") || message.includes("caja_diaria_fecha_key")) {
      res.status(409).json({ message: "Ya existe un registro para esta fecha" });
      return;
    }
    res.status(400).json({ message });
  }
}

export async function deleteCajaController(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ message: "id es requerido" });
      return;
    }
    const deleted = await removeCaja(String(id));
    if (!deleted) {
      res.status(404).json({ message: "Registro de caja no encontrado" });
      return;
    }
    res.json({ message: "Eliminado correctamente" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(500).json({ message });
  }
}
