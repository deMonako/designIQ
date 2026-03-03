import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ChevronLeft, ChevronRight, Calendar, CheckCircle2,
  AlertTriangle, X, Edit2, Flag,
} from "lucide-react";
import { isOverdue, TODAY } from "../mockData";

// ─── Date helpers (ręczna implementacja, bez date-fns locale) ─────────────────

const DAY_NAMES  = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const MONTH_NAMES = ["stycznia","lutego","marca","kwietnia","maja","czerwca",
                     "lipca","sierpnia","września","października","listopada","grudnia"];

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

// Poniedziałek tygodnia zawierającego datę
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Nd
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

function formatWeekLabel(days) {
  const first = days[0];
  const last  = days[6];
  const sameMonth = first.getMonth() === last.getMonth();
  if (sameMonth) {
    return `${first.getDate()}–${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
  }
  return `${first.getDate()} ${MONTH_NAMES[first.getMonth()]} – ${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
}

// ─── Stałe ────────────────────────────────────────────────────────────────────

const PRIORITY_ORDER  = { "Krytyczny": 0, "Wysoki": 1, "Normalny": 2, "Niski": 3 };
const PRIORITY_BADGE  = {
  "Niski":     { bg: "bg-slate-100",   text: "text-slate-500",  dot: "bg-slate-300",  border: "border-slate-200" },
  "Normalny":  { bg: "bg-blue-50",     text: "text-blue-600",   dot: "bg-blue-400",   border: "border-blue-100" },
  "Wysoki":    { bg: "bg-orange-50",   text: "text-orange-600", dot: "bg-orange-400", border: "border-orange-100" },
  "Krytyczny": { bg: "bg-red-50",      text: "text-red-600",    dot: "bg-red-500",    border: "border-red-200" },
};
const STATUS_OPTIONS   = ["Niezrobione", "Zrobione"];
const PRIORITY_OPTIONS = ["Niski", "Normalny", "Wysoki", "Krytyczny"];

// ─── PriorityBadge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }) {
  const s = PRIORITY_BADGE[priority] ?? PRIORITY_BADGE["Normalny"];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {priority}
    </span>
  );
}

// ─── TaskCard (karta w kolumnie dnia) ─────────────────────────────────────────

