-- 08: Autenticación y RBAC
-- Agregar password_hash y rol_acceso a trabajadores

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_acceso_enum') THEN
    CREATE TYPE rol_acceso_enum AS ENUM ('ADMIN', 'TRABAJADOR');
  END IF;
END
$$;

ALTER TABLE trabajadores
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS rol_acceso rol_acceso_enum NOT NULL DEFAULT 'TRABAJADOR';

-- Crear un admin por defecto (DNI: 00000000, password: admin123)
-- El hash bcrypt de 'admin123' con 10 rounds:
-- Se debe generar en runtime; este script solo marca el rol.
-- La contraseña se debe establecer usando el endpoint o un script seed.
UPDATE trabajadores
  SET rol_acceso = 'ADMIN'
  WHERE id = (SELECT id FROM trabajadores ORDER BY created_at ASC LIMIT 1);
