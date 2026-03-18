import type { Request, Response } from "express";
import { login, setPassword, updateRolAcceso } from "../services/auth.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { RolAcceso } from "../types/auth.types.js";

export async function loginController(req: Request, res: Response) {
  try {
    const { dni, password } = req.body as { dni?: string; password?: string };
    const result = await login(dni ?? "", password ?? "");
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(401).json({ message });
  }
}

export async function meController(req: AuthenticatedRequest, res: Response) {
  res.json(req.user);
}

export async function setPasswordController(req: AuthenticatedRequest, res: Response) {
  try {
    const { trabajador_id, password } = req.body as { trabajador_id?: string; password?: string };
    const targetId = trabajador_id ?? req.user?.id;

    if (!targetId) {
      res.status(400).json({ message: "trabajador_id es requerido" });
      return;
    }

    // Only ADMIN can set another user's password
    if (targetId !== req.user?.id && req.user?.rol_acceso !== "ADMIN") {
      res.status(403).json({ message: "No tienes permisos para cambiar esta contraseña" });
      return;
    }

    await setPassword(targetId, password ?? "");
    res.json({ message: "Contraseña actualizada" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(400).json({ message });
  }
}

export async function updateRolAccesoController(req: AuthenticatedRequest, res: Response) {
  try {
    const { trabajador_id, rol_acceso } = req.body as { trabajador_id?: string; rol_acceso?: string };

    if (!trabajador_id) {
      res.status(400).json({ message: "trabajador_id es requerido" });
      return;
    }

    const validRoles: RolAcceso[] = ["ADMIN", "TRABAJADOR"];
    if (!rol_acceso || !validRoles.includes(rol_acceso as RolAcceso)) {
      res.status(400).json({ message: "rol_acceso debe ser ADMIN o TRABAJADOR" });
      return;
    }

    await updateRolAcceso(trabajador_id, rol_acceso as RolAcceso);
    res.json({ message: "Rol de acceso actualizado" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    res.status(400).json({ message });
  }
}
