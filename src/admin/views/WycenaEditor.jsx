import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp,
  ClipboardList, Copy, Check, GripVertical, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { getWycena, upsertWycena } from "../api/gasApi";
import { gasGet } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";
import { WYCENA_CATEGORIES as CATEGORIES, MATERIAL_CATEGORIES } from "../constants";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);
const PLN = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

function round2(v) { return Math.round(v * 100) / 100; }
function calcGross(item) {
  return round2((item.quantity || 0) * (item.unit_price || 0) * (1 + (item.vat_rate ?? 8) / 100));
}
function emptyItem(category = "materials") {
  return {
    id: `wi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: "", category, quantity: 1, unit_price: 0, vat_rate: 8, note: "",
  };
}
function emptyRoom() {
  return { name: "", area: 0, presence: 0, switch: 0, lightRelay: 0, lightDim: 0, shading: 0, heating: 0, audio: 0 };
}

// ── Modal: lista materiałów dla technika ────────────────────────────────────
function TechListModal({ items, project, onClose }) {
  const [copied, setCopied] = useState(false);

  const materialItems = CATEGORIES
    .filter(cat => MATERIAL_CATEGORIES.has(cat.key))
    .map(cat => ({ ...cat, items: items.filter(i => i.category === cat.key && i.name?.trim()) }))
    .filter(cat => cat.items.length > 0);

  const totalItems = materialItems.reduce((s, cat) => s + cat.items.length, 0);
  const date = new Date().toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" });

  const copyToClipboard = () => {
    const lines = [`LISTA MATERIAŁÓW DLA TECHNIKA`, `Projekt: ${project.name}`, `Kod: ${project.code || "—"}`, `Data: ${date}`, ""];
    materialItems.forEach(cat => {
      lines.push(`── ${cat.label.toUpperCase()} ──`);
      cat.items.forEach((item, i) => { lines.push(`  ${i + 1}. ${item.name}  ×${item.quantity}`); });
      lines.push("");
    });
    lines.push(`Łącznie: ${totalItems} pozycji`);
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Skopiowano do schowka");
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Lista materiałów — technik</h3>
              <p className="text-xs text-slate-400">{project.name} · {date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied ? "bg-green-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Skopiowano!" : "Kopiuj"}
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {materialItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Brak pozycji materiałowych w wycenie.</p>
            </div>
          ) : materialItems.map(cat => (
            <div key={cat.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-4 rounded-full bg-orange-400 flex-shrink-0" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat.label}</p>
                <span className="text-[10px] text-slate-300 font-medium">{cat.items.length} szt.</span>
              </div>
              <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                {cat.items.map((item, idx) => (
                  <div key={item.id} className={`flex items-center justify-between px-3 py-2 text-sm ${idx > 0 ? "border-t border-slate-100" : ""}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                      <span className="text-slate-800 font-medium truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-orange-600 flex-shrink-0 ml-3 tabular-nums">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {totalItems > 0 && (
          <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500 rounded-b-2xl">
            Łącznie <span className="font-bold text-slate-700">{totalItems}</span> pozycji materiałowych
          </div>
        )}
      </div>
    </div>
  );
}

