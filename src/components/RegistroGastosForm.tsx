import { useEffect, useMemo, useState } from 'react'
import { authHeaders } from '../context/AuthContext'

interface CatalogItem {
  id: string
  nombre: string
}

interface ProductoCatalogItem extends CatalogItem {
  categoria_id: string
}

interface CatalogosResponse {
  productos: ProductoCatalogItem[]
  proveedores: CatalogItem[]
  categorias: CatalogItem[]
}

type TipoDocumento = 'Factura' | 'Boleta'

interface LoteForm {
  nombre_descriptivo: string
  tiene_presupuesto: boolean
  monto_presupuesto: string
  fecha_creacion: string
}

interface DocumentoForm {
  referencia_factura: string
  tipo_documento: TipoDocumento
  numero_documento: string
  fecha_emision: string
  proveedor_id: string
}

interface DetalleForm {
  producto_id: string
  categoria_id: string
  cantidad: string
  precio_unitario_lista: string
  descuento: string
}

interface DetalleRow {
  id: string
  producto_id: string
  categoria_id: string
  cantidad: number
  precio_unitario_lista: number
  subtotal: number
  descuento: number
  total_pagado: number
  precio_unitario_real: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 2,
})

const initialLote: LoteForm = {
  nombre_descriptivo: '',
  tiene_presupuesto: true,
  monto_presupuesto: '',
  fecha_creacion: new Date().toISOString().slice(0, 10),
}

const initialDocumento: DocumentoForm = {
  referencia_factura: '',
  tipo_documento: 'Factura',
  numero_documento: '',
  fecha_emision: new Date().toISOString().slice(0, 10),
  proveedor_id: '',
}

const initialDetalle: DetalleForm = {
  producto_id: '',
  categoria_id: '',
  cantidad: '',
  precio_unitario_lista: '',
  descuento: '0',
}

interface RegistroGastosFormProps {
  editDocumentoId?: string | null
  onEditDone?: () => void
}