function TaskCard({ task, project, isSelected, onClick }) {
  const overdue  = isOverdue(task.dueDate, task.status);
  const isDone   = task.status === "Zrobione";
  const isEvent  = task.type === "event";
  const pStyle   = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE["Normalny"];

  let bg     = "bg-white border-slate-200 hover:border-slate-300";
  let accent = `border-l-2 ${pStyle.border}`;
  if (isEvent)    { bg = "bg-indigo-50 border-indigo-200 hover:border-indigo-300"; accent = "border-l-2 border-l-indigo-400"; }
  if (isDone)     { bg = "bg-slate-50 border-slate-200 hover:border-slate-300"; }
  if (overdue && !isDone) { bg = "bg-red-50/70 border-red-200 hover:border-red-300"; accent = "border-l-2 border-l-red-400"; }
  if (isSelected) { bg = "bg-orange-50 border-orange-300 ring-1 ring-orange-200"; accent = "border-l-2 border-l-orange-500"; }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`relative px-2 py-1.5 rounded-md border text-xs cursor-pointer transition-all hover:shadow-sm ${bg} ${accent} select-none`}
    >
      <div className="flex items-start gap-1.5 min-w-0">
        {isEvent
          ? <Calendar className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-px" />
          : <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${pStyle.dot}`} />
        }
        <div className="min-w-0 flex-1">
          <div className={`font-medium leading-snug line-clamp-2 ${
            isDone   ? "line-through text-slate-400" :
            isEvent  ? "text-indigo-800" :
                       "text-slate-700"
          }`}>
            {task.title}
          </div>
          {project && (
            <div className="text-slate-400 truncate mt-0.5 leading-none">{project.name}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-0.5">
          {isDone  && <CheckCircle2 className="w-3 h-3 text-green-500" />}
          {overdue && !isDone && <AlertTriangle className="w-3 h-3 text-red-400" />}
        </div>
      </div>
    </motion.div>
  );
}

// ─── DayColumn (pionowy pasek dnia) ──────────────────────────────────────────

function DayColumn({ date, tasks, projects, selectedTaskId, onTaskClick }) {
  const dateStr  = formatYMD(date);
  const isToday  = dateStr === TODAY;
  const dayIndex = date.getDay();              // 0=Nd
  const normIdx  = dayIndex === 0 ? 6 : dayIndex - 1; // 0=Pon … 6=Nd
  const isWeekend = normIdx >= 5;
  const dayName  = DAY_NAMES[normIdx];

  // Kolejność: najpierw wydarzenia, potem zadania wg priorytetu
  const sorted = [...tasks].sort((a, b) => {
    if (a.type === "event" && b.type !== "event") return -1;
    if (a.type !== "event" && b.type === "event") return 1;
    return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
  });

  return (
    <div className={`flex flex-col border-r border-slate-200 last:border-r-0 min-h-[480px] ${
      isWeekend ? "bg-slate-50/60" : "bg-white"
    }`}>
      {/* Nagłówek */}
      <div className={`px-1 py-2 border-b text-center ${
        isToday
          ? "bg-brand-orange border-brand-orange"
          : isWeekend
            ? "bg-slate-100/80 border-slate-200"
            : "bg-slate-50 border-slate-200"
      }`}>
        <div className={`text-[10px] font-semibold uppercase tracking-widest ${
          isToday ? "text-orange-100" : "text-slate-400"
        }`}>
          {dayName}
        </div>
        <div className={`text-xl font-bold leading-tight tabular-nums ${
          isToday ? "text-white" : "text-slate-700"
        }`}>
          {date.getDate()}
        </div>
        <div className={`text-[10px] h-3.5 ${isToday ? "text-orange-200" : "text-slate-300"}`}>
          {tasks.length > 0 ? `${tasks.length}` : ""}
        </div>
      </div>

      {/* Lista zadań i wydarzeń */}
      <div className="flex-1 p-1 space-y-1 overflow-y-auto">
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
          <div className="text-center pt-4 text-slate-200 text-xs select-none">—</div>
        )}
      </div>
    </div>
  );
}

// ─── TaskDetailPanel (panel szczegółów) ───────────────────────────────────────

function TaskDetailPanel({ task, project, onClose, onStatusChange, onEdit }) {
  const overdue = isOverdue(task.dueDate, task.status);
  const isDone  = task.status === "Zrobione";
  const isEvent = task.type === "event";
  const pStyle  = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE["Normalny"];

  return (
    <motion.div
      key="detail-panel"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.18 }}
      className="w-72 flex-shrink-0 bg-white rounded-xl border border-slate-200 shadow-md flex flex-col overflow-hidden self-start"
    >
      {/* Pasek tytułu */}
      <div className={`px-4 py-3 border-b border-slate-200 flex items-center justify-between ${
        isEvent ? "bg-indigo-50" : ""
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          {isEvent
            ? <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              </div>
            : <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${pStyle.bg}`}>
                <Flag className={`w-3.5 h-3.5 ${pStyle.text}`} />
              </div>
          }
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {isEvent ? "Wydarzenie" : "Zadanie"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Treść */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h3 className={`text-sm font-semibold leading-snug ${
          isDone ? "line-through text-slate-400" : "text-slate-900"
        }`}>
          {task.title}
        </h3>

        {/* Metadane */}
        <div className="space-y-2.5 text-xs">
          {!isEvent && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 flex-shrink-0">Priorytet</span>
              <PriorityBadge priority={task.priority} />
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 flex-shrink-0">Status</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
              isDone
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-slate-100 text-slate-600"
            }`}>
              {isDone && <CheckCircle2 className="w-3 h-3" />}
              {task.status}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 flex-shrink-0">Termin</span>
            <span className={`flex items-center gap-1 font-medium ${
              overdue ? "text-red-500" : isDone ? "text-green-600" : "text-slate-700"
            }`}>
              {overdue && <AlertTriangle className="w-3 h-3" />}
              <Calendar className="w-3 h-3 opacity-60" />
              {task.dueDate === TODAY ? "Dziś" : task.dueDate}
            </span>
          </div>

          {project && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 flex-shrink-0">Projekt</span>
              <span className="font-medium text-slate-700 text-right truncate max-w-[140px]">
                {project.name}
              </span>
            </div>
          )}
        </div>

        {/* Opis */}
        {task.description && (
          <div>
            <div className="text-xs text-slate-400 mb-1.5">Opis</div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
              {task.description}
            </p>
          </div>
        )}
      </div>

      {/* Akcje */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/50">
        <button
          onClick={() => onStatusChange(task.id, isDone ? "Niezrobione" : "Zrobione")}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            isDone
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-green-500 text-white hover:bg-green-600 shadow-sm"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isDone ? "Oznacz jako niezrobione" : "Oznacz jako zrobione"}
        </button>
        <button
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-white transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edytuj
        </button>
      </div>
    </motion.div>
  );
}

// ─── TaskModal (dodawanie / edycja) ───────────────────────────────────────────

