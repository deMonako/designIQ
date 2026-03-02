import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle, StickyNote, Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { TODAY, isOverdue } from "../mockData";

const PRIORITY_DOT = {
  "Niski":     "bg-slate-300",
  "Normalny":  "bg-blue-400",
  "Wysoki":    "bg-orange-400",
  "Krytyczny": "bg-red-500",
};

function TaskCard({ task, project, onStatusChange }) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all ${
        overdue ? "border-red-200 bg-red-50/30" : "border-slate-200"
      }`}
    >
      {/* Status toggle */}
      <button
        onClick={() => {
          const next = { "Niezrobione": "Zrobione", "Zrobione": "Niezrobione" };
          onStatusChange(task.id, next[task.status]);
        }}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          task.status === "Zrobione" ? "bg-green-500 border-green-500" : "border-slate-300 hover:border-orange-400"
        }`}
      >
        {task.status === "Zrobione" && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${task.status === "Zrobione" ? "line-through text-slate-400" : "text-slate-800"}`}>
          {task.title}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {project?.name ?? "Nieprzypisany"}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] ?? "bg-slate-300"}`} />
        {overdue && (
          <span className="text-xs text-red-500 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {task.dueDate}
          </span>
        )}
        {!overdue && task.status === "Niezrobione" && (
          <span className="text-xs text-slate-500 font-medium">Niezrobione</span>
        )}
      </div>
    </motion.div>
  );
}

// ── Quick Notes ───────────────────────────────────────────────────────────────

function QuickNotes() {
  const [notes, setNotes] = useState(() => localStorage.getItem("diq_notes") || "");

  const handleChange = (e) => {
    setNotes(e.target.value);
    localStorage.setItem("diq_notes", e.target.value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-slate-700">Szybkie notatki</span>
        {notes && (
          <span className="ml-auto text-xs text-slate-300">zapisano lokalnie</span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Wpisz szybką notatkę, numer telefonu, przypomnienie..."
        className="w-full h-28 text-sm text-slate-700 resize-none outline-none placeholder-slate-300 leading-relaxed"
      />
    </motion.div>
  );
}

// ── Pomodoro Timer ────────────────────────────────────────────────────────────

const POMODORO_MODES = {
  work:       { label: "Praca",        secs: 25 * 60, color: "text-orange-600", bg: "bg-orange-50",  ring: "border-orange-400" },
  shortBreak: { label: "Krótka przerwa", secs: 5 * 60, color: "text-green-600",  bg: "bg-green-50",   ring: "border-green-400"  },
  longBreak:  { label: "Długa przerwa",  secs: 15 * 60,color: "text-blue-600",   bg: "bg-blue-50",    ring: "border-blue-400"   },
};

function PomodoroTimer() {
  const [state, setState] = useState({ mode: "work", running: false, seconds: 25 * 60 });
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => {
      setState(prev => {
        if (prev.seconds <= 1) {
          const nextRounds = prev.mode === "work" ? rounds + 1 : rounds;
          setRounds(nextRounds);
          const nextMode = prev.mode === "work"
            ? (nextRounds % 4 === 0 ? "longBreak" : "shortBreak")
            : "work";
          return { mode: nextMode, running: false, seconds: POMODORO_MODES[nextMode].secs };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.running, rounds]);

  const cfg    = POMODORO_MODES[state.mode];
  const mm     = String(Math.floor(state.seconds / 60)).padStart(2, "0");
  const ss     = String(state.seconds % 60).padStart(2, "0");
  const pct    = 1 - state.seconds / cfg.secs;
  const radius = 28;
  const circ   = 2 * Math.PI * radius;

  const reset = () => setState({ mode: "work", running: false, seconds: 25 * 60 });
  const switchMode = (mode) => setState({ mode, running: false, seconds: POMODORO_MODES[mode].secs });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 ${state.running ? "border-" + cfg.ring.split("-")[1] + "-200" : ""}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Coffee className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-slate-700">Focus Timer</span>
        {rounds > 0 && (
          <span className="ml-auto text-xs text-slate-400">{rounds} {rounds === 1 ? "runda" : "rundy"}</span>
        )}
      </div>

      {/* Mode selector */}
      <div className="flex gap-1 mb-4">
        {Object.entries(POMODORO_MODES).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 text-xs py-1 rounded-lg font-medium transition-all ${state.mode === key ? cfg.bg + " " + cfg.color : "text-slate-400 hover:text-slate-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div className="flex items-center justify-center gap-5">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
            <circle
              cx="32" cy="32" r={radius} fill="none"
              stroke={state.mode === "work" ? "#f97316" : state.mode === "shortBreak" ? "#22c55e" : "#3b82f6"}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              className="transition-all duration-1000"
            />
          </svg>
          <span className={`text-sm font-bold tabular-nums ${cfg.color}`}>{mm}:{ss}</span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setState(p => ({ ...p, running: !p.running }))}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              state.running
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : cfg.bg + " " + cfg.color + " hover:opacity-80"
            }`}
          >
            {state.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {state.running ? "Pauza" : "Start"}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard({ projects, tasks, onUpdateTask }) {
  const today = new Date(TODAY);
  const dateLabel = format(today, "EEEE, d MMMM yyyy", { locale: pl });
  const dayOfWeek = dateLabel.split(",")[0];
  const rest      = dateLabel.split(",").slice(1).join(",").trim();

  const todayTasks   = tasks.filter(t => t.dueDate === TODAY && t.status !== "Zrobione");
  const overdueTasks = tasks.filter(t => t.dueDate < TODAY && isOverdue(t.dueDate, t.status));

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) onUpdateTask({ ...task, status: newStatus });
  };

  const noTasks = todayTasks.length === 0 && overdueTasks.length === 0;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-8">

      {/* Date header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center pt-4"
      >
        <div className="text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight capitalize">
          {dayOfWeek}
        </div>
        <div className="text-lg text-slate-400 mt-2 font-medium">{rest}</div>
      </motion.div>

      {/* Overdue */}
      <AnimatePresence>
        {overdueTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-600">
                Zaległe ({overdueTasks.length})
              </span>
            </div>
            <div className="space-y-2">
              {overdueTasks.map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  project={projects.find(p => p.id === t.projectId)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today */}
      <AnimatePresence>
        {todayTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-slate-700">
                Na dziś ({todayTasks.length})
              </span>
            </div>
            <div className="space-y-2">
              {todayTasks.map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  project={projects.find(p => p.id === t.projectId)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {noTasks && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center"
          >
            <CheckCircle2 className="w-14 h-14 mx-auto text-green-400 mb-4" />
            <div className="text-xl font-semibold text-slate-700">Wszystko ogarnięte!</div>
            <div className="text-sm text-slate-400 mt-2">Brak zadań na dziś ani zaległych.</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widgets row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickNotes />
        <PomodoroTimer />
      </div>
    </div>
  );
}
