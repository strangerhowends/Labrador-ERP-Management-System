-- ERP Labrador - Modulos: Catalogos, Remuneraciones y Horarios
-- Esquema alineado al requerimiento funcional.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trabajador_rol_enum') THEN
    CREATE TYPE trabajador_rol_enum AS ENUM ('Cocina', 'Atencion', 'Limpieza', 'Administracion');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'turno_tipo_enum') THEN
    CREATE TYPE turno_tipo_enum AS ENUM ('Manana', 'Tarde', 'Cierre');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL,
  ruc_dni VARCHAR(20),
  contacto VARCHAR(120),
  estado_activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL,
  estado_activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  estado_activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trabajadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(160) NOT NULL,
  rol trabajador_rol_enum NOT NULL,
  estado_activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos_personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id),
  fecha_pago DATE NOT NULL,
  monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  numero_semana INTEGER NOT NULL CHECK (numero_semana BETWEEN 1 AND 53),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS horarios_turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  turno_tipo turno_tipo_enum NOT NULL,
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_horario_turno_dia UNIQUE (fecha, turno_tipo)
);

CREATE INDEX IF NOT EXISTS idx_proveedores_estado_activo ON proveedores (estado_activo);
CREATE INDEX IF NOT EXISTS idx_categorias_estado_activo ON categorias (estado_activo);
CREATE INDEX IF NOT EXISTS idx_productos_estado_activo ON productos (estado_activo);
CREATE INDEX IF NOT EXISTS idx_trabajadores_estado_activo ON trabajadores (estado_activo);
CREATE INDEX IF NOT EXISTS idx_pagos_numero_semana ON pagos_personal (numero_semana);
CREATE INDEX IF NOT EXISTS idx_horarios_fecha ON horarios_turnos (fecha);
