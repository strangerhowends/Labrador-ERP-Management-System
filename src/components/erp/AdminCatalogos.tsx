import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Papa from "papaparse";
import toast, { Toaster } from "react-hot-toast";
import { authHeaders } from "../../context/AuthContext";
import {
  API_URL,
  type Categoria,
  type CategoriaTipo,
  type Producto,
  type Proveedor,
  type RolAcceso,
  type Trabajador,
  type TrabajadorRol,
} from "./types";
import { AjustesView } from "./AjustesView";

type TabKey = "proveedores" | "categorias" | "productos" | "trabajadores" | "ajustes";

type TabFeedback = {
  error: string | null;
  success: string | null;
};

type BulkResult = {
  total: number;
  inserted: number;
  skipped_existing: number;
  skipped_invalid: number;
};

type ProductBulkResult = BulkResult & {
  skipped_missing_category?: Array<{ nombre: string; categoria: string }>;
};

type CsvRow = Record<string, string>;

const tabLabels: Record<TabKey, string> = {
  proveedores: "Proveedores",
  categorias: "Categorias",
  productos: "Productos",
  trabajadores: "Trabajadores",
  ajustes: "Ajustes",
};

const initialFeedback: Record<TabKey, TabFeedback> = {
  proveedores: { error: null, success: null },
  categorias: { error: null, success: null },
  productos: { error: null, success: null },
  trabajadores: { error: null, success: null },
  ajustes: { error: null, success: null },
};

