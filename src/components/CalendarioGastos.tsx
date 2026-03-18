import { useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core/index.js'
import { useAuth } from '../context/AuthContext'
import { RegistroGastosForm } from './RegistroGastosForm'

interface LoteResumen {
  lote_id: string
  nombre_descriptivo: string
  fecha: string
  total_lote: number
  documentos_count: number
  items_count: number
}

interface DocumentoResumen {
  documento_id: string
  referencia_factura: string
  tipo_documento: string
  numero_documento: string
  proveedor_nombre: string
  total_documento: number
  items_count: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 2,
})

export function CalendarioGastos() {
  const { user } = useAuth()
  const isAdmin = user?.rol_acceso === 'ADMIN'

  const [lotes, setLotes] = useState<LoteResumen[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Document detail for the selected date
  const [documentos, setDocumentos] = useState<DocumentoResumen[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Edit mode
  const [editDocId, setEditDocId] = useState<string | null>(null)

  const lotesByDate = useMemo(() => {
    const grouped = new Map<string, LoteResumen[]>()
    for (const lote of lotes) {
      const key = lote.fecha.slice(0, 10)
      const current = grouped.get(key) ?? []
      current.push(lote)
      grouped.set(key, current)
    }
    return grouped
  }, [lotes])

  const resumenDiaSeleccionado = useMemo(() => {
    if (!selectedDate) return []
    return lotesByDate.get(selectedDate) ?? []
  }, [lotesByDate, selectedDate])

  const totalDiaSeleccionado = useMemo(
    () => round2(resumenDiaSeleccionado.reduce((acc, item) => acc + item.total_lote, 0)),
    [resumenDiaSeleccionado]
  )

  const events = useMemo<EventInput[]>(
    () =>
      lotes.map((item) => ({
        id: item.lote_id,
        start: item.fecha,
        allDay: true,
        title: item.nombre_descriptivo,
        extendedProps: {
          total: item.total_lote,
          fecha: item.fecha,
        },
      })),
    [lotes]
  )

  // Fetch documents when modal opens for a date
  useEffect(() => {
    if (!modalOpen || !selectedDate) {
      setDocumentos([])
      return
    }
    void fetchDocumentos(selectedDate)
  }, [modalOpen, selectedDate])

  async function fetchDocumentos(date: string) {
    setLoadingDocs(true)
    try {
      const res = await fetch(`${API_URL}/gastos/resumen-fecha?date=${date}`)
      if (!res.ok) throw new Error('No se pudo cargar documentos')
      const data = (await res.json()) as { documentos: DocumentoResumen[] }
      setDocumentos(data.documentos)
    } catch {
      setDocumentos([])
    } finally {
      setLoadingDocs(false)
    }
  }

  async function loadMonth(arg: DatesSetArg) {
    setIsLoading(true)
    setError(null)

    try {
      const month = arg.startStr.slice(0, 7)
      const response = await fetch(`${API_URL}/gastos/lotes-resumen?month=${month}`)
      if (!response.ok) {
        throw new Error('No se pudo cargar el resumen mensual de lotes')
      }
      const data = (await response.json()) as Array<{
        lote_id: string
        nombre_descriptivo: string
        fecha_creacion: string
        total_lote: number
        documentos_count: number
        items_count: number
      }>

      setLotes(
        data.map((row) => ({
          lote_id: row.lote_id,
          nombre_descriptivo: row.nombre_descriptivo,
          fecha: row.fecha_creacion,
          total_lote: Number(row.total_lote),
          documentos_count: Number(row.documentos_count),
          items_count: Number(row.items_count),
        }))
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  function openResumenFechaByDate(date: string) {
    setSelectedDate(date)
    setModalOpen(true)
  }

  function openResumenFecha(arg: EventClickArg) {
    const date = arg.event.startStr.slice(0, 10)
    openResumenFechaByDate(date)
  }

  function onDateClick(arg: { dateStr: string }) {
    const date = arg.dateStr.slice(0, 10)
    if ((lotesByDate.get(date) ?? []).length > 0) {
      openResumenFechaByDate(date)
    }
  }

  function handleEditDone() {
    setEditDocId(null)
    // Refresh both the calendar and the modal documents
    if (selectedDate) void fetchDocumentos(selectedDate)
  }

  return (
    <section className="soft-enter rounded-3xl border border-sand-200 bg-white p-4 shadow-soft sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink-950">Calendario de Gastos</h2>
          <p className="mt-1 text-sm text-ink-600">Indicador visual por dia con tooltip del total gastado.</p>
        </div>
        {isLoading && <span className="rounded-lg bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-700">Actualizando...</span>}
      </header>

      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="calendar-shell overflow-x-auto">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="es"
          height="auto"
          events={events}
          datesSet={loadMonth}
          dateClick={onDateClick}
          eventDisplay="block"
          eventContent={renderEventContent}
          eventClick={openResumenFecha}
          eventDidMount={(info) => {
            const total = Number(info.event.extendedProps.total)
            info.el.setAttribute('title', `${info.event.title} - ${currency.format(total)}`)
          }}
          dayMaxEvents={2}
          fixedWeekCount={false}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
        />
      </div>

      {/* ── Modal Resumen del Día ── */}
      {modalOpen && selectedDate && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/35 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-sand-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink-950">Resumen de Compras del {formatDate(selectedDate)}</h3>
                <p className="mt-1 text-sm text-ink-600">
                  {resumenDiaSeleccionado.length} lote(s) | Total gastado: {currency.format(totalDiaSeleccionado)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-sand-200 px-3 py-1.5 text-sm font-semibold text-ink-700 hover:bg-sand-50"
              >
                Cerrar
              </button>
            </div>

            {/* Lotes summary table */}
            <div className="mt-5 max-h-[28vh] overflow-y-auto rounded-2xl border border-sand-200">
              <table className="min-w-full text-sm">
                <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.12em] text-ink-600">
                  <tr>
                    <th className="px-3 py-3">Lote</th>
                    <th className="px-3 py-3">Documentos</th>
                    <th className="px-3 py-3">Items</th>
                    <th className="px-3 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenDiaSeleccionado.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-ink-500">
                        No hay compras registradas para esta fecha.
                      </td>
                    </tr>
                  )}
                  {resumenDiaSeleccionado.map((lote) => (
                    <tr key={lote.lote_id} className="border-t border-sand-100">
                      <td className="px-3 py-3 text-ink-800">{lote.nombre_descriptivo}</td>
                      <td className="px-3 py-3 text-ink-700">{lote.documentos_count}</td>
                      <td className="px-3 py-3 text-ink-700">{lote.items_count}</td>
                      <td className="px-3 py-3 font-semibold text-ink-900">{currency.format(lote.total_lote)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Documents detail table */}
            <h4 className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-ink-600">Documentos del Día</h4>
            <div className="mt-2 max-h-[28vh] overflow-y-auto rounded-2xl border border-sand-200">
              <table className="min-w-full text-sm">
                <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.12em] text-ink-600">
                  <tr>
                    <th className="px-3 py-3">Referencia</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Código</th>
                    <th className="px-3 py-3">Proveedor</th>
                    <th className="px-3 py-3">Items</th>
                    <th className="px-3 py-3">Total</th>
                    {isAdmin && <th className="px-3 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {loadingDocs && (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="px-3 py-6 text-center text-ink-500">
                        Cargando documentos...
                      </td>
                    </tr>
                  )}
                  {!loadingDocs && documentos.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="px-3 py-6 text-center text-ink-500">
                        Sin documentos.
                      </td>
                    </tr>
                  )}
                  {documentos.map((doc) => (
                    <tr key={doc.documento_id} className="border-t border-sand-100">
                      <td className="px-3 py-3 text-ink-800">{doc.referencia_factura}</td>
                      <td className="px-3 py-3 text-ink-700">{doc.tipo_documento}</td>
                      <td className="px-3 py-3 text-ink-700">{doc.numero_documento}</td>
                      <td className="px-3 py-3 text-ink-700">{doc.proveedor_nombre}</td>
                      <td className="px-3 py-3 text-ink-700">{doc.items_count}</td>
                      <td className="px-3 py-3 font-semibold text-ink-900">{currency.format(doc.total_documento)}</td>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            title="Editar Factura"
                            onClick={() => setEditDocId(doc.documento_id)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-amber-50 hover:text-amber-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Edición de Documento ── */}
      {editDocId && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
          <div className="mx-auto max-w-6xl pt-4 pb-12">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setEditDocId(null)}
                className="rounded-xl border border-sand-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 shadow hover:bg-sand-50"
              >
                Cerrar Editor
              </button>
            </div>
            <RegistroGastosForm editDocumentoId={editDocId} onEditDone={handleEditDone} />
          </div>
        </div>
      )}
    </section>
  )
}

function renderEventContent(_arg: EventContentArg) {
  return (
    <span className="mt-0.5 inline-flex max-w-full items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
      <span className="truncate">{_arg.event.title}</span>
    </span>
  )
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
