-- Run this script in psql connected to postgres database:
-- psql -U postgres -d postgres -f sql/01_init_labrador.sql

CREATE DATABASE labrador_db;

\connect labrador_db;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS caja_diaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE UNIQUE NOT NULL,
    total_contado DECIMAL(10,2) NOT NULL DEFAULT 0,
    fondo_siguiente_dia DECIMAL(10,2) NOT NULL DEFAULT 0,
    ingreso_neto_caja_fuerte DECIMAL(10,2)
      GENERATED ALWAYS AS (total_contado - fondo_siguiente_dia) STORED,
    egresos_retiros DECIMAL(10,2) NOT NULL DEFAULT 0,
    otros_ingresos DECIMAL(10,2) NOT NULL DEFAULT 0,
    saldo_acumulado_final DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_caja_diaria_fecha_desc ON caja_diaria (fecha DESC);
