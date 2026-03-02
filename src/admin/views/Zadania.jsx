import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, CheckCircle2, AlertTriangle, Calendar,
  LayoutList, Columns, CalendarDays,
} from "lucide-react";
import { isOverdue, TODAY } from "../mockData";
import TaskCalendar from "./TaskCalendar";

const STATUS_OPTIONS   = ["Niezrobione", "Zrobione"];
const PRIORITY_OPTIONS = ["Niski", "Normalny", "Wysoki", "Krytyczny"];

function PriorityBadge({ priority }) {
  const s = {
    "Niski":     "bg-slate-100 text-slate-500",
    "Normalny":  "bg-blue-50 text-blue-600",
    "Wysoki":    "bg-orange-50 text-orange-600",
    "Krytyczny": "bg-red-50 text-red-600 border border-red-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${s[priority] ?? s["Normalny"]}`}>{priority}</span>;
}

function StatusBadge({ status }) {
  const s = {
    "Niezrobione": "bg-slate-100 text-slate-600",
    "Zrobione":    "bg-green-50 text-green-700 border border-green-200",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s[status] ?? s["Niezrobione"]}`}>{status}</span>;
}

function TaskRow({ task, project, onStatusChange }) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${overdue ? "bg-red-50/30" : ""}`}
    >
      <button
        onClick={() => {
          const next = { "Niezrobione": "Zrobione", "Zrobione": "Niezrobione" };
          onStatusChange(task.id, next[task.status]);
        }}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          task.status === "Zrobione" ? "bg-green-500 border-green-500" : "border-slate-300 hover:border-orange-400"
        }`}
      >
        {task.status === "Zrobione" && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${task.status === "Zrobione" ? "line-through text-slate-400" : "text-slate-800"}`}>
          {task.title}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {project?.name ?? <span className="italic">Nieprzypisany</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        <span className={`text-xs font-medium flex items-center gap-1 ${overdue ? "text-red-500" : "text-slate-400"}`}>
          {overdue && <AlertTriangle className="w-3 h-3" />}
          <Calendar className="w-3 h-3" />
          {task.dueDate === TODAY ? "Dziś" : task.dueDate}
        </span>
      </div>
    </motion.div>
  );
}

function KanbanColumn({ title, tasks, projects, color, onStatusChange, nextStatus }) {
  return (
    <div className={`flex-1 min-w-[260px] bg-white rounded-xl border ${color} shadow-sm`}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="font-semibold text-slate-700 text-sm">{title}</span>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{tasks.length}</span>
      </div>
      <div className="p-3 space-y-2 min-h-[200px]">
        {tasks.map(task => {
          const project = projects.find(p => p.id === task.projectId);
          const overdue = isOverdue(task.dueDate, task.status);
          return (
            <div key={task.id} className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-all ${overdue ? "border-red-200 bg-red-50/30" : "border-slate-200"}`}>
              <div className="text-sm font-medium text-slate-800 mb-2">{task.title}</div>
              <div className="flex items-center justify-between gap-2">
                <PriorityBadge priority={task.priority} />
                <span className="text-xs text-slate-400 truncate">{project?.name ?? "Nieprzypisany"}</span>
              </div>
              <div className={`text-xs mt-2 flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
                <Calendar className="w-3 h-3" />
                {task.dueDate === TODAY ? "Dziś" : task.dueDate}
                {overdue && <AlertTriangle className="w-3 h-3" />}
              </div>
              {nextStatus && (
                <button
                  onClick={() => onStatusChange(task.id, nextStatus)}
                  className="mt-2 text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  → {nextStatus === "Zrobione" ? "Zakończ" : "Cofnij"}
                </button>
              )}
            </div>
          );
        })}
        {tasks.length === 0 && <div className="text-xs text-slate-300 text-center py-6">Brak zadań</div>}
      </div>
    </div>
  );
}

function AddTaskModal({ projects, onAdd, onClose }) {
  const [form, setForm] = useState({
    title: "", projectId: "none", priority: "Normalny", dueDate: TODAY, description: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      ...form,
      id:        `t-${Date.now()}`,
      status:    "Niezrobione",
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
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Nowe zadanie</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Tytuł *</label>
            <input
              value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="Nazwa zadania..." required autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Projekt</label>
              <select value={form.projectId} onChange={e => set("projectId", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                <option value="none">— Nieprzypisany —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Priorytet</label>
              <select value={form.priority} onChange={e => set("priority", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Termin</label>
              <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Opis</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Opcjonalny opis zadania..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 resize-none h-20"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">Anuluj</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">Dodaj zadanie</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Zadania({ projects, tasks, onUpdateTask, onAddTask }) {
  const [viewMode, setViewMode] = useState("list");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch   = t.title.toLowerCase().includes(search.toLowerCase());
      const matchProject  = projectFilter === "all" || (projectFilter === "none" ? t.projectId === null : t.projectId === projectFilter);
      const matchStatus   = statusFilter === "all" || t.status === statusFilter;
      const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
      const matchOverdue  = !showOverdueOnly || isOverdue(t.dueDate, t.status);
      return matchSearch && matchProject && matchStatus && matchPriority && matchOverdue;
    });
  }, [tasks, search, projectFilter, statusFilter, priorityFilter, showOverdueOnly]);

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) onUpdateTask({ ...task, status: newStatus });
  };

  const overdueCount = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj zadania..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-700">
            <option value="all">Wszystkie projekty</option>
            <option value="none">Nieprzypisany</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-700">
            <option value="all">Wszystkie statusy</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-700">
            <option value="all">Każdy priorytet</option>
            {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
          </select>
          {overdueCount > 0 && (
            <button
              onClick={() => setShowOverdueOnly(!showOverdueOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${showOverdueOnly ? "bg-red-500 text-white border-red-500" : "bg-white border-slate-200 text-red-500 hover:bg-red-50"}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Po terminie ({overdueCount})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View mode */}
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list"   ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50"}`} title="Lista"><LayoutList className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("kanban")} className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50"}`} title="Kanban"><Columns className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("calendar")} className={`p-2 transition-colors ${viewMode === "calendar" ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50"}`} title="Kalendarz"><CalendarDays className="w-4 h-4" /></button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Nowe zadanie
          </button>
        </div>
      </div>

      {/* Stats */}
      {viewMode !== "calendar" && (
        <div className="flex gap-3 flex-wrap text-sm text-slate-500">
          {STATUS_OPTIONS.map(s => {
            const count = tasks.filter(t => t.status === s).length;
            return <span key={s}><span className="font-semibold text-slate-700">{count}</span> {s}</span>;
          })}
          <span className="text-slate-300">·</span>
          <span>{filtered.length} wyników</span>
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Brak zadań spełniających kryteria</p>
            </div>
          ) : (
            filtered.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                project={projects.find(p => p.id === task.projectId)}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      )}

      {/* Kanban view */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn title="Niezrobione" tasks={filtered.filter(t => t.status === "Niezrobione")} projects={projects} color="border-slate-200"  onStatusChange={handleStatusChange} nextStatus="Zrobione" />
          <KanbanColumn title="Zrobione"   tasks={filtered.filter(t => t.status === "Zrobione")}   projects={projects} color="border-green-200"  onStatusChange={handleStatusChange} nextStatus="Niezrobione" />
        </div>
      )}

      {/* Calendar view */}
      {viewMode === "calendar" && (
        <TaskCalendar tasks={tasks} projects={projects} />
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddTaskModal projects={projects} onAdd={onAddTask} onClose={() => setShowAddModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
