-- ============================================================
-- 09 · Configuraciones Globales (clave-valor)
-- ============================================================

CREATE TYPE tipo_dato_config AS ENUM ('BOOLEAN', 'NUMBER', 'STRING', 'JSON');

CREATE TABLE IF NOT EXISTS configuraciones_globales (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave         VARCHAR(120) NOT NULL UNIQUE,
  valor         VARCHAR(500) NOT NULL DEFAULT '',
  tipo_dato     tipo_dato_config NOT NULL DEFAULT 'STRING',
  descripcion   TEXT
);

-- ── Seed initial rows ──
INSERT INTO configuraciones_globales (clave, valor, tipo_dato, descripcion) VALUES
  ('visibilidad_horarios_global', 'false', 'BOOLEAN', 'Si es true, todos los trabajadores ven el horario completo; si es false solo ven el suyo.'),
  ('horario_defecto_semana', '13:00', 'STRING', 'Hora de entrada por defecto para dias de semana (Lun-Vie).'),
  ('horario_defecto_finde', '11:00', 'STRING', 'Hora de entrada por defecto para fines de semana (Sab-Dom).'),
  ('pin_cierre_lote', '1234', 'STRING', 'PIN requerido para confirmar el cierre de un lote de gastos.')
ON CONFLICT (clave) DO NOTHING;
