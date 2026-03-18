-- Refactor to 3-level gastos architecture: lote -> documento -> detalle
-- Run in labrador_db:
-- psql -U postgres -d labrador_db -f sql/03_gastos_3_niveles_refactor.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS gastos_detalles;
DROP TABLE IF EXISTS gastos_documentos;
DROP TABLE IF EXISTS gastos_lotes;
DROP TYPE IF EXISTS tipo_documento_enum;

CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TYPE tipo_documento_enum AS ENUM ('Factura', 'Boleta');

CREATE TABLE IF NOT EXISTS gastos_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_descriptivo VARCHAR(160) NOT NULL,
  tiene_presupuesto BOOLEAN NOT NULL DEFAULT false,
  monto_presupuesto DECIMAL(12,2),
  fecha_creacion DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_monto_presupuesto
    CHECK (
      (tiene_presupuesto = true AND monto_presupuesto IS NOT NULL AND monto_presupuesto >= 0)
      OR
      (tiene_presupuesto = false AND monto_presupuesto IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS gastos_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID NOT NULL REFERENCES gastos_lotes(id) ON DELETE CASCADE,
  referencia_factura VARCHAR(160) NOT NULL,
  tipo_documento tipo_documento_enum NOT NULL,
  numero_documento VARCHAR(80) NOT NULL,
  fecha_emision DATE NOT NULL,
  proveedor_id UUID NOT NULL REFERENCES proveedores(id),
  total_documento DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gastos_detalles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES gastos_documentos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  categoria_id UUID NOT NULL REFERENCES categorias(id),
  cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
  precio_unitario_lista DECIMAL(12,2) NOT NULL CHECK (precio_unitario_lista >= 0),
  descuento DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  total_pagado DECIMAL(12,2) NOT NULL CHECK (total_pagado >= 0),
  precio_unitario_real DECIMAL(12,2) NOT NULL CHECK (precio_unitario_real >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_lotes_fecha ON gastos_lotes (fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_documentos_lote ON gastos_documentos (lote_id);
CREATE INDEX IF NOT EXISTS idx_gastos_detalles_documento ON gastos_detalles (documento_id);