function TaskModal({ projects, task, onSave, onClose }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title:       task?.title       ?? "",
    projectId:   task?.projectId   ?? "none",
    priority:    task?.priority    ?? "Normalny",
    dueDate:     task?.dueDate     ?? TODAY,
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
      id:        task?.id        ?? `t-${Date.now()}`,
      status:    task?.status    ?? "Niezrobione",
      assignee:  task?.assignee  ?? "Adam",
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
          {/* Typ */}
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
                      ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                      : "bg-orange-50 border-orange-400 text-orange-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* Tytuł */}
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
            {/* Projekt */}
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

            {/* Priorytet – tylko dla zadań */}
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

            {/* Termin */}
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

          {/* Opis */}
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
  const [weekStart, setWeekStart]   = useState(() => getWeekStart(parseDate(TODAY)));
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const weekDays = getWeekDays(weekStart);

  // Zadania pogrupowane po dacie
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    });
    return map;
  }, [tasks]);

  // Statystyki
  const allTasks    = tasks.filter(t => t.type !== "event");
  const doneTasks   = allTasks.filter(t => t.status === "Zrobione").length;
  const overdueCnt  = allTasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const weekStart_s = formatYMD(weekDays[0]);
  const weekEnd_s   = formatYMD(weekDays[6]);
  const weekCount   = tasks.filter(t => t.dueDate >= weekStart_s && t.dueDate <= weekEnd_s).length;

  // Synchronizacja wybranego zadania po aktualizacji tasks
  useEffect(() => {
    if (!selectedTask) return;
    const fresh = tasks.find(t => t.id === selectedTask.id);
    if (fresh) setSelectedTask(fresh);
    else       setSelectedTask(null);
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleTaskClick = (task) => {
    setSelectedTask(prev => prev?.id === task.id ? null : task);
  };

  const openAdd = () => { setEditingTask(null); setShowModal(true); };
  const openEdit = () => { setEditingTask(selectedTask); setShowModal(true); };

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-4">

      {/* ── Pasek narzędziowy ── */}
      <div className="flex flex-wrap gap-3 items-center justify-between">

        {/* Nawigacja po tygodniach */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWeekStart(d => addWeeks(d, -1))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(getWeekStart(parseDate(TODAY)))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Dziś
          </button>
          <button
            onClick={() => setWeekStart(d => addWeeks(d, 1))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="ml-1 text-sm font-semibold text-slate-700">
            {formatWeekLabel(weekDays)}
          </span>
        </div>

        {/* Statystyki */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500">
          <span>
            <span className="font-semibold text-slate-700">{weekCount}</span> w tym tygodniu
          </span>
          <span className="text-slate-300">·</span>
          <span>
            <span className="font-semibold text-green-600">{doneTasks}</span> ukończonych
          </span>
          {overdueCnt > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-red-500 font-semibold">
                <AlertTriangle className="w-3 h-3" />
                {overdueCnt} po terminie
              </span>
            </>
          )}
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Nowe zadanie
        </button>
      </div>

      {/* ── Legenda priorytetów ── */}
      <div className="flex flex-wrap gap-2 items-center text-xs text-slate-400">
        <span className="font-medium text-slate-500 mr-1">Priorytety:</span>
        {["Krytyczny","Wysoki","Normalny","Niski"].map(p => (
          <PriorityBadge key={p} priority={p} />
        ))}
        <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">
          <Calendar className="w-3 h-3" /> Wydarzenie
        </span>
      </div>

      {/* ── Widok tygodnia + panel szczegółów ── */}
      <div className="flex gap-4 items-start overflow-x-auto pb-2">

        {/* Siatka tygodnia */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" style={{ minWidth: 560 }}>
          <div className="grid grid-cols-7 divide-x divide-slate-200">
            {weekDays.map(day => (
              <DayColumn
                key={formatYMD(day)}
                date={day}
                tasks={tasksByDate[formatYMD(day)] ?? []}
                projects={projects}
                selectedTaskId={selectedTask?.id}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
        </div>

        {/* Panel szczegółów */}
        <AnimatePresence>
          {selectedTask && (
            <TaskDetailPanel
              key={selectedTask.id}
              task={selectedTask}
              project={projects.find(p => p.id === selectedTask.projectId)}
              onClose={() => setSelectedTask(null)}
              onStatusChange={handleStatusChange}
              onEdit={openEdit}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal dodaj/edytuj ── */}
      <AnimatePresence>
        {showModal && (
          <TaskModal
            projects={projects}
            task={editingTask}
            onSave={handleSaveTask}
            onClose={() => { setShowModal(false); setEditingTask(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
