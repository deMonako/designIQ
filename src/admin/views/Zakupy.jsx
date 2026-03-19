import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart, FolderKanban, Save, Plus, Trash2, Loader2,
  RefreshCw, ChevronDown, ChevronUp, ExternalLink, Link as LinkIcon, Package,
} from "lucide-react";
import { toast } from "sonner";
import { getZakupy, upsertZakupy } from "../api/gasApi";
import { gasGet } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";
import { TODAY } from "../mockData";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

const CATEGORIES = [
  { key: "smart_home", label: "Sprzęt Smart Home",          dot: "bg-orange-400" },
  { key: "cables",     label: "Kable i osprzęt",             dot: "bg-yellow-400" },
  { key: "cabinet",    label: "Szafa sterownicza",           dot: "bg-blue-400"   },
  { key: "audio",      label: "Audio / Video",               dot: "bg-purple-400" },
  { key: "security",   label: "Monitoring i bezpieczeństwo", dot: "bg-red-400"    },
  { key: "other",      label: "Inne",                        dot: "bg-slate-400"  },
];

const STATUSES = ["Oczekuje", "Zamówione", "Dostarczone"];

const STATUS_STYLE = {
  "Oczekuje":    "bg-slate-100 text-slate-500",
  "Zamówione":   "bg-blue-100  text-blue-700",
  "Dostarczone": "bg-green-100 text-green-700",
};

