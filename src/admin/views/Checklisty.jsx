import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Circle, Globe, Layers, BookOpen, X, Trash2, ClipboardList } from "lucide-react";

const TYPE_LABELS = { globalna: "Globalna", etapowa: "Etapowa", projektowa: "Projektowa" };
const TYPE_ICONS = { globalna: Globe, etapowa: Layers, projektowa: BookOpen };
const TYPE_COLORS = {
  globalna:   "bg-indigo-50 text-indigo-700 border border-indigo-200",
  etapowa:    "bg-orange-50 text-orange-700 border border-orange-200",
  projektowa: "bg-green-50 text-green-700 border border-green-200",
};

function TypeBadge({ type }) {
  const Icon = TYPE_ICONS[type] || Globe;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[type] || TYPE_COLORS.globalna}`}>
      <Icon className="w-3 h-3" />
      {TYPE_LABELS[type] || type}
    </span>
  );
}

function ChecklistCard({ checklist, project, onToggleItem, onAddItem, onDeleteChecklist }) {
  const [newItemText, setNewItemText] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);

  const doneCount = checklist.items.filter(i => i.done).length;
  const total = checklist.items.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAddItem(checklist.id, newItemText.trim());
    setNewItemText("");
    setShowAddItem(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm">{checklist.title}</h3>
            {project && (
              <div className="text-xs text-slate-400 mt-0.5">{project.name}</div>
            )}
            {checklist.stage && (
              <div className="text-xs text-slate-400">{checklist.stage}</div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <TypeBadge type={checklist.type} />
            <button
              onClick={() => onDeleteChecklist(checklist.id)}
              className="p-1 text-slate-300 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : "bg-orange-400"}`}
            />
          </div>
          <span className={`text-xs font-semibold ${pct === 100 ? "text-green-600" : "text-slate-500"}`}>
            {doneCount}/{total}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 py-3 space-y-2">
        <AnimatePresence>
          {checklist.items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2.5 group"
            >
              <button
                onClick={() => onToggleItem(checklist.id, item.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  item.done
                    ? "bg-green-500 border-green-500 hover:bg-green-600"
                    : "border-slate-300 hover:border-orange-400"
                }`}
              >
                {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
              </button>
              <span className={`text-sm flex-1 ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                {item.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add item */}
        <AnimatePresence>
          {showAddItem ? (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddItem}
              className="flex items-center gap-2 mt-2"
            >
              <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
              <input
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                placeholder="Nowy punkt checklisty..."
                className="flex-1 text-sm border-b border-orange-400 outline-none py-0.5 text-slate-800 bg-transparent placeholder-slate-300"
                autoFocus
              />
              <button type="submit" className="text-xs text-orange-600 font-medium hover:text-orange-700">Dodaj</button>
              <button type="button" onClick={() => setShowAddItem(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </motion.form>
          ) : (
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-orange-600 transition-colors mt-1 py-1"
            >
              <Plus className="w-3.5 h-3.5" /> Dodaj punkt
            </button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AddChecklistModal({ projects, onAdd, onClose }) {
  const [form, setForm] = useState({
    title: "", type: "etapowa", projectId: "", stage: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      id: `ch-${Date.now()}`,
      title: form.title,
      type: form.type,
      projectId: form.projectId || null,
      stage: form.stage || null,
      items: [],
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Nowa checklista</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Tytuł *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="Nazwa checklisty..." required autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Typ</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                <option value="etapowa">Etapowa</option>
                <option value="projektowa">Projektowa</option>
                <option value="globalna">Globalna</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Etap (opcjonalne)</label>
              <input value={form.stage} onChange={e => set("stage", e.target.value)}
                placeholder="np. Etap 3"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>
          </div>
          {form.type !== "globalna" && (
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Projekt</label>
              <select value={form.projectId} onChange={e => set("projectId", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                <option value="">— bez projektu —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">Anuluj</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">Utwórz</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Checklisty({ projects, checklists, onToggleItem, onAddItem, onAddChecklist, onDeleteChecklist }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    return checklists.filter(cl => {
      const matchType = typeFilter === "all" || cl.type === typeFilter;
      const matchProject = projectFilter === "all" || cl.projectId === projectFilter || (projectFilter === "global" && !cl.projectId);
      return matchType && matchProject;
    });
  }, [checklists, typeFilter, projectFilter]);

  const totalItems = checklists.reduce((acc, cl) => acc + cl.items.length, 0);
  const doneItems  = checklists.reduce((acc, cl) => acc + cl.items.filter(i => i.done).length, 0);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Nagłówek */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Checklisty</h2>
          <p className="text-xs text-slate-400">Listy kontrolne projektów i etapów realizacji</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-700">
            <option value="all">Wszystkie typy</option>
            <option value="globalna">Globalne</option>
            <option value="etapowa">Etapowe</option>
            <option value="projektowa">Projektowe</option>
          </select>
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-700">
            <option value="all">Wszystkie projekty</option>
            <option value="global">Globalne (bez projektu)</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Nowa checklista
        </button>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Globalny postęp checklist</span>
          <span className="text-sm font-bold text-orange-600">{doneItems}/{totalItems} punktów</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: totalItems > 0 ? `${Math.round((doneItems / totalItems) * 100)}%` : "0%" }}
            transition={{ duration: 0.8 }}
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <span><span className="font-semibold text-slate-700">{checklists.length}</span> checklist</span>
          <span><span className="font-semibold text-slate-700">{totalItems}</span> punktów łącznie</span>
          <span><span className="font-semibold text-green-600">{doneItems}</span> ukończonych</span>
        </div>
      </div>

      {/* Checklist grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Brak checklist spełniających kryteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(cl => (
            <ChecklistCard
              key={cl.id}
              checklist={cl}
              project={projects.find(p => p.id === cl.projectId)}
              onToggleItem={onToggleItem}
              onAddItem={onAddItem}
              onDeleteChecklist={onDeleteChecklist}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddChecklistModal
            projects={projects}
            onAdd={onAddChecklist}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
