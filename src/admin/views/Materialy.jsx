import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, BookOpen, Terminal, Link2, FolderOpen, Plus, X,
  Search, ExternalLink, Trash2, Package,
} from "lucide-react";

const CATEGORIES = ["Dokumentacje", "Instrukcje", "Skrypty", "Linki", "Inne"];

const CATEGORY_META = {
  "Dokumentacje": { icon: FileText,   color: "bg-blue-50 text-blue-600 border-blue-200",   dot: "bg-blue-500" },
  "Instrukcje":   { icon: BookOpen,   color: "bg-purple-50 text-purple-600 border-purple-200", dot: "bg-purple-500" },
  "Skrypty":      { icon: Terminal,   color: "bg-green-50 text-green-600 border-green-200",  dot: "bg-green-500" },
  "Linki":        { icon: Link2,      color: "bg-orange-50 text-orange-600 border-orange-200", dot: "bg-orange-500" },
  "Inne":         { icon: FolderOpen, color: "bg-slate-100 text-slate-600 border-slate-200",  dot: "bg-slate-400" },
};

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META["Inne"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}>
      <meta.icon className="w-3 h-3" />
      {category}
    </span>
  );
}

function MaterialCard({ material, onDelete }) {
  const meta = CATEGORY_META[material.category] ?? CATEGORY_META["Inne"];
  const isLink = material.url && material.url !== "#";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 flex items-start gap-3"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${meta.color}`}>
        <meta.icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm truncate">{material.title}</div>
            {material.description && (
              <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{material.description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <CategoryBadge category={material.category} />
          <span className="text-xs text-slate-400">{material.date}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 ml-1">
        {isLink && (
          <a
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
            title="Otwórz"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={() => onDelete(material.id)}
          className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
          title="Usuń"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function AddMaterialModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    title: "", category: "Dokumentacje", description: "", url: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({ ...form, id: `mat-${Date.now()}`, date: "2026-03-02" });
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
          <h2 className="text-lg font-bold text-slate-900">Nowy materiał</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Tytuł *</label>
            <input
              value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="Nazwa dokumentu / narzędzia..." required autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Kategoria</label>
            <select value={form.category} onChange={e => set("category", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Opis</label>
            <textarea
              value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Krótki opis zawartości..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 resize-none h-20"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">URL / link</label>
            <input
              value={form.url} onChange={e => set("url", e.target.value)}
              placeholder="https://..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">Anuluj</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">Dodaj</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Materialy({ materials, onAddMaterial, onDeleteMaterial }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    return materials.filter(m => {
      const matchSearch   = m.title.toLowerCase().includes(search.toLowerCase()) ||
                            (m.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || m.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [materials, search, categoryFilter]);

  // Group by category for the stats row
  const counts = CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: materials.filter(m => m.category === c).length }), {});

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj materiałów..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-700">
            <option value="all">Wszystkie kategorie</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Nowy materiał
        </button>
      </div>

      {/* Category stats */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.filter(c => counts[c] > 0).map(c => {
          const meta = CATEGORY_META[c];
          return (
            <button
              key={c}
              onClick={() => setCategoryFilter(categoryFilter === c ? "all" : c)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                categoryFilter === c ? `${meta.color} shadow-sm` : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <meta.icon className="w-3.5 h-3.5" />
              {c} <span className="font-bold">{counts[c]}</span>
            </button>
          );
        })}
        <span className="ml-1 text-xs text-slate-400 self-center">{filtered.length} wyników</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Brak materiałów spełniających kryteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(m => (
              <MaterialCard key={m.id} material={m} onDelete={onDeleteMaterial} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddMaterialModal onAdd={onAddMaterial} onClose={() => setShowAddModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