export function AdminCatalogos() {
  const [tab, setTab] = useState<TabKey>("proveedores");

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);

  const [loading, setLoading] = useState(false);
  const [feedbackByTab, setFeedbackByTab] = useState<Record<TabKey, TabFeedback>>(initialFeedback);

  const [proveedorForm, setProveedorForm] = useState({ id: "", nombre: "", ruc_dni: "", contacto: "" });
  const [categoriaForm, setCategoriaForm] = useState<{ id: string; nombre: string; tipo: CategoriaTipo }>({
    id: "",
    nombre: "",
    tipo: "Insumo",
  });
  const [productoForm, setProductoForm] = useState({ id: "", nombre: "", categoria_id: "" });
  const [trabajadorForm, setTrabajadorForm] = useState<{ id: string; nombre_completo: string; rol: TrabajadorRol; dni: string; telefono: string; correo: string }>({
    id: "",
    nombre_completo: "",
    rol: "Cocina",
    dni: "",
    telefono: "",
    correo: "",
  });

  const [importingTab, setImportingTab] = useState<TabKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accessRol, setAccessRol] = useState<RolAcceso>("TRABAJADOR");
  const [accessPassword, setAccessPassword] = useState("");
  const [accessConfirm, setAccessConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);

  useEffect(() => {
    void loadAll();
  }, []);

  // Clear stale feedback whenever the active tab changes
  useEffect(() => {
    setFeedbackByTab((prev) => ({
      ...prev,
      [tab]: { error: null, success: null },
    }));
  }, [tab]);

  const categoriaLookup = useMemo(() => {
    return new Map(categorias.map((c) => [c.id, c.nombre]));
  }, [categorias]);

  const activeFeedback = feedbackByTab[tab];

  function setTabFeedback(tabKey: TabKey, feedback: Partial<TabFeedback>) {
    setFeedbackByTab((prev) => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        ...feedback,
      },
    }));
  }

  function clearFeedback(tabKey: TabKey = tab) {
    setTabFeedback(tabKey, { error: null, success: null });
  }

  async function loadAll() {
    setLoading(true);

    try {
      const [pRes, cRes, prRes, tRes] = await Promise.all([
        fetch(`${API_URL}/proveedores?active=false`),
        fetch(`${API_URL}/categorias?active=false`),
        fetch(`${API_URL}/productos?active=false`),
        fetch(`${API_URL}/trabajadores?active=false`, { headers: authHeaders() }),
      ]);

      if (!pRes.ok || !cRes.ok || !prRes.ok || !tRes.ok) {
        throw new Error("No se pudieron cargar los catalogos");
      }

      const [pData, cData, prData, tData] = await Promise.all([
        pRes.json() as Promise<Proveedor[]>,
        cRes.json() as Promise<Categoria[]>,
        prRes.json() as Promise<Producto[]>,
        tRes.json() as Promise<Trabajador[]>,
      ]);

      setProveedores(pData);
      setCategorias(cData);
      setProductos(prData);
      setTrabajadores(tData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setTabFeedback(tab, { error: message });
    } finally {
      setLoading(false);
    }
  }

  async function saveProveedor() {
    clearFeedback("proveedores");
    if (!proveedorForm.nombre.trim()) {
      setTabFeedback("proveedores", { error: "El nombre del proveedor es requerido" });
      return;
    }

    const isEdit = Boolean(proveedorForm.id);
    const endpoint = isEdit ? `${API_URL}/proveedores/${proveedorForm.id}` : `${API_URL}/proveedores`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: authHeaders(),
      body: JSON.stringify({
        nombre: proveedorForm.nombre,
        ruc_dni: proveedorForm.ruc_dni || null,
        contacto: proveedorForm.contacto || null,
      }),
    });

    if (!res.ok) {
      setTabFeedback("proveedores", { error: "No se pudo guardar proveedor" });
      return;
    }

    setTabFeedback("proveedores", { success: isEdit ? "Proveedor actualizado" : "Proveedor creado" });
    setProveedorForm({ id: "", nombre: "", ruc_dni: "", contacto: "" });
    await loadAll();
  }

  async function saveCategoria() {
    clearFeedback("categorias");
    if (!categoriaForm.nombre.trim()) {
      setTabFeedback("categorias", { error: "El nombre de categoria es requerido" });
      return;
    }

    const isEdit = Boolean(categoriaForm.id);
    const endpoint = isEdit ? `${API_URL}/categorias/${categoriaForm.id}` : `${API_URL}/categorias`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: authHeaders(),
      body: JSON.stringify({ nombre: categoriaForm.nombre, tipo: categoriaForm.tipo }),
    });

    if (!res.ok) {
      setTabFeedback("categorias", { error: "No se pudo guardar categoria" });
      return;
    }

    setTabFeedback("categorias", { success: isEdit ? "Categoria actualizada" : "Categoria creada" });
    setCategoriaForm({ id: "", nombre: "", tipo: "Insumo" });
    await loadAll();
  }

  async function saveProducto() {
    clearFeedback("productos");
    if (!productoForm.nombre.trim() || !productoForm.categoria_id) {
      setTabFeedback("productos", { error: "Producto y categoria son requeridos" });
      return;
    }

    const isEdit = Boolean(productoForm.id);
    const endpoint = isEdit ? `${API_URL}/productos/${productoForm.id}` : `${API_URL}/productos`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: authHeaders(),
      body: JSON.stringify({ nombre: productoForm.nombre, categoria_id: productoForm.categoria_id }),
    });

    if (!res.ok) {
      setTabFeedback("productos", { error: "No se pudo guardar producto" });
      return;
    }

    setTabFeedback("productos", { success: isEdit ? "Producto actualizado" : "Producto creado" });
    setProductoForm({ id: "", nombre: "", categoria_id: "" });
    await loadAll();
  }

  async function saveTrabajador() {
    clearFeedback("trabajadores");
    if (!trabajadorForm.nombre_completo.trim()) {
      setTabFeedback("trabajadores", { error: "El nombre del trabajador es requerido" });
      return;
    }
    if (!trabajadorForm.dni.trim()) {
      setTabFeedback("trabajadores", { error: "El DNI del trabajador es requerido" });
      return;
    }

    const isEdit = Boolean(trabajadorForm.id);
    const endpoint = isEdit ? `${API_URL}/trabajadores/${trabajadorForm.id}` : `${API_URL}/trabajadores`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: authHeaders(),
      body: JSON.stringify({
        nombre_completo: trabajadorForm.nombre_completo,
        rol: trabajadorForm.rol,
        dni: trabajadorForm.dni,
        telefono: trabajadorForm.telefono || null,
        correo: trabajadorForm.correo || null,
      }),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { message?: string } | null;
      const errorMsg = payload?.message ?? "No se pudo guardar trabajador";
      setTabFeedback("trabajadores", { error: errorMsg });
      toast.error(errorMsg);
      return;
    }

    setTabFeedback("trabajadores", { success: isEdit ? "Trabajador actualizado" : "Trabajador creado" });
    setTrabajadorForm({ id: "", nombre_completo: "", rol: "Cocina", dni: "", telefono: "", correo: "" });
    setAccessPassword("");
    setAccessConfirm("");
    setShowPassword(false);
    setAccessRol("TRABAJADOR");
    await loadAll();
  }

  async function saveAccess() {
    if (!trabajadorForm.id) return;
    setAccessSaving(true);
    clearFeedback("trabajadores");

    try {
      // Update rol_acceso
      const currentTrabajador = trabajadores.find((t) => t.id === trabajadorForm.id);
      if (currentTrabajador && currentTrabajador.rol_acceso !== accessRol) {
        const rolRes = await fetch(`${API_URL}/auth/rol-acceso`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ trabajador_id: trabajadorForm.id, rol_acceso: accessRol }),
        });
        if (!rolRes.ok) {
          const payload = (await rolRes.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? "No se pudo actualizar el rol de acceso");
        }
      }

      // Set password if provided
      if (accessPassword.trim()) {
        if (accessPassword !== accessConfirm) {
          throw new Error("Las contrasenas no coinciden");
        }
        const pwRes = await fetch(`${API_URL}/auth/set-password`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ trabajador_id: trabajadorForm.id, password: accessPassword }),
        });
        if (!pwRes.ok) {
          const payload = (await pwRes.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? "No se pudo establecer la contrasena");
        }
      }

      toast.success("Acceso actualizado");
      setTabFeedback("trabajadores", { success: "Acceso al sistema actualizado" });
      setAccessPassword("");
      setAccessConfirm("");
      setShowPassword(false);
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al guardar acceso";
      setTabFeedback("trabajadores", { error: message });
      toast.error(message);
    } finally {
      setAccessSaving(false);
    }
  }

  async function deactivate(tabKey: TabKey, id: string) {
    clearFeedback(tabKey);
    const res = await fetch(`${API_URL}/${tabKey}/${id}/desactivar`, { method: "PATCH", headers: authHeaders() });
    if (!res.ok) {
      setTabFeedback(tabKey, { error: "No se pudo desactivar el registro" });
      return;
    }
    setTabFeedback(tabKey, { success: "Registro desactivado" });
    await loadAll();
  }

  function openCsvPicker(tabKey: TabKey) {
    clearFeedback(tabKey);
    setImportingTab(tabKey);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  async function onCsvSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const currentTab = importingTab;
    if (!file || !currentTab) {
      return;
    }

    try {
      if (currentTab === "proveedores") {
        await importProveedoresCsv(file);
      }

      if (currentTab === "categorias") {
        await importCategoriasCsv(file);
      }

      if (currentTab === "productos") {
        await importProductosCsv(file);
      }

      if (currentTab === "trabajadores") {
        await importTrabajadoresCsv(file);
      }

      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo importar el CSV";
      setTabFeedback(currentTab, { error: message });
      toast.error(message);
    } finally {
      setImportingTab(null);
      event.target.value = "";
    }
  }

  async function importProveedoresCsv(file: File) {
    const rows = await parseCsv(file);
    const items = rows.map((row) => ({
      nombre: pickColumn(row, ["nombre"]),
      ruc_dni: pickColumn(row, ["ruc_dni", "ruc", "dni", "documento"]),
      contacto: pickColumn(row, ["contacto", "telefono", "email"]),
    }));

    const result = await sendBulk<TabKey, BulkResult>("proveedores", "/proveedores/bulk", items);
    handleBulkSuccess("proveedores", "Proveedores", result);
  }

  async function importCategoriasCsv(file: File) {
    const rows = await parseCsv(file);
    const items = rows.map((row) => ({
      nombre: pickColumn(row, ["nombre"]),
      tipo: normalizeCategoriaTipo(pickColumn(row, ["tipo"])),
    }));

    const result = await sendBulk<TabKey, BulkResult>("categorias", "/categorias/bulk", items);
    handleBulkSuccess("categorias", "Categorias", result);
  }

  async function importProductosCsv(file: File) {
    const rows = await parseCsv(file);
    const items = rows.map((row) => ({
      nombre: pickColumn(row, ["nombre"]),
      categoria: pickColumn(row, ["categoria", "categoria_nombre"]),
    }));

    const result = await sendBulk<TabKey, ProductBulkResult>("productos", "/productos/bulk", items);
    const skippedByCategory = result.skipped_missing_category?.length ?? 0;
    const message = `Productos importados: ${result.inserted}. Omitidos existentes: ${result.skipped_existing}. Omitidos sin categoria: ${skippedByCategory}.`;
    setTabFeedback("productos", { success: message });
    toast.success(message);
  }

  async function importTrabajadoresCsv(file: File) {
    const rows = await parseCsv(file);
    const items = rows.map((row) => ({
      nombre_completo: pickColumn(row, ["nombre_completo", "nombre", "trabajador"]),
      rol: normalizeTrabajadorRol(pickColumn(row, ["rol"])),
      dni: pickColumn(row, ["dni", "documento"]),
      telefono: pickColumn(row, ["telefono", "celular", "phone"]),
      correo: pickColumn(row, ["correo", "email", "mail"]),
    }));

    const result = await sendBulk<TabKey, BulkResult>("trabajadores", "/trabajadores/bulk", items);
    handleBulkSuccess("trabajadores", "Trabajadores", result);
  }

  async function sendBulk<T extends TabKey, TResult>(tabKey: T, path: string, items: Array<Record<string, string>>): Promise<TResult> {
    if (!items.length) {
      throw new Error("El archivo CSV no tiene filas para importar");
    }

    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message ?? `No se pudo importar ${tabLabels[tabKey].toLowerCase()}`);
    }

    return (await response.json()) as TResult;
  }

  function handleBulkSuccess(tabKey: TabKey, label: string, result: BulkResult) {
    const message = `${label} importados: ${result.inserted}. Omitidos existentes: ${result.skipped_existing}. Omitidos invalidos: ${result.skipped_invalid}.`;
    setTabFeedback(tabKey, { success: message });
    toast.success(message);
  }

  return (
    <section className="soft-enter rounded-3xl border border-sand-200 bg-white p-6 shadow-soft sm:p-8">
      <h2 className="text-xl font-semibold text-ink-950">Administracion de Catalogos</h2>
      <p className="mt-1 text-sm text-ink-600">CRUD para proveedores, categorias, productos y trabajadores.</p>
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onCsvSelected} />

      <div className="mt-5 grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          {(Object.keys(tabLabels) as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`w-full rounded-xl border px-4 py-2 text-left text-sm font-semibold transition ${
                tab === key
                  ? "border-sage-500 bg-sage-500 text-white"
                  : "border-sand-200 bg-sand-50 text-ink-700 hover:bg-sand-100"
              }`}
            >
              {tabLabels[key]}
            </button>
          ))}
        </aside>

        <div className="space-y-4">
          {activeFeedback.error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{activeFeedback.error}</p>}
          {activeFeedback.success && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{activeFeedback.success}</p>
          )}

          {tab === "proveedores" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input label="Nombre" value={proveedorForm.nombre} onChange={(v) => setProveedorForm((p) => ({ ...p, nombre: v }))} />
                <Input label="RUC/DNI" value={proveedorForm.ruc_dni} onChange={(v) => setProveedorForm((p) => ({ ...p, ruc_dni: v }))} />
                <Input label="Contacto" value={proveedorForm.contacto} onChange={(v) => setProveedorForm((p) => ({ ...p, contacto: v }))} />
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={saveProveedor}>{proveedorForm.id ? "Actualizar" : "Crear"}</ActionButton>
                <GhostButton onClick={() => setProveedorForm({ id: "", nombre: "", ruc_dni: "", contacto: "" })}>Limpiar</GhostButton>
                <GhostButton onClick={() => openCsvPicker("proveedores")}>Importar CSV</GhostButton>
              </div>
              <TableWrap loading={loading}>
                <table className="min-w-full text-sm">
                  <thead className="bg-sand-50 text-ink-700">
                    <tr>
                      <Th>Nombre</Th>
                      <Th>RUC/DNI</Th>
                      <Th>Contacto</Th>
                      <Th>Estado</Th>
                      <Th>Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((item) => (
                      <tr key={item.id} className="border-t border-sand-100">
                        <Td>{item.nombre}</Td>
                        <Td>{item.ruc_dni ?? "-"}</Td>
                        <Td>{item.contacto ?? "-"}</Td>
                        <Td>{item.activo ? "Activo" : "Inactivo"}</Td>
                        <Td>
                          <div className="flex gap-2">
                            <MiniButton
                              onClick={() =>
                                setProveedorForm({
                                  id: item.id,
                                  nombre: item.nombre,
                                  ruc_dni: item.ruc_dni ?? "",
                                  contacto: item.contacto ?? "",
                                })
                              }
                            >
                              Editar
                            </MiniButton>
                            {item.activo && <MiniButton onClick={() => void deactivate("proveedores", item.id)}>Desactivar</MiniButton>}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </>
          )}

          {tab === "categorias" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input label="Nombre" value={categoriaForm.nombre} onChange={(v) => setCategoriaForm((p) => ({ ...p, nombre: v }))} />
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink-700">Tipo</span>
                  <select
                    value={categoriaForm.tipo}
                    onChange={(e) => setCategoriaForm((p) => ({ ...p, tipo: e.target.value as CategoriaTipo }))}
                    className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
                  >
                    <option value="Insumo">Insumo</option>
                    <option value="Gasto Operativo">Gasto Operativo</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={saveCategoria}>{categoriaForm.id ? "Actualizar" : "Crear"}</ActionButton>
                <GhostButton onClick={() => setCategoriaForm({ id: "", nombre: "", tipo: "Insumo" })}>Limpiar</GhostButton>
                <GhostButton onClick={() => openCsvPicker("categorias")}>Importar CSV</GhostButton>
              </div>
              <TableWrap loading={loading}>
                <table className="min-w-full text-sm">
                  <thead className="bg-sand-50 text-ink-700">
                    <tr>
                      <Th>Nombre</Th>
                      <Th>Tipo</Th>
                      <Th>Estado</Th>
                      <Th>Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((item) => (
                      <tr key={item.id} className="border-t border-sand-100">
                        <Td>{item.nombre}</Td>
                        <Td>{item.tipo}</Td>
                        <Td>{item.activo ? "Activo" : "Inactivo"}</Td>
                        <Td>
                          <div className="flex gap-2">
                            <MiniButton onClick={() => setCategoriaForm({ id: item.id, nombre: item.nombre, tipo: item.tipo })}>Editar</MiniButton>
                            {item.activo && <MiniButton onClick={() => void deactivate("categorias", item.id)}>Desactivar</MiniButton>}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </>
          )}

          {tab === "productos" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input label="Nombre" value={productoForm.nombre} onChange={(v) => setProductoForm((p) => ({ ...p, nombre: v }))} />
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink-700">Categoria</span>
                  <select
                    value={productoForm.categoria_id}
                    onChange={(e) => setProductoForm((p) => ({ ...p, categoria_id: e.target.value }))}
                    className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
                  >
                    <option value="">Seleccionar</option>
                    {categorias
                      .filter((c) => c.activo)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={saveProducto}>{productoForm.id ? "Actualizar" : "Crear"}</ActionButton>
                <GhostButton onClick={() => setProductoForm({ id: "", nombre: "", categoria_id: "" })}>Limpiar</GhostButton>
                <GhostButton onClick={() => openCsvPicker("productos")}>Importar CSV</GhostButton>
              </div>
              <TableWrap loading={loading}>
                <table className="min-w-full text-sm">
                  <thead className="bg-sand-50 text-ink-700">
                    <tr>
                      <Th>Nombre</Th>
                      <Th>Categoria</Th>
                      <Th>Estado</Th>
                      <Th>Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((item) => (
                      <tr key={item.id} className="border-t border-sand-100">
                        <Td>{item.nombre}</Td>
                        <Td>{item.categoria_nombre ?? categoriaLookup.get(item.categoria_id) ?? "-"}</Td>
                        <Td>{item.activo ? "Activo" : "Inactivo"}</Td>
                        <Td>
                          <div className="flex gap-2">
                            <MiniButton
                              onClick={() =>
                                setProductoForm({
                                  id: item.id,
                                  nombre: item.nombre,
                                  categoria_id: item.categoria_id,
                                })
                              }
                            >
                              Editar
                            </MiniButton>
                            {item.activo && <MiniButton onClick={() => void deactivate("productos", item.id)}>Desactivar</MiniButton>}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </>
          )}

          {tab === "trabajadores" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Nombre Completo"
                  value={trabajadorForm.nombre_completo}
                  onChange={(v) => setTrabajadorForm((p) => ({ ...p, nombre_completo: v }))}
                />
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink-700">Rol</span>
                  <select
                    value={trabajadorForm.rol}
                    onChange={(e) => setTrabajadorForm((p) => ({ ...p, rol: e.target.value as TrabajadorRol }))}
                    className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
                  >
                    <option value="Cocina">Cocina</option>
                    <option value="Atencion">Atencion</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Administracion">Administracion</option>
                  </select>
                </label>
                <Input
                  label="DNI"
                  value={trabajadorForm.dni}
                  onChange={(v) => setTrabajadorForm((p) => ({ ...p, dni: v.slice(0, 8) }))}
                  maxLength={8}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Telefono"
                  value={trabajadorForm.telefono}
                  onChange={(v) => setTrabajadorForm((p) => ({ ...p, telefono: v }))}
                  type="tel"
                />
                <Input
                  label="Correo"
                  value={trabajadorForm.correo}
                  onChange={(v) => setTrabajadorForm((p) => ({ ...p, correo: v }))}
                  type="email"
                />
              </div>

              {/* ── Acceso al Sistema (solo al editar) ── */}
              {trabajadorForm.id && (
                <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">Acceso al Sistema</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-ink-700">Rol de Acceso</span>
                      <select
                        value={accessRol}
                        onChange={(e) => setAccessRol(e.target.value as RolAcceso)}
                        className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
                      >
                        <option value="TRABAJADOR">Trabajador</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-ink-700">Nueva Contrasena</span>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={accessPassword}
                          onChange={(e) => setAccessPassword(e.target.value)}
                          className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 pr-9 text-ink-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z" clipRule="evenodd" />
                              <path d="M10.748 13.93l2.523 2.523A9.987 9.987 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-ink-700">Confirmar Contrasena</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={accessConfirm}
                        onChange={(e) => setAccessConfirm(e.target.value)}
                        className={`w-full rounded-xl border bg-white px-3 py-2 text-ink-900 ${
                          accessConfirm && accessPassword !== accessConfirm
                            ? "border-red-400 focus:ring-red-400"
                            : "border-sand-200"
                        }`}
                      />
                      {accessConfirm && accessPassword !== accessConfirm && (
                        <span className="mt-1 block text-xs text-red-600">Las contrasenas no coinciden</span>
                      )}
                      {accessConfirm && accessPassword && accessPassword === accessConfirm && (
                        <span className="mt-1 block text-xs text-green-600">Contrasenas coinciden ✓</span>
                      )}
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={accessSaving || (!!accessPassword.trim() && accessPassword !== accessConfirm)}
                        onClick={() => void saveAccess()}
                        className="rounded-xl border border-sage-600 bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:opacity-50"
                      >
                        {accessSaving ? "Guardando..." : "Guardar Acceso"}
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const t = trabajadores.find((w) => w.id === trabajadorForm.id);
                    return t && !t.tiene_password ? (
                      <p className="mt-2 text-xs text-amber-700">Este trabajador aun no tiene contrasena configurada.</p>
                    ) : null;
                  })()}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={saveTrabajador}>{trabajadorForm.id ? "Actualizar" : "Crear"}</ActionButton>
                <GhostButton onClick={() => { setTrabajadorForm({ id: "", nombre_completo: "", rol: "Cocina", dni: "", telefono: "", correo: "" }); setAccessPassword(""); setAccessConfirm(""); setShowPassword(false); setAccessRol("TRABAJADOR"); }}>Limpiar</GhostButton>
                <GhostButton onClick={() => openCsvPicker("trabajadores")}>Importar CSV</GhostButton>
              </div>
              <TableWrap loading={loading}>
                <table className="min-w-full text-sm">
                  <thead className="bg-sand-50 text-ink-700">
                    <tr>
                      <Th>Nombre</Th>
                      <Th>DNI</Th>
                      <Th>Rol</Th>
                      <Th>Acceso</Th>
                      <Th>Telefono</Th>
                      <Th>Correo</Th>
                      <Th>Estado</Th>
                      <Th>Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {trabajadores.map((item) => (
                      <tr key={item.id} className="border-t border-sand-100">
                        <Td>{item.nombre_completo}</Td>
                        <Td>{item.dni}</Td>
                        <Td>{item.rol}</Td>
                        <Td>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            item.rol_acceso === "ADMIN"
                              ? "border border-amber-200 bg-amber-50 text-amber-800"
                              : "border border-sand-200 bg-sand-50 text-ink-600"
                          }`}>
                            {item.rol_acceso}
                          </span>
                          {!item.tiene_password && (
                            <span className="ml-1 text-[10px] text-amber-600" title="Sin contrasena">⚠</span>
                          )}
                        </Td>
                        <Td>{item.telefono ?? "-"}</Td>
                        <Td>{item.correo ?? "-"}</Td>
                        <Td>{item.activo ? "Activo" : "Inactivo"}</Td>
                        <Td>
                          <div className="flex gap-2">
                            <MiniButton
                              onClick={() => {
                                setTrabajadorForm({
                                  id: item.id,
                                  nombre_completo: item.nombre_completo,
                                  rol: item.rol,
                                  dni: item.dni,
                                  telefono: item.telefono ?? "",
                                  correo: item.correo ?? "",
                                });
                                setAccessRol(item.rol_acceso);
                                setAccessPassword("");
                                setAccessConfirm("");
                                setShowPassword(false);
                              }}
                            >
                              Editar
                            </MiniButton>
                            {item.activo && <MiniButton onClick={() => void deactivate("trabajadores", item.id)}>Desactivar</MiniButton>}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </>
          )}

          {tab === "ajustes" && <AjustesView />}
        </div>
      </div>

      <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: "Outfit, sans-serif", fontSize: "0.85rem" } }} />
    </section>
  );
}

