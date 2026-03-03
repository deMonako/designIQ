import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Calendar, Clock, StickyNote,
  Play, Pause, RotateCcw, Coffee, FolderKanban, Flag,
  TrendingUp, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { TODAY, isOverdue } from "../mockData";

// ─── Stałe ────────────────────────────────────────────────────────────────────

const PRIORITY_DOT = {
  "Niski":     "bg-slate-300",
  "Normalny":  "bg-blue-400",
  "Wysoki":    "bg-orange-400",
  "Krytyczny": "bg-red-500",
};

const PRIORITY_BADGE = {
  "Niski":     "bg-slate-100 text-slate-500",
  "Normalny":  "bg-blue-50 text-blue-600",
  "Wysoki":    "bg-orange-50 text-orange-600",
  "Krytyczny": "bg-red-50 text-red-600",
};

const STATUS_BADGE = {
  "W trakcie":  { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400"   },
  "Wstrzymany": { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  "Ukończony":  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400"  },
  "Wstępny":    { bg: "bg-slate-100", text: "text-slate-600",  dot: "bg-slate-300"  },
};

const PRIORITY_ORDER = { "Krytyczny": 0, "Wysoki": 1, "Normalny": 2, "Niski": 3 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const now    = new Date(TODAY + "T00:00:00");
  return Math.ceil((target - now) / 86_400_000);
}

function formatDayShort(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return format(d, "EEE d MMM", { locale: pl });
}

// ─── AgendaRow (zadanie/wydarzenie na dziś) ───────────────────────────────────

function AgendaRow({ task, project, onStatusChange }) {
  const isDone  = task.status === "Zrobione";
  const isEvent = task.type === "event";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all ${
        isDone  ? "opacity-60" :
        isEvent ? "bg-indigo-50/60 border border-indigo-100" :
                  "bg-white border border-slate-100 hover:border-slate-200 shadow-sm"
      }`}
    >
      {/* Toggle / Ikona */}
      {isEvent ? (
        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-3 h-3 text-indigo-500" />
        </div>
      ) : (
        <button
          onClick={() => onStatusChange(task.id, isDone ? "Niezrobione" : "Zrobione")}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            isDone ? "bg-green-500 border-green-500" : "border-slate-300 hover:border-orange-400"
          }`}
        >
          {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
        </button>
      )}

      {/* Treść */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${
          isDone ? "line-through text-slate-400" : isEvent ? "text-indigo-800" : "text-slate-800"
        }`}>
          {task.title}
        </span>
        {project && (
          <span className="text-xs text-slate-400 ml-2">{project.name}</span>
        )}
      </div>

      {/* Badge */}
      {!isEvent && (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE["Normalny"]}`}>
          {task.priority}
        </span>
      )}
      {isEvent && (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0">
          Wydarzenie
        </span>
      )}
    </motion.div>
  );
}

// ─── OverdueRow (zaległe zadanie) ─────────────────────────────────────────────

function OverdueRow({ task, project, onStatusChange }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-red-50/60 border border-red-100"
    >
      <button
        onClick={() => onStatusChange(task.id, "Zrobione")}
        className="w-5 h-5 rounded-full border-2 border-red-300 hover:border-red-500 flex items-center justify-center flex-shrink-0 transition-all"
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-800">{task.title}</span>
        {project && <span className="text-xs text-slate-400 ml-2">{project.name}</span>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE["Normalny"]}`}>
          {task.priority}
        </span>
        <span className="text-xs text-red-500 font-medium">{task.dueDate}</span>
      </div>
    </motion.div>
  );
}

// ─── ProjectCard (mini karta projektu) ───────────────────────────────────────

function ProjectCard({ project }) {
  const days   = daysUntil(project.deadline);
  const status = STATUS_BADGE[project.status] ?? STATUS_BADGE["Wstępny"];

  const deadlineColor =
    days < 0  ? "text-red-500 font-bold" :
    days <= 7  ? "text-amber-600 font-semibold" :
    days <= 30 ? "text-orange-500" :
                 "text-slate-400";

  const barColor =
    project.progress >= 80 ? "bg-green-400" :
    project.progress >= 40 ? "bg-brand-orange" :
                              "bg-slate-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 truncate">{project.name}</div>
          <div className="text-xs text-slate-400 truncate">{project.client.name}</div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${status.bg} ${status.text}`}>
          {project.status}
        </span>
      </div>

      {/* Postęp */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-slate-500 tabular-nums w-7 text-right">
          {project.progress}%
        </span>
      </div>

      {/* Deadline */}
      <div className={`text-[11px] flex items-center gap-1 ${deadlineColor}`}>
        <Clock className="w-3 h-3 flex-shrink-0" />
        {days < 0
          ? `Termin minął ${Math.abs(days)} dni temu`
          : days === 0
            ? "Termin: dziś!"
            : `${days} dni do terminu`}
      </div>
    </motion.div>
  );
}

