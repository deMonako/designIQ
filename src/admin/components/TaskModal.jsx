import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, Calendar, Trash2 } from "lucide-react";
import { TODAY } from "../mockData";

const PRIORITY_OPTIONS = ["Niski", "Normalny", "Wysoki", "Krytyczny"];

// Specjalny pseudo-projekt firmowy (nie jest prawdziwym projektem w bazie)
export const DESIGNIQ_PROJECT_ID = "__designiq__";

export function projectLabel(projectId, projects) {
  if (!projectId || projectId === "none") return "Nieprzypisany";
  if (projectId === DESIGNIQ_PROJECT_ID) return "designIQ";
  return projects?.find(p => p.id === projectId)?.name ?? "—";
}

export default function TaskModal({ projects = [], task, defaultDate, onSave, onDelete, onClose }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title:       task?.title       ?? "",
    projectId:   task?.projectId   ?? "none",
    priority:    task?.priority    ?? "Normalny",
    dueDate:     task?.dueDate     ?? defaultDate ?? TODAY,
    description: task?.description ?? "",
    type:        task?.type        ?? "task",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete?.(task.id);
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
                key={opt.value} type="button"
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

          {/* Projekt + priorytet */}
          <div className="grid grid-cols-2 gap-3">
            <div className={form.type === "task" ? "" : "col-span-2"}>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Projekt</label>
              <select
                value={form.projectId}
                onChange={e => set("projectId", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="none">— Nieprzypisany —</option>
                <option value={DESIGNIQ_PROJECT_ID}>designIQ</option>
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

          {/* Przyciski */}
          <div className="flex gap-3 pt-1">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                onBlur={() => setConfirmDelete(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  confirmDelete
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmDelete ? "Potwierdź usunięcie" : "Usuń"}
              </button>
            )}
            <button
              type="button" onClick={onClose}
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