function parseCsv(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error("El CSV tiene un formato invalido"));
          return;
        }

        const rows = (results.data ?? []).map((row) => normalizeRowHeaders(row));
        resolve(rows);
      },
      error: () => reject(new Error("No se pudo leer el archivo CSV")),
    });
  });
}

function normalizeRowHeaders(row: Record<string, string>) {
  const output: CsvRow = {};
  for (const [key, value] of Object.entries(row)) {
    output[normalizeHeader(key)] = typeof value === "string" ? value.trim() : "";
  }
  return output;
}

function normalizeHeader(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function pickColumn(row: CsvRow, candidates: string[]) {
  for (const candidate of candidates) {
    const key = normalizeHeader(candidate);
    const value = row[key];
    if (value) {
      return value;
    }
  }
  return "";
}

function normalizeCategoriaTipo(value: string): CategoriaTipo {
  const normalized = normalizeHeader(value);
  if (normalized === "gastooperativo") {
    return "Gasto Operativo";
  }
  return "Insumo";
}

function normalizeTrabajadorRol(value: string): TrabajadorRol {
  const normalized = normalizeHeader(value);
  if (normalized === "atencion") {
    return "Atencion";
  }
  if (normalized === "limpieza") {
    return "Limpieza";
  }
  if (normalized === "administracion") {
    return "Administracion";
  }
  return "Cocina";
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-ink-700">{label}</span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
      />
    </label>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 text-left font-semibold">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-3 py-2 text-ink-800">{children}</td>;
}

function ActionButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700">
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border border-sand-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-50">
      {children}
    </button>
  );
}

function MiniButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg border border-sand-200 px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-sand-50">
      {children}
    </button>
  );
}

function TableWrap({ loading, children }: { loading: boolean; children: ReactNode }) {
  if (loading) {
    return <p className="rounded-xl bg-sand-50 px-3 py-2 text-sm text-ink-700">Cargando...</p>;
  }

  return <div className="overflow-x-auto rounded-xl border border-sand-200">{children}</div>;
}
