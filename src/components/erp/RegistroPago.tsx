import { useEffect, useMemo, useState } from "react";
import { authHeaders } from "../../context/AuthContext";
import {
  API_URL,
  type PeriodicidadPago,
  type PreviewAsistenciaRangoResponse,
  type TipoPago,
  type Trabajador,
} from "./types";

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

type PagoDraft = {
  tipo_pago: TipoPago;
  observaciones: string;
  dailyAmounts: Record<string, string>;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function monthStartISO() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function RegistroPago() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [periodicidad, setPeriodicidad] = useState<PeriodicidadPago>("SEMANAL");
  const [selectedTrabajadorIds, setSelectedTrabajadorIds] = useState<string[]>([]);

  const [fechaInicio, setFechaInicio] = useState(() => todayISO());
  const [fechaFin, setFechaFin] = useState(() => addDaysISO(todayISO(), 6));

  const [preview, setPreview] = useState<PreviewAsistenciaRangoResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [pagos, setPagos] = useState<Record<string, PagoDraft>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const trabajadoresFiltrados = useMemo(
    () => trabajadores.filter((item) => item.activo && item.periodicidad_pago === periodicidad),
    [trabajadores, periodicidad]
  );

  const selectedWorkers = useMemo(
    () => trabajadoresFiltrados.filter((item) => selectedTrabajadorIds.includes(item.id)),
    [trabajadoresFiltrados, selectedTrabajadorIds]
  );

  useEffect(() => {
    void loadTrabajadores();
  }, []);

  useEffect(() => {
    if (periodicidad === "SEMANAL") {
      const start = todayISO();
      setFechaInicio(start);
      setFechaFin(addDaysISO(start, 6));
    } else {
      const start = monthStartISO();
      setFechaInicio(start);
      setFechaFin(todayISO());
    }

    setPreview(null);
    setSelectedTrabajadorIds([]);
    setPagos({});
    setError(null);
    setSuccess(null);
  }, [periodicidad]);

  async function loadTrabajadores() {
    const res = await fetch(`${API_URL}/trabajadores`, { headers: authHeaders() });
    if (!res.ok) {
      setError("No se pudo cargar trabajadores");
      return;
    }

    const data = (await res.json()) as Trabajador[];
    setTrabajadores(data.filter((item) => item.activo));
  }

  function toggleTrabajador(id: string) {
    setSelectedTrabajadorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    setPagos((prev) => ({
      ...prev,
      [id]: prev[id] ?? {
        tipo_pago: "Sueldo",
        observaciones: "",
        dailyAmounts: {},
      },
    }));
  }

  function updatePago(id: string, patch: Partial<PagoDraft>) {
    setPagos((prev) => ({
      ...prev,
      [id]: {
        tipo_pago: prev[id]?.tipo_pago ?? "Sueldo",
        observaciones: prev[id]?.observaciones ?? "",
        dailyAmounts: prev[id]?.dailyAmounts ?? {},
        ...patch,
      },
    }));
  }

  function updateMontoDia(workerId: string, date: string, value: string) {
    const draft = pagos[workerId] ?? {
      tipo_pago: "Sueldo" as TipoPago,
      observaciones: "",
      dailyAmounts: {},
    };

    updatePago(workerId, {
      dailyAmounts: {
        ...draft.dailyAmounts,
        [date]: value,
      },
    });
  }

  async function loadAttendancePreview() {
    setError(null);
    setSuccess(null);

    if (selectedWorkers.length === 0) {
      setError("Selecciona al menos un trabajador");
      return;
    }

    if (fechaInicio > fechaFin) {
      setError("La fecha inicio no puede ser mayor que la fecha fin");
      return;
    }

    setLoadingPreview(true);

    try {
      const ids = selectedWorkers.map((w) => w.id).join(",");
      const query = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        periodicidad_pago: periodicidad,
        trabajador_ids: ids,
      });

      const res = await fetch(`${API_URL}/remuneraciones/asistencia-preview?${query.toString()}`, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "No se pudo cargar asistencia por rango");
      }

      const payload = (await res.json()) as PreviewAsistenciaRangoResponse;
      setPreview(payload);

      setPagos((prev) => {
        const next = { ...prev };
        for (const worker of payload.trabajadores) {
          next[worker.trabajador_id] = {
            tipo_pago: next[worker.trabajador_id]?.tipo_pago ?? "Sueldo",
            observaciones: next[worker.trabajador_id]?.observaciones ?? "",
            dailyAmounts: next[worker.trabajador_id]?.dailyAmounts ?? {},
          };
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleSaveBatch() {
    setError(null);
    setSuccess(null);

    if (!preview || preview.trabajadores.length === 0) {
      setError("Primero carga la asistencia por rango");
      return;
    }

    setIsSaving(true);

    try {
      let count = 0;

      for (const worker of preview.trabajadores) {
        const draft = pagos[worker.trabajador_id] ?? { tipo_pago: "Sueldo" as TipoPago, observaciones: "", dailyAmounts: {} };
        const total = worker.dias.reduce((acc, day) => {
          const amount = Number(draft.dailyAmounts[day.fecha] ?? "0");
          return acc + (Number.isNaN(amount) ? 0 : amount);
        }, 0);

        if (total <= 0) {
          continue;
        }

        const res = await fetch(`${API_URL}/remuneraciones`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            trabajador_id: worker.trabajador_id,
            monto_pagado: Number(total.toFixed(2)),
            fecha_pago: fechaFin,
            tipo_pago: draft.tipo_pago,
            observaciones: [
              periodicidad === "SEMANAL" ? "Pago semanal" : "Pago mensual",
              `Rango ${fechaInicio} a ${fechaFin}`,
              draft.observaciones?.trim() || null,
            ].filter(Boolean).join(" | "),
          }),
        });

        if (!res.ok) {
          throw new Error(`No se pudo registrar el pago de ${worker.trabajador_nombre}`);
        }

        count += 1;
      }

      if (count === 0) {
        setError("No hay montos diarios mayores a 0 para registrar");
      } else {
        setSuccess(`Pagos registrados correctamente (${count})`);
        setPreview(null);
        setSelectedTrabajadorIds([]);
        setPagos({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="soft-enter rounded-3xl border border-sand-200 bg-white p-6 shadow-soft sm:p-8">
      <h2 className="text-xl font-semibold text-ink-950">Registro de Remuneraciones</h2>
      <p className="mt-1 text-sm text-ink-600">
        Selecciona semanal o mensual, define rango de fechas y usa la asistencia de turnos para registrar monto por dia trabajado.
      </p>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">Tipo de Grupo</span>
          <select
            value={periodicidad}
            onChange={(e) => setPeriodicidad(e.target.value as PeriodicidadPago)}
            className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
          >
            <option value="SEMANAL">Pago Semanal</option>
            <option value="MENSUAL">Pago Mensual</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">Fecha Inicio</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">Fecha Fin</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void loadAttendancePreview()}
            disabled={loadingPreview}
            className="w-full rounded-xl border border-sage-600 bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingPreview ? "Cargando..." : "Cargar Asistencia"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-sand-200 bg-sand-50 p-4">
        <p className="text-sm font-semibold text-ink-900">Trabajadores ({periodicidad === "SEMANAL" ? "Semanal" : "Mensual"})</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {trabajadoresFiltrados.map((item) => (
            <label key={item.id} className="flex items-center gap-2 rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm text-ink-800">
              <input
                type="checkbox"
                checked={selectedTrabajadorIds.includes(item.id)}
                onChange={() => toggleTrabajador(item.id)}
                className="h-4 w-4 rounded border-sand-300"
              />
              <span>{item.nombre_completo}</span>
            </label>
          ))}
        </div>
        {trabajadoresFiltrados.length === 0 && (
          <p className="mt-2 text-sm text-ink-600">No hay trabajadores activos con este tipo de pago.</p>
        )}
      </div>

      {preview && (
        <div className="mt-5 space-y-4">
          {preview.trabajadores.map((worker) => {
            const draft = pagos[worker.trabajador_id] ?? {
              tipo_pago: "Sueldo" as TipoPago,
              observaciones: "",
              dailyAmounts: {},
            };

            const totalTrabajador = worker.dias.reduce((acc, day) => {
              const value = Number(draft.dailyAmounts[day.fecha] ?? "0");
              return acc + (Number.isNaN(value) ? 0 : value);
            }, 0);

            return (
              <article key={worker.trabajador_id} className="rounded-2xl border border-sand-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-950">{worker.trabajador_nombre}</p>
                  <p className="text-sm font-semibold text-sage-700">Total: {money.format(totalTrabajador)}</p>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-ink-700">Tipo de Pago</span>
                    <select
                      value={draft.tipo_pago}
                      onChange={(e) => updatePago(worker.trabajador_id, { tipo_pago: e.target.value as TipoPago })}
                      className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
                    >
                      <option value="Sueldo">Sueldo</option>
                      <option value="Adelanto">Adelanto</option>
                      <option value="Bono">Bono</option>
                    </select>
                  </label>

                  <label className="text-sm sm:col-span-2">
                    <span className="mb-1 block font-medium text-ink-700">Observaciones</span>
                    <textarea
                      value={draft.observaciones}
                      onChange={(e) => updatePago(worker.trabajador_id, { observaciones: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
                    />
                  </label>
                </div>

                <div className="mt-3 overflow-x-auto rounded-xl border border-sand-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-sand-50 text-ink-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Fecha</th>
                        <th className="px-3 py-2 text-left">Asistencia</th>
                        <th className="px-3 py-2 text-left">Monto Dia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {worker.dias.map((day) => (
                        <tr key={day.fecha} className="border-t border-sand-100">
                          <td className="px-3 py-2">{day.fecha}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                day.trabajo_programado
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-sand-200 bg-sand-50 text-ink-500"
                              }`}
                            >
                              {day.trabajo_programado ? "Trabajo" : "No trabajo"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.dailyAmounts[day.fecha] ?? ""}
                              onChange={(e) => updateMontoDia(worker.trabajador_id, day.fecha, e.target.value)}
                              className="w-40 rounded-lg border border-sand-200 px-2 py-1 text-ink-900"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleSaveBatch()}
        disabled={isSaving}
        className="mt-5 rounded-xl bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Guardando..." : "Registrar Pagos por Rango"}
      </button>
    </section>
  );
}
