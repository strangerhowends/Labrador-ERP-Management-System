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

      <div className="mt-6 space-y-3">
        {data.map((row) => (
          <details key={`d-${row.semana_del_anio}`} className="rounded-2xl border border-sand-200 bg-white p-4" open>
            <summary className="cursor-pointer list-none text-sm font-semibold text-ink-900">
              Semana {row.semana_del_anio} - Total {money.format(row.total_semana)}
            </summary>
            <div className="mt-3 overflow-x-auto rounded-xl border border-sand-200">
              <table className="min-w-full text-sm">
                <thead className="bg-sand-50 text-ink-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-left">Monto</th>
                    <th className="px-3 py-2 text-left">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {row.pagos.map((pago) => (
                    <tr key={pago.pago_id} className="border-t border-sand-100">
                      <td className="px-3 py-2">{pago.fecha_pago}</td>
                      <td className="px-3 py-2">{pago.tipo_pago}</td>
                      <td className="px-3 py-2">{money.format(pago.monto_pagado)}</td>
                      <td className="px-3 py-2">{pago.observaciones ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
