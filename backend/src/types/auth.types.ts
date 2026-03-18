export type RolAcceso = "ADMIN" | "TRABAJADOR";

export interface AuthPayload {
  id: string;
  nombre_completo: string;
  rol_acceso: RolAcceso;
}

export interface LoginInput {
  dni: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: AuthPayload;
}
