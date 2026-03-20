-- 10: Nomina semanal detallada (Opcion B)
-- Objetivo:
-- 1) Definir periodicidad de pago por trabajador (SEMANAL/MENSUAL)
-- 2) Crear proceso semanal (cabecera)
-- 3) Crear detalle por trabajador y por dia con extras/descuentos y motivos
-- 4) Mantener compatibilidad con pagos_personal
--
-- Ejecutar en labrador_db (DBeaver o psql):
-- psql -U postgres -d labrador_db -f sql/10_nomina_semanal_proceso_detallado.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'periodicidad_pago_enum') THEN
    CREATE TYPE periodicidad_pago_enum AS ENUM ('SEMANAL', 'MENSUAL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_proceso_pago_enum') THEN
    CREATE TYPE estado_proceso_pago_enum AS ENUM ('BORRADOR', 'CERRADO', 'ANULADO');
  END IF;
END $$;

-- 1) Trabajador con periodicidad de pago
ALTER TABLE trabajadores
  ADD COLUMN IF NOT EXISTS periodicidad_pago periodicidad_pago_enum NOT NULL DEFAULT 'SEMANAL';

CREATE INDEX IF NOT EXISTS idx_trabajadores_periodicidad_pago
  ON trabajadores (periodicidad_pago)
  WHERE activo = true;

-- 2) Cabecera de proceso semanal
CREATE TABLE IF NOT EXISTS procesos_pago_semanal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anio_iso INTEGER NOT NULL CHECK (anio_iso BETWEEN 2000 AND 3000),
  semana_iso INTEGER NOT NULL CHECK (semana_iso BETWEEN 1 AND 53),
  fecha_inicio_semana DATE NOT NULL,
  fecha_fin_semana DATE NOT NULL,
  estado estado_proceso_pago_enum NOT NULL DEFAULT 'BORRADOR',
  creado_por UUID REFERENCES trabajadores(id),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_proceso_pago_semana UNIQUE (anio_iso, semana_iso),
  CONSTRAINT ck_rango_semana_7_dias CHECK (fecha_fin_semana = (fecha_inicio_semana + INTERVAL '6 day')::date)
);

CREATE INDEX IF NOT EXISTS idx_proceso_pago_semana_estado
  ON procesos_pago_semanal (anio_iso DESC, semana_iso DESC, estado);

-- 3) Cabecera por trabajador dentro del proceso
CREATE TABLE IF NOT EXISTS proceso_pago_trabajador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proceso_pago_id UUID NOT NULL REFERENCES procesos_pago_semanal(id) ON DELETE CASCADE,
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id),
  total_base NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_base >= 0),
  total_extra NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_extra >= 0),
  total_descuento NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_descuento >= 0),
  total_neto NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_proceso_pago_trabajador UNIQUE (proceso_pago_id, trabajador_id)
);

CREATE INDEX IF NOT EXISTS idx_proceso_pago_trabajador_proceso
  ON proceso_pago_trabajador (proceso_pago_id);

CREATE INDEX IF NOT EXISTS idx_proceso_pago_trabajador_trabajador
  ON proceso_pago_trabajador (trabajador_id);

-- 4) Detalle diario por trabajador
CREATE TABLE IF NOT EXISTS proceso_pago_detalle_dia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proceso_pago_trabajador_id UUID NOT NULL REFERENCES proceso_pago_trabajador(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  trabajo_programado BOOLEAN NOT NULL DEFAULT false,
  pago_base_dia NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (pago_base_dia >= 0),

  extra_habilitado BOOLEAN NOT NULL DEFAULT false,
  extra_monto NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (extra_monto >= 0),
  extra_motivo TEXT,

  descuento_habilitado BOOLEAN NOT NULL DEFAULT false,
  descuento_monto NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (descuento_monto >= 0),
  descuento_motivo TEXT,

  total_dia NUMERIC(12,2) GENERATED ALWAYS AS (pago_base_dia + extra_monto - descuento_monto) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_detalle_dia UNIQUE (proceso_pago_trabajador_id, fecha),

  CONSTRAINT ck_extra_regla_habilitado
    CHECK (
      (extra_habilitado = false AND extra_monto = 0) OR
      (extra_habilitado = true)
    ),

  CONSTRAINT ck_descuento_regla_habilitado
    CHECK (
      (descuento_habilitado = false AND descuento_monto = 0) OR
      (descuento_habilitado = true)
    ),

  CONSTRAINT ck_extra_motivo_requerido
    CHECK (
      extra_habilitado = false OR
      extra_monto = 0 OR
      (extra_motivo IS NOT NULL AND LENGTH(BTRIM(extra_motivo)) > 0)
    ),

  CONSTRAINT ck_descuento_motivo_requerido
    CHECK (
      descuento_habilitado = false OR
      descuento_monto = 0 OR
      (descuento_motivo IS NOT NULL AND LENGTH(BTRIM(descuento_motivo)) > 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_detalle_dia_fecha
  ON proceso_pago_detalle_dia (fecha);

-- 5) Compatibilidad con pagos_personal existente
ALTER TABLE pagos_personal
  ADD COLUMN IF NOT EXISTS proceso_pago_semanal_id UUID REFERENCES procesos_pago_semanal(id);

CREATE INDEX IF NOT EXISTS idx_pagos_personal_proceso_pago
  ON pagos_personal (proceso_pago_semanal_id);

-- 6) Trigger de updated_at reutilizable
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_procesos_pago_semanal ON procesos_pago_semanal;
CREATE TRIGGER trg_update_procesos_pago_semanal
  BEFORE UPDATE ON procesos_pago_semanal
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_update_proceso_pago_trabajador ON proceso_pago_trabajador;
CREATE TRIGGER trg_update_proceso_pago_trabajador
  BEFORE UPDATE ON proceso_pago_trabajador
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_update_proceso_pago_detalle_dia ON proceso_pago_detalle_dia;
CREATE TRIGGER trg_update_proceso_pago_detalle_dia
  BEFORE UPDATE ON proceso_pago_detalle_dia
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;