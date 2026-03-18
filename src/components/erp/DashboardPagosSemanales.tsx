import { useEffect, useState } from "react";
import { authHeaders, useAuth } from "../../context/AuthContext";
import { API_URL, type PagoDetalle, type ResumenSemanal, type TipoPago, type Trabajador } from "./types";

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

export function DashboardPagosSemanales() {
  const { user } = useAuth();
  const isAdmin = user?.rol_acceso === "ADMIN";

  const [data, setData] = useState<ResumenSemanal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [editPago, setEditPago] = useState<PagoDetalle | null>(null);
  const [editTrabajadorId, setEditTrabajadorId] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editTipo, setEditTipo] = useState<TipoPago>("Sueldo");
  const [editObs, setEditObs] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);

  // Delete confirmation state
  const [deletePago, setDeletePago] = useState<PagoDetalle | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void loadResumen();
    if (isAdmin) void loadTrabajadores();
  }, []);

  async function loadResumen() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/remuneraciones/semanal`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        throw new Error("No se pudo cargar el resumen semanal");
      }
      const payload = (await res.json()) as ResumenSemanal[];
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function loadTrabajadores() {
    try {
      const res = await fetch(`${API_URL}/trabajadores`, { headers: authHeaders() });
      if (res.ok) {
        const list = (await res.json()) as Trabajador[];
        setTrabajadores(list.filter((t) => t.activo));
      }
    } catch { /* silent */ }
  }

  function openEdit(pago: PagoDetalle) {
    setEditPago(pago);
    setEditTrabajadorId(pago.trabajador_id);
    setEditFecha(pago.fecha_pago);
    setEditMonto(String(pago.monto_pagado));
    setEditTipo(pago.tipo_pago);
    setEditObs(pago.observaciones ?? "");
    setEditError(null);
  }

  function closeEdit() {
    setEditPago(null);
    setEditError(null);
  }

  async function handleEditSave() {
    if (!editPago) return;
    const montoNum = Number(editMonto);
    if (Number.isNaN(montoNum) || montoNum <= 0) {
      setEditError("El monto debe ser mayor a 0");
      return;
    }
    if (!editTrabajadorId) {
      setEditError("Selecciona un trabajador");
      return;
    }

    setEditSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`${API_URL}/remuneraciones/${editPago.pago_id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          trabajador_id: editTrabajadorId,
          monto_pagado: montoNum,
          fecha_pago: editFecha,
          tipo_pago: editTipo,
          observaciones: editObs || null,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Error al actualizar");
      }

      closeEdit();
      await loadResumen();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletePago) return;
    setDeleting(true);

    try {
      const res = await fetch(`${API_URL}/remuneraciones/${deletePago.pago_id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Error al eliminar");
      }

      setDeletePago(null);
      await loadResumen();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setDeletePago(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="soft-enter rounded-3xl border border-sand-200 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink-950">Dashboard Semanal de Remuneraciones</h2>
          <p className="mt-1 text-sm text-ink-600">Agrupado por semana con detalle por trabajador.</p>
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
              Semana {row.semana_del_anio} - Total Pagado {money.format(row.total_semana)}
            </summary>
            <div className="mt-3 overflow-x-auto rounded-xl border border-sand-200">
              <table className="min-w-full text-sm">
                <thead className="bg-sand-50 text-ink-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Trabajador</th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-left">Monto</th>
                    <th className="px-3 py-2 text-left">Observaciones</th>
                    {isAdmin && <th className="px-3 py-2 text-left">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {row.pagos.map((pago) => (
                    <tr key={pago.pago_id} className="border-t border-sand-100">
                      <td className="px-3 py-2">{pago.trabajador_nombre}</td>
                      <td className="px-3 py-2">{pago.fecha_pago}</td>
                      <td className="px-3 py-2">{pago.tipo_pago}</td>
                      <td className="px-3 py-2">{money.format(pago.monto_pagado)}</td>
                      <td className="px-3 py-2">{pago.observaciones ?? "-"}</td>
                      {isAdmin && (
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              title="Editar"
                              onClick={() => openEdit(pago)}
                              className="rounded-lg p-1.5 text-ink-500 transition hover:bg-amber-50 hover:text-amber-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              title="Eliminar"
                              onClick={() => setDeletePago(pago)}
                              className="rounded-lg p-1.5 text-ink-500 transition hover:bg-red-50 hover:text-red-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>

      {/* ── Edit Modal ── */}
      {editPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-sand-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-ink-950">Editar Pago</h3>

            {editError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">Trabajador</span>
                <select
                  value={editTrabajadorId}
                  onChange={(e) => setEditTrabajadorId(e.target.value)}
                  className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
                >
                  <option value="">Seleccionar</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre_completo}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">Fecha de Pago</span>
                <input
                  type="date"
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                  className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">Monto</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editMonto}
                  onChange={(e) => setEditMonto(e.target.value)}
                  className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">Tipo de Pago</span>
                <select
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value as TipoPago)}
                  className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
                >
                  <option value="Sueldo">Sueldo</option>
                  <option value="Adelanto">Adelanto</option>
                  <option value="Bono">Bono</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium text-ink-700">Observaciones</span>
              <textarea
                value={editObs}
                onChange={(e) => setEditObs(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl border border-sand-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={editSaving}
                onClick={() => void handleEditSave()}
                className="rounded-xl bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:opacity-60"
              >
                {editSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletePago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-ink-950">Confirmar Eliminacion</h3>
            <p className="mt-2 text-sm text-ink-600">
              ¿Eliminar el pago de <strong>{deletePago.trabajador_nombre}</strong> por{" "}
              <strong>{money.format(deletePago.monto_pagado)}</strong> del {deletePago.fecha_pago}?
            </p>
            <p className="mt-1 text-xs text-red-600">Esta accion no se puede deshacer.</p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletePago(null)}
                className="rounded-xl border border-sand-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
