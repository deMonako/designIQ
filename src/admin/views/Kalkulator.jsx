import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, FolderKanban,
  RefreshCw, Trash2, Plus, ShoppingCart,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import * as GAS from "../api/gasApi";
import { gasGet } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";
import { TODAY } from "../mockData";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

// SKU elementu dodawanego przy "Generuj" (tymczasowo, docelowo z projektu SVG/JSON)
const DEFAULT_SKU = "100512";

// ─────────────────────────────────────────────────────────────────────────────
// KATEGORIE zakupów
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "smart_home", label: "Sprzęt Smart Home" },
  { key: "cables",     label: "Kable i osprzęt" },
  { key: "cabinet",    label: "Szafa sterownicza" },
  { key: "audio",      label: "Audio / Video" },
  { key: "security",   label: "Monitoring i bezp." },
  { key: "other",      label: "Inne" },
];

// ─────────────────────────────────────────────────────────────────────────────
// BOM TABLE — edytowalna tabela zestawienia materiałów
// ─────────────────────────────────────────────────────────────────────────────

function BOMTable({ items, onChange, cennik = [] }) {
  const total = items.reduce((s, r) => s + r.quantity * r.priceEst, 0);
  const [sugg, setSugg] = useState({});
  const suggRefs = useRef({});

  useEffect(() => {
    const handler = (e) => {
      setSugg(prev => {
        const next = { ...prev };
        Object.keys(suggRefs.current).forEach(id => {
          if (suggRefs.current[id] && !suggRefs.current[id].contains(e.target)) {
            if (next[id]?.show) next[id] = { ...next[id], show: false };
          }
        });
        return next;
      });
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const update = (id, key, val) =>
    onChange(items.map(r => r.id === id ? { ...r, [key]: val } : r));

  const remove = (id) => onChange(items.filter(r => r.id !== id));

  const handleNameChange = useCallback((id, value) => {
    onChange(items.map(r => r.id === id ? { ...r, name: value } : r));
    if (value.length >= 3 && cennik.length > 0) {
      const q = value.toLowerCase();
      const matches = cennik
        .filter(c => (c.name != null && c.name.toLowerCase().includes(q)) || (c.sku != null && String(c.sku).toLowerCase().includes(q)))
        .slice(0, 8);
      setSugg(prev => ({ ...prev, [id]: { show: matches.length > 0, list: matches } }));
    } else {
      setSugg(prev => ({ ...prev, [id]: { show: false, list: [] } }));
    }
  }, [cennik, items, onChange]);

  const selectSugg = useCallback((rowId, cennikItem) => {
    onChange(items.map(r =>
      r.id === rowId
        ? { ...r, name: cennikItem.name, priceEst: cennikItem.price_pln ?? r.priceEst }
        : r
    ));
    setSugg(prev => ({ ...prev, [rowId]: { show: false, list: [] } }));
  }, [items, onChange]);

  const addRow = () => {
    onChange([...items, {
      id:       `bom-custom-${Date.now()}`,
      name:     "",
      category: "smart_home",
      unit:     "szt.",
      quantity: 1,
      priceEst: 0,
      link:     "",
      status:   "Oczekuje",
    }]);
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide">
              <th className="text-left px-3 py-2.5 min-w-[260px]">Urządzenie / materiał</th>
              <th className="text-left px-3 py-2.5 w-36">Kategoria</th>
              <th className="text-center px-3 py-2.5 w-24">Ilość</th>
              <th className="text-left px-2 py-2.5 w-16">J.m.</th>
              <th className="text-right px-3 py-2.5 w-28">Cena jedn.</th>
              <th className="text-right px-3 py-2.5 w-28">Wartość</th>
              <th className="w-9" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-300 text-sm">
                  Kliknij „Generuj" lub „Dodaj pozycję"
                </td>
              </tr>
            )}
            {items.map(row => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition-colors group">
                {/* Nazwa z autocomplete */}
                <td className="px-3 py-2">
                  <div className="relative" ref={el => { suggRefs.current[row.id] = el; }}>
                    <input
                      value={row.name}
                      onChange={e => handleNameChange(row.id, e.target.value)}
                      className="w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400/50 rounded px-1 py-0.5 text-slate-800 font-medium text-sm"
                      placeholder="Nazwa urządzenia…"
                    />
                    {sugg[row.id]?.show && (
                      <ul className="absolute left-0 top-full mt-0.5 z-50 w-72 bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm">
                        {sugg[row.id].list.map(c => (
                          <li
                            key={c.sku}
                            onMouseDown={() => selectSugg(row.id, c)}
                            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-orange-50 gap-2"
                          >
                            <span className="truncate">{c.name}</span>
                            <span className="shrink-0 text-xs text-slate-400 font-mono">{c.sku}</span>
                            {c.price_pln != null && (
                              <span className="shrink-0 text-xs font-semibold text-orange-600">
                                {c.price_pln.toLocaleString("pl-PL")} zł
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </td>
                {/* Kategoria */}
                <td className="px-3 py-2">
                  <select
                    value={row.category}
                    onChange={e => update(row.id, "category", e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-xs text-slate-500 focus:ring-1 focus:ring-orange-400/50 rounded"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </td>
                {/* Ilość */}
                <td className="px-3 py-2 text-center">
                  <input
                    type="number" min="0" value={row.quantity}
                    onChange={e => update(row.id, "quantity", Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center border border-slate-200 rounded-lg px-1 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 tabular-nums"
                  />
                </td>
                {/* Jednostka */}
                <td className="px-2 py-2">
                  <input
                    value={row.unit}
                    onChange={e => update(row.id, "unit", e.target.value)}
                    className="w-12 bg-transparent border-0 outline-none text-xs text-slate-400 focus:ring-1 focus:ring-orange-400/50 rounded px-1"
                  />
                </td>
                {/* Cena */}
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" min="0" step="10" value={row.priceEst}
                    onChange={e => update(row.id, "priceEst", parseFloat(e.target.value) || 0)}
                    className="w-24 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 tabular-nums"
                  />
                  <span className="text-xs text-slate-400 ml-1">zł</span>
                </td>
                {/* Wartość */}
                <td className="px-3 py-2 text-right font-semibold text-slate-700 tabular-nums">
                  {(row.quantity * row.priceEst).toLocaleString("pl-PL")} zł
                </td>
                {/* Usuń */}
                <td className="px-1 py-2 text-center">
                  <button
                    onClick={() => remove(row.id)}
                    className="p-1 rounded text-slate-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td colSpan={4} className="px-3 py-2.5">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Dodaj pozycję
                </button>
              </td>
              <td className="px-3 py-2.5 text-right text-xs text-slate-500 font-medium">Razem netto:</td>
              <td className="px-3 py-2.5 text-right text-base font-bold text-orange-600 tabular-nums">
                {total.toLocaleString("pl-PL")} zł
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATOR LISTY ZAKUPÓW — główna sekcja
// ─────────────────────────────────────────────────────────────────────────────

function BOMGenerator({ projects }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [bom, setBOM] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // "ok" | "err"
  const [cennik, setCennik] = useState([]);

  const project = projects.find(p => p.id === selectedProjectId) ?? null;

  useEffect(() => {
    if (!GAS_ON) return;
    gasGet("getCennik")
      .then(data => { if (Array.isArray(data)) setCennik(data); })
      .catch(() => {});
  }, []);

  const generate = () => {
    if (!project) return;
    setSaveResult(null);
    const cennikItem = cennik.find(c => String(c.sku) === DEFAULT_SKU);
    const newItem = {
      id:       `bom-${DEFAULT_SKU}-${Date.now()}`,
      name:     cennikItem?.name ?? `SKU ${DEFAULT_SKU}`,
      category: "smart_home",
      unit:     "szt.",
      quantity: 1,
      priceEst: cennikItem?.price_pln ?? 0,
      link:     "",
      status:   "Oczekuje",
    };
    setBOM(prev => [...prev, newItem]);
  };

  const handleSave = async () => {
    if (!project || !bom.length) return;
    setSaving(true);
    setSaveResult(null);

    try {
      let existingItems = [];
      let existingId;
      if (GAS_ON) {
        const existing = await GAS.getZakupy(project.id).catch(() => null);
        if (existing && Array.isArray(existing.items)) {
          existingItems = existing.items;
          existingId = existing.id;
        }
      }

      const existingIds = new Set(existingItems.map(i => i.id));
      const newItems = bom
        .filter(r => !existingIds.has(r.id))
        .map(({ id, name, category, quantity, unit, priceEst, link, status }) => ({
          id, name, category, quantity, unit, priceEst,
          link: link ?? "",
          status: status ?? "Oczekuje",
        }));

      const zakupy = {
        id:          existingId,
        projectId:   project.id,
        items:       [...existingItems, ...newItems],
        updatedDate: TODAY,
      };

      if (GAS_ON) await GAS.upsertZakupy(zakupy);
      setSaveResult("ok");
    } catch {
      setSaveResult("err");
    } finally {
      setSaving(false);
    }
  };

  const totalValue = useMemo(
    () => bom.reduce((s, r) => s + r.quantity * r.priceEst, 0),
    [bom],
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-4 h-4 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800">Generator listy zakupów</div>
          <div className="text-xs text-slate-400 mt-0.5">
            Wybierz projekt, kliknij Generuj — edytuj zestawienie i zapisz do zakupów projektu
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* Wybór projektu + przycisk Generuj */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Projekt
            </label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-400 transition-all bg-white">
              <FolderKanban className="w-4 h-4 text-slate-300 flex-shrink-0" />
              <select
                value={selectedProjectId}
                onChange={e => { setSelectedProjectId(e.target.value); setBOM([]); setSaveResult(null); }}
                className="flex-1 outline-none text-sm text-slate-800 bg-transparent"
              >
                <option value="">— wybierz projekt —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!selectedProjectId || cennik.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:from-orange-700 hover:to-orange-600 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Generuj
          </button>
        </div>

        {/* Tabela BOM */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-slate-700">Zestawienie materiałów</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
              edytowalne
            </span>
          </div>
          <BOMTable items={bom} onChange={setBOM} cennik={cennik} />
        </div>

        {/* Footer: łączna wartość + zapis */}
        <AnimatePresence>
          {bom.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100"
            >
              <div>
                <div className="text-xs text-slate-400">Łączna wartość zestawienia</div>
                <div className="text-2xl font-bold text-orange-600">
                  {totalValue.toLocaleString("pl-PL")} zł
                </div>
                <div className="text-xs text-slate-400">netto</div>
              </div>

              <div className="flex items-center gap-3">
                {saveResult === "ok" && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1.5 text-green-600 text-sm font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Zapisano w zakupach projektu
                  </motion.div>
                )}
                {saveResult === "err" && (
                  <div className="flex items-center gap-1.5 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" /> Błąd zapisu
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving || !project}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-bold hover:from-slate-900 hover:to-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  {saving
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Zapisuję…</>
                    : <><ShoppingCart className="w-4 h-4" /> Zapisz do zakupów projektu</>
                  }
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedProjectId && bom.length === 0 && (
          <div className="text-center py-8 text-slate-300 text-sm">
            Wybierz projekt i kliknij Generuj
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function Kalkulator({ projects = [] }) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kalkulator</h2>
          <p className="text-xs text-slate-400">Generator listy zakupów</p>
        </div>
      </div>

      <BOMGenerator projects={projects} />
    </div>
  );
}
