import { useEffect, useState } from "react";
import { API_URL, type ResumenSemanal } from "./types";
import { authHeaders } from "../../context/AuthContext";

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

export function MisPagos() {
  const [data, setData] = useState<ResumenSemanal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadResumen();
  }, []);

  async function loadResumen() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/remuneraciones/semanal`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        throw new Error("No se pudo cargar tus pagos");
      }
      const payload = (await res.json()) as ResumenSemanal[];
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const totalGeneral = data.reduce((sum, w) => sum + w.total_semana, 0);

  return (
    <section className="soft-enter rounded-3xl border border-sand-200 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink-950">Mis Pagos</h2>
          <p className="mt-1 text-sm text-ink-600">Historial de tus remuneraciones, agrupado por semana.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadResumen()}
          className="rounded-xl border border-sand-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-50"
        >
          Actualizar
        </button>
      </div>

      {loading && <p className="mt-4 text-sm text-ink-600">Cargando...</p>}
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {!loading && !error && data.length === 0 && (
        <p className="mt-4 text-sm text-ink-600">No tienes pagos registrados.</p>
      )}

      {data.length > 0 && (
        <div className="mt-5 rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-sage-700">Total General</p>
          <p className="mt-1 text-2xl font-semibold text-sage-900">{money.format(totalGeneral)}</p>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((row) => (
          <article key={row.semana_del_anio} className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-ink-500">Semana {row.semana_del_anio}</p>
            <p className="mt-1 text-2xl font-semibold text-ink-950">{money.format(row.total_semana)}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {data.map((row) => (
          <details key={`d-${row.semana_del_anio}`} className="rounded-2xl border border-sand-200 bg-white p-4" open>
            <summary className="cursor-pointer list-none text-sm font-semibold text-ink-900">
              Semana {row.semana_del_anio} - Total {money.format(row.total_semana)}
            </summary>
            <div className="mt-4 space-y-3">
              {row.pagos.map((pago) => {
                // Parsear observaciones para extraer base, extras, descuentos
                const obs = pago.observaciones ?? "";
                const baseMatch = obs.match(/Base:\s?([\d.]+)/);
                const extrasMatch = obs.match(/Extras:\s?\+?([\d.]+)/);
                const descuentosMatch = obs.match(/Descuentos:\s?-?([\d.]+)/);

                const base = baseMatch ? parseFloat(baseMatch[1]) : 0;
                const extras = extrasMatch ? parseFloat(extrasMatch[1]) : 0;
                const descuentos = descuentosMatch ? parseFloat(descuentosMatch[1]) : 0;

                return (
                  <article key={pago.pago_id} className="rounded-xl border border-sand-200 bg-sand-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <p className="text-xs text-ink-600">Fecha de pago</p>
                        <p className="font-semibold text-ink-950">{pago.fecha_pago}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-ink-600">Tipo de pago</p>
                        <p className="font-semibold text-sage-700">{pago.tipo_pago}</p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 mb-3">
                      <div className="rounded-lg border border-sand-300 bg-white px-3 py-2">
                        <p className="text-xs text-ink-600">Base</p>
                        <p className="text-lg font-semibold text-ink-950">{money.format(base)}</p>
                      </div>
                      {extras > 0 && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <p className="text-xs text-emerald-700">+ Extras</p>
                          <p className="text-lg font-semibold text-emerald-700">+{money.format(extras)}</p>
                        </div>
                      )}
                      {descuentos > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                          <p className="text-xs text-red-700">- Descuentos</p>
                          <p className="text-lg font-semibold text-red-700">-{money.format(descuentos)}</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border-2 border-sage-300 bg-sage-50 px-3 py-2 mb-3">
                      <p className="text-xs text-sage-700">TOTAL A RECIBIR</p>
                      <p className="text-2xl font-bold text-sage-900">{money.format(pago.monto_pagado)}</p>
                    </div>

                    {pago.observaciones && (
                      <details className="cursor-pointer">
                        <summary className="text-xs font-medium text-ink-600 hover:text-ink-800">Ver detalles completos</summary>
                        <p className="mt-2 text-xs text-ink-700 whitespace-pre-wrap break-words bg-white rounded-lg p-2 border border-sand-200">
                          {pago.observaciones}
                        </p>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
