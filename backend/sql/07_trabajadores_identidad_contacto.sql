-- 07: Agregar columnas de identidad y contacto a trabajadores
-- dni (UNIQUE, NOT NULL), telefono, correo

ALTER TABLE trabajadores
  ADD COLUMN IF NOT EXISTS dni VARCHAR(20),
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(30),
  ADD COLUMN IF NOT EXISTS correo VARCHAR(150);

-- Rellenar filas existentes con un placeholder para satisfacer NOT NULL
UPDATE trabajadores SET dni = 'SIN-DNI-' || LEFT(id::text, 8) WHERE dni IS NULL;

-- Ahora aplicar restricciones
ALTER TABLE trabajadores
  ALTER COLUMN dni SET NOT NULL;

ALTER TABLE trabajadores
  ADD CONSTRAINT trabajadores_dni_unique UNIQUE (dni);