// ── Wiersz tabeli z DnD ────────────────────────────────────────────────────
function SortableRow({ item, updateItem, removeItem, noteExpanded, onToggleNote, onNameChange, onSelectSugg, sugg, suggPos, suggRefs }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <tr ref={setNodeRef} style={style} className="hover:bg-slate-50/50">
        <td className="p-2 w-7">
          <button
            {...attributes} {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 touch-none flex items-center justify-center w-full"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </td>
        <td className="p-2">
          <div className="flex items-center gap-1">
            <div
              className="relative flex-1"
              ref={el => { if (suggRefs) suggRefs.current[item.id] = el; }}
            >
              <input
                value={item.name}
                onChange={e => (onNameChange ? onNameChange(item.id, e.target.value) : updateItem(item.id, "name", e.target.value))}
                placeholder="Nazwa pozycji (min. 3 znaki dla podpowiedzi)"
                className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
              {sugg?.show && suggPos && (
                <ul
                  style={{ position: 'fixed', top: suggPos.top + 2, left: suggPos.left, width: Math.max(suggPos.width, 280), zIndex: 9999 }}
                  className="bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm"
                >
                  {sugg.list.map(c => (
                    <li
                      key={c.sku ?? c.name}
                      onMouseDown={() => onSelectSugg(item.id, c)}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-orange-50 gap-2"
                    >
                      <span className="flex-1 truncate">{c.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.sku && <span className="text-xs text-slate-400 font-mono">{c.sku}</span>}
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
            <button
              onClick={() => onToggleNote(item.id)}
              title={noteExpanded ? "Ukryj komentarz" : "Dodaj komentarz dla klienta"}
              className={`p-1 rounded transition-colors flex-shrink-0 ${
                noteExpanded || item.note ? "text-orange-500 bg-orange-50" : "text-slate-300 hover:text-slate-500"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
        <td className="p-2">
          <input
            type="number" min="0" step="1"
            value={item.quantity}
            onChange={e => updateItem(item.id, "quantity", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          />
        </td>
        <td className="p-2">
          <div className="flex flex-col gap-1">
            <input
              type="number" min="0" step="0.01"
              value={item.unit_price}
              onChange={e => updateItem(item.id, "unit_price", e.target.value)}
              title="Cena netto"
              className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
            <input
              key={`g-${item.id}-${item.unit_price}-${item.vat_rate}`}
              type="number" min="0" step="0.01"
              defaultValue={round2(item.unit_price * (1 + (item.vat_rate ?? 8) / 100))}
              onBlur={e => {
                const g = parseFloat(e.target.value) || 0;
                updateItem(item.id, "unit_price", round2(g / (1 + (item.vat_rate ?? 8) / 100)));
              }}
              title="Cena brutto — wpisz aby przeliczyć netto"
              className="w-full border border-blue-200 rounded-lg px-2 py-1 text-xs text-right outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-blue-50/50 text-slate-600"
            />
          </div>
        </td>
        <td className="p-2">
          <select
            value={item.vat_rate}
            onChange={e => updateItem(item.id, "vat_rate", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
          >
            <option value={0}>0%</option>
            <option value={8}>8%</option>
            <option value={23}>23%</option>
          </select>
        </td>
        <td className="p-2 text-right font-semibold text-slate-900 whitespace-nowrap">
          {calcGross(item).toLocaleString("pl-PL", PLN)} zł
        </td>
        <td className="p-2">
          <button onClick={() => removeItem(item.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
      {noteExpanded && (
        <tr className="bg-orange-50/20">
          <td />
          <td colSpan={6} className="px-2 pb-2 pt-0.5">
            <textarea
              value={item.note || ""}
              onChange={e => updateItem(item.id, "note", e.target.value)}
              placeholder="Komentarz widoczny dla klienta w panelu inwestycji..."
              rows={2}
              className="w-full border border-orange-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none bg-white"
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Sekcja kategorii ──────────────────────────────────────────────────────
function CategorySection({ cat, catItems, updateItem, removeItem, addItem, reorder, expandedNotes, onToggleNote, collapsed, onCollapse, onNameChange, onSelectSugg, sugg, suggPos, suggRefs }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const catGross = catItems.reduce((s, i) => s + calcGross(i), 0);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={onCollapse}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
          {catItems.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 font-medium px-1.5 py-0.5 rounded-full">
              {catItems.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {catGross > 0 && (
            <span className="text-sm font-bold text-orange-600">
              {catGross.toLocaleString("pl-PL", PLN)} zł
            </span>
          )}
          {collapsed
            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            : <ChevronUp   className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </button>

      {!collapsed && (
        <>
          {catItems.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (over && active.id !== over.id) reorder(active.id, over.id);
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 border-t border-t-slate-100">
                    <tr>
                      <th className="w-7 p-2" />
                      <th className="text-left p-2 font-semibold">Pozycja</th>
                      <th className="text-right p-2 font-semibold w-20">Ilość</th>
                      <th className="text-right p-2 font-semibold w-36">
                        Cena jedn.
                        <div className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">netto / brutto</div>
                      </th>
                      <th className="text-right p-2 font-semibold w-20">VAT %</th>
                      <th className="text-right p-2 font-semibold w-28">Suma brutto</th>
                      <th className="w-8 p-2" />
                    </tr>
                  </thead>
                  <SortableContext items={catItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <tbody className="divide-y divide-slate-100">
                      {catItems.map(item => (
                        <SortableRow
                          key={item.id}
                          item={item}
                          updateItem={updateItem}
                          removeItem={removeItem}
                          noteExpanded={expandedNotes.has(item.id)}
                          onToggleNote={onToggleNote}
                          onNameChange={onNameChange}
                          onSelectSugg={onSelectSugg}
                          sugg={sugg[item.id]}
                          suggPos={suggPos[item.id]}
                          suggRefs={suggRefs}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </div>
            </DndContext>
          )}
          <div className={`p-3 ${catItems.length > 0 ? "border-t border-slate-100" : ""}`}>
            <button
              onClick={() => addItem(cat.key)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-orange-400 hover:text-orange-600 text-xs font-medium w-full justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Dodaj pozycję
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Główny edytor ─────────────────────────────────────────────────────────
export default function WycenaEditor({ project, onClose }) {
  const [items,   setItems]   = useState([]);
  const [rooms,   setRooms]   = useState([]);
  const [status,  setStatus]  = useState("Czeka na akceptację");
  const [wycenaId, setId]     = useState(null);
  const [loading,  setLoading] = useState(true);
  const [saving,   setSaving]  = useState(false);
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(CATEGORIES.map(c => [c.key, false]))
  );
  const [roomsCollapsed,  setRoomsCollapsed]  = useState(false);
  const [showTechList,    setShowTechList]    = useState(false);
  const [expandedNotes,   setExpandedNotes]   = useState(new Set());
  const [cennik,   setCennik]  = useState([]);
  const [sugg,     setSugg]    = useState({});
  const [suggPos,  setSuggPos] = useState({});
  const suggRefs = useRef({});

  useEffect(() => {
    if (!GAS_ON) { setLoading(false); return; }
    getWycena(project.id)
      .then(w => {
        if (w && w.id) {
          setId(w.id);
          const loadedItems = Array.isArray(w.items) ? w.items : [];
          setItems(loadedItems);
          setRooms(Array.isArray(w.rooms) ? w.rooms : []);
          setStatus(w.status || "Czeka na akceptację");
          // Auto-expand notes for items that already have a note
          const withNotes = new Set(loadedItems.filter(i => i.note).map(i => i.id));
          if (withNotes.size > 0) setExpandedNotes(withNotes);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Wczytaj cennik + materiały do autouzupełniania nazw pozycji
    Promise.all([
      gasGet("getCennik").catch(() => []),
      gasGet("getMaterialyJson").catch(() => []),
    ]).then(([cennikData, matData]) => {
      const merged = [
        ...(Array.isArray(cennikData) ? cennikData : []),
        ...(Array.isArray(matData) ? matData.map(m => ({ name: m.name, price_pln: m.price_pln, sku: null, link: m.link })) : []),
      ];
      setCennik(merged);
    });
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

  const addItem    = (category) => setItems(prev => [...prev, emptyItem(category)]);
  const removeItem = (id)       => setItems(prev => prev.filter(it => it.id !== id));
  const updateItem = (id, field, value) => setItems(prev =>
    prev.map(it => it.id === id
      ? { ...it, [field]: ["quantity", "unit_price", "vat_rate"].includes(field) ? Number(value) : value }
      : it
    )
  );

  const reorderCategory = (catKey, activeId, overId) => {
    setItems(prev => {
      const catItems = prev.filter(i => i.category === catKey);
      const reordered = arrayMove(catItems,
        catItems.findIndex(i => i.id === activeId),
        catItems.findIndex(i => i.id === overId),
      );
      let ri = 0;
      return prev.map(i => i.category === catKey ? reordered[ri++] : i);
    });
  };

  const toggleNote = (id) => setExpandedNotes(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleNameChange = useCallback((id, value) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, name: value } : it));
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
        ? { ...it, name: cennikItem.name, unit_price: cennikItem.price_pln ?? it.unit_price }
        : it
    ));
    setSugg(prev => ({ ...prev, [itemId]: { show: false, list: [] } }));
  }, []);

  const addRoom    = ()          => setRooms(prev => [...prev, emptyRoom()]);
  const removeRoom = (idx)       => setRooms(prev => prev.filter((_, i) => i !== idx));
  const updateRoom = (idx, field, value) => setRooms(prev =>
    prev.map((r, i) => i === idx ? { ...r, [field]: field === "name" ? value : (parseFloat(value) || 0) } : r)
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await upsertWycena({ id: wycenaId || undefined, projectId: project.id, items, rooms, status });
      if (saved && saved.id) setId(saved.id);
      toast.success("Wycena zapisana");
    } catch (e) {
      toast.error("Błąd zapisu: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const totalNet   = items.reduce((s, i) => s + round2((i.quantity || 0) * (i.unit_price || 0)), 0);
  const totalGross = items.reduce((s, i) => s + calcGross(i), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-stretch justify-end">
      <div className="w-full max-w-4xl bg-white h-full flex flex-col shadow-2xl">

        {/* Nagłówek */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">Edytor wyceny</div>
            <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTechList(true)}
              title="Generuj listę materiałów dla technika"
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Lista technika</span>
            </button>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            >
              <option>Czeka na akceptację</option>
              <option>Zaakceptowana</option>
              <option>Odrzucona</option>
              <option>W przygotowaniu</option>
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
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
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Sekcje kategorii */}
              {CATEGORIES.map(cat => (
                <CategorySection
                  key={cat.key}
                  cat={cat}
                  catItems={items.filter(i => i.category === cat.key)}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  addItem={addItem}
                  reorder={(aId, oId) => reorderCategory(cat.key, aId, oId)}
                  expandedNotes={expandedNotes}
                  onToggleNote={toggleNote}
                  collapsed={collapsed[cat.key]}
                  onCollapse={() => setCollapsed(p => ({ ...p, [cat.key]: !p[cat.key] }))}
                  onNameChange={handleNameChange}
                  onSelectSugg={selectSugg}
                  sugg={sugg}
                  suggPos={suggPos}
                  suggRefs={suggRefs}
                />
              ))}

              {/* Analiza techniczna pomieszczeń */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors text-left"
                  onClick={() => setRoomsCollapsed(p => !p)}
                >
                  <h3 className="text-sm font-semibold text-slate-700">Analiza techniczna pomieszczeń</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{rooms.length} pom.</span>
                    {roomsCollapsed
                      ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      : <ChevronUp   className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </button>
                {!roomsCollapsed && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[760px]">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="text-left p-2 font-semibold">Pomieszczenie</th>
                            <th className="text-center p-2 w-14">m²</th>
                            <th className="text-center p-2 w-16">Obecność</th>
                            <th className="text-center p-2 w-16">Przełącznik</th>
                            <th className="text-center p-2 w-16">Oświetl.</th>
                            <th className="text-center p-2 w-16">Ściemn.</th>
                            <th className="text-center p-2 w-16">Zacienianie</th>
                            <th className="text-center p-2 w-16">Ogrzewanie</th>
                            <th className="text-center p-2 w-14">Audio</th>
                            <th className="p-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {rooms.length === 0 && (
                            <tr>
                              <td colSpan={10} className="p-4 text-center text-slate-400">Brak pomieszczeń — dodaj pierwsze</td>
                            </tr>
                          )}
                          {rooms.map((room, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-1.5">
                                <input type="text" value={room.name || ""} onChange={e => updateRoom(idx, "name", e.target.value)}
                                  placeholder="Nazwa..." className="w-full border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-orange-400" />
                              </td>
                              {["area","presence","switch","lightRelay","lightDim","shading","heating","audio"].map(field => (
                                <td key={field} className="p-1.5">
                                  <input type="number" min="0" step={field === "area" ? "0.01" : "1"}
                                    value={room[field] ?? 0} onChange={e => updateRoom(idx, field, e.target.value)}
                                    className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-center outline-none focus:border-orange-400" />
                                </td>
                              ))}
                              <td className="p-1.5">
                                <button onClick={() => removeRoom(idx)} className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-3 border-t border-slate-100">
                      <button onClick={addRoom}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-orange-400 hover:text-orange-600 text-xs font-medium w-full justify-center transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Dodaj pomieszczenie
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Stopka z sumami */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex gap-8 text-sm">
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wider">Suma netto</div>
              <div className="font-bold">{totalNet.toLocaleString("pl-PL", PLN)} zł</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wider">Suma brutto</div>
              <div className="font-bold text-orange-400 text-lg">{totalGross.toLocaleString("pl-PL", PLN)} zł</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">{items.length} pozycji</div>
        </div>
      </div>

      {showTechList && (
        <TechListModal items={items} project={project} onClose={() => setShowTechList(false)} />
      )}
    </div>
  );
}
