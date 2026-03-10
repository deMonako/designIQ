import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Calendar, Clock,
  StickyNote, FolderKanban, Phone, Mail, Pencil,
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
    days < 0  ? "text-red-500 font-semibold" :
    days <= 7  ? "text-orange-600 font-semibold" :
                 "text-slate-400";

  const deadlineText =
    days < 0  ? `Termin minął ${Math.abs(days)} dni temu` :
    days === 0 ? "Termin dziś!" :
                 `${days} dni do terminu`;

  const statusColors = {
    "W trakcie":  "bg-blue-50 text-blue-600",
    "Wstrzymany": "bg-slate-100 text-slate-500",
    "Wstępny":    "bg-slate-100 text-slate-400",
  };

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
            className="h-full bg-brand-orange rounded-full transition-all"
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
    <div className="bg-amber-50 rounded-xl border border-amber-100 shadow-sm p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-slate-700">Szybkie notatki</span>
        {notes && <span className="ml-auto text-xs text-amber-300">zapisano lokalnie</span>}
      </div>
      <textarea
        value={notes}
        onChange={e => save(e.target.value)}
        placeholder="Wpisz notatkę, numer telefonu, przypomnienie…"
        className="flex-1 min-h-[100px] text-sm text-slate-700 resize-none outline-none placeholder-amber-300 leading-relaxed bg-transparent"
      />
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

  const totalDone     = tasks.filter(t => t.status === "Zrobione").length;
  const todayDone     = tasks.filter(t => String(t.dueDate || "").substring(0, 10) === TODAY && t.status === "Zrobione").length;
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

  // ── Stat chips ────────────────────────────────────────────────────────────

  const chips = [
    {
      icon:  <Clock className="w-3.5 h-3.5" />,
      value: todayItems.length,
      label: "na dziś",
      cls:   "bg-orange-50 text-orange-600 border-orange-200",
    },
    {
      icon:  <AlertTriangle className="w-3.5 h-3.5" />,
      value: overdueTasks.length,
      label: "zaległe",
      cls:   overdueTasks.length > 0
               ? "bg-red-50 text-red-600 border-red-200"
               : "bg-slate-50 text-slate-400 border-slate-200",
    },
    {
      icon:  <FolderKanban className="w-3.5 h-3.5" />,
      value: activeProjects.length,
      label: "aktywne proj.",
      cls:   "bg-slate-50 text-slate-600 border-slate-200",
    },
    {
      icon:  <CheckCircle2 className="w-3.5 h-3.5" />,
      value: totalDone,
      label: "ukończone",
      cls:   "bg-green-50 text-green-600 border-green-200",
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* ── Nagłówek ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <div className="text-4xl font-bold text-slate-900 capitalize tracking-tight leading-none">
            {weekday}
          </div>
          <div className="text-base text-slate-400 mt-1 font-medium">{dateFull}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {chips.map(c => (
            <div key={c.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm ${c.cls}`}>
              {c.icon}
              <span className="text-lg font-bold tabular-nums leading-none">{c.value}</span>
              <span className="text-xs font-medium opacity-70 hidden sm:block">{c.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="h-px bg-slate-200" />

      {/* ── Postęp na dziś ── */}
      {(todayItems.length + todayDone) > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 shrink-0">Dziś:</span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[180px]">
            <motion.div
              className="h-full bg-orange-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((todayDone / (todayItems.length + todayDone)) * 100)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs text-slate-400 tabular-nums">
            {todayDone}/{todayItems.length + todayDone}
          </span>
          {todayDone === todayItems.length + todayDone && todayDone > 0 && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Wszystko gotowe
            </span>
          )}
        </div>
      )}

      {/* ── Główna siatka (2 kolumny) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Lewa: Agenda + Zaległe [+ Nadchodzące gdy mało zadań] ─── */}
        <div className="space-y-5">

          {/* Agenda dnia */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-5 rounded-full bg-orange-500 flex-shrink-0" />
              <span className="text-sm font-bold text-slate-800">Agenda dnia</span>
              {todayDone > 0 && (
                <span className="ml-auto text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {todayDone} zrobione
                </span>
              )}
            </div>
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
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1 h-5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-sm font-bold text-red-600">Zaległe ({overdueTasks.length})</span>
                </div>
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
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-5 rounded-full bg-slate-300 flex-shrink-0" />
                <span className="text-sm font-bold text-slate-800">Nadchodzące</span>
              </div>
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
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-5 rounded-full bg-slate-400 flex-shrink-0" />
              <span className="text-sm font-bold text-slate-800">Aktywne projekty</span>
              <span className="ml-auto text-xs text-slate-400">{activeProjects.length}</span>
            </div>
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
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-5 rounded-full bg-slate-300 flex-shrink-0" />
                <span className="text-sm font-bold text-slate-800">Nadchodzące</span>
              </div>
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

      {/* ── Notatki ── */}
      <QuickNotes />

      {/* ── Modal edycji zadania (nadchodzące) ── */}
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
