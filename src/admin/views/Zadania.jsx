import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ChevronLeft, ChevronRight, Calendar, CheckCircle2,
  AlertTriangle, X, Edit2, Flag,
} from "lucide-react";
import { isOverdue, TODAY } from "../mockData";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DAY_NAMES       = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const DAY_NAMES_FULL  = ["Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota","Niedziela"];
const MONTH_NAMES     = ["stycznia","lutego","marca","kwietnia","maja","czerwca",
                         "lipca","sierpnia","września","października","listopada","grudnia"];
const MONTHS_FULL     = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
                         "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells  = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const grid = [];
  for (let i = 0; i < totalCells; i++) {
    grid.push(new Date(year, month, 1 - startPad + i));
  }
  return grid;
}

function formatWeekLabel(days) {
  const first = days[0], last = days[6];
  if (first.getMonth() === last.getMonth())
    return `${first.getDate()}–${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
  return `${first.getDate()} ${MONTH_NAMES[first.getMonth()]} – ${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
}

function formatMonthLabel(date) {
  return `${MONTHS_FULL[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDayLabel(dateStr) {
  const date = parseDate(dateStr);
  const di   = date.getDay();
  const ni   = di === 0 ? 6 : di - 1;
  return `${DAY_NAMES_FULL[ni]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Stałe ────────────────────────────────────────────────────────────────────

const PRIORITY_ORDER  = { "Krytyczny": 0, "Wysoki": 1, "Normalny": 2, "Niski": 3 };
const PRIORITY_OPTIONS = ["Niski", "Normalny", "Wysoki", "Krytyczny"];

// ─── PriorityBadge — neutralny szary, priorytet nie zmienia koloru ────────────

function PriorityBadge({ priority }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
      {priority}
    </span>
  );
}

// ─── TaskCard (karta w kolumnie dnia – widok tygodnia) ────────────────────────

function TaskCard({ task, project, isSelected, onClick }) {
  const overdue = isOverdue(task.dueDate, task.status);
  const isDone  = task.status === "Zrobione";
  const isEvent = task.type === "event";

  // Kolor bazuje TYLKO na typie (zadanie=pomarańczowy, wydarzenie=fioletowy)
  // Priorytet nie wpływa na kolor — tylko na kolejność sortowania
  const bg = isSelected
    ? "bg-orange-50 border-orange-300 ring-1 ring-orange-200"
    : isDone
      ? "bg-slate-50 border-slate-200 hover:border-slate-300"
      : isEvent
        ? "bg-violet-50 border-violet-200 hover:border-violet-300"
        : "bg-white border-slate-200 hover:border-orange-200";

  const accent = isSelected
    ? "border-l-2 border-l-orange-500"
    : isDone
      ? "border-l-2 border-l-slate-200"
      : isEvent
        ? "border-l-2 border-l-violet-500"
        : "border-l-2 border-l-orange-300";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`px-2 py-1.5 rounded-md border text-xs cursor-pointer transition-all hover:shadow-sm ${bg} ${accent} select-none`}
    >
      <div className="flex items-start gap-1.5 min-w-0">
        {isEvent
          ? <Calendar className="w-3 h-3 text-violet-500 flex-shrink-0 mt-px" />
          : <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1 bg-orange-400" />
        }
        <div className="min-w-0 flex-1">
          <div className={`font-medium leading-snug line-clamp-2 ${
            isDone ? "line-through text-slate-400" : isEvent ? "text-violet-800" : "text-slate-700"
          }`}>{task.title}</div>
          {project && <div className="text-slate-400 truncate mt-0.5 leading-none">{project.name}</div>}
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-0.5">
          {isDone  && <CheckCircle2 className="w-3 h-3 text-green-500" />}
          {overdue && !isDone && <AlertTriangle className="w-3 h-3 text-red-400" />}
        </div>
      </div>
    </motion.div>
  );
}

// ─── DayColumn (pionowy pasek – widok tygodnia) ───────────────────────────────