export function RegistroGastosForm({ editDocumentoId, onEditDone }: RegistroGastosFormProps = {}) {
  const isEditMode = Boolean(editDocumentoId)

  const [catalogos, setCatalogos] = useState<CatalogosResponse>({
    productos: [],
    proveedores: [],
    categorias: [],
  })
  const [lote, setLote] = useState<LoteForm>(initialLote)
  const [documento, setDocumento] = useState<DocumentoForm>(initialDocumento)
  const [detalle, setDetalle] = useState<DetalleForm>(initialDetalle)
  const [filas, setFilas] = useState<DetalleRow[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [securityKey, setSecurityKey] = useState('')
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false)
  const [isSavingLote, setIsSavingLote] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoadingDoc, setIsLoadingDoc] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const productoLookup = useMemo(() => {
    return new Map(catalogos.productos.map((p) => [p.id, p.categoria_id]))
  }, [catalogos.productos])

  const categoriaAutoFilled = Boolean(detalle.producto_id && productoLookup.has(detalle.producto_id))

  const calculosDetalle = useMemo(() => {
    const cantidad = Number(detalle.cantidad) || 0
    const precioLista = Number(detalle.precio_unitario_lista) || 0
    const descuento = Number(detalle.descuento) || 0
    const subtotal = round2(cantidad * precioLista)
    const totalPagado = round2(subtotal - descuento)
    const precioUnitarioReal = cantidad > 0 ? round2(totalPagado / cantidad) : 0

    return {
      subtotal,
      totalPagado,
      precioUnitarioReal,
    }
  }, [detalle])

  const totalDocumentoActual = useMemo(
    () => round2(filas.reduce((acc, row) => acc + row.total_pagado, 0)),
    [filas]
  )

  useEffect(() => {
    void fetchCatalogos()
  }, [])

  async function fetchCatalogos() {
    setIsLoadingCatalogos(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/catalogos`)
      if (!response.ok) throw new Error('No se pudieron cargar los catalogos')
      const data: CatalogosResponse = await response.json()
      setCatalogos(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      setError(message)
    } finally {
      setIsLoadingCatalogos(false)
    }
  }

  // ── Load document for edit mode ──
  useEffect(() => {
    if (!editDocumentoId) return
    void loadDocumentoForEdit(editDocumentoId)
  }, [editDocumentoId])

  async function loadDocumentoForEdit(docId: string) {
    setIsLoadingDoc(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/gastos/documento/${docId}`)
      if (!res.ok) throw new Error('No se pudo cargar el documento')

      const doc = (await res.json()) as {
        id: string
        referencia_factura: string
        tipo_documento: TipoDocumento
        numero_documento: string
        fecha_emision: string
        proveedor_id: string
        detalles: Array<{
          id: string
          producto_id: string
          categoria_id: string
          cantidad: number
          precio_unitario_lista: number
          descuento: number
          subtotal: number
          total_pagado: number
          precio_unitario_real: number
        }>
      }

      setDocumento({
        referencia_factura: doc.referencia_factura,
        tipo_documento: doc.tipo_documento,
        numero_documento: doc.numero_documento,
        fecha_emision: doc.fecha_emision.slice(0, 10),
        proveedor_id: doc.proveedor_id,
      })

      setFilas(
        doc.detalles.map((d) => ({
          id: d.id,
          producto_id: d.producto_id,
          categoria_id: d.categoria_id,
          cantidad: d.cantidad,
          precio_unitario_lista: d.precio_unitario_lista,
          subtotal: d.subtotal,
          descuento: d.descuento,
          total_pagado: d.total_pagado,
          precio_unitario_real: d.precio_unitario_real,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoadingDoc(false)
    }
  }

  async function handleUpdateDocumento() {
    setError(null)
    setSuccess(null)

    if (!editDocumentoId) return

    if (!documento.referencia_factura.trim() || !documento.numero_documento.trim() || !documento.proveedor_id) {
      setError('Completa la cabecera del documento antes de actualizar.')
      return
    }

    if (filas.length === 0) {
      setError('No hay items en la factura para actualizar.')
      return
    }

    setIsUpdating(true)

    try {
      const payload = {
        referencia_factura: documento.referencia_factura,
        tipo_documento: documento.tipo_documento,
        numero_documento: documento.numero_documento,
        fecha_emision: documento.fecha_emision,
        proveedor_id: documento.proveedor_id,
        detalles: filas.map((item) => ({
          producto_id: item.producto_id,
          categoria_id: item.categoria_id,
          cantidad: item.cantidad,
          precio_unitario_lista: item.precio_unitario_lista,
          descuento: item.descuento,
        })),
      }

      const res = await fetch(`${API_URL}/gastos/documento/${editDocumentoId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? 'Error al actualizar')
      }

      setSuccess('Factura actualizada correctamente.')
      onEditDone?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsUpdating(false)
    }
  }

  function handleProductoChange(productoId: string) {
    if (!productoId) {
      setDetalle((prev) => ({ ...prev, producto_id: '', categoria_id: '' }))
      return
    }
    const catId = productoLookup.get(productoId) ?? ''
    setDetalle((prev) => ({ ...prev, producto_id: productoId, categoria_id: catId }))
  }

  function removeDetalle(id: string) {
    setFilas((prev) => prev.filter((row) => row.id !== id))
  }

  function guardarGastoCompleto() {
    setError(null)
    setSuccess(null)

    if (!documento.referencia_factura.trim() || !documento.numero_documento.trim() || !documento.proveedor_id) {
      setError('Completa la cabecera del documento para poder acumular items.')
      return
    }

    const cantidad = Number(detalle.cantidad)
    const precio = Number(detalle.precio_unitario_lista)
    const descuento = Number(detalle.descuento)

    if (!detalle.producto_id || !detalle.categoria_id) {
      setError('Selecciona producto y categoria para acumular el item.')
      return
    }

    if (
      Number.isNaN(cantidad) ||
      cantidad <= 0 ||
      Number.isNaN(precio) ||
      precio < 0 ||
      Number.isNaN(descuento) ||
      descuento < 0
    ) {
      setError('Cantidad, precio y descuento deben ser validos.')
      return
    }

    if (descuento > calculosDetalle.subtotal) {
      setError('El descuento no puede superar el subtotal.')
      return
    }

    setFilas((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        producto_id: detalle.producto_id,
        categoria_id: detalle.categoria_id,
        cantidad,
        precio_unitario_lista: precio,
        subtotal: calculosDetalle.subtotal,
        descuento,
        total_pagado: calculosDetalle.totalPagado,
        precio_unitario_real: calculosDetalle.precioUnitarioReal,
      },
    ])

    // Limpia solo campos del Nivel 3
    setDetalle(initialDetalle)
    setSuccess('Item acumulado en la factura actual.')
  }

  async function confirmarGuardarLote() {
    setError(null)
    setSuccess(null)

    if (!lote.nombre_descriptivo.trim()) {
      setError('El lote requiere un nombre descriptivo.')
      return
    }

    if (lote.tiene_presupuesto && (!lote.monto_presupuesto || Number(lote.monto_presupuesto) < 0)) {
      setError('Debes ingresar un monto de presupuesto valido.')
      return
    }

    if (!documento.referencia_factura.trim() || !documento.numero_documento.trim() || !documento.proveedor_id) {
      setError('Completa la cabecera del documento antes del guardado final.')
      return
    }

    if (filas.length === 0) {
      setError('No hay items en la factura actual para guardar.')
      return
    }

    if (!securityKey.trim()) {
      setError('Debes ingresar la clave de seguridad para confirmar el guardado.')
      return
    }

    setIsSavingLote(true)

    try {
      const payload = {
        security_key: securityKey,
        lote: {
          nombre_descriptivo: lote.nombre_descriptivo,
          tiene_presupuesto: lote.tiene_presupuesto,
          monto_presupuesto: lote.tiene_presupuesto ? Number(lote.monto_presupuesto) : null,
          fecha_creacion: lote.fecha_creacion,
        },
        documentos: [
          {
            referencia_factura: documento.referencia_factura,
            tipo_documento: documento.tipo_documento,
            numero_documento: documento.numero_documento,
            fecha_emision: documento.fecha_emision,
            proveedor_id: documento.proveedor_id,
            detalles: filas.map((item) => ({
              producto_id: item.producto_id,
              categoria_id: item.categoria_id,
              cantidad: item.cantidad,
              precio_unitario_lista: item.precio_unitario_lista,
              descuento: item.descuento,
            })),
          },
        ],
      }

      const response = await fetch(`${API_URL}/gastos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(data?.message ?? 'No se pudo guardar el lote completo')
      }

      setSuccess('Lote completo guardado correctamente.')
      setFilas([])
      setDetalle(initialDetalle)
      setDocumento((prev) => ({ ...initialDocumento, fecha_emision: prev.fecha_emision, proveedor_id: prev.proveedor_id }))
      setDrawerOpen(false)
      setModalOpen(false)
      setSecurityKey('')
      setLote((prev) => ({ ...initialLote, fecha_creacion: prev.fecha_creacion }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      setError(message)
    } finally {
      setIsSavingLote(false)
    }
  }

  return (
    <section className="soft-enter space-y-6">
      {isLoadingDoc && (
        <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-soft text-center">
          <p className="text-sm text-ink-600">Cargando datos del documento...</p>
        </div>
      )}

      <article className="rounded-3xl border border-sand-200 bg-white p-6 shadow-soft sm:p-7">
        <h2 className="text-lg font-semibold text-ink-950">
          {isEditMode ? 'Editar Factura' : 'Registro de Gastos por Lote'}
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          {isEditMode ? 'Modifica la cabecera y los items del documento.' : 'Flujo de 3 niveles: Lote / Documento / Detalle.'}
        </p>

        {!isEditMode && (
          <>
            <h3 className="mb-3 mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-ink-600">Nivel 1: Lote</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InputField
                id="nombre_descriptivo"
                label="Nombre Descriptivo"
                value={lote.nombre_descriptivo}
                onChange={(value) => setLote((prev) => ({ ...prev, nombre_descriptivo: value }))}
                placeholder="Ej: Gastos Semana 1"
              />
              <InputField
                id="fecha_creacion"
                label="Fecha Creacion"
                type="date"
                value={lote.fecha_creacion}
                onChange={(value) => setLote((prev) => ({ ...prev, fecha_creacion: value }))}
              />
              <label className="flex items-end" htmlFor="toggle-presupuesto">
                <button
                  id="toggle-presupuesto"
                  type="button"
                  onClick={() => setLote((prev) => ({ ...prev, tiene_presupuesto: !prev.tiene_presupuesto, monto_presupuesto: !prev.tiene_presupuesto ? prev.monto_presupuesto : '' }))}
                  className="inline-flex items-center gap-3 rounded-full border border-sand-200 bg-sand-50 px-3 py-2 text-sm font-medium text-ink-800"
                >
                  <span className={`relative h-6 w-11 rounded-full transition ${lote.tiene_presupuesto ? 'bg-sage-600' : 'bg-ink-300'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${lote.tiene_presupuesto ? 'left-5' : 'left-0.5'}`} />
                  </span>
                  {lote.tiene_presupuesto ? 'Gasto con Presupuesto' : 'Gasto sin Presupuesto'}
                </button>
              </label>
              {lote.tiene_presupuesto && (
                <InputField
                  id="monto_presupuesto"
                  label="Monto Presupuesto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={lote.monto_presupuesto}
                  onChange={(value) => setLote((prev) => ({ ...prev, monto_presupuesto: value }))}
                />
              )}
            </div>
          </>
        )}

        <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-ink-600">
          {isEditMode ? 'Cabecera del Documento' : 'Nivel 2: Documento'}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <InputField
            id="referencia_factura"
            label="Referencia"
            value={documento.referencia_factura}
            onChange={(value) => setDocumento((prev) => ({ ...prev, referencia_factura: value }))}
            placeholder="Nombre interno de factura"
          />
          <SelectField
            id="proveedor_id"
            label="Proveedor"
            value={documento.proveedor_id}
            onChange={(value) => setDocumento((prev) => ({ ...prev, proveedor_id: value }))}
            options={catalogos.proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
            placeholder={isLoadingCatalogos ? 'Cargando...' : 'Seleccionar'}
          />
          <InputField
            id="fecha_emision"
            label="Fecha Emision"
            type="date"
            value={documento.fecha_emision}
            onChange={(value) => setDocumento((prev) => ({ ...prev, fecha_emision: value }))}
          />
          <SelectField
            id="tipo_documento"
            label="Tipo"
            value={documento.tipo_documento}
            onChange={(value) => setDocumento((prev) => ({ ...prev, tipo_documento: value as TipoDocumento }))}
            options={[
              { value: 'Factura', label: 'Factura' },
              { value: 'Boleta', label: 'Boleta' },
            ]}
          />
          <InputField
            id="numero_documento"
            label="Codigo"
            value={documento.numero_documento}
            onChange={(value) => setDocumento((prev) => ({ ...prev, numero_documento: value }))}
            placeholder="Ej: F001-123"
          />
        </div>
      </article>

      <article className="rounded-3xl border border-sand-200 bg-white p-6 shadow-soft sm:p-7">
        <h3 className="text-base font-semibold text-ink-950">Nivel 3: Items del Documento</h3>
        <p className="mt-1 text-sm text-ink-600">Al anadir item se limpian solo campos del nivel 3.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SelectField
            id="producto_id"
            label="Producto"
            value={detalle.producto_id}
            onChange={handleProductoChange}
            options={catalogos.productos.map((p) => ({ value: p.id, label: p.nombre }))}
            placeholder={isLoadingCatalogos ? 'Cargando...' : 'Seleccionar'}
          />
          <SelectField
            id="categoria_id"
            label="Categoria"
            value={detalle.categoria_id}
            onChange={(value) => setDetalle((prev) => ({ ...prev, categoria_id: value }))}
            options={catalogos.categorias.map((c) => ({ value: c.id, label: c.nombre }))}
            placeholder={isLoadingCatalogos ? 'Cargando...' : 'Seleccionar'}
            disabled={categoriaAutoFilled}
          />
          <InputField
            id="cantidad"
            label="Cantidad"
            type="number"
            min="0"
            step="0.01"
            value={detalle.cantidad}
            onChange={(value) => setDetalle((prev) => ({ ...prev, cantidad: value }))}
          />
          <InputField
            id="precio_unitario_lista"
            label="Precio Unitario"
            type="number"
            min="0"
            step="0.01"
            value={detalle.precio_unitario_lista}
            onChange={(value) => setDetalle((prev) => ({ ...prev, precio_unitario_lista: value }))}
          />
          <InputField
            id="descuento"
            label="Descuento"
            type="number"
            min="0"
            step="0.01"
            value={detalle.descuento}
            onChange={(value) => setDetalle((prev) => ({ ...prev, descuento: value }))}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <CalcCard label="Subtotal" value={currency.format(calculosDetalle.subtotal)} />
          <CalcCard label="Total Pagado" value={currency.format(calculosDetalle.totalPagado)} />
          <CalcCard label="P.U. Real" value={currency.format(calculosDetalle.precioUnitarioReal)} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-2 font-mono text-sm text-ink-700">
            Total documento actual: {currency.format(totalDocumentoActual)}
          </span>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-sand-200">
          <table className="min-w-full text-sm">
            <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.12em] text-ink-600">
              <tr>
                <th className="px-3 py-3">Producto</th>
                <th className="px-3 py-3">Categoria</th>
                <th className="px-3 py-3">Cantidad</th>
                <th className="px-3 py-3">Subtotal</th>
                <th className="px-3 py-3">Descuento</th>
                <th className="px-3 py-3">Total Pagado</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-ink-500">
                    Sin items agregados.
                  </td>
                </tr>
              )}
              {filas.map((row) => (
                <tr key={row.id} className="border-t border-sand-100">
                  <td className="whitespace-nowrap px-3 py-3">{findNombre(catalogos.productos, row.producto_id)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{findNombre(catalogos.categorias, row.categoria_id)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{row.cantidad}</td>
                  <td className="whitespace-nowrap px-3 py-3">{currency.format(row.subtotal)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{currency.format(row.descuento)}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink-900">{currency.format(row.total_pagado)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeDetalle(row.id)}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={guardarGastoCompleto}
            className="inline-flex items-center justify-center rounded-2xl bg-sage-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-700"
          >
            {isEditMode ? 'Agregar Item' : 'Guardar Gasto Completo'}
          </button>
          {isEditMode && (
            <button
              type="button"
              disabled={isUpdating || filas.length === 0}
              onClick={() => void handleUpdateDocumento()}
              className="inline-flex items-center justify-center rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
            >
              {isUpdating ? 'Actualizando...' : 'Actualizar Factura'}
            </button>
          )}
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
      </article>

      {!isEditMode && (
        <>
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="fixed bottom-5 right-[max(0.75rem,calc((100vw-80rem)/2-2.8rem))] z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-white shadow-2xl transition hover:bg-ink-950"
            aria-label="Abrir o cerrar barra lateral de resumen"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>

          {drawerOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setDrawerOpen(false)} />
              <aside className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto border-l border-sand-200 bg-white p-4 shadow-2xl sm:max-w-md sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-ink-950">Resumen de Factura Actual</h3>
                    <p className="mt-1 text-sm text-ink-600">Proveedor: {findNombre(catalogos.proveedores, documento.proveedor_id)}</p>
                  </div>
                  <button type="button" className="rounded-lg px-2 py-1 text-ink-500 hover:bg-sand-100" onClick={() => setDrawerOpen(false)}>
                    X
                  </button>
                </div>

                <div className="mt-5 max-h-[58vh] overflow-y-auto rounded-2xl border border-sand-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.12em] text-ink-600">
                      <tr>
                        <th className="px-3 py-3">Producto</th>
                        <th className="px-3 py-3">Cantidad</th>
                        <th className="px-3 py-3">Total Pagado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-ink-500">
                            No hay items en la factura actual.
                          </td>
                        </tr>
                      )}
                      {filas.map((item) => (
                        <tr key={item.id} className="border-t border-sand-100">
                          <td className="px-3 py-3 text-ink-800">{findNombre(catalogos.productos, item.producto_id)}</td>
                          <td className="px-3 py-3 text-ink-700">{item.cantidad}</td>
                          <td className="px-3 py-3 font-mono text-ink-900">{currency.format(item.total_pagado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 rounded-2xl border border-sand-200 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-ink-600">Total Documento Actual</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-ink-950">{currency.format(totalDocumentoActual)}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-sage-700 px-4 py-3 text-sm font-semibold text-white hover:bg-sage-800"
                >
                  Confirmar y Guardar Lote Completo
                </button>
              </aside>
            </>
          )}

          {modalOpen && (
            <div className="fixed inset-0 z-[60] grid place-items-center bg-black/35 px-4">
              <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-6 shadow-2xl">
                <h4 className="text-lg font-semibold text-ink-950">Confirmacion de Seguridad</h4>
                <p className="mt-1 text-sm text-ink-600">Ingresa la clave de administrador para guardar todo el lote.</p>

                <label className="mt-4 block" htmlFor="security_key">
                  <span className="mb-1.5 block text-sm font-medium text-ink-800">Clave de Seguridad</span>
                  <input
                    id="security_key"
                    type="password"
                    value={securityKey}
                    onChange={(event) => setSecurityKey(event.target.value)}
                    className="w-full rounded-2xl border border-sand-200 bg-sand-50/50 px-3 py-2.5 text-sm text-ink-900 outline-none ring-sage-500 transition focus:border-sage-500 focus:bg-white focus:ring-2"
                  />
                </label>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-sand-200 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-sand-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmarGuardarLote()}
                    disabled={isSavingLote}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-sage-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sage-800 disabled:opacity-60"
                  >
                    {isSavingLote ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

interface InputFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  min?: string
  step?: string
  placeholder?: string
}

function InputField({ id, label, value, onChange, type = 'text', min, step, placeholder }: InputFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium text-ink-800">{label}</span>
      <input
        id={id}
        type={type}
        min={min}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-sand-200 bg-sand-50/50 px-3 py-2.5 text-sm text-ink-900 outline-none ring-sage-500 transition placeholder:text-ink-400 focus:border-sage-500 focus:bg-white focus:ring-2"
      />
    </label>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}

function SelectField({ id, label, value, onChange, options, placeholder = 'Seleccionar', disabled = false }: SelectFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium text-ink-800">{label}</span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border border-sand-200 bg-sand-50/50 px-3 py-2.5 text-sm text-ink-900 outline-none ring-sage-500 transition focus:border-sage-500 focus:bg-white focus:ring-2 ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function CalcCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-sand-50 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-ink-500">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-ink-900">{value}</p>
    </div>
  )
}

function findNombre(items: CatalogItem[], id: string): string {
  return items.find((item) => item.id === id)?.nombre ?? 'N/A'
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
