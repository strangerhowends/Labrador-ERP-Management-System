import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthPayload, RolAcceso } from "../types/auth.types.js";

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token de autenticacion requerido" });
    return;
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Token invalido o expirado" });
  }
}

export function authorize(...allowedRoles: RolAcceso[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    if (!allowedRoles.includes(req.user.rol_acceso)) {
      res.status(403).json({ message: "No tienes permisos para esta accion" });
      return;
    }

    next();
  };
}
