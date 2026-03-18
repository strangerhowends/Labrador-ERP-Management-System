import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { authHeaders, useAuth } from '../context/AuthContext'

interface CajaRecord {
  id: string
  fecha: string
  total_contado: number
  fondo_siguiente_dia: number
  ingreso_neto_caja_fuerte: number
  egresos_retiros: number
  otros_ingresos: number
  saldo_acumulado_final: number
}

interface CajaForm {
  fecha: string
  total_contado: string
  fondo_siguiente_dia: string
  egresos_retiros: string
  otros_ingresos: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

const initialForm: CajaForm = {
  fecha: new Date().toISOString().slice(0, 10),
  total_contado: '',
  fondo_siguiente_dia: '',
  egresos_retiros: '0',
  otros_ingresos: '0',
}

const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 2,
})

export function DashboardCaja() {
  const { user } = useAuth()
  const isAdmin = user?.rol_acceso === 'ADMIN'

  const [form, setForm] = useState<CajaForm>(initialForm)
  const [rows, setRows] = useState<CajaRecord[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Edit modal state
  const [editRow, setEditRow] = useState<CajaRecord | null>(null)
  const [editForm, setEditForm] = useState<CajaForm>(initialForm)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete confirmation state
  const [deleteRow, setDeleteRow] = useState<CajaRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const ultimoSaldo = useMemo(() => {
    if (rows.length === 0) return 0
    return rows[0].saldo_acumulado_final
  }, [rows])

  async function fetchHistorial() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/caja`)
      if (!response.ok) {
        throw new Error('No se pudo obtener el historial')
      }
      const data: CajaRecord[] = await response.json()
      setRows(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchHistorial()
  }, [])

  function updateField(field: keyof CajaForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        fecha: form.fecha,
        total_contado: Number(form.total_contado),
        fondo_siguiente_dia: Number(form.fondo_siguiente_dia),
        egresos_retiros: Number(form.egresos_retiros),
        otros_ingresos: Number(form.otros_ingresos),
      }

      const response = await fetch(`${API_URL}/caja`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { message?: string }
          | null
        throw new Error(data?.message ?? 'No se pudo guardar el arqueo')
      }

      setSuccess('Arqueo guardado correctamente')
      setForm((prev) => ({
        ...initialForm,
        fecha: prev.fecha,
      }))
      await fetchHistorial()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Edit handlers ──
  function openEdit(row: CajaRecord) {
    setEditRow(row)
    setEditForm({
      fecha: row.fecha.slice(0, 10),
      total_contado: String(row.total_contado),
      fondo_siguiente_dia: String(row.fondo_siguiente_dia),
      egresos_retiros: String(row.egresos_retiros),
      otros_ingresos: String(row.otros_ingresos),
    })
    setEditError(null)
  }

  async function handleEditSave() {
    if (!editRow) return
    setEditSaving(true)
    setEditError(null)

    try {
      const payload = {
        fecha: editForm.fecha,
        total_contado: Number(editForm.total_contado),
        fondo_siguiente_dia: Number(editForm.fondo_siguiente_dia),
        egresos_retiros: Number(editForm.egresos_retiros),
        otros_ingresos: Number(editForm.otros_ingresos),
      }

      const res = await fetch(`${API_URL}/caja/${editRow.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? 'Error al actualizar')
      }

      setEditRow(null)
      await fetchHistorial()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setEditSaving(false)
    }
  }

  // ── Delete handlers ──
  async function handleDelete() {
    if (!deleteRow) return
    setDeleting(true)

    try {
      const res = await fetch(`${API_URL}/caja/${deleteRow.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? 'Error al eliminar')
      }

      setDeleteRow(null)
      await fetchHistorial()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setDeleteRow(null)
    } finally {
      setDeleting(false)
    }
  }

  const colSpan = isAdmin ? 8 : 7

  return (
    <section className="soft-enter grid gap-6 lg:grid-cols-[360px,1fr]">
      <article className="rounded-3xl border border-sand-200 bg-white p-6 shadow-soft sm:p-7">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-ink-950">Registrar Arqueo</h2>
          <p className="mt-1 text-sm text-ink-600">Guarda los valores del cierre del dia.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <InputField
            id="fecha"
            label="Fecha"
            type="date"
            value={form.fecha}
            onChange={(value) => updateField('fecha', value)}
            required
          />
          <InputField
            id="total_contado"
            label="Total Contado"
            type="number"
            step="0.01"
            min="0"
            value={form.total_contado}
            onChange={(value) => updateField('total_contado', value)}
            required
          />
          <InputField
            id="fondo_siguiente_dia"
            label="Fondo / Descarte"
            type="number"
            step="0.01"
            min="0"
            value={form.fondo_siguiente_dia}
            onChange={(value) => updateField('fondo_siguiente_dia', value)}
            required
          />
          <InputField
            id="egresos_retiros"
            label="Egresos / Retiros"
            type="number"
            step="0.01"
            min="0"
            value={form.egresos_retiros}
            onChange={(value) => updateField('egresos_retiros', value)}
            required
          />
          <InputField
            id="otros_ingresos"
            label="Otros Ingresos"
            type="number"
            step="0.01"
            min="0"
            value={form.otros_ingresos}
            onChange={(value) => updateField('otros_ingresos', value)}
            required
          />

          <button
            type="submit"
            disabled={isSaving}
            className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-sage-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Guardando...' : 'Guardar Arqueo'}
          </button>
        </form>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
      </article>

      <article className="rounded-3xl border border-sand-200 bg-white p-4 shadow-soft sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-sand-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Historial de Caja</h2>
            <p className="mt-1 text-sm text-ink-600">Ordenado por fecha descendente.</p>
          </div>
          <div className="rounded-2xl border border-sage-200 bg-sage-50 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.15em] text-sage-700">Saldo Acumulado Actual</p>
            <p className="font-mono text-lg font-semibold text-sage-700">{currency.format(ultimoSaldo)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-ink-500">
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Fondo</th>
                <th className="px-3 py-3 font-medium">Ingreso Neto</th>
                <th className="px-3 py-3 font-medium">Egresos</th>
                <th className="px-3 py-3 font-medium">Otros Ingresos</th>
                <th className="px-3 py-3 font-medium text-sage-700">Saldo Acumulado</th>
                {isAdmin && <th className="px-3 py-3 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="px-3 py-6 text-center text-ink-500" colSpan={colSpan}>
                    Cargando historial...
                  </td>
                </tr>
              )}

              {!isLoading && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-ink-500" colSpan={colSpan}>
                    No hay registros todavia.
                  </td>
                </tr>
              )}

              {rows.map((row) => (
                <tr key={row.id} className="border-t border-sand-100">
                  <td className="whitespace-nowrap px-3 py-3 text-ink-800">{formatDate(row.fecha)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink-700">{currency.format(row.total_contado)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink-700">{currency.format(row.fondo_siguiente_dia)}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-ink-900">
                    {currency.format(row.ingreso_neto_caja_fuerte)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink-700">{currency.format(row.egresos_retiros)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink-700">{currency.format(row.otros_ingresos)}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="inline-flex rounded-full bg-sage-100 px-3 py-1 font-mono font-semibold text-sage-700">
                      {currency.format(row.saldo_acumulado_final)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => openEdit(row)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-amber-50 hover:text-amber-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => setDeleteRow(row)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-700"
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
      </article>

      {/* ── Modal Editar Arqueo ── */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-sand-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-ink-950">Editar Arqueo</h3>
            <p className="mt-1 text-sm text-ink-600">Modifica los valores del registro seleccionado.</p>

            {editError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>
            )}

            <div className="mt-4 space-y-3">
              <InputField
                id="edit_fecha"
                label="Fecha"
                type="date"
                value={editForm.fecha}
                onChange={(v) => setEditForm((p) => ({ ...p, fecha: v }))}
                required
              />
              <InputField
                id="edit_total_contado"
                label="Total Contado"
                type="number"
                step="0.01"
                min="0"
                value={editForm.total_contado}
                onChange={(v) => setEditForm((p) => ({ ...p, total_contado: v }))}
                required
              />
              <InputField
                id="edit_fondo"
                label="Fondo / Descarte"
                type="number"
                step="0.01"
                min="0"
                value={editForm.fondo_siguiente_dia}
                onChange={(v) => setEditForm((p) => ({ ...p, fondo_siguiente_dia: v }))}
                required
              />
              <InputField
                id="edit_egresos"
                label="Egresos / Retiros"
                type="number"
                step="0.01"
                min="0"
                value={editForm.egresos_retiros}
                onChange={(v) => setEditForm((p) => ({ ...p, egresos_retiros: v }))}
                required
              />
              <InputField
                id="edit_otros"
                label="Otros Ingresos"
                type="number"
                step="0.01"
                min="0"
                value={editForm.otros_ingresos}
                onChange={(v) => setEditForm((p) => ({ ...p, otros_ingresos: v }))}
                required
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRow(null)}
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
                {editSaving ? 'Guardando...' : 'Actualizar Arqueo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminacion ── */}
      {deleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-ink-950">Confirmar Eliminacion</h3>
            <p className="mt-2 text-sm text-ink-600">
              ¿Eliminar el arqueo del <strong>{formatDate(deleteRow.fecha)}</strong> con total{' '}
              <strong>{currency.format(deleteRow.total_contado)}</strong>?
            </p>
            <p className="mt-1 text-xs text-red-600">Esta accion no se puede deshacer.</p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteRow(null)}
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
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

interface InputFieldProps {
  id: string
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  step?: string
  min?: string
}

function InputField({ id, label, type, value, onChange, required, step, min }: InputFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium text-ink-800">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        step={step}
        min={min}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-sand-200 bg-sand-50/50 px-3 py-2.5 text-sm text-ink-900 outline-none ring-sage-500 transition placeholder:text-ink-400 focus:border-sage-500 focus:bg-white focus:ring-2"
      />
    </label>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