function DayColumn({ date, tasks, projects, selectedTaskId, onTaskClick }) {
  const dateStr   = formatYMD(date);
  const isToday   = dateStr === TODAY;
  const dayIndex  = date.getDay();
  const normIdx   = dayIndex === 0 ? 6 : dayIndex - 1;
  const isWeekend = normIdx >= 5;

  const sorted = [...tasks].sort((a, b) => {
    if (a.type === "event" && b.type !== "event") return -1;
    if (a.type !== "event" && b.type === "event") return 1;
    return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
  });

  return (
    <div className={`flex flex-col border-r border-slate-200 last:border-r-0 min-h-[640px] ${
      isWeekend ? "bg-slate-50/60" : "bg-white"
    }`}>
      {/* Nagłówek dnia */}
      <div className={`px-1 py-2.5 border-b text-center ${
        isToday ? "bg-brand-orange border-brand-orange" : isWeekend ? "bg-slate-100/80 border-slate-200" : "bg-slate-50 border-slate-200"
      }`}>
        <div className={`text-[10px] font-semibold uppercase tracking-widest ${isToday ? "text-orange-100" : "text-slate-400"}`}>
          {DAY_NAMES[normIdx]}
        </div>
        <div className={`text-2xl font-bold leading-tight tabular-nums ${isToday ? "text-white" : "text-slate-700"}`}>
          {date.getDate()}
        </div>
        <div className={`text-[10px] h-4 ${isToday ? "text-orange-200" : "text-slate-300"}`}>
          {tasks.length > 0 ? tasks.length : ""}
        </div>
      </div>

      {/* Zadania */}
      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
        {sorted.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            project={projects.find(p => p.id === task.projectId)}
            isSelected={selectedTaskId === task.id}
            onClick={() => onTaskClick(task)}
          />
        ))}
        {sorted.length === 0 && (
          <div className="text-center pt-6 text-slate-200 text-xs select-none">—</div>
        )}
      </div>
    </div>
  );
}

// ─── MonthDayCell (komórka dnia – widok miesiąca) ─────────────────────────────

const MAX_TASK_DOTS = 5;

function MonthDayCell({ date, tasks, isSelected, isCurrentMonth, onDayClick }) {
  const dateStr   = formatYMD(date);
  const isToday   = dateStr === TODAY;
  const dayIndex  = date.getDay();
  const normIdx   = dayIndex === 0 ? 6 : dayIndex - 1;
  const isWeekend = normIdx >= 5;

  const events       = tasks.filter(t => t.type === "event");
  const regularTasks = [...tasks.filter(t => t.type !== "event")]
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

  const dotsToShow = regularTasks.slice(0, MAX_TASK_DOTS);
  const extraCount = regularTasks.length - MAX_TASK_DOTS;

  return (
    <button
      onClick={() => onDayClick(dateStr)}
      className={`relative p-1.5 flex flex-col min-h-[90px] text-left w-full border-r border-b border-slate-100 last:border-r-0 transition-all group ${
        !isCurrentMonth ? "bg-slate-50/60" : isWeekend ? "bg-slate-50/40" : "bg-white"
      } ${isSelected ? "ring-2 ring-inset ring-orange-400 bg-orange-50/30" : "hover:bg-slate-50"}
      ${isToday && !isSelected ? "bg-orange-50/40" : ""}`}
    >
      {/* Numer dnia */}
      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1 flex-shrink-0 ${
        isToday
          ? "bg-brand-orange text-white"
          : !isCurrentMonth
            ? "text-slate-300"
            : isWeekend
              ? "text-slate-400"
              : "text-slate-700 group-hover:text-slate-900"
      }`}>
        {date.getDate()}
      </span>

      {/* Kropki zadań — zawsze pomarańczowe (priorytet nie zmienia koloru) */}
      {dotsToShow.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mb-0.5">
          {dotsToShow.map(task => (
            <span
              key={task.id}
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                task.status === "Zrobione" ? "bg-slate-300" : "bg-orange-400"
              }`}
              title={task.title}
            />
          ))}
          {extraCount > 0 && (
            <span className="text-[9px] text-slate-400 font-semibold leading-tight">+{extraCount}</span>
          )}
        </div>
      )}

      {/* Kropka/licznik wydarzeń — zawsze fioletowa */}
      {events.length > 0 && (
        <div className="flex items-center gap-0.5 mt-auto">
          <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
          {events.length > 1 && (
            <span className="text-[9px] text-violet-500 font-semibold leading-none">{events.length}</span>
          )}
        </div>
      )}
    </button>
  );
}

