-- Refactor de horarios_turnos a horarios flexibles por hora.
-- Ejecutar en labrador_db:
-- psql -U postgres -d labrador_db -f sql/06_horarios_flexibles_hora_entrada.sql

BEGIN;

ALTER TABLE horarios_turnos
  DROP CONSTRAINT IF EXISTS uq_horario_turno_dia;

ALTER TABLE horarios_turnos
  ADD COLUMN IF NOT EXISTS hora_entrada TIME,
  ADD COLUMN IF NOT EXISTS hora_salida TIME;

-- Migracion para registros existentes con columna turno.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'horarios_turnos'
      AND column_name = 'turno'
  ) THEN
    UPDATE horarios_turnos
    SET hora_entrada = CASE turno::text
      WHEN 'Apertura' THEN '07:00'::time
      WHEN 'Medio Dia' THEN '13:00'::time
      WHEN 'Cierre' THEN '18:00'::time
      WHEN 'Manana_Cocina' THEN '13:00'::time
      WHEN 'Tarde_Cocina' THEN '16:30'::time
      WHEN 'Manana_Atencion' THEN '13:00'::time
      WHEN 'Tarde_Atencion' THEN '16:30'::time
      ELSE '13:00'::time
    END
    WHERE hora_entrada IS NULL;

    ALTER TABLE horarios_turnos
      DROP COLUMN turno;
  END IF;
END $$;

ALTER TABLE horarios_turnos
  ALTER COLUMN hora_entrada SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_horarios_fecha_hora ON horarios_turnos (fecha, hora_entrada);
CREATE INDEX IF NOT EXISTS idx_horarios_trabajador ON horarios_turnos (trabajador_id);

COMMIT;
