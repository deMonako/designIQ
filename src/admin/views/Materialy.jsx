import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, BookOpen, Terminal, Link2, FolderOpen, Plus, X,
  Search, ExternalLink, Trash2, Package, Cpu, Upload, Library,
} from "lucide-react";
import { uploadFile } from "../api/gasApi";
import { GAS_CONFIG } from "../api/gasConfig";

const CATEGORIES = ["Dokumentacje", "Instrukcje", "Skrypty", "Linki", "Inne"];
const DEVICES    = ["Fotowoltaika", "Rekuperacja", "Ogrzewanie", "Klimatyzacja", "Alarm", "KNX", "Loxone"];

// Kategorie zakupowe (te same co w Zakupy.jsx)
const SHOP_CATEGORIES = [
  { key: "smart_home", label: "Sprzęt Smart Home" },
  { key: "cables",     label: "Kable i osprzęt" },
  { key: "cabinet",    label: "Szafa sterownicza" },
  { key: "audio",      label: "Audio / Video" },
  { key: "security",   label: "Monitoring i bezpieczeństwo" },
  { key: "other",      label: "Inne" },
];

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

function DeviceBadge({ device }) {
  if (!device) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-teal-50 text-teal-700 border-teal-200">
      <Cpu className="w-3 h-3" />
      {device}
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
          <DeviceBadge device={material.device} />
          {material.shopCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-orange-50 text-orange-700 border-orange-200">
              {SHOP_CATEGORIES.find(c => c.key === material.shopCategory)?.label ?? material.shopCategory}
            </span>
          )}
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

const EXT_TYPE_MAT = {
  pdf: "pdf", xlsx: "xlsx", xls: "xlsx", dwg: "dwg", dxf: "dwg",
  docx: "docx", doc: "docx",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image",
};

function AddMaterialModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    title: "", category: "Dokumentacje", device: "", description: "", shopCategory: "",
  });
  const [matFile,      setMatFile]      = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setMatFile(f);
    setUploadError(null);
    if (!form.title) set("title", f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!matFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = await uploadFile(matFile, null); // null = folder Materiały
      onAdd({
        ...form,
        id: `mat-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        url: uploaded.url,
        driveId: uploaded.driveId,
      });
      onClose();
    } catch(err) {
      setUploadError("Błąd przesyłania: " + err.message);
      setUploading(false);
    }
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
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Urządzenie / technologia</label>
            <select value={form.device} onChange={e => set("device", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
              <option value="">Brak</option>
              {DEVICES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Kategoria zakupowa</label>
            <select value={form.shopCategory} onChange={e => set("shopCategory", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
              <option value="">Brak (automatycznie)</option>
              {SHOP_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
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
          {/* File picker */}
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Plik *</label>
            {!matFile ? (
              <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-slate-200 rounded-xl px-4 py-4 hover:border-orange-300 hover:bg-orange-50/40 transition-all">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">Kliknij aby wybrać plik</div>
                  <div className="text-xs text-slate-400 mt-0.5">PDF, DWG, XLSX, DOCX, obraz…</div>
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{matFile.name}</div>
                  <div className="text-xs text-slate-400">{(matFile.size / 1024).toFixed(0)} KB</div>
                </div>
                <button type="button" onClick={() => { setMatFile(null); setUploadError(null); }}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {uploadError && <p className="text-xs text-red-500 font-medium mt-1.5">{uploadError}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">Anuluj</button>
            <button type="submit" disabled={!matFile || uploading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
              {uploading
                ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Przesyłanie…</>
                : "Dodaj materiał"
              }
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Materialy({ materials, onAddMaterial, onDeleteMaterial }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    let result = materials.filter(m => {
      const matchSearch   = m.title.toLowerCase().includes(search.toLowerCase()) ||
                            (m.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || m.category === categoryFilter;
      const matchDevice   = deviceFilter === "all"
        ? true
        : deviceFilter === "_none"
        ? !m.device
        : m.device === deviceFilter;
      return matchSearch && matchCategory && matchDevice;
    });

    if (sortBy === "category") {
      result = [...result].sort((a, b) => a.category.localeCompare(b.category, "pl"));
    } else if (sortBy === "device") {
      result = [...result].sort((a, b) => (a.device || "").localeCompare(b.device || "", "pl"));
    } else if (sortBy === "category-device") {
      result = [...result].sort((a, b) => {
        const c = a.category.localeCompare(b.category, "pl");
        return c !== 0 ? c : (a.device || "").localeCompare(b.device || "", "pl");
      });
    }

    return result;
  }, [materials, search, categoryFilter, deviceFilter, sortBy]);

  // Group by category for the stats row
  const counts = CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: materials.filter(m => m.category === c).length }), {});

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Nagłówek */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          <Library className="w-4 h-4 text-slate-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Baza wiedzy</h2>
          <p className="text-xs text-slate-400">Dokumentacje, instrukcje i zasoby systemowe</p>
        </div>
      </div>

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
          <select value={deviceFilter} onChange={e => setDeviceFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-700">
            <option value="all">Wszystkie urządzenia</option>
            {DEVICES.map(d => <option key={d}>{d}</option>)}
            <option value="_none">Bez tagu urządzenia</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-700">
            <option value="default">Sortuj: domyślnie</option>
            <option value="category">Sortuj: kategoria A-Z</option>
            <option value="device">Sortuj: urządzenie A-Z</option>
            <option value="category-device">Sortuj: kategoria + urządzenie</option>
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
