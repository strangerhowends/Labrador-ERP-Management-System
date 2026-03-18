import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { authHeaders } from "../../context/AuthContext";
import { API_URL } from "./types";

interface ConfigItem {
  id: string;
  clave: string;
  valor: string;
  tipo_dato: "BOOLEAN" | "NUMBER" | "STRING" | "JSON";
  descripcion: string | null;
}

const LABELS: Record<string, { title: string; hint: string }> = {
  visibilidad_horarios_global: {
    title: "Visibilidad de horarios entre trabajadores",
    hint: "Si esta activo, todos los trabajadores pueden ver el horario completo. Si esta desactivado, cada uno solo ve el suyo.",
  },
  horario_defecto_semana: {
    title: "Hora de entrada predeterminada (Lun-Vie)",
    hint: "Se usara como valor por defecto al crear turnos en dias de semana.",
  },
  horario_defecto_finde: {
    title: "Hora de entrada predeterminada (Sab-Dom)",
    hint: "Se usara como valor por defecto al crear turnos en fines de semana.",
  },
  pin_cierre_lote: {
    title: "PIN de Cierre de Lote",
    hint: "PIN requerido para confirmar el cierre de un lote de gastos.",
  },
};

export function AjustesView() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    void loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/configuraciones`, { headers: authHeaders() });
      if (!res.ok) throw new Error("No se pudieron cargar las configuraciones");
      const data = (await res.json()) as ConfigItem[];
      setConfigs(data);
      const initial: Record<string, string> = {};
      for (const c of data) initial[c.clave] = c.valor;
      setDraft(initial);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar configuraciones");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(clave: string, valor: string) {
    setDraft((prev) => ({ ...prev, [clave]: valor }));
  }

  const hasChanges = configs.some((c) => draft[c.clave] !== c.valor);

  async function handleSave() {
    const changed = configs
      .filter((c) => draft[c.clave] !== c.valor)
      .map((c) => ({ clave: c.clave, valor: draft[c.clave] }));

    if (changed.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/configuraciones`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(changed),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Error al guardar");
      }
      const data = (await res.json()) as ConfigItem[];
      setConfigs(data);
      const updated: Record<string, string> = {};
      for (const c of data) updated[c.clave] = c.valor;
      setDraft(updated);
      toast.success("Configuraciones guardadas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-ink-600">Cargando configuraciones...</p>;
  }

  const boolConfig = configs.find((c) => c.clave === "visibilidad_horarios_global");
  const semanaConfig = configs.find((c) => c.clave === "horario_defecto_semana");
  const findeConfig = configs.find((c) => c.clave === "horario_defecto_finde");
  const pinConfig = configs.find((c) => c.clave === "pin_cierre_lote");

  return (
    <div className="space-y-5">
      {/* ── Toggle: Visibilidad horarios ── */}
      {boolConfig && (
        <Card clave={boolConfig.clave}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">{LABELS[boolConfig.clave].title}</p>
              <p className="mt-0.5 text-xs text-ink-500">{LABELS[boolConfig.clave].hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft[boolConfig.clave] === "true"}
              onClick={() => updateDraft(boolConfig.clave, draft[boolConfig.clave] === "true" ? "false" : "true")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                draft[boolConfig.clave] === "true" ? "bg-sage-600" : "bg-sand-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                  draft[boolConfig.clave] === "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </Card>
      )}

      {/* ── Horarios por defecto ── */}
      <Card clave="horarios_defecto">
        <p className="text-sm font-semibold text-ink-900">Horarios de Entrada por Defecto</p>
        <p className="mt-0.5 text-xs text-ink-500">Se aplicaran como valor inicial al crear nuevos turnos.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {semanaConfig && (
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">{LABELS[semanaConfig.clave].title}</span>
              <input
                type="time"
                value={draft[semanaConfig.clave] ?? ""}
                onChange={(e) => updateDraft(semanaConfig.clave, e.target.value)}
                className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
              />
            </label>
          )}
          {findeConfig && (
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">{LABELS[findeConfig.clave].title}</span>
              <input
                type="time"
                value={draft[findeConfig.clave] ?? ""}
                onChange={(e) => updateDraft(findeConfig.clave, e.target.value)}
                className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-ink-900"
              />
            </label>
          )}
        </div>
      </Card>

      {/* ── PIN de cierre de lote ── */}
      {pinConfig && (
        <Card clave={pinConfig.clave}>
          <p className="text-sm font-semibold text-ink-900">{LABELS[pinConfig.clave].title}</p>
          <p className="mt-0.5 text-xs text-ink-500">{LABELS[pinConfig.clave].hint}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showPin ? "text" : "password"}
                value={draft[pinConfig.clave] ?? ""}
                onChange={(e) => updateDraft(pinConfig.clave, e.target.value)}
                maxLength={20}
                className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 pr-9 text-ink-900 font-mono tracking-widest"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPin((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              >
                {showPin ? (
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
          </div>
        </Card>
      )}

      {/* ── Floating Save Button ── */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="rounded-xl bg-sage-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-sage-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      )}
    </div>
  );
}

function Card({ children, clave }: { children: React.ReactNode; clave: string }) {
  return (
    <div key={clave} className="rounded-2xl border border-sand-200 bg-white p-5">
      {children}
    </div>
  );
}
