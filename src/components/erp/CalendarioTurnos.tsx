import { useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { authHeaders } from "../../context/AuthContext";
import { API_URL, type HorarioAsignacionInput, type HorarioItem, type Trabajador } from "./types";

const weekDays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const MONTH_NAMES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

type SectionRole = "Cocina" | "Atencion";

interface DayAssignmentRow {
  rowId: string;
  trabajador_id: string;
  hora_entrada: string;
  hora_salida: string;
  rol: SectionRole;
}

interface DayCell {
  date: string;
  dayNumber: number;
  inMonth: boolean;
}

const ROLE_SECTIONS: Array<{ role: SectionRole; label: string; tone: string }> = [
  { role: "Cocina", label: "Personal de Cocina", tone: "border-amber-200 bg-amber-50 text-amber-800" },
  { role: "Atencion", label: "Personal de Atencion (Meseros)", tone: "border-sky-200 bg-sky-50 text-sky-800" },
];

export function CalendarioTurnos() {
  const [cursor, setCursor] = useState(() => new Date());
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [asignacionesPorDia, setAsignacionesPorDia] = useState<Record<string, DayAssignmentRow[]>>({});
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const month = formatMonth(cursor);
  const monthLabel = cursor.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const days = useMemo(() => buildMonthGrid(cursor), [cursor]);

  const cocinaWorkers = useMemo(() => trabajadores.filter((w) => w.rol === "Cocina"), [trabajadores]);
  const atencionWorkers = useMemo(() => trabajadores.filter((w) => w.rol === "Atencion"), [trabajadores]);
  const workerNameById = useMemo(() => {
    const map = new Map<string, string>();
    trabajadores.forEach((worker) => map.set(worker.id, worker.nombre_completo));
    return map;
  }, [trabajadores]);

  useEffect(() => {
    void loadTrabajadores();
  }, []);

  useEffect(() => {
    void loadHorarios(month);
  }, [month]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (selectedDate && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setSelectedDate(null);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedDate(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedDate]);

  async function loadTrabajadores() {
    const res = await fetch(`${API_URL}/trabajadores`, { headers: authHeaders() });
    if (!res.ok) {
      toast.error("No se pudieron cargar trabajadores");
      return;
    }

    const payload = (await res.json()) as Trabajador[];
    setTrabajadores(payload.filter((w) => w.activo));
  }

  async function loadHorarios(monthParam: string) {
    const res = await fetch(`${API_URL}/horarios?month=${monthParam}`, { headers: authHeaders() });
    if (!res.ok) {
      toast.error("No se pudo cargar el calendario de turnos");
      return;
    }

    const payload = (await res.json()) as { rows: HorarioItem[]; visibilidad_global: boolean };
    const rows = payload.rows;
    const grouped: Record<string, DayAssignmentRow[]> = {};

    for (const row of rows) {
      const date = row.fecha.slice(0, 10);
      grouped[date] ??= [];
      grouped[date].push({
        rowId: row.id,
        trabajador_id: row.trabajador_id,
        hora_entrada: normalizeTime(row.hora_entrada),
        hora_salida: row.hora_salida ? normalizeTime(row.hora_salida) : "",
        rol: row.rol === "Cocina" ? "Cocina" : "Atencion",
      });
    }

    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.hora_entrada.localeCompare(b.hora_entrada));
    });

    setAsignacionesPorDia(grouped);
  }

  function getRowsForSection(date: string, role: SectionRole) {
    return (asignacionesPorDia[date] ?? []).filter((row) => row.rol === role);
  }

  async function persistDay(date: string, nextRows: DayAssignmentRow[]) {
    setSavingDate(date);

    const payload: HorarioAsignacionInput[] = nextRows
      .filter((row) => row.trabajador_id && row.hora_entrada)
      .map((row) => ({
        trabajador_id: row.trabajador_id,
        hora_entrada: row.hora_entrada,
        hora_salida: row.hora_salida || null,
      }));

    try {
      const res = await fetch(`${API_URL}/horarios`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ fecha: date, asignaciones: payload }),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar");
      }

      toast.success("Turnos actualizados", { duration: 1500 });
    } catch {
      toast.error("No se pudo guardar la programacion");
      void loadHorarios(month);
    } finally {
      setSavingDate(null);
    }
  }

  function addWorkerRow(date: string, role: SectionRole) {
    const current = asignacionesPorDia[date] ?? [];
    const availableWorkers = role === "Cocina" ? cocinaWorkers : atencionWorkers;
    const defaultWorkerId = availableWorkers[0]?.id ?? "";

    const nextRows = [
      ...current,
      {
        rowId: crypto.randomUUID(),
        trabajador_id: defaultWorkerId,
        hora_entrada: getDefaultHourForDate(date),
        hora_salida: "",
        rol: role,
      },
    ];

    setAsignacionesPorDia((prev) => ({ ...prev, [date]: nextRows }));
    void persistDay(date, nextRows);
  }

  function updateRow(date: string, rowId: string, field: "trabajador_id" | "hora_entrada" | "hora_salida", value: string) {
    const current = asignacionesPorDia[date] ?? [];
    const nextRows = current.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row));
    setAsignacionesPorDia((prev) => ({ ...prev, [date]: nextRows }));
    void persistDay(date, nextRows);
  }

  function removeRow(date: string, rowId: string) {
    const current = asignacionesPorDia[date] ?? [];
    const nextRows = current.filter((row) => row.rowId !== rowId);
    setAsignacionesPorDia((prev) => ({ ...prev, [date]: nextRows }));
    void persistDay(date, nextRows);
  }

  const drawerTitle = useMemo(() => {
    if (!selectedDate) return "";
    const d = new Date(`${selectedDate}T00:00:00`);
    return `Programacion de Turnos - ${DAY_NAMES_ES[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES_ES[d.getMonth()]}`;
  }, [selectedDate]);

  return (
    <>
      <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: "Outfit, sans-serif", fontSize: "0.85rem" } }} />

      <section className="soft-enter rounded-3xl border border-sand-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink-950">Calendario de Turnos</h2>
            <p className="mt-1 text-sm text-ink-600">Haz clic en el dia para gestionar horarios flexibles.</p>
          </div>

          <div className="inline-flex rounded-xl border border-sand-200 bg-sand-50 p-1">
            <button
              type="button"
              onClick={() => setCursor((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
              className="rounded-lg px-3 py-1 text-sm font-semibold text-ink-700 hover:bg-white"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm font-semibold capitalize text-ink-900">{monthLabel}</span>
            <button
              type="button"
              onClick={() => setCursor((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
              className="rounded-lg px-3 py-1 text-sm font-semibold text-ink-700 hover:bg-white"
            >
              Siguiente
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((d) => (
                <div key={d} className="rounded-xl bg-sand-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-ink-700">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {days.map((cell, idx) => {
                if (!cell.inMonth) {
                  return <div key={`blank-${idx}`} className="h-28 rounded-2xl border border-sand-100 bg-sand-50/70" />;
                }

                const isToday = cell.date === new Date().toISOString().slice(0, 10);
                const rows = (asignacionesPorDia[cell.date] ?? []).slice().sort((a, b) => a.hora_entrada.localeCompare(b.hora_entrada));
                const previewRows = rows.length > 3 ? rows.slice(0, 2) : rows;
                const extraCount = rows.length > 3 ? rows.length - 2 : 0;

                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className="h-28 rounded-2xl border border-sand-200 bg-white p-2 text-left transition hover:border-sage-500 hover:shadow-sm"
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-sage-600 text-white" : "text-ink-900"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    <div className="mt-1.5 space-y-1">
                      {previewRows.map((row) => {
                        const fullName = workerNameById.get(row.trabajador_id) ?? "Sin nombre";
                        const firstName = fullName.trim().split(" ")[0] ?? fullName;
                        return (
                          <span key={row.rowId} className="block w-fit rounded-full border border-sand-200 bg-sand-50 px-2 py-0.5 text-[10px] font-medium text-ink-700">
                            {firstName} {row.hora_entrada}
                          </span>
                        );
                      })}
                      {extraCount > 0 && (
                        <span className="block w-fit rounded-full border border-sand-200 bg-sand-50 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                          +{extraCount} mas
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {selectedDate && (
        <div className="fixed inset-0 z-40 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={() => setSelectedDate(null)} />

          <aside
            ref={drawerRef}
            className="relative z-50 flex h-full w-full flex-col overflow-y-auto border-l border-sand-200 bg-white shadow-2xl sm:max-w-md"
          >
            <header className="sticky top-0 border-b border-sand-200 bg-white/95 px-6 py-4 backdrop-blur">
              <h3 className="text-base font-semibold text-ink-950">{drawerTitle}</h3>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="absolute right-4 top-3 rounded-full px-2 py-1 text-sm text-ink-500 hover:bg-sand-100"
              >
                Cerrar
              </button>
              {savingDate === selectedDate && <p className="mt-1 text-xs text-sage-700">Guardando cambios...</p>}
            </header>

            <div className="space-y-6 p-6">
              {ROLE_SECTIONS.map((section) => {
                const sectionRows = getRowsForSection(selectedDate, section.role);
                const workers = section.role === "Cocina" ? cocinaWorkers : atencionWorkers;

                return (
                  <section key={section.role}>
                    <div className={`mb-3 rounded-xl border px-3 py-2 ${section.tone}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em]">{section.label}</p>
                    </div>

                    <div className="space-y-3">
                      {sectionRows.map((row) => (
                        <div key={row.rowId} className="grid grid-cols-[1fr_110px_auto] items-center gap-2">
                          <select
                            value={row.trabajador_id}
                            onChange={(e) => updateRow(selectedDate, row.rowId, "trabajador_id", e.target.value)}
                            className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm text-ink-900"
                          >
                            <option value="">Seleccionar trabajador</option>
                            {workers.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {worker.nombre_completo}
                              </option>
                            ))}
                          </select>

                          <input
                            type="time"
                            value={row.hora_entrada}
                            onChange={(e) => updateRow(selectedDate, row.rowId, "hora_entrada", e.target.value)}
                            className="rounded-xl border border-sand-200 bg-white px-2 py-2 text-sm text-ink-900"
                          />

                          <button
                            type="button"
                            onClick={() => removeRow(selectedDate, row.rowId)}
                            className="rounded-lg border border-sand-200 px-2 py-2 text-xs font-semibold text-ink-600 hover:bg-sand-50"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addWorkerRow(selectedDate, section.role)}
                      className="mt-3 rounded-xl border border-sand-200 px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-50"
                    >
                      Asignar Trabajador
                    </button>
                  </section>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function getDefaultHourForDate(date: string) {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 || day === 6 ? "11:00" : "13:00";
}

function normalizeTime(timeValue: string) {
  return timeValue.slice(0, 5);
}

function formatMonth(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function buildMonthGrid(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  const cells: DayCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);

    cells.push({
      date: current.toISOString().slice(0, 10),
      dayNumber: current.getDate(),
      inMonth: current.getMonth() === month,
    });
  }

  return cells;
}
