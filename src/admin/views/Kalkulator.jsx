import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, FolderKanban,
  RefreshCw, ChevronDown, ChevronUp, Trash2, Plus, ShoppingCart,
  CheckCircle2, AlertCircle, FileText,
} from "lucide-react";
import * as GAS from "../api/gasApi";
import { gasGet } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";
import { TODAY } from "../mockData";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

// ─────────────────────────────────────────────────────────────────────────────
// KATALOG LOXONE (symulacja LOXONE.xlsx z materiałów designIQ)
// W produkcji: plik Excel fetchowany z Google Drive przez GAS.
// Kolumny: device (nazwa urządzenia), outputs (ile wyjść/wejść na jednostkę),
//          priceEst (cena jedn. netto PLN), category, unit.
// ─────────────────────────────────────────────────────────────────────────────

const LOXONE_CATALOG = [
  { device: "Loxone Miniserver Gen 2",       outputs: 1,  priceEst: 2490, category: "smart_home", unit: "szt." },
  { device: "Loxone Relay Extension",         outputs: 12, priceEst: 1290, category: "smart_home", unit: "szt." },
  { device: "Loxone Dimmer Extension",        outputs: 4,  priceEst: 1490, category: "smart_home", unit: "szt." },
  { device: "Loxone RGBW 24V Dimmer",         outputs: 1,  priceEst: 490,  category: "smart_home", unit: "szt." },
  { device: "Loxone Blind & AC Motor Ctrl.",   outputs: 2,  priceEst: 890,  category: "smart_home", unit: "szt." },
  { device: "Loxone Extension",               outputs: 12, priceEst: 790,  category: "smart_home", unit: "szt." },
  { device: "Loxone Analog Extension",        outputs: 8,  priceEst: 890,  category: "smart_home", unit: "szt." },
];

// ─────────────────────────────────────────────────────────────────────────────
// SYMULACJA projekt_XXX.json
// W produkcji: plik JSON fetchowany z Google Drive po wyborze projektu.
// Format docelowy punktu instalacyjnego:
//   { id: "OS1", device: "Loxone Relay Extension", output: 1 }
//   — device: nazwa urządzenia z katalogu LOXONE
//   — output: liczba wyjść/wejść zużywanych przez ten punkt na danym urządzeniu
// ─────────────────────────────────────────────────────────────────────────────

function simulateProjectPoints(project) {
  // Deterministyczny seed z kodu projektu
  const code = project.code || project.id;
  let seed = 0;
  for (let i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) >>> 0;

  const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xFFFFFFFF; };

  const sizes = { "Full house": 35, "Smart design+": 22, "Smart design": 14 };
  const base = sizes[project.package] ?? 20;
  const total = base + Math.floor(rng() * 10);

  const DEVICE_WEIGHTS = [
    { device: "Loxone Relay Extension",       weight: 0.35, outputRange: [1, 2] },
    { device: "Loxone Dimmer Extension",      weight: 0.20, outputRange: [1, 1] },
    { device: "Loxone RGBW 24V Dimmer",       weight: 0.12, outputRange: [1, 1] },
    { device: "Loxone Blind & AC Motor Ctrl.", weight: 0.13, outputRange: [1, 2] },
    { device: "Loxone Extension",             weight: 0.12, outputRange: [1, 1] },
    { device: "Loxone Analog Extension",      weight: 0.08, outputRange: [1, 1] },
  ];

  const points = [];
  for (let i = 0; i < total; i++) {
    const r = rng();
    let cum = 0;
    let chosen = DEVICE_WEIGHTS[0];
    for (const dw of DEVICE_WEIGHTS) {
      cum += dw.weight;
      if (r < cum) { chosen = dw; break; }
    }
    const outMin = chosen.outputRange[0];
    const outMax = chosen.outputRange[1];
    const output = outMin + Math.floor(rng() * (outMax - outMin + 1));
    points.push({ id: `OS${i + 1}`, device: chosen.device, output });
  }
  return points;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGREGACJA punktów → BOM
// ─────────────────────────────────────────────────────────────────────────────

