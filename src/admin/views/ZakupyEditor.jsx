import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Plus, Trash2, Save, Loader2, ShoppingCart, ChevronDown, ChevronUp,
  ExternalLink, Package
} from "lucide-react";
import { toast } from "sonner";
import { getZakupy, upsertZakupy } from "../api/gasApi";
import { gasGet } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

const CATEGORIES = [
  { key: "smart_home",  label: "Sprzęt Smart Home" },
  { key: "cables",      label: "Kable i osprzęt" },
  { key: "cabinet",     label: "Szafa sterownicza" },
  { key: "audio",       label: "Audio / Video" },
  { key: "security",    label: "Monitoring i bezpieczeństwo" },
  { key: "other",       label: "Inne" },
];

const STATUSES = ["Oczekuje", "Zamówione", "Dostarczone"];

const STATUS_STYLE = {
  "Oczekuje":    "bg-slate-100 text-slate-600",
  "Zamówione":   "bg-blue-100 text-blue-700",
  "Dostarczone": "bg-green-100 text-green-700",
};

function emptyItem() {
  return {
    id:        `zi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name:      "",
    category:  "smart_home",
    quantity:  1,
    unit:      "szt.",
    priceEst:  0,
    link:      "",
    status:    "Oczekuje",
  };
}

export default function ZakupyEditor({ project, onClose }) {
  const [items,    setItems]   = useState([]);
  const [zakupyId, setId]      = useState(null);
  const [loading,  setLoading] = useState(true);
  const [saving,   setSaving]  = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [cennik,   setCennik]  = useState([]);
  const [sugg,     setSugg]    = useState({});
  const [suggPos,  setSuggPos] = useState({});
  const suggRefs = useRef({});

  useEffect(() => {
    if (!GAS_ON) { setLoading(false); return; }
    getZakupy(project.id)
      .then(z => {
        if (z && z.id) {
          setId(z.id);
          setItems(Array.isArray(z.items) ? z.items : []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    gasGet("getCennik")
      .then(data => { if (Array.isArray(data)) setCennik(data); })
      .catch(() => {});
  }, [project.id]);

  // Zamknij podpowiedzi po kliknięciu poza
  useEffect(() => {
    const handler = (e) => {
      setSugg(prev => {
        const next = { ...prev };
        Object.keys(suggRefs.current).forEach(id => {
          if (suggRefs.current[id] && !suggRefs.current[id].contains(e.target)) {
            if (next[id]) next[id] = { ...next[id], show: false };
          }
        });
        return next;
      });
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id) => setItems(prev => prev.filter(it => it.id !== id));
  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(it =>
      it.id === id
        ? { ...it, [field]: (field === "quantity" || field === "priceEst") ? Number(value) : value }
        : it
    ));
  };

  const handleNameChange = useCallback((id, value) => {
    updateItem(id, "name", value);
    if (value.length >= 3 && cennik.length > 0) {
      const q = value.toLowerCase();
      const matches = cennik
        .filter(c => (c.name != null && c.name.toLowerCase().includes(q)) || (c.sku != null && String(c.sku).toLowerCase().includes(q)))
        .slice(0, 8);
      if (matches.length > 0 && suggRefs.current[id]) {
        const rect = suggRefs.current[id].getBoundingClientRect();
        setSuggPos(prev => ({ ...prev, [id]: { top: rect.bottom, left: rect.left, width: rect.width } }));
      }
      setSugg(prev => ({ ...prev, [id]: { show: matches.length > 0, list: matches } }));
    } else {
      setSugg(prev => ({ ...prev, [id]: { show: false, list: [] } }));
    }
  }, [cennik]);

  const selectSugg = useCallback((itemId, cennikItem) => {
    setItems(prev => prev.map(it =>
      it.id === itemId
        ? { ...it, name: cennikItem.name, priceEst: cennikItem.price_pln ?? it.priceEst }
        : it
    ));
    setSugg(prev => ({ ...prev, [itemId]: { show: false, list: [] } }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        id:        zakupyId || undefined,
        projectId: project.id,
        items,
        updatedDate: new Date().toISOString().substring(0, 10),
      };
      const saved = await upsertZakupy(payload);
      if (saved && saved.id) setId(saved.id);
      toast.success("Lista zakupów zapisana");
    } catch (e) {
      toast.error("Błąd zapisu: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Grouped by category (only categories with items)
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    items: items.filter(i => i.category === cat.key),
  })).filter(cat => cat.items.length > 0);

  // Summary stats
  const totalEst   = items.reduce((s, i) => s + (i.quantity || 0) * (i.priceEst || 0), 0);
  const countDone  = items.filter(i => i.status === "Dostarczone").length;
  const countOrder = items.filter(i => i.status === "Zamówione").length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-stretch justify-end">
      <div className="w-full max-w-4xl bg-white h-full flex flex-col shadow-2xl">

        {/* Nagłówek */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">Lista zakupów</div>
            <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Zapisz
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Treść */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Tabela pozycji */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-semibold">Pozycja</th>
                      <th className="text-left p-3 font-semibold w-40">Kategoria</th>
                      <th className="text-right p-3 font-semibold w-16">Ilość</th>
                      <th className="text-left p-3 font-semibold w-20">Jedn.</th>
                      <th className="text-right p-3 font-semibold w-28">Cena est.</th>
                      <th className="text-left p-3 font-semibold w-28">Status</th>
                      <th className="text-left p-3 font-semibold w-20">Link</th>
                      <th className="p-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 text-sm">
                          Brak pozycji — kliknij „Dodaj pozycję"
                        </td>
                      </tr>
                    )}
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <div
                            className="relative"
                            ref={el => { suggRefs.current[item.id] = el; }}
                          >
                            <input
                              value={item.name}
                              onChange={e => handleNameChange(item.id, e.target.value)}
                              placeholder="Nazwa produktu (min. 3 znaki)"
                              className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                            />
                            {sugg[item.id]?.show && suggPos[item.id] && (
                              <ul style={{ position: 'fixed', top: suggPos[item.id].top + 2, left: suggPos[item.id].left, width: Math.max(suggPos[item.id].width, 280), zIndex: 9999 }} className="bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm">
                                {sugg[item.id].list.map(c => (
                                  <li
                                    key={c.sku}
                                    onMouseDown={() => selectSugg(item.id, c)}
                                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-green-50 gap-2"
                                  >
                                    <span className="truncate">{c.name}</span>
                                    <span className="shrink-0 text-xs text-slate-400 font-mono">{c.sku}</span>
                                    {c.price_pln != null && (
                                      <span className="shrink-0 text-xs font-semibold text-green-600">
                                        {c.price_pln.toLocaleString("pl-PL")} zł
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <select
                            value={item.category}
                            onChange={e => updateItem(item.id, "category", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 bg-white"
                          >
                            {CATEGORIES.map(c => (
                              <option key={c.key} value={c.key}>{c.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number" min="0" step="1"
                            value={item.quantity}
                            onChange={e => updateItem(item.id, "quantity", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            value={item.unit}
                            onChange={e => updateItem(item.id, "unit", e.target.value)}
                            placeholder="szt."
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number" min="0" step="0.01"
                            value={item.priceEst}
                            onChange={e => updateItem(item.id, "priceEst", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.status}
                            onChange={e => updateItem(item.id, "status", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 bg-white"
                          >
                            {STATUSES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            value={item.link}
                            onChange={e => updateItem(item.id, "link", e.target.value)}
                            placeholder="https://..."
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                          />
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-green-400 hover:text-green-600 text-sm font-medium w-full justify-center transition-colors"
              >
                <Plus className="w-4 h-4" /> Dodaj pozycję
              </button>

              {/* Podgląd wg kategorii */}
              {byCategory.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700">Podgląd wg kategorii</h3>
                  </div>
                  {byCategory.map(cat => {
                    const catEst = cat.items.reduce((s, i) => s + (i.quantity || 0) * (i.priceEst || 0), 0);
                    const isOpen = !collapsed[cat.key];
                    return (
                      <div key={cat.key} className="border-b border-slate-100 last:border-0">
                        <button
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-left"
                          onClick={() => setCollapsed(p => ({ ...p, [cat.key]: !p[cat.key] }))}
                        >
                          <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-green-600">
                              {catEst > 0 ? `~${catEst.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł` : `${cat.items.length} poz.`}
                            </span>
                            {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-2 space-y-1">
                            {cat.items.map(i => (
                              <div key={i.id} className="flex items-center justify-between text-xs text-slate-600 py-0.5 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[i.status] || ""}`}>
                                    {i.status}
                                  </span>
                                  <span className="truncate">{i.name || <em className="text-slate-400">bez nazwy</em>}</span>
                                  <span className="shrink-0 text-slate-400">× {i.quantity} {i.unit}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {i.priceEst > 0 && (
                                    <span>~{((i.quantity || 0) * i.priceEst).toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł</span>
                                  )}
                                  {i.link && (
                                    <a href={i.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Stopka */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex gap-8 text-sm">
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wider">Szacunkowa wartość</div>
              <div className="font-bold text-green-400 text-lg">
                {totalEst > 0 ? `~${totalEst.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł` : "—"}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wider">Zamówione</div>
              <div className="font-bold">{countOrder}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wider">Dostarczone</div>
              <div className="font-bold">{countDone}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">{items.length} pozycji</div>
        </div>
      </div>
    </div>
  );
}
