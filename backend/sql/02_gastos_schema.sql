-- Run this script in psql connected to labrador_db:
-- psql -U postgres -d labrador_db -f sql/02_gastos_schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento_enum') THEN
    CREATE TYPE tipo_documento_enum AS ENUM ('Factura', 'Boleta', 'Nota de Venta');
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS gastos_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_referencia VARCHAR(160) NOT NULL,
  tipo_documento tipo_documento_enum NOT NULL,
  numero_documento VARCHAR(80) NOT NULL,
  tiene_presupuesto BOOLEAN NOT NULL DEFAULT false,
  fecha_registro DATE NOT NULL,
  total_documento DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gastos_detalles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES gastos_documentos(id) ON DELETE CASCADE,
  fecha_gasto DATE NOT NULL,
  producto_id UUID NOT NULL REFERENCES productos(id),
  cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
  precio_unitario_lista DECIMAL(12,2) NOT NULL CHECK (precio_unitario_lista >= 0),
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  descuento DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
  total_pagado DECIMAL(12,2) NOT NULL CHECK (total_pagado >= 0),
  precio_unitario_real DECIMAL(12,2) NOT NULL CHECK (precio_unitario_real >= 0),
  proveedor_id UUID NOT NULL REFERENCES proveedores(id),
  categoria_id UUID NOT NULL REFERENCES categorias(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_doc_fecha ON gastos_documentos (fecha_registro DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_det_documento ON gastos_detalles (documento_id);

INSERT INTO proveedores (nombre)
VALUES ('Proveedor General')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO categorias (nombre)
VALUES ('Insumos'), ('Bebidas'), ('Limpieza')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO productos (nombre)
VALUES ('Arroz'), ('Aceite'), ('Detergente')
ON CONFLICT (nombre) DO NOTHING;
