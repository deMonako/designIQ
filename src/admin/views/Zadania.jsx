import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, CheckCircle2, AlertTriangle, Calendar, CalendarCheck,
  ChevronLeft, ChevronRight, LayoutList, Columns, CalendarDays,
  Edit3, Save, Flag, Search,
} from "lucide-react";
import { isOverdue, TODAY } from "../mockData";

// ── Constants ──────────────────────────────────────────────────────────────────
const PRIORITY_OPTIONS = ["Niski", "Normalny", "Wysoki", "Krytyczny"];
const STATUS_OPTIONS   = ["Todo", "W trakcie", "Zrobione"];
const PRIORITY_ORDER   = { "Krytyczny": 0, "Wysoki": 1, "Normalny": 2, "Niski": 3 };
const DAYS_PL   = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const MONTHS_PL = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

// ── Date Helpers ───────────────────────────────────────────────────────────────
function parseDateLocal(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getMondayOfWeek(dateStr) {
  const d = parseDateLocal(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sortByPriority(arr) {
  return [...arr].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────────
function PriorityDot({ priority }) {
  const colors = {
    Niski:     "bg-slate-300",
    Normalny:  "bg-blue-400",
    Wysoki:    "bg-orange-400",
    Krytyczny: "bg-red-500",
  };
  return (
    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${colors[priority] ?? "bg-slate-300"}`} />
  );
}

function PriorityBadge({ priority }) {
  const s = {
    Niski:     "bg-slate-100 text-slate-500",
    Normalny:  "bg-blue-50 text-blue-600",
    Wysoki:    "bg-orange-50 text-orange-600",
    Krytyczny: "bg-red-50 text-red-600 border border-red-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${s[priority] ?? s.Normalny}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = {
    Todo:       "bg-slate-100 text-slate-600",
    "W trakcie":"bg-blue-50 text-blue-700 border border-blue-200",
    Zrobione:   "bg-green-50 text-green-700 border border-green-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s[status] ?? s.Todo}`}>
      {status}
    </span>
  );
}

// ── Week Task Card ─────────────────────────────────────────────────────────────
function WeekTaskCard({ task, onClick }) {
  const overdue = isOverdue(task.dueDate, task.status);
  const isEvent = task.type === "event";
  const isDone  = task.status === "Zrobione";

  let cls =
    "bg-white border-slate-200 hover:border-orange-300 hover:shadow-sm";
  if (isEvent)       cls = "bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-400";
  else if (isDone)   cls = "bg-slate-50 border-slate-100 opacity-60 hover:opacity-90";
  else if (overdue)  cls = "bg-red-50 border-red-200 hover:border-red-400";

  return (
    <motion.button
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-2 py-1.5 transition-all text-xs cursor-pointer ${cls}`}
    >
      <div className="flex items-start gap-1.5">
        {isEvent
          ? <CalendarCheck className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
          : <PriorityDot priority={task.priority} />
        }
        <span
          className={`leading-snug font-medium line-clamp-2 ${
            isDone   ? "line-through text-slate-400"
            : isEvent ? "text-purple-700"
            : "text-slate-700"
          }`}
        >
          {task.title}
        </span>
      </div>
      {!isEvent && !isDone && (
        <div className="mt-1 pl-3.5">
          <StatusBadge status={task.status} />
        </div>
      )}
    </motion.button>
  );
}

// ── Task Detail Panel ──────────────────────────────────────────────────────────
function TaskDetailPanel({ task, project, projects, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ ...task });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Sync form whenever task changes (after save or external update)
  useEffect(() => {
    setForm({ ...task });
  }, [task]);

  const overdue = isOverdue(task.dueDate, task.status);
  const isEvent = task.type === "event";

  const handleSave = () => {
    onUpdate(form);
    setEditing(false);
  };

  const handleToggleDone = () => {
    onUpdate({ ...task, status: task.status === "Zrobione" ? "Todo" : "Zrobione" });
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.22 }}
      className="fixed right-0 top-16 bottom-0 w-full max-w-sm bg-white shadow-2xl z-40 flex flex-col border-l border-slate-200"
    >
      {/* Header */}
      <div
        className={`px-4 py-3.5 border-b border-slate-200 flex items-center justify-between flex-shrink-0 ${
          isEvent ? "bg-purple-50" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isEvent
            ? <CalendarCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />
            : <Flag className="w-4 h-4 text-orange-500 flex-shrink-0" />
          }
          <span className="font-semibold text-slate-800 text-sm">
            {isEvent ? "Wydarzenie" : "Zadanie"}
          </span>
          {overdue && !isEvent && (
            <span className="text-xs text-red-500 font-medium flex items-center gap-0.5 flex-shrink-0">
              <AlertTriangle className="w-3 h-3" /> po terminie
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!editing && !isEvent && (
            <button
              onClick={() => setEditing(true)}
              title="Edytuj"
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Tytuł</label>
              <input
                value={form.title}
                onChange={e => set("title", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={e => set("status", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Priorytet</label>
                <select
                  value={form.priority}
                  onChange={e => set("priority", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Termin</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => set("dueDate", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Projekt</label>
              <select
                value={form.projectId ?? "none"}
                onChange={e => set("projectId", e.target.value === "none" ? null : e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="none">— Nieprzypisany —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Opis</label>
              <textarea
                value={form.description ?? ""}
                onChange={e => set("description", e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
              />
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-semibold text-slate-800 leading-snug text-base">{task.title}</h2>
              {project && (
                <p className="text-xs text-slate-400 mt-0.5">{project.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-xs text-slate-400 mb-1.5">Status</p>
                <StatusBadge status={task.status} />
              </div>
              {!isEvent && (
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400 mb-1.5">Priorytet</p>
                  <PriorityBadge priority={task.priority} />
                </div>
              )}
              <div className={`bg-slate-50 rounded-lg p-2.5 ${isEvent ? "col-span-2" : ""}`}>
                <p className="text-xs text-slate-400 mb-1">Termin</p>
                <p
                  className={`text-sm font-medium flex items-center gap-1 ${
                    overdue ? "text-red-500" : "text-slate-700"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {task.dueDate === TODAY ? "Dziś" : task.dueDate}
                </p>
              </div>
            </div>

            {task.description && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1.5">Opis</p>
                <p className="text-sm text-slate-700 leading-relaxed">{task.description}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 flex gap-2 flex-shrink-0">
        {editing ? (
          <>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Zapisz
            </button>
          </>
        ) : (
          !isEvent && (
            <>
              <button
                onClick={handleToggleDone}
                className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  task.status === "Zrobione"
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {task.status === "Zrobione" ? "Cofnij" : "Zrealizowane"}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edytuj
              </button>
            </>
          )
        )}
      </div>
    </motion.div>
  );
}

// ── Add Task Modal ─────────────────────────────────────────────────────────────
function AddTaskModal({ projects, onAdd, onClose }) {
  const [form, setForm] = useState({
    title: "", projectId: "none", priority: "Normalny",
    dueDate: TODAY, description: "", type: "task",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      ...form,
      id:        `t-${Date.now()}`,
      status:    "Todo",
      assignee:  "Adam",
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Nowe zadanie / wydarzenie</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2">
            {[
              { val: "task",  label: "Zadanie",     icon: Flag },
              { val: "event", label: "Wydarzenie",  icon: CalendarCheck },
            ].map(({ val, label, icon: Icon }) => (
              <button
                key={val}
                type="button"
                onClick={() => set("type", val)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                  form.type === val
                    ? val === "event"
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-orange-500 text-white border-orange-500"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">Tytuł *</label>
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder={form.type === "event" ? "Nazwa wydarzenia..." : "Nazwa zadania..."}
              required autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Projekt</label>
              <select
                value={form.projectId}
                onChange={e => set("projectId", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="none">— Nieprzypisany —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">
                {form.type === "event" ? "Ważność" : "Priorytet"}
              </label>
              <select
                value={form.priority}
                onChange={e => set("priority", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">
              {form.type === "event" ? "Data" : "Termin"}
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => set("dueDate", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">Opis</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Opcjonalny opis..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
            >
              Dodaj
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Week View ──────────────────────────────────────────────────────────────────
function WeekView({ tasks, projects, onTaskClick, currentWeekStart, onPrevWeek, onNextWeek, onToday }) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toDateStr(addDays(currentWeekStart, i))),
    [currentWeekStart]
  );

  const weekSet = useMemo(() => new Set(days), [days]);
  const outsideCount = tasks.filter(t => !weekSet.has(t.dueDate) && t.status !== "Zrobione").length;

  const monthLabel = useMemo(() => {
    const d0 = parseDateLocal(days[0]);
    const d6 = parseDateLocal(days[6]);
    const m0 = MONTHS_PL[d0.getMonth()];
    const m6 = MONTHS_PL[d6.getMonth()];
    return m0 === m6
      ? `${m0} ${d0.getFullYear()}`
      : `${m0} – ${m6} ${d6.getFullYear()}`;
  }, [days]);

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={onPrevWeek}
              className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onToday}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border-x border-slate-200 transition-colors"
            >
              Dziś
            </button>
            <button
              onClick={onNextWeek}
              className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm font-semibold text-slate-700 capitalize">{monthLabel}</span>
        </div>
        {outsideCount > 0 && (
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            +{outsideCount} zadań poza tygodniem
          </span>
        )}
      </div>

      {/* 7 vertical columns */}
      <div className="grid grid-cols-7 gap-2 overflow-x-auto">
        {days.map((dateStr, i) => {
          const isToday = dateStr === TODAY;
          const d       = parseDateLocal(dateStr);
          const dayAll  = sortByPriority(tasks.filter(t => t.dueDate === dateStr));
          const events  = dayAll.filter(t => t.type === "event");
          const regular = dayAll.filter(t => t.type !== "event");

          return (
            <div
              key={dateStr}
              className={`flex flex-col rounded-xl border min-h-[500px] transition-colors ${
                isToday
                  ? "border-orange-300 bg-orange-50/30 shadow-sm"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* Day header */}
              <div
                className={`px-2 py-3 text-center border-b flex-shrink-0 ${
                  isToday ? "border-orange-200" : "border-slate-100"
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {DAYS_PL[i]}
                </div>
                <div
                  className={`text-xl font-bold leading-tight mt-0.5 ${
                    isToday ? "text-orange-500" : "text-slate-800"
                  }`}
                >
                  {d.getDate()}
                </div>
                <div className="text-xs text-slate-400">{MONTHS_PL[d.getMonth()]}</div>
                {dayAll.length > 0 && (
                  <div
                    className={`mt-1.5 text-xs font-semibold w-5 h-5 rounded-full mx-auto flex items-center justify-center ${
                      isToday
                        ? "bg-orange-100 text-orange-500"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {dayAll.length}
                  </div>
                )}
              </div>

              {/* Tasks — events first, then regular tasks sorted by priority */}
              <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                {events.map(task => (
                  <WeekTaskCard
                    key={task.id}
                    task={task}
                    project={projects.find(p => p.id === task.projectId)}
                    onClick={() => onTaskClick(task)}
                  />
                ))}
                {events.length > 0 && regular.length > 0 && (
                  <div className="border-t border-slate-100 my-1" />
                )}
                {regular.map(task => (
                  <WeekTaskCard
                    key={task.id}
                    task={task}
                    project={projects.find(p => p.id === task.projectId)}
                    onClick={() => onTaskClick(task)}
                  />
                ))}
                {dayAll.length === 0 && (
                  <div className="flex items-center justify-center py-6">
                    <span className="text-xs text-slate-200">·</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── List View ──────────────────────────────────────────────────────────────────
function ListView({ tasks, projects, onTaskClick }) {
  const sorted = useMemo(() => sortByPriority(tasks), [tasks]);

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 text-sm">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>Brak zadań spełniających kryteria</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {sorted.map(task => {
        const project = projects.find(p => p.id === task.projectId);
        const overdue = isOverdue(task.dueDate, task.status);
        const isEvent = task.type === "event";
        return (
          <motion.button
            key={task.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onTaskClick(task)}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer ${
              overdue ? "bg-red-50/30" : ""
            }`}
          >
            <div className="flex-shrink-0">
              {isEvent
                ? <CalendarCheck className="w-4 h-4 text-purple-400" />
                : <PriorityDot priority={task.priority} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm font-medium ${
                  task.status === "Zrobione"
                    ? "line-through text-slate-400"
                    : isEvent ? "text-purple-700"
                    : "text-slate-800"
                }`}
              >
                {task.title}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {project?.name ?? <span className="italic">Nieprzypisany</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isEvent && <PriorityBadge priority={task.priority} />}
              <StatusBadge status={task.status} />
              <span
                className={`text-xs flex items-center gap-1 ${
                  overdue ? "text-red-500 font-medium" : "text-slate-400"
                }`}
              >
                {overdue && <AlertTriangle className="w-3 h-3" />}
                <Calendar className="w-3 h-3" />
                {task.dueDate === TODAY ? "Dziś" : task.dueDate}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Kanban View ────────────────────────────────────────────────────────────────
function KanbanView({ tasks, projects, onTaskClick }) {
  const columns = [
    { status: "Todo",       title: "Todo",      accent: "border-slate-200", count: "bg-slate-100 text-slate-500" },
    { status: "W trakcie",  title: "W trakcie", accent: "border-blue-200",  count: "bg-blue-50 text-blue-600" },
    { status: "Zrobione",   title: "Zrobione",  accent: "border-green-200", count: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(col => {
        const colTasks = sortByPriority(tasks.filter(t => t.status === col.status));
        return (
          <div
            key={col.status}
            className={`flex-1 min-w-[240px] bg-white rounded-xl border ${col.accent} shadow-sm`}
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-700">{col.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.count}`}>
                {colTasks.length}
              </span>
            </div>
            <div className="p-3 space-y-2 min-h-[200px]">
              {colTasks.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                const overdue = isOverdue(task.dueDate, task.status);
                const isEvent = task.type === "event";
                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={`rounded-lg border p-3 shadow-sm hover:shadow-md cursor-pointer transition-all ${
                      isEvent  ? "border-purple-200 bg-purple-50/40"
                      : overdue ? "border-red-200 bg-red-50/30"
                      : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-1.5 mb-2">
                      {isEvent
                        ? <CalendarCheck className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                        : <PriorityDot priority={task.priority} />
                      }
                      <div
                        className={`text-sm font-medium ${
                          task.status === "Zrobione"
                            ? "line-through text-slate-400"
                            : isEvent ? "text-purple-700"
                            : "text-slate-800"
                        }`}
                      >
                        {task.title}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {!isEvent && <PriorityBadge priority={task.priority} />}
                      <span className="text-xs text-slate-400 truncate ml-auto">
                        {project?.name ?? "—"}
                      </span>
                    </div>
                    <div
                      className={`text-xs mt-2 flex items-center gap-1 ${
                        overdue ? "text-red-500 font-medium" : "text-slate-400"
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      {task.dueDate === TODAY ? "Dziś" : task.dueDate}
                      {overdue && <AlertTriangle className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <div className="text-xs text-slate-300 text-center py-8">Brak zadań</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Zadania({ projects, tasks, onUpdateTask, onAddTask }) {
  const [viewMode, setViewMode]           = useState("week");
  const [selectedTask, setSelectedTask]   = useState(null);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMondayOfWeek(TODAY));
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");

  const filtered = useMemo(
    () => tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchSearch && matchStatus;
    }),
    [tasks, search, statusFilter]
  );

  const handleSelectTask = (task) => setSelectedTask(task);
  const handleUpdateTask = (updated) => {
    onUpdateTask(updated);
    setSelectedTask(prev => (prev?.id === updated.id ? updated : prev));
  };

  const overdueCount = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const eventCount   = tasks.filter(t => t.type === "event").length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj..."
              className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 w-44"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-700"
          >
            <option value="all">Wszystkie statusy</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> {overdueCount} po terminie
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode("week")}
              title="Tydzień"
              className={`p-2 transition-colors ${viewMode === "week"   ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Lista"
              className={`p-2 transition-colors ${viewMode === "list"   ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              title="Kanban"
              className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Nowe zadanie
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 flex-wrap text-sm text-slate-500 items-center">
        {STATUS_OPTIONS.map(s => {
          const count = tasks.filter(t => t.status === s && t.type !== "event").length;
          return (
            <span key={s}>
              <span className="font-semibold text-slate-700">{count}</span> {s}
            </span>
          );
        })}
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1">
          <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-semibold text-slate-700">{eventCount}</span> wydarzeń
        </span>
      </div>

      {/* Views */}
      {viewMode === "week" && (
        <WeekView
          tasks={filtered}
          projects={projects}
          onTaskClick={handleSelectTask}
          currentWeekStart={currentWeekStart}
          onPrevWeek={() => setCurrentWeekStart(d => addDays(d, -7))}
          onNextWeek={() => setCurrentWeekStart(d => addDays(d, 7))}
          onToday={() => setCurrentWeekStart(getMondayOfWeek(TODAY))}
        />
      )}
      {viewMode === "list" && (
        <ListView tasks={filtered} projects={projects} onTaskClick={handleSelectTask} />
      )}
      {viewMode === "kanban" && (
        <KanbanView tasks={filtered} projects={projects} onTaskClick={handleSelectTask} />
      )}

      {/* Task Detail Panel + backdrop */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setSelectedTask(null)}
            />
            <TaskDetailPanel
              task={selectedTask}
              project={projects.find(p => p.id === selectedTask.projectId)}
              projects={projects}
              onClose={() => setSelectedTask(null)}
              onUpdate={handleUpdateTask}
            />
          </>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddTaskModal
            projects={projects}
            onAdd={onAddTask}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