function buildBOM(points) {
  // 1. Miniserver — zawsze 1 szt.
  const miniserver = LOXONE_CATALOG.find(c => c.device === "Loxone Miniserver Gen 2");

  // 2. Agreguj pozostałe urządzenia
  const demand = new Map();
  for (const pt of points) {
    const row = demand.get(pt.device) || { totalOutputs: 0, pointCount: 0 };
    row.totalOutputs += pt.output;
    row.pointCount += 1;
    demand.set(pt.device, row);
  }

  const items = [];

  // Miniserver first
  if (miniserver) {
    items.push({
      id: `bom-miniserver`,
      name: miniserver.device,
      category: miniserver.category,
      unit: miniserver.unit,
      quantity: 1,
      priceEst: miniserver.priceEst,
      link: "",
      status: "Oczekuje",
      _totalOutputs: 1,
      _pointCount: 0,
    });
  }

  // Then aggregated devices
  for (const [device, data] of demand) {
    const catalog = LOXONE_CATALOG.find(c => c.device === device);
    const quantity = catalog
      ? Math.ceil(data.totalOutputs / catalog.outputs)
      : data.pointCount;
    items.push({
      id: `bom-${device.replace(/\s+/g, "-").toLowerCase()}`,
      name: device,
      category: catalog?.category ?? "smart_home",
      unit: catalog?.unit ?? "szt.",
      quantity,
      priceEst: catalog?.priceEst ?? 0,
      link: "",
      status: "Oczekuje",
      _totalOutputs: data.totalOutputs,
      _pointCount: data.pointCount,
    });
  }

  // Sort: miniserver first, then by totalOutputs desc
  return items.sort((a, b) => {
    if (a.name.includes("Miniserver")) return -1;
    if (b.name.includes("Miniserver")) return 1;
    return b._totalOutputs - a._totalOutputs;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// KATEGORIE zakupów (matching schema ZakupyEditor)
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
  // { [rowId]: { show: bool, list: [] } }
  const [sugg, setSugg] = useState({});
  const suggRefs = useRef({});

  // Zamknij dropdown po kliknięciu poza
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
      id: `bom-custom-${Date.now()}`,
      name: "",
      category: "smart_home",
      unit: "szt.",
      quantity: 1,
      priceEst: 0,
      link: "",
      status: "Oczekuje",
      _totalOutputs: 0,
      _pointCount: 0,
    }]);
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide">
              <th className="text-left px-3 py-2.5 min-w-[220px]">Urządzenie / materiał</th>
              <th className="text-left px-3 py-2.5 w-36">Kategoria</th>
              <th className="text-center px-3 py-2.5 w-24">Ilość</th>
              <th className="text-left px-2 py-2.5 w-16">J.m.</th>
              <th className="text-right px-3 py-2.5 w-28">Cena jedn.</th>
              <th className="text-right px-3 py-2.5 w-28">Wartość</th>
              <th className="w-9" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                  {row._pointCount > 0 && (
                    <div className="text-[10px] text-slate-400 px-1 mt-0.5">
                      {row._pointCount} pkt · {row._totalOutputs} wypustów
                    </div>
                  )}
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
  const [bom, setBOM] = useState(null);
  const [points, setPoints] = useState([]);
  const [showPoints, setShowPoints] = useState(false);
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
    const pts = simulateProjectPoints(project);
    setPoints(pts);
    setBOM(buildBOM(pts));
    setSaveResult(null);
  };

  const handleSave = async () => {
    if (!project || !bom) return;
    setSaving(true);
    setSaveResult(null);

    try {
      // Pobierz istniejące zakupy i dołącz nowe pozycje (nie nadpisuj)
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
        .map(r => ({
          id:       r.id,
          name:     r.name,
          category: r.category,
          quantity: r.quantity,
          unit:     r.unit,
          priceEst: r.priceEst,
          link:     r.link ?? "",
          status:   r.status ?? "Oczekuje",
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
    () => (bom ?? []).reduce((s, r) => s + r.quantity * r.priceEst, 0),
    [bom],
  );

  // Group points by device for summary
  const pointsSummary = useMemo(() => {
    const map = new Map();
    for (const pt of points) {
      const row = map.get(pt.device) || { device: pt.device, count: 0, outputs: 0 };
      row.count++;
      row.outputs += pt.output;
      map.set(pt.device, row);
    }
    return [...map.values()].sort((a, b) => b.outputs - a.outputs);
  }, [points]);

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
            Czyta punkty instalacyjne projektu → oblicza potrzebne moduły Loxone → tworzy listę zakupów
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* Nota o formacie JSON */}
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">Format projekt_XXX.json</span> (docelowy, teraz symulowany):
            każdy punkt instalacyjny to{" "}
            <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[10px]">
              {"{ id: \"OS1\", device: \"Loxone Relay Extension\", output: 1 }"}
            </code>{" "}
            — <code className="font-mono text-[10px] bg-blue-100 px-1 rounded">output</code> = liczba wyjść zużywanych przez dany punkt.
            Dane katalogu (wypusty/szt., ceny) z{" "}
            <span className="font-semibold">LOXONE.xlsx</span> w materiałach designIQ.
          </div>
        </div>

        {/* Step 1: wybór projektu */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Projekt
            </label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-400 transition-all bg-white">
              <FolderKanban className="w-4 h-4 text-slate-300 flex-shrink-0" />
              <select
                value={selectedProjectId}
                onChange={e => { setSelectedProjectId(e.target.value); setBOM(null); setPoints([]); setSaveResult(null); }}
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
            disabled={!selectedProjectId}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:from-orange-700 hover:to-orange-600 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Generuj
          </button>
        </div>

        {/* Step 2+3: wyniki */}
        <AnimatePresence>
          {bom && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Podsumowanie punktów */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                <button
                  onClick={() => setShowPoints(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-5 h-5 bg-orange-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {points.length}
                    </span>
                    Punkty instalacyjne (symulowane) · {pointsSummary.length} typów urządzeń
                  </div>
                  {showPoints
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />
                  }
                </button>

                <AnimatePresence>
                  {showPoints && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 space-y-1.5">
                        {pointsSummary.map(row => (
                          <div key={row.device} className="flex items-center gap-3 text-xs">
                            <span className="flex-1 text-slate-700 font-medium">{row.device}</span>
                            <span className="text-slate-400">{row.count} pkt</span>
                            <span className="text-slate-500 font-semibold w-20 text-right">
                              {row.outputs} wypustów
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* BOM table */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-slate-700">Zestawienie materiałów</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    edytowalne
                  </span>
                </div>
                <BOMTable items={bom} onChange={setBOM} cennik={cennik} />
              </div>

              {/* Footer: total + save button */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-400">Łączna wartość zestawienia</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {totalValue.toLocaleString("pl-PL")} zł
                  </div>
                  <div className="text-xs text-slate-400">netto · bez robocizny i okablowania</div>
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
                    disabled={saving || !bom?.length}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-bold hover:from-slate-900 hover:to-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    {saving
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Zapisuję…</>
                      : <><ShoppingCart className="w-4 h-4" /> Stwórz listę zakupów</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!bom && !selectedProjectId && (
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
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
      {/* Nagłówek */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kalkulator</h2>
          <p className="text-xs text-slate-400">Generator listy zakupów Loxone</p>
        </div>
      </div>

      {/* Generator BOM */}
      <BOMGenerator projects={projects} />
    </div>
  );
}