// ─── UpcomingItem (nadchodzące zadanie) ───────────────────────────────────────

function UpcomingItem({ task, project }) {
  const isEvent = task.type === "event";
  const pStyle  = PRIORITY_DOT[task.priority] ?? PRIORITY_DOT["Normalny"];

  return (
    <div className="flex items-center gap-2 py-1.5 text-xs">
      {isEvent
        ? <Calendar className="w-3 h-3 text-indigo-400 flex-shrink-0" />
        : <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pStyle}`} />
      }
      <span className={`flex-1 truncate font-medium ${isEvent ? "text-indigo-700" : "text-slate-700"}`}>
        {task.title}
      </span>
      {project && (
        <span className="text-slate-300 truncate max-w-[80px]">{project.name.split(" ")[0]}</span>
      )}
    </div>
  );
}

// ─── Quick Notes ─────────────────────────────────────────────────────────────

function QuickNotes() {
  const [notes, setNotes] = useState(() => localStorage.getItem("diq_notes") || "");
  const save = (v) => { setNotes(v); localStorage.setItem("diq_notes", v); };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-slate-700">Szybkie notatki</span>
        {notes && <span className="ml-auto text-xs text-slate-300">zapisano lokalnie</span>}
      </div>
      <textarea
        value={notes}
        onChange={e => save(e.target.value)}
        placeholder="Wpisz szybką notatkę, numer telefonu, przypomnienie…"
        className="flex-1 min-h-[120px] text-sm text-slate-700 resize-none outline-none placeholder-slate-300 leading-relaxed"
      />
    </div>
  );
}

// ─── Pomodoro Timer ───────────────────────────────────────────────────────────

const POMODORO_MODES = {
  work:       { label: "Praca",           secs: 25 * 60, color: "text-orange-600", bg: "bg-orange-50",  stroke: "#f97316" },
  shortBreak: { label: "Krótka przerwa",  secs:  5 * 60, color: "text-green-600",  bg: "bg-green-50",   stroke: "#22c55e" },
  longBreak:  { label: "Długa przerwa",   secs: 15 * 60, color: "text-blue-600",   bg: "bg-blue-50",    stroke: "#3b82f6" },
};

function PomodoroTimer() {
  const [state,  setState]  = useState({ mode: "work", running: false, seconds: 25 * 60 });
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => {
      setState(prev => {
        if (prev.seconds > 1) return { ...prev, seconds: prev.seconds - 1 };
        const nextRounds = prev.mode === "work" ? rounds + 1 : rounds;
        setRounds(nextRounds);
        const nextMode = prev.mode === "work"
          ? (nextRounds % 4 === 0 ? "longBreak" : "shortBreak") : "work";
        return { mode: nextMode, running: false, seconds: POMODORO_MODES[nextMode].secs };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.running, rounds]);

  const cfg    = POMODORO_MODES[state.mode];
  const mm     = String(Math.floor(state.seconds / 60)).padStart(2, "0");
  const ss     = String(state.seconds % 60).padStart(2, "0");
  const radius = 28;
  const circ   = 2 * Math.PI * radius;
  const pct    = 1 - state.seconds / cfg.secs;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Coffee className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-slate-700">Focus Timer</span>
        {rounds > 0 && (
          <span className="ml-auto text-xs text-slate-400">{rounds} {rounds === 1 ? "runda" : "rundy"}</span>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-4">
        {Object.entries(POMODORO_MODES).map(([key, m]) => (
          <button
            key={key}
            onClick={() => setState({ mode: key, running: false, seconds: m.secs })}
            className={`flex-1 text-xs py-1 rounded-lg font-medium transition-all ${
              state.mode === key ? `${cfg.bg} ${cfg.color}` : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Display */}
      <div className="flex items-center justify-center gap-5 flex-1">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
            <circle
              cx="32" cy="32" r={radius} fill="none"
              stroke={cfg.stroke} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
              className="transition-all duration-1000"
            />
          </svg>
          <span className={`text-sm font-bold tabular-nums ${cfg.color}`}>{mm}:{ss}</span>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setState(p => ({ ...p, running: !p.running }))}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              state.running ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : `${cfg.bg} ${cfg.color}`
            }`}
          >
            {state.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {state.running ? "Pauza" : "Start"}
          </button>
          <button
            onClick={() => setState({ mode: "work", running: false, seconds: 25 * 60 })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ projects, tasks, onUpdateTask }) {
  const todayDate  = new Date(TODAY + "T00:00:00");
  const weekday    = format(todayDate, "EEEE",         { locale: pl });
  const dateFull   = format(todayDate, "d MMMM yyyy", { locale: pl });

  // Agregaty
  const todayItems   = tasks
    .filter(t => t.dueDate === TODAY && t.status !== "Zrobione")
    .sort((a, b) => {
      if (a.type === "event" && b.type !== "event") return -1;
      if (a.type !== "event" && b.type === "event") return 1;
      return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    });

  const overdueTasks = tasks
    .filter(t => t.type !== "event" && isOverdue(t.dueDate, t.status))
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

  const todayDone  = tasks.filter(t => t.dueDate === TODAY && t.status === "Zrobione").length;
  const totalDone  = tasks.filter(t => t.status === "Zrobione").length;

  const activeProjects = projects
    .filter(p => p.status !== "Ukończony")
    .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline));

  // Nadchodzące: jutro + 7 dni, bez dziś i zaległych
  const upcoming = tasks
    .filter(t => t.dueDate > TODAY && t.status !== "Zrobione")
    .sort((a, b) => {
      if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      if (a.type === "event" && b.type !== "event") return -1;
      if (a.type !== "event" && b.type === "event") return 1;
      return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    })
    .slice(0, 8);

  // Pogrupuj nadchodzące po dacie
  const upcomingByDate = upcoming.reduce((acc, t) => {
    if (!acc[t.dueDate]) acc[t.dueDate] = [];
    acc[t.dueDate].push(t);
    return acc;
  }, {});

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) onUpdateTask({ ...task, status: newStatus });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl">

      {/* ── Nagłówek: data + statystyki ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <div className="text-4xl font-bold text-slate-900 capitalize tracking-tight leading-none">
              {weekday}
            </div>
            <div className="text-base text-slate-400 mt-1 font-medium">{dateFull}</div>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-2">
            {[
              {
                icon: <Clock className="w-3.5 h-3.5" />,
                label: "na dziś",
                value: todayItems.length,
                color: todayItems.length > 0 ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-slate-50 text-slate-500 border-slate-200",
              },
              {
                icon: <AlertTriangle className="w-3.5 h-3.5" />,
                label: "zaległe",
                value: overdueTasks.length,
                color: overdueTasks.length > 0 ? "bg-red-50 text-red-600 border-red-200" : "bg-slate-50 text-slate-400 border-slate-200",
              },
              {
                icon: <FolderKanban className="w-3.5 h-3.5" />,
                label: "aktywne projekty",
                value: activeProjects.length,
                color: "bg-blue-50 text-blue-700 border-blue-200",
              },
              {
                icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                label: "ukończone",
                value: totalDone,
                color: "bg-green-50 text-green-700 border-green-200",
              },
            ].map(chip => (
              <div key={chip.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${chip.color}`}>
                {chip.icon}
                <span className="text-xl font-bold tabular-nums leading-none">{chip.value}</span>
                <span className="text-xs font-medium opacity-70 hidden sm:block">{chip.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-200" />
      </motion.div>

      {/* ── Główna siatka ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Lewa kolumna (agenda + zaległe) ─── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Agenda dnia */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-brand-orange flex-shrink-0" />
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
                    <div className="text-xs opacity-70 mt-0.5">Sprawdź nadchodzące zadania po prawej.</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Zaległe */}
          <AnimatePresence>
            {overdueTasks.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-sm font-bold text-red-600">
                    Zaległe ({overdueTasks.length})
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="space-y-1.5">
                  {overdueTasks.map(t => (
                    <OverdueRow
                      key={t.id}
                      task={t}
                      project={projects.find(p => p.id === t.projectId)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Notatki + Pomodoro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <QuickNotes />
            <PomodoroTimer />
          </div>
        </div>

        {/* ─── Prawa kolumna (projekty + nadchodzące) ─── */}
        <div className="space-y-5">

          {/* Aktywne projekty */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-sm font-bold text-slate-800">Aktywne projekty</span>
              <span className="ml-auto text-xs text-slate-400">{activeProjects.length}</span>
            </div>
            {activeProjects.length > 0 ? (
              <div className="space-y-2">
                {activeProjects.map(p => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-4">Brak aktywnych projektów</div>
            )}
          </section>

          {/* Nadchodzące */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-slate-400 flex-shrink-0" />
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
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-4">
                Brak zaplanowanych zadań
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
