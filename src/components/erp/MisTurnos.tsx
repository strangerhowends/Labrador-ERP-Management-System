import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { API_URL, type HorarioItem } from "./types";
import { authHeaders, useAuth } from "../../context/AuthContext";

const weekDays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const MONTH_NAMES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

interface DayCell {
  date: string;
  dayNumber: number;
  inMonth: boolean;
}

interface MyShift {
  hora_entrada: string;
  hora_salida: string | null;
  nombre_completo?: string;
  rol?: string;
  is_mine: boolean;
}

export function MisTurnos() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => new Date());
  const [shiftsByDate, setShiftsByDate] = useState<Record<string, MyShift[]>>({});
  const [visibilidadGlobal, setVisibilidadGlobal] = useState(false);

  const month = formatMonth(cursor);
  const monthLabel = cursor.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const days = useMemo(() => buildMonthGrid(cursor), [cursor]);

  useEffect(() => {
    void loadHorarios(month);
  }, [month]);

  async function loadHorarios(monthParam: string) {
    try {
      const res = await fetch(`${API_URL}/horarios?month=${monthParam}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        toast.error("No se pudieron cargar tus turnos");
        return;
      }

      const payload = (await res.json()) as { rows: HorarioItem[]; visibilidad_global: boolean };
      setVisibilidadGlobal(payload.visibilidad_global);

      const grouped: Record<string, MyShift[]> = {};

      for (const row of payload.rows) {
        const date = row.fecha.slice(0, 10);
        grouped[date] ??= [];
        grouped[date].push({
          hora_entrada: row.hora_entrada.slice(0, 5),
          hora_salida: row.hora_salida ? row.hora_salida.slice(0, 5) : null,
          nombre_completo: row.nombre_completo,
          rol: row.rol,
          is_mine: row.trabajador_id === user?.id,
        });
      }

      setShiftsByDate(grouped);
    } catch {
      toast.error("Error al cargar horarios");
    }
  }

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedShifts = selectedDate ? (shiftsByDate[selectedDate] ?? []) : [];
  const selectedTitle = useMemo(() => {
    if (!selectedDate) return "";
    const d = new Date(`${selectedDate}T00:00:00`);
    return `${DAY_NAMES_ES[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES_ES[d.getMonth()]}`;
  }, [selectedDate]);

  return (
    <>
      <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: "Outfit, sans-serif", fontSize: "0.85rem" } }} />

      <section className="soft-enter rounded-3xl border border-sand-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink-950">
              {visibilidadGlobal ? "Turnos del Equipo" : "Mis Turnos"}
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              {visibilidadGlobal
                ? "Horarios de todo el equipo. Tus turnos aparecen resaltados."
                : "Vista de tus horarios asignados."}
            </p>
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
                const shifts = shiftsByDate[cell.date] ?? [];
                const hasShifts = shifts.length > 0;

                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className={`h-28 rounded-2xl border p-2 text-left transition ${
                      hasShifts
                        ? "border-sage-300 bg-sage-50 hover:border-sage-500"
                        : "border-sand-200 bg-white hover:border-sand-300"
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-sage-600 text-white" : "text-ink-900"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    <div className="mt-1.5 space-y-1">
                      {shifts.slice(0, 2).map((s, i) => (
                        <span
                          key={i}
                          className={`block w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            s.is_mine
                              ? "border-sage-300 bg-sage-100 text-sage-900"
                              : "border-sand-200 bg-sand-50 text-ink-700"
                          }`}
                        >
                          {visibilidadGlobal && s.nombre_completo
                            ? `${s.nombre_completo.split(" ")[0]} ${s.hora_entrada}`
                            : `${s.hora_entrada}${s.hora_salida ? ` - ${s.hora_salida}` : ""}`}
                        </span>
                      ))}
                      {shifts.length > 2 && (
                        <span className="block w-fit rounded-full border border-sand-200 bg-sand-50 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                          +{shifts.length - 2} mas
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
        <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-5 shadow-soft soft-enter">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold capitalize text-ink-950">{selectedTitle}</h3>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-sm font-medium text-ink-500 hover:text-ink-800"
            >
              Cerrar
            </button>
          </div>

          {selectedShifts.length === 0 ? (
            <p className="mt-3 text-sm text-ink-600">No hay turnos asignados para este dia.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {selectedShifts.map((s, i) => (
                <div
                  key={i}
                  className={`rounded-xl border px-4 py-3 ${
                    s.is_mine
                      ? "border-sage-300 bg-sage-50"
                      : "border-sand-200 bg-sand-50"
                  }`}
                >
                  {visibilidadGlobal && s.nombre_completo && (
                    <p className="mb-1 text-xs font-semibold text-ink-600">
                      {s.nombre_completo} {s.rol ? `(${s.rol})` : ""}
                      {s.is_mine && <span className="ml-1 text-sage-700">— Tu turno</span>}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-sage-800">
                    Entrada: {s.hora_entrada}
                    {s.hora_salida ? ` — Salida: ${s.hora_salida}` : " (sin hora de salida)"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function formatMonth(date: Date) {
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}`;
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
