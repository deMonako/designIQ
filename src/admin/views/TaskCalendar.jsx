import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { isOverdue, TODAY } from "../mockData";

const DAYS_SHORT  = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nie"];
const MONTHS_PL   = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
const VIEW_LABELS = { month: "Miesiąc", week: "Tydzień", day: "Dzień" };

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); // Monday-first
  return d;
}

function TaskChip({ task, compact }) {
  const overdue = isOverdue(task.dueDate, task.status);
  const cls = overdue
    ? "bg-red-100 text-red-700"
    : task.status === "Zrobione"   ? "bg-green-100 text-green-700"
    : task.status === "W trakcie"  ? "bg-blue-100 text-blue-700"
    : "bg-slate-100 text-slate-600";
  if (compact) {
    return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${overdue ? "bg-red-500" : task.status === "Zrobione" ? "bg-green-500" : task.status === "W trakcie" ? "bg-blue-500" : "bg-slate-400"}`} />;
  }
  return (
    <div className={`text-[10px] leading-4 px-1 py-0.5 rounded truncate ${cls}`}>
      {task.title}
    </div>
  );
}

function DayTaskPanel({ dateStr, tasks, projects }) {
  const dayTasks = tasks.filter(t => t.dueDate === dateStr);
  const d = new Date(dateStr);
  const label = `${d.getDate()} ${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
  const isToday = dateStr === TODAY;

  return (
    <motion.div
      key={dateStr}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm"
    >
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <span className="font-semibold text-slate-900 text-sm">
          {isToday ? "Dziś" : label}
        </span>
        <span className="text-xs text-slate-400">({dayTasks.length} zadań)</span>
      </div>
      {dayTasks.length === 0 ? (
        <div className="px-5 py-6 text-center text-sm text-slate-400">Brak zadań na ten dzień</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {dayTasks.map(t => {
            const proj = projects.find(p => p.id === t.projectId);
            const overdue = isOverdue(t.dueDate, t.status);
            return (
              <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${overdue ? "bg-red-500" : t.status === "Zrobione" ? "bg-green-500" : t.status === "W trakcie" ? "bg-blue-500" : "bg-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${t.status === "Zrobione" ? "line-through text-slate-400" : "text-slate-800"}`}>{t.title}</div>
                  <div className="text-xs text-slate-400">{proj?.name ?? "Nieprzypisany"}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${overdue ? "bg-red-50 text-red-600 border border-red-200" : t.status === "Zrobione" ? "bg-green-50 text-green-700" : t.status === "W trakcie" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                  {t.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default function TaskCalendar({ tasks, projects }) {
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 2));
  const [selectedDay, setSelectedDay] = useState(TODAY);

  // ──────────────── Month view ────────────────
  const monthGrid = useMemo(() => {
    const year  = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const offset   = firstDow === 0 ? 6 : firstDow - 1;
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr, dayTasks: tasks.filter(t => t.dueDate === dateStr) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return { year, month, cells };
  }, [currentDate, tasks]);

  // ──────────────── Week view ────────────────
  const weekDays = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const dateStr = toDateStr(d);
      return { date: d, dateStr, dayTasks: tasks.filter(t => t.dueDate === dateStr) };
    });
  }, [currentDate, tasks]);

  // ──────────────── Navigation ────────────────
  const nav = {
    prev: () => {
      if (view === "month") setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
      if (view === "week")  setCurrentDate(d => addDays(d, -7));
      if (view === "day")   { const d = addDays(new Date(selectedDay), -1); setSelectedDay(toDateStr(d)); setCurrentDate(d); }
    },
    next: () => {
      if (view === "month") setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
      if (view === "week")  setCurrentDate(d => addDays(d, 7));
      if (view === "day")   { const d = addDays(new Date(selectedDay), 1); setSelectedDay(toDateStr(d)); setCurrentDate(d); }
    },
    today: () => { setCurrentDate(new Date(TODAY)); setSelectedDay(TODAY); },
  };

  const weekStart = getWeekStart(currentDate);
  const weekEnd   = addDays(weekStart, 6);

  const navLabel = {
    month: `${MONTHS_PL[monthGrid.month]} ${monthGrid.year}`,
    week:  `${weekStart.getDate()} – ${weekEnd.getDate()} ${MONTHS_PL[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`,
    day:   (() => { const d = new Date(selectedDay); return `${d.getDate()} ${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`; })(),
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* View tabs */}
        <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
          {["month", "week", "day"].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={nav.today} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
            Dziś
          </button>
          <div className="flex items-center">
            <button onClick={nav.prev} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-sm font-semibold text-slate-900 px-2 min-w-[180px] text-center">{navLabel[view]}</span>
            <button onClick={nav.next} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Month View ── */}
      {view === "month" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {DAYS_SHORT.map(d => (
              <div key={d} className="py-2 text-xs font-semibold text-slate-500 text-center">{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7">
            {monthGrid.cells.map((cell, idx) => {
              if (!cell) return (
                <div key={`e-${idx}`} className="min-h-[90px] border-b border-r border-slate-100 bg-slate-50/50" />
              );
              const isToday    = cell.dateStr === TODAY;
              const isSelected = cell.dateStr === selectedDay;
              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDay(cell.dateStr)}
                  className={`min-h-[90px] border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors ${isSelected ? "bg-orange-50" : "hover:bg-slate-50"}`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1 ${isToday ? "bg-orange-500 text-white" : "text-slate-700"}`}>
                    {cell.day}
                  </div>
                  <div className="space-y-0.5">
                    {cell.dayTasks.slice(0, 3).map(t => (
                      <TaskChip key={t.id} task={t} />
                    ))}
                    {cell.dayTasks.length > 3 && (
                      <div className="text-[10px] text-slate-400 pl-0.5">+{cell.dayTasks.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Week View ── */}
      {view === "week" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-slate-200">
            {weekDays.map((wd, i) => {
              const isToday    = wd.dateStr === TODAY;
              const isSelected = wd.dateStr === selectedDay;
              return (
                <div key={wd.dateStr} className={`min-h-[240px] ${isToday ? "bg-orange-50/40" : ""}`}>
                  {/* Header */}
                  <div
                    onClick={() => setSelectedDay(wd.dateStr)}
                    className={`px-1 py-2 text-center border-b border-slate-200 cursor-pointer hover:bg-slate-50 ${isSelected ? "bg-orange-100/60" : ""}`}
                  >
                    <div className="text-[11px] text-slate-500 font-medium">{DAYS_SHORT[i]}</div>
                    <div className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-orange-500 text-white" : "text-slate-800"}`}>
                      {wd.date.getDate()}
                    </div>
                  </div>
                  {/* Tasks */}
                  <div className="p-1 space-y-0.5">
                    {wd.dayTasks.slice(0, 6).map(t => {
                      const overdue = isOverdue(t.dueDate, t.status);
                      return (
                        <div key={t.id} className={`text-[11px] px-1.5 py-1 rounded truncate leading-4 ${overdue ? "bg-red-100 text-red-700" : t.status === "Zrobione" ? "bg-green-100 text-green-700" : t.status === "W trakcie" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                          {t.title}
                        </div>
                      );
                    })}
                    {wd.dayTasks.length > 6 && (
                      <div className="text-[10px] text-slate-400 px-1.5">+{wd.dayTasks.length - 6}</div>
                    )}
                    {wd.dayTasks.length === 0 && (
                      <div className="text-[11px] text-slate-300 text-center pt-4">—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Day View ── */}
      {view === "day" && (() => {
        const dayTasks = tasks.filter(t => t.dueDate === selectedDay);
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            {dayTasks.length === 0 ? (
              <div className="py-16 text-center">
                <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <div className="text-sm text-slate-400">Brak zadań na ten dzień</div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dayTasks.map(t => {
                  const proj   = projects.find(p => p.id === t.projectId);
                  const overdue = isOverdue(t.dueDate, t.status);
                  return (
                    <div key={t.id} className={`px-5 py-4 ${overdue ? "bg-red-50/30" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${t.status === "Zrobione" ? "line-through text-slate-400" : "text-slate-800"}`}>{t.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{proj?.name ?? "Nieprzypisany"}</div>
                          {t.description && <div className="text-xs text-slate-500 mt-1">{t.description}</div>}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${overdue ? "bg-red-50 text-red-600 border border-red-200" : t.status === "Zrobione" ? "bg-green-50 text-green-700" : t.status === "W trakcie" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                            {t.status}
                          </span>
                          <span className="text-xs text-slate-400">{t.priority}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Shared: selected day panel (month & week) ── */}
      {view !== "day" && (
        <AnimatePresence mode="wait">
          <DayTaskPanel key={selectedDay} dateStr={selectedDay} tasks={tasks} projects={projects} />
        </AnimatePresence>
      )}
    </div>
  );
}