function newItem(category = "smart_home") {
  return {
    id:       `zi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name:     "",
    category,
    quantity: 1,
    unit:     "szt.",
    priceEst: 0,
    link:     "",
    status:   "Oczekuje",
  };
}

// ─── pojedynczy wiersz ────────────────────────────────────────────────────────
function ItemRow({ item, cennik, onUpdate, onRemove, suggState, setSuggState }) {
  const wrapRef = useRef(null);

  const handleNameChange = useCallback((value) => {
    onUpdate("name", value);
    if (value.length >= 3 && cennik.length > 0) {
      const q = value.toLowerCase();
      const matches = cennik
        .filter(c =>
          (c.name != null && c.name.toLowerCase().includes(q)) ||
          (c.sku  != null && String(c.sku).toLowerCase().includes(q))
        )
        .slice(0, 8);
      if (matches.length > 0 && wrapRef.current) {
        const rect = wrapRef.current.getBoundingClientRect();
        setSuggState({ show: true, list: matches, pos: { top: rect.bottom, left: rect.left, width: rect.width } });
      } else {
        setSuggState({ show: false, list: [] });
      }
    } else {
      setSuggState({ show: false, list: [] });
    }
  }, [cennik, onUpdate, setSuggState]);

  const selectSugg = useCallback((c) => {
    onUpdate("name",     c.name);
    onUpdate("priceEst", c.price_pln ?? item.priceEst);
    if (c.link) onUpdate("link", c.link);
    setSuggState({ show: false, list: [] });
  }, [item.priceEst, onUpdate, setSuggState]);

  return (
    <tr className="group hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
      {/* Nazwa */}
      <td className="px-3 py-1.5 min-w-[220px]">
        <div ref={wrapRef} className="relative">
          <input
            value={item.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Nazwa produktu…"
            className="w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400/40 rounded px-1 py-0.5 text-sm text-slate-800"
          />
          {suggState?.show && suggState.pos && (
            <ul
              style={{
                position: "fixed",
                top:   suggState.pos.top + 2,
                left:  suggState.pos.left,
                width: Math.max(suggState.pos.width, 300),
                zIndex: 9999,
              }}
              className="bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto text-sm"
            >
              {suggState.list.map(c => (
                <li
                  key={c.sku ?? c.name}
                  onMouseDown={() => selectSugg(c)}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-orange-50 gap-2"
                >
                  <span className="flex-1 truncate">{c.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.sku && <span className="text-[10px] text-slate-400 font-mono">{c.sku}</span>}
                    {c.price_pln != null && (
                      <span className="text-xs font-semibold text-orange-600">
                        {c.price_pln.toLocaleString("pl-PL")} zł
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </td>

      {/* Ilość */}
      <td className="px-2 py-1.5 w-16">
        <input
          type="number" min="0" value={item.quantity}
          onChange={e => onUpdate("quantity", Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full text-center border border-slate-200 rounded-lg px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-orange-400/40 tabular-nums"
        />
      </td>

      {/* Jedn. */}
      <td className="px-2 py-1.5 w-14">
        <input
          value={item.unit}
          onChange={e => onUpdate("unit", e.target.value)}
          className="w-full text-center bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400/40 rounded px-1 py-0.5 text-xs text-slate-400"
        />
      </td>

      {/* Cena est */}
      <td className="px-2 py-1.5 w-24">
        <input
          type="number" min="0" step="0.01" value={item.priceEst}
          onChange={e => onUpdate("priceEst", parseFloat(e.target.value) || 0)}
          className="w-full text-right border border-slate-200 rounded-lg px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-orange-400/40 tabular-nums"
        />
      </td>

      {/* Wartość */}
      <td className="px-3 py-1.5 w-24 text-right text-sm font-semibold text-slate-600 tabular-nums">
        {((item.quantity || 0) * (item.priceEst || 0)).toLocaleString("pl-PL")} zł
      </td>

      {/* Status */}
      <td className="px-2 py-1.5 w-32">
        <select
          value={item.status}
          onChange={e => onUpdate("status", e.target.value)}
          className={`w-full text-xs font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${STATUS_STYLE[item.status] ?? ""}`}
        >
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </td>

      {/* Link */}
      <td className="px-2 py-1.5 w-8 text-center">
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            title={item.link}
            className="inline-flex items-center justify-center p-1 text-blue-400 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="inline-flex items-center justify-center p-1 text-slate-200">
            <LinkIcon className="w-3.5 h-3.5" />
          </span>
        )}
      </td>

      {/* Usuń */}
      <td className="px-1 py-1.5 w-8 text-center">
        <button
          onClick={onRemove}
          className="p-1 rounded text-slate-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─── sekcja kategorii ─────────────────────────────────────────────────────────
function CategorySection({ cat, items, cennik, onUpdateItem, onRemoveItem, onAddItem, collapsed, onToggle }) {
  const [suggMap, setSuggMap] = useState({});

  const catTotal   = items.reduce((s, i) => s + (i.quantity || 0) * (i.priceEst || 0), 0);
  const doneCount  = items.filter(i => i.status === "Dostarczone").length;
  const orderCount = items.filter(i => i.status === "Zamówione").length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Nagłówek kategorii */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50/80 transition-colors text-left"
      >
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cat.dot}`} />
        <span className="font-semibold text-slate-800 flex-1">{cat.label}</span>

        <div className="flex items-center gap-2.5 shrink-0">
          {items.length > 0 && (
            <>
              <span className="text-xs text-slate-400">{items.length} poz.</span>
              {orderCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">{orderCount} zam.</span>
              )}
              {doneCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">{doneCount} dost.</span>
              )}
              {catTotal > 0 && (
                <span className="text-sm font-bold text-green-600 tabular-nums">
                  ~{catTotal.toLocaleString("pl-PL")} zł
                </span>
              )}
            </>
          )}
          {items.length === 0 && <span className="text-xs text-slate-300">brak pozycji</span>}
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
            : <ChevronUp   className="w-4 h-4 text-slate-400 ml-1" />
          }
        </div>
      </button>

      {/* Zawartość */}
      {!collapsed && (
        <div className="border-t border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {items.length > 0 && (
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/60">
                    <th className="text-left px-3 py-1.5 font-medium">Nazwa</th>
                    <th className="text-center px-2 py-1.5 w-16 font-medium">Ilość</th>
                    <th className="text-center px-2 py-1.5 w-14 font-medium">Jm.</th>
                    <th className="text-right px-2 py-1.5 w-24 font-medium">Cena</th>
                    <th className="text-right px-3 py-1.5 w-24 font-medium">Wartość</th>
                    <th className="text-left px-2 py-1.5 w-32 font-medium">Status</th>
                    <th className="w-8" />
                    <th className="w-8" />
                  </tr>
                </thead>
              )}
              <tbody>
                {items.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    cennik={cennik}
                    onUpdate={(field, value) => onUpdateItem(item.id, field, value)}
                    onRemove={() => onRemoveItem(item.id)}
                    suggState={suggMap[item.id]}
                    setSuggState={s => setSuggMap(prev => ({ ...prev, [item.id]: s }))}
                  />
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-slate-300 text-xs">
                      Brak pozycji w tej kategorii
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 border-t border-slate-50">
            <button
              onClick={() => onAddItem(cat.key)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-orange-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Dodaj do „{cat.label}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── główny widok ─────────────────────────────────────────────────────────────
export default function Zakupy({ projects = [], initialProjectId, initialItems = null }) {
  const [projectId,  setProjectId]  = useState(initialProjectId ?? "");
  const [items,      setItems]      = useState(initialItems ?? []);
  const [zakupyId,   setZakupyId]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [cennik,     setCennik]     = useState([]);
  const [collapsed,  setCollapsed]  = useState({});

  // Załaduj katalog produktów
  useEffect(() => {
    if (!GAS_ON) return;
    Promise.all([
      gasGet("getCennik").catch(() => []),
      gasGet("getMaterialyJson").catch(() => []),
    ]).then(([cd, md]) => {
      setCennik([
        ...(Array.isArray(cd) ? cd : []),
        ...(Array.isArray(md) ? md.map(m => ({ name: m.name, price_pln: m.price_pln, sku: null, link: m.link })) : []),
      ]);
    });
  }, []);

  // Załaduj zakupy projektu (pomijamy gdy przekazano initialItems — dane już mamy)
  useEffect(() => {
    if (!projectId) { setItems([]); setZakupyId(null); return; }
    if (initialItems !== null) return; // dane przekazane bezpośrednio — nie ładuj z GAS
    if (!GAS_ON)    { setItems([]); setZakupyId(null); return; }
    setLoading(true);
    getZakupy(projectId)
      .then(z => {
        setZakupyId(z?.id ?? null);
        setItems(Array.isArray(z?.items) ? z.items : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItem = useCallback((id, field, value) => {
    setItems(prev => prev.map(it =>
      it.id === id
        ? { ...it, [field]: (field === "quantity" || field === "priceEst") ? Number(value) : value }
        : it
    ));
  }, []);

  const removeItem = useCallback((id) => setItems(prev => prev.filter(it => it.id !== id)), []);

  const addItem = useCallback((category = "smart_home") => {
    setItems(prev => [...prev, newItem(category)]);
    // Otwórz kategorię jeśli zwinięta
    setCollapsed(prev => ({ ...prev, [category]: false }));
  }, []);

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const saved = await upsertZakupy({
        id:          zakupyId ?? undefined,
        projectId,
        items,
        updatedDate: TODAY,
      });
      if (saved?.id) setZakupyId(saved.id);
      toast.success("Lista zakupów zapisana");
    } catch (e) {
      toast.error("Błąd zapisu: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const totalEst   = items.reduce((s, i) => s + (i.quantity || 0) * (i.priceEst || 0), 0);
  const countDone  = items.filter(i => i.status === "Dostarczone").length;
  const countOrder = items.filter(i => i.status === "Zamówione").length;

  const selectedProject = projects.find(p => p.id === projectId);

  return (
    <div className="p-4 lg:p-6 space-y-4">

      {/* Nagłówek */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Package className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Zakupy</h2>
          <p className="text-xs text-slate-400">Listy zakupów materiałów i urządzeń dla projektów</p>
        </div>
      </div>

      {/* Pasek górny */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-400 transition-all flex-1 min-w-64">
          <FolderKanban className="w-4 h-4 text-slate-300 shrink-0" />
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="flex-1 outline-none text-sm text-slate-800 bg-transparent"
          >
            <option value="">— wybierz projekt —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>

        {projectId && (
          <>
            <button
              onClick={() => {
                setLoading(true);
                getZakupy(projectId)
                  .then(z => { setZakupyId(z?.id ?? null); setItems(Array.isArray(z?.items) ? z.items : []); })
                  .catch(() => {})
                  .finally(() => setLoading(false));
              }}
              disabled={loading}
              className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-sm font-semibold hover:shadow-md disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Zapisz
            </button>
          </>
        )}
      </div>

      {/* Podsumowanie */}
      {projectId && !loading && items.length > 0 && (
        <div className="flex items-center gap-6 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm">
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wider">Łącznie</div>
            <div className="font-bold text-green-400">{totalEst > 0 ? `~${totalEst.toLocaleString("pl-PL")} zł` : "—"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wider">Pozycji</div>
            <div className="font-bold">{items.length}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wider">Zamówione</div>
            <div className="font-bold text-blue-400">{countOrder}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wider">Dostarczone</div>
            <div className="font-bold text-green-400">{countDone}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCollapsed(CATEGORIES.reduce((a, c) => ({ ...a, [c.key]: true }), {}))}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Zwiń wszystko
            </button>
            <span className="text-slate-600">·</span>
            <button
              onClick={() => setCollapsed({})}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Rozwiń wszystko
            </button>
          </div>
        </div>
      )}

      {/* Brak projektu */}
      {!projectId && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-16 text-center">
          <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Wybierz projekt aby zarządzać listą zakupów</p>
        </div>
      )}

      {/* Loader */}
      {projectId && loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
        </div>
      )}

      {/* Kategorie */}
      {projectId && !loading && (
        <div className="space-y-3">
          {CATEGORIES.map(cat => (
            <CategorySection
              key={cat.key}
              cat={cat}
              items={items.filter(i => i.category === cat.key)}
              cennik={cennik}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onAddItem={addItem}
              collapsed={!!collapsed[cat.key]}
              onToggle={() => setCollapsed(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
