import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Zap, TrendingUp, Activity, Info, FolderKanban,
  RefreshCw, ChevronDown, ChevronUp, Trash2, Plus, ShoppingCart,
  CheckCircle2, AlertCircle, FileText,
} from "lucide-react";
import * as GAS from "../api/gasApi";
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

function BOMTable({ items, onChange }) {
  const total = items.reduce((s, r) => s + r.quantity * r.priceEst, 0);

  const update = (id, key, val) =>
    onChange(items.map(r => r.id === id ? { ...r, [key]: val } : r));

  const remove = (id) => onChange(items.filter(r => r.id !== id));

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
                {/* Nazwa */}
                <td className="px-3 py-2">
                  <input
                    value={row.name}
                    onChange={e => update(row.id, "name", e.target.value)}
                    className="w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400/50 rounded px-1 py-0.5 text-slate-800 font-medium text-sm"
                    placeholder="Nazwa urządzenia…"
                  />
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

  const project = projects.find(p => p.id === selectedProjectId) ?? null;

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

    const zakupy = {
      projectId: project.id,
      items: bom.map(r => ({
        id:       r.id,
        name:     r.name,
        category: r.category,
        quantity: r.quantity,
        unit:     r.unit,
        priceEst: r.priceEst,
        link:     r.link ?? "",
        status:   r.status ?? "Oczekuje",
      })),
      updatedDate: TODAY,
    };

    try {
      if (GAS_ON) {
        await GAS.upsertZakupy(zakupy);
      }
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
                <BOMTable items={bom} onChange={setBOM} />
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
// ISTNIEJĄCE KALKULATORY POMOCNICZE (zwinięte w akordeon)
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, badge, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm"
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-orange-500" />
        <span className="font-semibold text-slate-800">{title}</span>
        {badge && (
          <span className="ml-1 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">{badge}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

function Stepper({ value, onChange, min = 0 }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-base leading-none transition-colors">−</button>
      <input type="number" min={min} value={value}
        onChange={e => onChange(Math.max(min, parseInt(e.target.value) || 0))}
        className="w-14 text-center border border-slate-200 rounded-lg py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
      />
      <button onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-base leading-none transition-colors">+</button>
    </div>
  );
}

const LOXONE_MODULES = [
  { key: "miniserver", label: "Loxone Miniserver Gen 2", price: 2490, color: "text-orange-600", bg: "bg-orange-50" },
  { key: "extension",  label: "Extension (8 DI / 8 DO)",  price:  790, color: "text-blue-600",   bg: "bg-blue-50"   },
  { key: "dimmer",     label: "Dimmer Extension",         price: 1190, color: "text-purple-600", bg: "bg-purple-50" },
  { key: "blind",      label: "Blind Extension",          price: 1190, color: "text-green-600",  bg: "bg-green-50"  },
  { key: "tree",       label: "Tree Extension",           price:  890, color: "text-amber-600",  bg: "bg-amber-50"  },
];

const LOXONE_INPUTS = [
  { key: "lights",   label: "Grupy oświetleniowe (ON/OFF)", icon: "💡", tip: "Każda niezależna sekcja świateł" },
  { key: "dimmers",  label: "Obwody ściemnialne",           icon: "🔆", tip: "Oświetlenie LED/halogen z regulacją" },
  { key: "blinds",   label: "Rolety / żaluzje",            icon: "🪟", tip: "Każdy napęd rolety/żaluzji" },
  { key: "heating",  label: "Strefy ogrzewania",           icon: "🌡️", tip: "Niezależne obwody grzewcze/klimatyzacja" },
  { key: "sensors",  label: "Czujniki (temp., ruch, CO2)", icon: "📡", tip: "Czujniki 1-Wire, AI lub cyfrowe" },
];

function LoxoneCalc() {
  const [v, setV] = useState({ lights: 12, dimmers: 4, blinds: 6, heating: 8, sensors: 6 });
  const set = (k, val) => setV(p => ({ ...p, [k]: val }));
  const doNeeded = v.lights + v.heating;
  const diNeeded = Math.ceil((v.lights + v.blinds + v.dimmers) * 1.5 + v.sensors);
  const ext = Math.max(Math.ceil((Math.max(doNeeded, diNeeded) - 8) / 8), 0);
  const dimExt = Math.ceil(v.dimmers / 8);
  const blindExt = Math.ceil(v.blinds / 4);
  const treeExt = Math.ceil(v.sensors / 10);
  const cost = 2490 + ext * 790 + dimExt * 1190 + blindExt * 1190 + treeExt * 890;
  const modules = [
    { key: "miniserver", count: 1,         price: 2490 },
    { key: "extension",  count: ext,       price: 790  },
    { key: "dimmer",     count: dimExt,    price: 1190 },
    { key: "blind",      count: blindExt,  price: 1190 },
    { key: "tree",       count: treeExt,   price: 890  },
  ];
  return (
    <SectionCard icon={Zap} title="Kalkulator modułów Loxone" badge="Szybka kalkulacja">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {LOXONE_INPUTS.map(({ key, label, icon, tip }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xl w-7 flex-shrink-0 text-center">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700">{label}</div>
                <div className="text-xs text-slate-400">{tip}</div>
              </div>
              <Stepper value={v[key]} onChange={val => set(key, val)} />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Wymagane moduły:</p>
          <div className="space-y-2">
            {modules.filter(m => m.count > 0).map(m => {
              const mod = LOXONE_MODULES.find(x => x.key === m.key);
              return (
                <div key={m.key} className={`flex items-center justify-between rounded-lg px-3 py-2 ${mod.bg}`}>
                  <span className="text-sm text-slate-700">{mod.label}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${mod.color}`}>×{m.count}</span>
                    <span className="text-xs text-slate-500">{(m.count * m.price).toLocaleString("pl")} zł</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white">
            <p className="text-xs text-orange-100">Szacunkowy koszt sprzętu Loxone</p>
            <p className="text-2xl font-bold mt-0.5">~{cost.toLocaleString("pl")} zł</p>
            <p className="text-xs text-orange-200 mt-1">netto · bez robocizny i okablowania</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

const CABLE_TYPES = [
  { id: 1, type: "YDY 3×1.5 mm²",       hint: "oświetlenie",          pricePerM: 2.5 },
  { id: 2, type: "YDY 5×2.5 mm²",       hint: "obwody siłowe",        pricePerM: 4.2 },
  { id: 3, type: "YSLCY 3×1.5 mm²",     hint: "ekranowany (silniki)", pricePerM: 3.8 },
  { id: 4, type: "UTP Cat6",            hint: "sieć / BUS / IP",      pricePerM: 1.8 },
  { id: 5, type: "Loxone Tree Bus",     hint: "magistrala drzewkowa", pricePerM: 3.2 },
  { id: 6, type: "KNX (YCYM 2×2×0.8)", hint: "KNX / EIB",            pricePerM: 4.8 },
];

function CableCalc() {
  const [cables, setCables] = useState(CABLE_TYPES.map(c => ({ ...c, meters: 0 })));
  const set = (id, key, val) => setCables(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c));
  const total = cables.reduce((s, c) => s + c.meters * c.pricePerM, 0);
  const totalMeters = cables.reduce((s, c) => s + c.meters, 0);
  return (
    <SectionCard icon={Activity} title="Kalkulator kosztów okablowania">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
              <th className="text-left pb-2 font-medium">Typ kabla</th>
              <th className="text-right pb-2 font-medium pr-2">Metry</th>
              <th className="text-right pb-2 font-medium pr-2">Cena/m (zł)</th>
              <th className="text-right pb-2 font-medium">Wartość</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {cables.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 pr-4">
                  <div className="font-medium text-slate-700">{c.type}</div>
                  <div className="text-xs text-slate-400">{c.hint}</div>
                </td>
                <td className="py-2.5 pr-2 text-right">
                  <input type="number" min="0" placeholder="0" value={c.meters || ""}
                    onChange={e => set(c.id, "meters", parseFloat(e.target.value) || 0)}
                    className="w-20 text-right border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                  />
                </td>
                <td className="py-2.5 pr-2 text-right">
                  <input type="number" min="0" step="0.1" value={c.pricePerM}
                    onChange={e => set(c.id, "pricePerM", parseFloat(e.target.value) || 0)}
                    className="w-16 text-right border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                  />
                </td>
                <td className="py-2.5 text-right font-medium text-slate-700">
                  {(c.meters * c.pricePerM).toFixed(2)} zł
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">Łącznie: <span className="font-semibold text-slate-700">{totalMeters.toFixed(0)} m</span> kabla</div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Łączny koszt okablowania</div>
          <div className="text-xl font-bold text-orange-600">{total.toFixed(2)} zł</div>
        </div>
      </div>
    </SectionCard>
  );
}

const PACKAGES = {
  "Smart design":  { price: 350, desc: "Oświetlenie, ogrzewanie, rolety" },
  "Smart design+": { price: 500, desc: "+ audio, klimatyzacja, zabezpieczenia" },
  "Full house":    { price: 700, desc: "Pełna automatyka, KNX/Loxone premium" },
};
const EXTRAS = [
  { key: "alarm",   label: "System alarmowy (Satel/DSC)", price: 3500 },
  { key: "audio",   label: "Multiroom audio",              price: 5000 },
  { key: "gate",    label: "Automatyka bramy / garażu",    price: 1800 },
  { key: "camera",  label: "Monitoring IP (4 kamery)",     price: 4200 },
  { key: "ev",      label: "Ładowarka EV (wallbox)",       price: 3200 },
  { key: "solar",   label: "Integracja PV / magazyn",      price: 6500 },
];

function PriceEstimator() {
  const [metraz, setMetraz] = useState(120);
  const [pakiet, setPakiet] = useState("Smart design");
  const [extras, setExtras] = useState({});
  const base = metraz * PACKAGES[pakiet].price;
  const extrasTotal = EXTRAS.reduce((s, e) => s + (extras[e.key] ? e.price : 0), 0);
  const total = base + extrasTotal;
  const margin = total * 0.25;
  return (
    <SectionCard icon={TrendingUp} title="Szybka wycena projektu">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">Powierzchnia obiektu</label>
              <span className="text-sm font-bold text-slate-800">{metraz} m²</span>
            </div>
            <input type="range" min="30" max="600" step="5" value={metraz}
              onChange={e => setMetraz(+e.target.value)} className="w-full accent-orange-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>30 m²</span><span>600 m²</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pakiet</label>
            <div className="space-y-2">
              {Object.entries(PACKAGES).map(([key, { price, desc }]) => (
                <label key={key} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${pakiet === key ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="radio" name="pakiet" checked={pakiet === key} onChange={() => setPakiet(key)} className="mt-0.5 accent-orange-500" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{key}</div>
                    <div className="text-xs text-slate-500">{desc}</div>
                    <div className="text-xs font-medium text-orange-600 mt-0.5">{price} zł/m²</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Systemy dodatkowe</label>
            <div className="grid grid-cols-2 gap-2">
              {EXTRAS.map(e => (
                <label key={e.key} className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${extras[e.key] ? "border-orange-300 bg-orange-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="checkbox" checked={!!extras[e.key]}
                    onChange={ev => setExtras(p => ({ ...p, [e.key]: ev.target.checked }))}
                    className="mt-0.5 accent-orange-500" />
                  <div>
                    <div className="text-xs font-medium text-slate-700 leading-tight">{e.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">+{e.price.toLocaleString("pl")} zł</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white flex-1">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Łączna wartość projektu</p>
            <p className="text-4xl font-bold mt-1">{total.toLocaleString("pl")} zł</p>
            <p className="text-sm text-slate-400 mt-0.5">netto · orientacyjnie</p>
            <div className="mt-5 pt-4 border-t border-slate-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Automatyka ({pakiet})</span>
                <span className="font-medium">{base.toLocaleString("pl")} zł</span>
              </div>
              {EXTRAS.filter(e => extras[e.key]).map(e => (
                <div key={e.key} className="flex justify-between text-sm">
                  <span className="text-slate-400">{e.label.split(" (")[0]}</span>
                  <span className="font-medium">+{e.price.toLocaleString("pl")} zł</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs text-green-600 font-medium">Szacowana marża (25%)</p>
            <p className="text-xl font-bold text-green-700 mt-0.5">{margin.toLocaleString("pl")} zł</p>
          </div>
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600">Wartość szacunkowa. Finalna wycena wymaga szczegółowego audytu i projektu instalacji.</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function Kalkulator({ projects = [] }) {
  const [showAux, setShowAux] = useState(false);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
      {/* Nagłówek */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kalkulator</h2>
          <p className="text-xs text-slate-400">Generator listy zakupów · Moduły Loxone · Okablowanie · Wycena</p>
        </div>
      </div>

      {/* Generator BOM — główna sekcja */}
      <BOMGenerator projects={projects} />

      {/* Kalkulatory pomocnicze — zwinięte */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowAux(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-400" />
            Kalkulatory pomocnicze (moduły, okablowanie, wycena)
          </span>
          {showAux ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        <AnimatePresence>
          {showAux && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-slate-50/50 space-y-4 border-t border-slate-200">
                <LoxoneCalc />
                <CableCalc />
                <PriceEstimator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
