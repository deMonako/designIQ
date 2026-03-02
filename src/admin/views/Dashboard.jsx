import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
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
          const next = { "Todo": "W trakcie", "W trakcie": "Zrobione", "Zrobione": "Todo" };
          onStatusChange(task.id, next[task.status]);
        }}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          task.status === "Zrobione"   ? "bg-green-500 border-green-500" :
          task.status === "W trakcie" ? "border-blue-400 bg-blue-50"    :
          "border-slate-300 hover:border-orange-400"
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
        {!overdue && task.status === "W trakcie" && (
          <span className="text-xs text-blue-500 font-medium">W trakcie</span>
        )}
      </div>
    </motion.div>
  );
}

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
    </div>
  );
}