// ─── MonthGrid (siatka miesiąca) ──────────────────────────────────────────────

function MonthGrid({ year, month, tasksByDate, selectedDay, onDayClick }) {
  const grid = getMonthGrid(year, month);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Nagłówki dni tygodnia */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAY_NAMES.map((name, i) => (
          <div key={name} className={`py-2 text-center text-[11px] font-semibold uppercase tracking-wider border-r last:border-r-0 border-slate-200 ${
            i >= 5 ? "text-slate-400 bg-slate-50" : "text-slate-500"
          }`}>
            {name}
          </div>
        ))}
      </div>
      {/* Komórki */}
      <div className="grid grid-cols-7">
        {grid.map(date => {
          const dateStr = formatYMD(date);
          return (
            <MonthDayCell
              key={dateStr}
              date={date}
              tasks={tasksByDate[dateStr] ?? []}
              isSelected={selectedDay === dateStr}
              isCurrentMonth={date.getMonth() === month}
              onDayClick={onDayClick}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── DayDetailPanel (panel dnia – widok miesiąca) ─────────────────────────────

function DayDetailPanel({ dateStr, tasks, projects, onTaskClick, onClose, onAdd }) {
  const events       = tasks.filter(t => t.type === "event");
  const regularTasks = [...tasks.filter(t => t.type !== "event")]
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
  const all = [...events, ...regularTasks];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.16 }}
      className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden"
    >
      {/* Nagłówek */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">{formatDayLabel(dateStr)}</span>
          {events.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-600 font-medium px-2 py-0.5 rounded-full">
              <Calendar className="w-3 h-3" />{events.length} {events.length === 1 ? "wydarzenie" : "wydarzenia"}
            </span>
          )}
          <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">
            {regularTasks.length} {regularTasks.length === 1 ? "zadanie" : regularTasks.length < 5 ? "zadania" : "zadań"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
          >
            <Plus className="w-3 h-3" /> Dodaj
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista */}
      {all.length === 0 ? (
        <div className="px-4 py-5 text-center text-slate-300 text-sm select-none">
          Brak zadań i wydarzeń w tym dniu
        </div>
      ) : (
        <div className="px-3 py-2.5 flex flex-wrap gap-2">
          {all.map(task => {
            const isEvent = task.type === "event";
            const overdue = isOverdue(task.dueDate, task.status);
            const isDone  = task.status === "Zrobione";
            return (
              <button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all hover:shadow-sm ${
                  isEvent
                    ? "bg-violet-50 border-violet-200 hover:border-violet-400"
                    : isDone
                      ? "bg-slate-50 border-slate-200 hover:border-slate-300"
                      : "bg-white border-slate-200 hover:border-orange-300"
                }`}
              >
                {isEvent
                  ? <Calendar className="w-3 h-3 text-violet-500 flex-shrink-0" />
                  : <span className="w-2 h-2 rounded-full flex-shrink-0 bg-orange-400" />
                }
                <span className={`font-medium max-w-[200px] truncate ${
                  isDone ? "line-through text-slate-400" : isEvent ? "text-violet-800" : "text-slate-700"
                }`}>
                  {task.title}
                </span>
                {!isEvent && <PriorityBadge priority={task.priority} />}
                {overdue && !isDone && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                {isDone && <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── TaskDetailPanel (panel zadania – poziomy, pod siatką) ────────────────────

function TaskDetailPanel({ task, project, onClose, onStatusChange, onEdit }) {
  const overdue = isOverdue(task.dueDate, task.status);
  const isDone  = task.status === "Zrobione";
  const isEvent = task.type === "event";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.16 }}
      className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden"
    >
      {/* Pasek nagłówka */}
      <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 ${isEvent ? "bg-violet-50/60" : ""}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isEvent ? "bg-violet-100" : "bg-orange-100"}`}>
          {isEvent
            ? <Calendar className="w-3.5 h-3.5 text-violet-600" />
            : <Flag className="w-3.5 h-3.5 text-orange-600" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-none mb-0.5">
            {isEvent ? "Wydarzenie" : "Zadanie"}
          </div>
          <h3 className={`text-sm font-semibold leading-tight truncate ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}>
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onStatusChange(task.id, isDone ? "Niezrobione" : "Zrobione")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              isDone
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-green-500 text-white hover:bg-green-600 shadow-sm"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isDone ? "Cofnij" : "Zrobione"}
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all whitespace-nowrap"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edytuj
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Treść: meta + opis */}
      <div className="px-4 py-2.5 flex flex-wrap items-start gap-x-6 gap-y-2">
        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 items-center">
          {!isEvent && <PriorityBadge priority={task.priority} />}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isDone ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-100 text-slate-600"
          }`}>
            {isDone && <CheckCircle2 className="w-3 h-3" />}
            {task.status}
          </span>
          <span className={`flex items-center gap-1 text-xs font-medium ${
            overdue ? "text-red-500" : isDone ? "text-green-600" : "text-slate-500"
          }`}>
            {overdue && <AlertTriangle className="w-3 h-3" />}
            <Calendar className="w-3 h-3 opacity-60" />
            {task.dueDate === TODAY ? "Dziś" : task.dueDate}
          </span>
          {project && (
            <span className="text-xs text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200 max-w-[180px] truncate">
              {project.name}
            </span>
          )}
        </div>

        {/* Opis */}
        {task.description && (
          <p className="text-xs text-slate-500 leading-relaxed flex-1 min-w-[180px]">
            {task.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── TaskModal (dodawanie / edycja) ───────────────────────────────────────────

function TaskModal({ projects, task, defaultDate, onSave, onClose }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title:       task?.title       ?? "",
    projectId:   task?.projectId   ?? "none",
    priority:    task?.priority    ?? "Normalny",
    dueDate:     task?.dueDate     ?? defaultDate ?? TODAY,
    description: task?.description ?? "",
    type:        task?.type        ?? "task",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...(task ?? {}),
      ...form,
      id:        task?.id       ?? `t-${Date.now()}`,
      status:    task?.status   ?? "Niezrobione",
      assignee:  task?.assignee ?? "Adam",
      projectId: form.projectId === "none" ? null : form.projectId,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{    scale: 0.96, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {isEdit ? "Edytuj" : "Nowe"} {form.type === "event" ? "wydarzenie" : "zadanie"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-2">
            {[
              { value: "task",  label: "Zadanie",    icon: <Flag className="w-3.5 h-3.5" /> },
              { value: "event", label: "Wydarzenie", icon: <Calendar className="w-3.5 h-3.5" /> },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("type", opt.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-all ${
                  form.type === opt.value
                    ? opt.value === "event"
                      ? "bg-violet-50 border-violet-400 text-violet-700"
                      : "bg-orange-50 border-orange-400 text-orange-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Tytuł *</label>
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder={form.type === "event" ? "Nazwa wydarzenia…" : "Nazwa zadania…"}
              required autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={form.type === "task" ? "" : "col-span-2"}>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Projekt</label>
              <select
                value={form.projectId}
                onChange={e => set("projectId", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="none">— Nieprzypisany —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {form.type === "task" && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Priorytet</label>
                <select
                  value={form.priority}
                  onChange={e => set("priority", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Termin</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => set("dueDate", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Opis</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Opcjonalny opis…"
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
            >
              {isEdit ? "Zapisz zmiany" : "Dodaj"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Główny komponent ─────────────────────────────────────────────────────────

export default function Zadania({ projects, tasks, onUpdateTask, onAddTask }) {
  const [viewMode,      setViewMode]      = useState("week");
  const [weekStart,     setWeekStart]     = useState(() => getWeekStart(parseDate(TODAY)));
  const [currentMonth,  setCurrentMonth]  = useState(() => {
    const t = parseDate(TODAY);
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedTask,  setSelectedTask]  = useState(null);
  const [selectedDay,   setSelectedDay]   = useState(null);  // "YYYY-MM-DD", widok miesiąca
  const [showModal,     setShowModal]     = useState(false);
  const [editingTask,   setEditingTask]   = useState(null);
  const [modalDate,     setModalDate]     = useState(null);  // pre-fill date in modal

  const weekDays = getWeekDays(weekStart);

  // Zadania pogrupowane wg daty
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    });
    return map;
  }, [tasks]);

  // Statystyki
  const allTasksOnly = tasks.filter(t => t.type !== "event");
  const doneCnt      = allTasksOnly.filter(t => t.status === "Zrobione").length;
  const overdueCnt   = allTasksOnly.filter(t => isOverdue(t.dueDate, t.status)).length;

  const periodStart  = viewMode === "week"
    ? formatYMD(weekDays[0])
    : formatYMD(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const periodEnd    = viewMode === "week"
    ? formatYMD(weekDays[6])
    : formatYMD(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
  const periodCount  = tasks.filter(t => t.dueDate >= periodStart && t.dueDate <= periodEnd).length;

  // Synchronizacja selectedTask po aktualizacji tasks
  useEffect(() => {
    if (!selectedTask) return;
    const fresh = tasks.find(t => t.id === selectedTask.id);
    fresh ? setSelectedTask(fresh) : setSelectedTask(null);
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────

  const switchView = (v) => {
    setViewMode(v);
    setSelectedTask(null);
    setSelectedDay(null);
  };

  const navigatePrev = () => {
    if (viewMode === "week") setWeekStart(d => addWeeks(d, -1));
    else setCurrentMonth(d => addMonths(d, -1));
  };
  const navigateNext = () => {
    if (viewMode === "week") setWeekStart(d => addWeeks(d, 1));
    else setCurrentMonth(d => addMonths(d, 1));
  };
  const navigateToday = () => {
    const today = parseDate(TODAY);
    if (viewMode === "week") setWeekStart(getWeekStart(today));
    else setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = { ...task, status: newStatus };
    onUpdateTask(updated);
    setSelectedTask(updated);
  };

  const handleSaveTask = (taskData) => {
    if (taskData.id && tasks.find(t => t.id === taskData.id)) {
      onUpdateTask(taskData);
      setSelectedTask(taskData);
    } else {
      onAddTask(taskData);
    }
  };

  // Kliknięcie zadania w widoku tygodnia
  const handleWeekTaskClick = (task) => {
    setSelectedDay(null);
    setSelectedTask(prev => prev?.id === task.id ? null : task);
  };

  // Kliknięcie dnia w widoku miesiąca
  const handleDayClick = (dateStr) => {
    setSelectedTask(null);
    setSelectedDay(prev => prev === dateStr ? null : dateStr);
  };

  // Kliknięcie zadania w panelu dnia (widok miesiąca)
  const handleDayPanelTaskClick = (task) => {
    setSelectedTask(task);
  };

  const openAdd = (date) => {
    setEditingTask(null);
    setModalDate(date ?? null);
    setShowModal(true);
  };
  const openEdit = () => {
    setEditingTask(selectedTask);
    setShowModal(true);
  };

  // ── Renderowanie ──────────────────────────────────────────────────────────

  const periodLabel = viewMode === "week"
    ? formatWeekLabel(weekDays)
    : formatMonthLabel(currentMonth);

  // Czy pokazać panel dnia (tylko miesiąc, gdy brak selectedTask)
  const showDayPanel  = viewMode === "month" && selectedDay && !selectedTask;
  // Czy pokazać panel zadania
  const showTaskPanel = !!selectedTask;

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-4">

      {/* ── Pasek narzędziowy ── */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {/* Nawigacja */}
        <div className="flex items-center gap-1.5">
          <button onClick={navigatePrev} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={navigateToday} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Dziś
          </button>
          <button onClick={navigateNext} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="ml-1 text-sm font-semibold text-slate-700">{periodLabel}</span>
        </div>

        {/* Statystyki */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500">
          <span>
            <span className="font-semibold text-slate-700">{periodCount}</span>{" "}
            {viewMode === "week" ? "w tym tygodniu" : "w tym miesiącu"}
          </span>
          <span className="text-slate-300">·</span>
          <span><span className="font-semibold text-green-600">{doneCnt}</span> ukończonych</span>
          {overdueCnt > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-red-500 font-semibold">
                <AlertTriangle className="w-3 h-3" />{overdueCnt} po terminie
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Przełącznik widoku */}
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
            {[
              { id: "week",  label: "Tydzień" },
              { id: "month", label: "Miesiąc" },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => switchView(v.id)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === v.id ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Dodaj */}
          <button
            onClick={() => openAdd(selectedDay)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Nowe zadanie
          </button>
        </div>
      </div>

      {/* ── Legenda ── */}
      <div className="flex flex-wrap gap-2 items-center text-xs text-slate-400">
        <span className="font-medium text-slate-500 mr-1">Priorytety:</span>
        {["Krytyczny","Wysoki","Normalny","Niski"].map(p => (
          <PriorityBadge key={p} priority={p} />
        ))}
        <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 font-medium">
          <Calendar className="w-3 h-3" /> Wydarzenie
        </span>
      </div>

      {/* ── Widok tygodnia ── */}
      {viewMode === "week" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-7 divide-x divide-slate-200" style={{ minWidth: 560 }}>
            {weekDays.map(day => (
              <DayColumn
                key={formatYMD(day)}
                date={day}
                tasks={tasksByDate[formatYMD(day)] ?? []}
                projects={projects}
                selectedTaskId={selectedTask?.id}
                onTaskClick={handleWeekTaskClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Widok miesiąca ── */}
      {viewMode === "month" && (
        <MonthGrid
          year={currentMonth.getFullYear()}
          month={currentMonth.getMonth()}
          tasksByDate={tasksByDate}
          selectedDay={selectedDay}
          onDayClick={handleDayClick}
        />
      )}

      {/* ── Panele dolne ── */}
      <AnimatePresence mode="wait">
        {showDayPanel && (
          <DayDetailPanel
            key={`day-${selectedDay}`}
            dateStr={selectedDay}
            tasks={tasksByDate[selectedDay] ?? []}
            projects={projects}
            onTaskClick={handleDayPanelTaskClick}
            onClose={() => setSelectedDay(null)}
            onAdd={() => openAdd(selectedDay)}
          />
        )}
        {showTaskPanel && (
          <TaskDetailPanel
            key={`task-${selectedTask.id}`}
            task={selectedTask}
            project={projects.find(p => p.id === selectedTask.projectId)}
            onClose={() => setSelectedTask(null)}
            onStatusChange={handleStatusChange}
            onEdit={openEdit}
          />
        )}
      </AnimatePresence>

      {/* ── Modal dodaj/edytuj ── */}
      <AnimatePresence>
        {showModal && (
          <TaskModal
            projects={projects}
            task={editingTask}
            defaultDate={modalDate}
            onSave={handleSaveTask}
            onClose={() => { setShowModal(false); setEditingTask(null); setModalDate(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
