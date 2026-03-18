import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import type { AuthPayload, LoginResult, RolAcceso } from "../types/auth.types.js";

interface TrabajadorAuthRow {
  id: string;
  nombre_completo: string;
  rol_acceso: RolAcceso;
  password_hash: string | null;
  activo: boolean;
}

export async function login(dni: string, password: string): Promise<LoginResult> {
  if (!dni || !password) {
    throw new Error("DNI y contraseña son requeridos");
  }

  const result = await pool.query<TrabajadorAuthRow>(
    `SELECT id, nombre_completo, rol_acceso, password_hash, activo
     FROM trabajadores
     WHERE dni = $1`,
    [dni.trim()]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("Credenciales incorrectas");
  }

  if (!user.activo) {
    throw new Error("Usuario desactivado");
  }

  if (!user.password_hash) {
    throw new Error("El usuario no tiene contraseña configurada");
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    throw new Error("Credenciales incorrectas");
  }

  const payload: AuthPayload = {
    id: user.id,
    nombre_completo: user.nombre_completo,
    rol_acceso: user.rol_acceso,
  };

  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: "12h" });

  return { token, user: payload };
}

export async function setPassword(trabajadorId: string, newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  const hash = await bcrypt.hash(newPassword, 10);

  const result = await pool.query(
    `UPDATE trabajadores SET password_hash = $2 WHERE id = $1 RETURNING id`,
    [trabajadorId, hash]
  );

  if (result.rowCount === 0) {
    throw new Error("Trabajador no encontrado");
  }
}

export async function updateRolAcceso(trabajadorId: string, rolAcceso: RolAcceso): Promise<void> {
  const result = await pool.query(
    `UPDATE trabajadores SET rol_acceso = $2 WHERE id = $1 RETURNING id`,
    [trabajadorId, rolAcceso]
  );

  if (result.rowCount === 0) {
    throw new Error("Trabajador no encontrado");
  }
}
