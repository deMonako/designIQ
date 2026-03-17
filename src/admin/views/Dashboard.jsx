import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Calendar, Clock,
  StickyNote, FolderKanban, Phone, Mail, Pencil, Plus,
  TrendingUp, Zap,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { TODAY, isOverdue } from "../mockData";
import TaskModal, { projectLabel, DESIGNIQ_PROJECT_ID } from "../components/TaskModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_ORDER = { "Krytyczny": 0, "Wysoki": 1, "Normalny": 2, "Niski": 3 };

function daysUntil(dateStr) {
  const s = dateStr ? String(dateStr).substring(0, 10) : "";
  if (!s) return Infinity;
  return Math.ceil(
    (new Date(s + "T00:00:00") - new Date(TODAY + "T00:00:00")) / 86_400_000
  );
}

function formatDayShort(dateStr) {
  const s = dateStr ? String(dateStr).substring(0, 10) : "";
  if (!s) return "";
  return format(new Date(s + "T00:00:00"), "EEE d MMM", { locale: pl });
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function CircularRing({ done, total, size = 72 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const offset = circ * (1 - pct);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#f1f5f9" strokeWidth={8} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#ringGrad)" strokeWidth={8} fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-slate-800 leading-none tabular-nums">
          {done}/{total}
        </span>
        <span className="text-[9px] text-slate-400 font-medium mt-0.5">dziś</span>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color }) {
  const colors = {
    orange: "bg-orange-50 border-orange-100 text-orange-600",
    red:    "bg-red-50   border-red-100   text-red-600",
    slate:  "bg-slate-50 border-slate-100 text-slate-600",
    green:  "bg-green-50 border-green-100 text-green-600",
  };
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border px-3 py-2.5 min-w-[64px] ${colors[color]}`}>
      <div className="mb-1 opacity-70">{icon}</div>
      <span className="text-xl font-extrabold tabular-nums leading-none">{value}</span>
      <span className="text-[10px] font-semibold opacity-60 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

// ─── AgendaRow (zadanie lub wydarzenie na dziś) ───────────────────────────────

function AgendaRow({ task, project, onStatusChange, onEdit }) {
  const [expanded, setExpanded] = React.useState(false);
  const isDone  = task.status === "Zrobione";
  const isEvent = task.type === "event";

  return (
    <motion.div layout initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
          isDone  ? "bg-slate-50 border-slate-100 opacity-60" :
          isEvent ? "bg-violet-50 border-violet-100" :
                    "bg-white border-slate-100 shadow-sm"
        } ${expanded ? "rounded-b-none border-b-0" : ""}`}
      >
        {isEvent ? (
          <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-3 h-3 text-violet-500" />
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, isDone ? "Niezrobione" : "Zrobione"); }}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              isDone
                ? "bg-green-500 border-green-500"
                : "border-slate-300 hover:border-orange-400"
            }`}
          >
            {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
          </button>
        )}

        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-1 min-w-0 text-left"
        >
          <span className={`text-sm font-medium ${
            isDone ? "line-through text-slate-400" :
            isEvent ? "text-violet-800" :
                      "text-slate-800"
          }`}>
            {task.title}
          </span>
          {(project || task.projectId === DESIGNIQ_PROJECT_ID) && (
            <span className="text-xs text-slate-400 ml-2">
              {task.projectId === DESIGNIQ_PROJECT_ID ? "designIQ" : project.name}
            </span>
          )}
        </button>

        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
          isEvent ? "bg-violet-100 text-violet-600" : "bg-orange-50 text-orange-600"
        }`}>
          {isEvent ? "Wydarzenie" : task.priority}
        </span>

        {!isEvent && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            title="Edytuj zadanie"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className={`px-3 py-2.5 rounded-b-lg border border-t-0 text-xs text-slate-600 space-y-1 ${
              isEvent ? "bg-violet-50 border-violet-100" : "bg-slate-50 border-slate-100"
            }`}>
              {task.description && (
                <p className="text-slate-700 leading-relaxed">{task.description}</p>
              )}
              {!task.description && <p className="text-slate-400 italic">Brak opisu</p>}
              {task.dueDate && (
                <p className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Termin: {String(task.dueDate).substring(0, 10)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── OverdueRow (zaległe zadanie) ─────────────────────────────────────────────

function OverdueRow({ task, project, onStatusChange, onEdit }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 bg-white shadow-sm border-l-2 border-l-red-400"
    >
      <button
        onClick={() => onStatusChange(task.id, "Zrobione")}
        className="w-5 h-5 rounded-full border-2 border-red-300 hover:border-red-500 flex items-center justify-center flex-shrink-0 transition-all"
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-800">{task.title}</span>
        {(project || task.projectId === DESIGNIQ_PROJECT_ID) && (
          <span className="text-xs text-slate-400 ml-2">
            {task.projectId === DESIGNIQ_PROJECT_ID ? "designIQ" : project.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
          {task.priority}
        </span>
        <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
          <AlertTriangle className="w-3 h-3" />
          {task.dueDate}
        </span>
        <button
          onClick={() => onEdit(task)}
          className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Edytuj zadanie"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── ProjectCard (karta projektu) ─────────────────────────────────────────────

function ProjectCard({ project, client, onClick }) {
  const [showContact, setShowContact] = React.useState(false);
  const days = daysUntil(project.deadline);

  const deadlineClass =
    days < 0   ? "text-red-500 font-semibold" :
    days <= 7  ? "text-orange-600 font-semibold" :
                 "text-slate-400";

  const deadlineText =
    days < 0   ? `Termin minął ${Math.abs(days)} dni temu` :
    days === 0 ? "Termin dziś!" :
                 `${days} dni do terminu`;

  const statusColors = {
    "W trakcie":  "bg-blue-50 text-blue-600",
    "Wstrzymany": "bg-slate-100 text-slate-500",
    "Wstępny":    "bg-slate-100 text-slate-400",
  };

  const progressColor =
    project.progress >= 75 ? "from-green-400 to-green-500" :
    project.progress >= 40 ? "from-orange-400 to-orange-500" :
                              "from-slate-300 to-slate-400";

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-3 hover:shadow-md transition-all ${onClick ? "cursor-pointer hover:border-orange-200" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-start gap-2 min-w-0">
          {client && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5">
              {client.name?.slice(0, 1).toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{project.name}</div>
            <div
              className="relative text-xs text-slate-400 truncate mt-0.5 cursor-default"
              onMouseEnter={() => setShowContact(true)}
              onMouseLeave={() => setShowContact(false)}
            >
              {client?.name ?? "—"}
              {showContact && client && (client.phone || client.email) && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-lg px-3 py-2 text-xs whitespace-nowrap pointer-events-none">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />{client.phone}
                    </div>
                  )}
                  {client.email && (
                    <div className={`flex items-center gap-2 text-slate-500 ${client.phone ? "mt-1" : ""}`}>
                      <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />{client.email}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${statusColors[project.status] ?? "bg-slate-100 text-slate-400"}`}>
          {project.status}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${progressColor} rounded-full transition-all`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-slate-500 tabular-nums w-7 text-right">
          {project.progress}%
        </span>
      </div>

      <div className={`text-[11px] flex items-center gap-1 ${deadlineClass}`}>
        <Clock className="w-3 h-3 flex-shrink-0" />
        {deadlineText}
      </div>
    </div>
  );
}

// ─── UpcomingItem ─────────────────────────────────────────────────────────────

function UpcomingItem({ task, project, onClick }) {
  const isEvent = task.type === "event";
  return (
    <button
      onClick={() => onClick(task)}
      className="w-full flex items-center gap-2 py-1.5 text-xs text-left hover:bg-slate-50 rounded-md px-1 -mx-1 transition-colors group"
    >
      {isEvent
        ? <Calendar className="w-3 h-3 text-violet-400 flex-shrink-0" />
        : <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
      }
      <span className={`flex-1 truncate font-medium ${isEvent ? "text-violet-700" : "text-slate-700"} group-hover:underline`}>
        {task.title}
      </span>
      {(project || task.projectId === DESIGNIQ_PROJECT_ID) && (
        <span className="text-slate-300 truncate max-w-[80px]">
          {task.projectId === DESIGNIQ_PROJECT_ID ? "designIQ" : project.name.split("–")[0].trim()}
        </span>
      )}
    </button>
  );
}

// ─── Quick Notes ─────────────────────────────────────────────────────────────

function QuickNotes() {
  const [notes, setNotes] = useState(() => localStorage.getItem("diq_notes") || "");
  const save = (v) => { setNotes(v); localStorage.setItem("diq_notes", v); };

  return (
    <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-orange-300 shadow-sm p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-semibold text-slate-700">Szybkie notatki</span>
        {notes && <span className="ml-auto text-xs text-slate-300">zapisano lokalnie</span>}
      </div>
      <textarea
        value={notes}
        onChange={e => save(e.target.value)}
        placeholder="Wpisz notatkę, numer telefonu, przypomnienie…"
        className="flex-1 min-h-[100px] text-sm text-slate-700 resize-none outline-none placeholder-slate-300 leading-relaxed bg-transparent"
      />
    </div>
  );
}

// ─── Priority breakdown widget ────────────────────────────────────────────────

const PRIORITY_META = [
  { key: "Krytyczny", color: "bg-red-500",    light: "bg-red-50",    text: "text-red-600"    },
  { key: "Wysoki",    color: "bg-orange-500",  light: "bg-orange-50", text: "text-orange-600" },
  { key: "Normalny",  color: "bg-blue-400",    light: "bg-blue-50",   text: "text-blue-600"   },
  { key: "Niski",     color: "bg-slate-300",   light: "bg-slate-50",  text: "text-slate-500"  },
];

function PriorityBreakdown({ tasks }) {
  const open = tasks.filter(t => t.status !== "Zrobione" && t.type !== "event");
  const total = open.length || 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">Otwarte zadania</span>
        <span className="ml-auto text-xs font-bold text-slate-400">{open.length}</span>
      </div>

      <div className="space-y-3">
        {PRIORITY_META.map(({ key, color, light, text }) => {
          const count = open.filter(t => t.priority === key).length;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${text}`}>{key}</span>
                <span className="text-xs text-slate-400 tabular-nums">{count}</span>
              </div>
              <div className={`h-2 ${light} rounded-full overflow-hidden`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={`h-full ${color} rounded-full`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stacked bar summary */}
      <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden flex">
        {PRIORITY_META.map(({ key, color }) => {
          const count = open.filter(t => t.priority === key).length;
          const pct = (count / total) * 100;
          return pct > 0 ? (
            <motion.div
              key={key}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className={`h-full ${color}`}
            />
          ) : null;
        })}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ color = "orange", children, badge, action }) {
  const accent = {
    orange: "bg-orange-500",
    red:    "bg-red-500",
    slate:  "bg-slate-300",
    blue:   "bg-blue-400",
  };
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-1 h-5 rounded-full flex-shrink-0 ${accent[color]}`} />
      <span className="text-sm font-bold text-slate-800">{children}</span>
      {badge !== undefined && (
        <span className="text-xs text-slate-400 font-medium">({badge})</span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ projects, tasks, clients, onUpdateTask, onAddTask, onDeleteTask, onSelectProject }) {
  const todayDate = new Date(TODAY + "T00:00:00");
  const weekday   = format(todayDate, "EEEE",         { locale: pl });
  const dateFull  = format(todayDate, "d MMMM yyyy", { locale: pl });

  const todayItems = tasks
    .filter(t => String(t.dueDate || "").substring(0, 10) === TODAY && t.status !== "Zrobione")
    .sort((a, b) => {
      if (a.type === "event" && b.type !== "event") return -1;
      if (a.type !== "event" && b.type === "event") return 1;
      return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    });

  const overdueTasks = tasks
    .filter(t => t.type !== "event" && isOverdue(String(t.dueDate || "").substring(0, 10), t.status))
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

  const totalDone      = tasks.filter(t => t.status === "Zrobione").length;
  const todayDone      = tasks.filter(t => String(t.dueDate || "").substring(0, 10) === TODAY && t.status === "Zrobione").length;
  const todayTotal     = todayItems.length + todayDone;
  const activeProjects = projects
    .filter(p => p.status !== "Ukończony")
    .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline));

  const upcoming = tasks
    .filter(t => String(t.dueDate || "").substring(0, 10) > TODAY && t.status !== "Zrobione")
    .sort((a, b) => {
      const ad = String(a.dueDate || "").substring(0, 10);
      const bd = String(b.dueDate || "").substring(0, 10);
      if (ad !== bd) return ad < bd ? -1 : 1;
      if (a.type === "event" && b.type !== "event") return -1;
      if (a.type !== "event" && b.type === "event") return 1;
      return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    })
    .slice(0, 9);

  const upcomingByDate = upcoming.reduce((acc, t) => {
    const key = String(t.dueDate || "").substring(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const fewTasksToday = todayItems.length <= 3;

  const [editingTask, setEditingTask] = useState(null);

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) onUpdateTask({ ...task, status: newStatus });
  };

  const handleSaveTask = (taskData) => {
    if (taskData.id && tasks.find(t => t.id === taskData.id)) onUpdateTask(taskData);
    else onAddTask?.(taskData);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* ── Nagłówek ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-4"
      >
        {/* Data */}
        <div className="flex-1 min-w-0">
          <div className="text-3xl font-extrabold text-slate-900 capitalize tracking-tight leading-none">
            {weekday}
          </div>
          <div className="text-sm text-slate-400 mt-1 font-medium">{dateFull}</div>
          {overdueTasks.length > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-100 rounded-lg text-xs font-semibold text-red-600">
              <AlertTriangle className="w-3 h-3" />
              {overdueTasks.length} zaległe {overdueTasks.length === 1 ? "zadanie" : "zadania"}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-14 bg-slate-100" />

        {/* Ring + stats */}
        <div className="flex items-center gap-4">
          <CircularRing done={todayDone} total={todayTotal} size={72} />
          <div className="flex flex-col gap-2">
            <StatCard
              icon={<FolderKanban className="w-3.5 h-3.5" />}
              value={activeProjects.length}
              label="projekty"
              color="slate"
            />
            <StatCard
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              value={totalDone}
              label="ukończone"
              color="green"
            />
          </div>
        </div>
      </motion.div>

      {/* ── Główna siatka (2 kolumny) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Lewa: Agenda + Zaległe [+ Nadchodzące gdy mało zadań] ─── */}
        <div className="space-y-5">

          {/* Agenda dnia */}
          <section>
            <SectionHeader
              color="orange"
              action={
                <button
                  onClick={() => setEditingTask({ dueDate: TODAY, status: "Niezrobione", priority: "Normalny", type: "task" })}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-orange-600 hover:bg-orange-50 border border-orange-200 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Dodaj
                </button>
              }
            >
              Agenda dnia
              {todayDone > 0 && (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1 ml-1">
                  <CheckCircle2 className="w-3 h-3" /> {todayDone} zrobione
                </span>
              )}
            </SectionHeader>
            <AnimatePresence>
              {todayItems.length > 0 ? (
                <div className="space-y-1.5">
                  {todayItems.map(t => (
                    <AgendaRow
                      key={t.id}
                      task={t}
                      project={projects.find(p => p.id === t.projectId)}
                      onStatusChange={handleStatusChange}
                      onEdit={setEditingTask}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700"
                >
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold">Nic zaplanowanego na dziś</div>
                    <div className="text-xs opacity-70 mt-0.5">Sprawdź nadchodzące zadania.</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Zaległe */}
          <AnimatePresence>
            {overdueTasks.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SectionHeader color="red" badge={overdueTasks.length}>
                  <span className="text-red-600">Zaległe</span>
                </SectionHeader>
                <div className="space-y-1.5">
                  {overdueTasks.map(t => (
                    <OverdueRow
                      key={t.id}
                      task={t}
                      project={projects.find(p => p.id === t.projectId)}
                      onStatusChange={handleStatusChange}
                      onEdit={setEditingTask}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Nadchodzące – tutaj gdy mało zadań na dziś (≤ 3) */}
          {fewTasksToday && (
            <section>
              <SectionHeader color="slate">Nadchodzące</SectionHeader>
              {Object.keys(upcomingByDate).length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {Object.entries(upcomingByDate).map(([date, items], i) => (
                    <div key={date} className={i > 0 ? "border-t border-slate-100" : ""}>
                      <div className="px-3 py-1.5 bg-slate-50 flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {formatDayShort(date)}
                        </span>
                        <span className="text-[10px] text-slate-300">{items.length}</span>
                      </div>
                      <div className="px-3 divide-y divide-slate-50">
                        {items.map(t => (
                          <UpcomingItem
                            key={t.id}
                            task={t}
                            project={projects.find(p => p.id === t.projectId)}
                            onClick={setEditingTask}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 text-center py-4">Brak nadchodzących zadań</div>
              )}
            </section>
          )}
        </div>

        {/* ─── Prawa: Projekty [+ Nadchodzące gdy dużo zadań] ─── */}
        <div className="space-y-5">

          {/* Aktywne projekty */}
          <section>
            <SectionHeader color="slate" badge={activeProjects.length}>
              Aktywne projekty
            </SectionHeader>
            <div className="space-y-2">
              {activeProjects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  client={(clients ?? []).find(c => c.id === p.clientId)}
                  onClick={onSelectProject ? () => onSelectProject(p) : undefined}
                />
              ))}
              {activeProjects.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-4">Brak aktywnych projektów</div>
              )}
            </div>
          </section>

          {/* Nadchodzące – tutaj gdy dużo zadań na dziś (> 3) */}
          {!fewTasksToday && (
            <section>
              <SectionHeader color="slate">Nadchodzące</SectionHeader>
              {Object.keys(upcomingByDate).length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {Object.entries(upcomingByDate).map(([date, items], i) => (
                    <div key={date} className={i > 0 ? "border-t border-slate-100" : ""}>
                      <div className="px-3 py-1.5 bg-slate-50 flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {formatDayShort(date)}
                        </span>
                        <span className="text-[10px] text-slate-300">{items.length}</span>
                      </div>
                      <div className="px-3 divide-y divide-slate-50">
                        {items.map(t => (
                          <UpcomingItem
                            key={t.id}
                            task={t}
                            project={projects.find(p => p.id === t.projectId)}
                            onClick={setEditingTask}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 text-center py-4">Brak nadchodzących zadań</div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* ── Dolny rząd: Notatki + Priority breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickNotes />
        <PriorityBreakdown tasks={tasks} />
      </div>

      {/* ── Modal edycji zadania ── */}
      <AnimatePresence>
        {editingTask && (
          <TaskModal
            projects={projects}
            task={editingTask}
            onSave={handleSaveTask}
            onDelete={onDeleteTask}
            onClose={() => setEditingTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
