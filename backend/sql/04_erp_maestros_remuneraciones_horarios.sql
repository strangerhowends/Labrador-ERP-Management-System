-- FASE 1 ERP LABRADOR: Maestros, Remuneraciones y Horarios
-- Ejecutar en labrador_db:
-- psql -U postgres -d labrador_db -f sql/04_erp_maestros_remuneraciones_horarios.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_tipo_enum') THEN
    CREATE TYPE categoria_tipo_enum AS ENUM ('Insumo', 'Gasto Operativo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trabajador_rol_enum') THEN
    CREATE TYPE trabajador_rol_enum AS ENUM ('Cocina', 'Atencion', 'Limpieza', 'Administracion');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_pago_enum') THEN
    CREATE TYPE tipo_pago_enum AS ENUM ('Sueldo', 'Adelanto', 'Bono');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'turno_enum') THEN
    CREATE TYPE turno_enum AS ENUM ('Apertura', 'Medio Dia', 'Cierre');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL,
  ruc_dni VARCHAR(20),
  contacto VARCHAR(120),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE proveedores
  ADD COLUMN IF NOT EXISTS ruc_dni VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contacto VARCHAR(120),
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL,
  tipo categoria_tipo_enum NOT NULL DEFAULT 'Insumo',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS tipo categoria_tipo_enum NOT NULL DEFAULT 'Insumo',
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id),
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS trabajadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo VARCHAR(160) NOT NULL,
  rol trabajador_rol_enum NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos_personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id),
  monto_pagado DECIMAL(12,2) NOT NULL CHECK (monto_pagado > 0),
  fecha_pago DATE NOT NULL,
  semana_del_anio INTEGER NOT NULL CHECK (semana_del_anio BETWEEN 1 AND 53),
  tipo_pago tipo_pago_enum NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS horarios_turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id),
  turno turno_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_horario_turno_dia UNIQUE (fecha, turno)
);

CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores (activo);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON categorias (activo);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);
CREATE INDEX IF NOT EXISTS idx_trabajadores_activo ON trabajadores (activo);
CREATE INDEX IF NOT EXISTS idx_pagos_semana ON pagos_personal (semana_del_anio);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos_personal (fecha_pago);
CREATE INDEX IF NOT EXISTS idx_horarios_fecha ON horarios_turnos (fecha);

COMMENT ON TABLE proveedores IS 'Borrado logico recomendado: set activo=false';
COMMENT ON TABLE categorias IS 'Borrado logico recomendado: set activo=false';
COMMENT ON TABLE productos IS 'Borrado logico recomendado: set activo=false';
COMMENT ON TABLE trabajadores IS 'Borrado logico recomendado: set activo=false';
