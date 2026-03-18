import { useEffect, useMemo, useState } from "react";
import { authHeaders } from "../../context/AuthContext";
import { API_URL, type TipoPago, type Trabajador } from "./types";

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

export function RegistroPago() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [trabajadorId, setTrabajadorId] = useState("");
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState("");
  const [tipoPago, setTipoPago] = useState<TipoPago>("Sueldo");
  const [observaciones, setObservaciones] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const numeroSemana = useMemo(() => getIsoWeek(new Date(`${fechaPago}T00:00:00`)), [fechaPago]);
  const montoNumber = Number(monto) || 0;

  useEffect(() => {
    void loadTrabajadores();
  }, []);

  async function loadTrabajadores() {
    const res = await fetch(`${API_URL}/trabajadores`, { headers: authHeaders() });
    if (!res.ok) {
      setError("No se pudo cargar trabajadores");
      return;
    }

    const data = (await res.json()) as Trabajador[];
    setTrabajadores(data.filter((item) => item.activo));
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);

    if (!trabajadorId) {
      setError("Selecciona un trabajador");
      return;
    }

    if (Number.isNaN(montoNumber) || montoNumber <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`${API_URL}/remuneraciones`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          trabajador_id: trabajadorId,
          monto_pagado: montoNumber,
          fecha_pago: fechaPago,
          tipo_pago: tipoPago,
          observaciones: observaciones || null,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo registrar el pago");
      }

      setSuccess("Pago registrado correctamente");
      setMonto("");
      setObservaciones("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="soft-enter rounded-3xl border border-sand-200 bg-white p-6 shadow-soft sm:p-8">
      <h2 className="text-xl font-semibold text-ink-950">Registro de Remuneraciones</h2>
      <p className="mt-1 text-sm text-ink-600">Formulario para sueldos, adelantos y bonos del personal.</p>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">Trabajador</span>
          <select
            value={trabajadorId}
            onChange={(e) => setTrabajadorId(e.target.value)}
            className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
          >
            <option value="">Seleccionar</option>
            {trabajadores.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre_completo}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">Fecha de Pago</span>
          <input
            type="date"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
          />
        </label>

        <div className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.12em] text-ink-500">Semana del Año</p>
          <p className="mt-1 text-lg font-semibold text-ink-950">Semana {numeroSemana}</p>
        </div>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">Monto</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">Tipo de Pago</span>
          <select
            value={tipoPago}
            onChange={(e) => setTipoPago(e.target.value as TipoPago)}
            className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
          >
            <option value="Sueldo">Sueldo</option>
            <option value="Adelanto">Adelanto</option>
            <option value="Bono">Bono</option>
          </select>
        </label>

        <div className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.12em] text-ink-500">Vista de Monto</p>
          <p className="mt-1 text-lg font-semibold text-ink-950">{money.format(montoNumber)}</p>
        </div>
      </div>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium text-ink-700">Observaciones</span>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
        />
      </label>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        className="mt-5 rounded-xl bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Guardando..." : "Registrar Pago"}
      </button>
    </section>
  );
}

function getIsoWeek(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
