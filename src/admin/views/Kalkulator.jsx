import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, FolderKanban, RefreshCw, Trash2, Plus,
  ShoppingCart, CheckCircle2, AlertCircle, ChevronDown,
  ChevronRight, X, Cpu, BarChart3, Package,
} from "lucide-react";
import * as GAS from "../api/gasApi";
import { gasGet } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";
import { TODAY } from "../mockData";
import { loadInstallationPoints } from "../../lib/shoppingList/installationData";
import { loadProductCatalog } from "../../lib/shoppingList/productCatalog";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

const CATALOG = loadProductCatalog();

// Domyślne urządzenie sterujące dla każdego typu zasobu
const DEFAULT_CONTROL = {
  relay_output:  "lox-relay-ext",
  dimmer_output: "lox-dimmer-ext",
  rgbw_output:   "lox-rgbw-dimmer",
  motor_output:  "lox-blind-ctrl",
  digital_input: "lox-extension",
  analog_input:  "lox-analog-ext",
};

const RESOURCE_BADGE_COLOR = {
  relay_output:  "bg-blue-100 text-blue-700",
  dimmer_output: "bg-purple-100 text-purple-700",
  rgbw_output:   "bg-pink-100 text-pink-700",
  motor_output:  "bg-green-100 text-green-700",
  digital_input: "bg-yellow-100 text-yellow-700",
  analog_input:  "bg-orange-100 text-orange-700",
};

const RESOURCE_LABEL = {
  relay_output:  "Przekaźnik",
  dimmer_output: "Dimmer",
  rgbw_output:   "RGBW",
  motor_output:  "Napęd",
  digital_input: "We. cyt.",
  analog_input:  "We. analog.",
};

function buildDefaultAssignments(points) {
  const result = {};
  for (const pt of points) {
    result[pt.id] = {
      controlDevice: DEFAULT_CONTROL[pt.resourceType] ?? "uncontrolled",
      ioCount: 1,
      materials: [],
    };
  }
  return result;
}

function calculateSummary(points, assignments, matList, cennik) {
  const deviceIO = {};    // productId -> totalIO
  const matCount = {};    // matName -> qty

  for (const pt of points) {
    const a = assignments[pt.id];
    if (!a) continue;
    if (a.controlDevice && a.controlDevice !== "uncontrolled") {
      deviceIO[a.controlDevice] = (deviceIO[a.controlDevice] ?? 0) + (a.ioCount ?? 1);
    }
    for (const m of (a.materials ?? [])) {
      matCount[m.name] = (matCount[m.name] ?? 0) + m.qty;
    }
  }

  const allPrices = [
    ...(cennik ?? []),
    ...(matList ?? []).map(m => ({ name: m.name, price_pln: m.price_pln, sku: null })),
  ];

  const deviceItems = Object.entries(deviceIO).map(([productId, totalIO]) => {
    const product = CATALOG.find(p => p.id === productId);
    if (!product) return null;
    return {
      id: `dev-${productId}`,
      name: product.name,
      partNumber: product.partNumber,
      totalIO,
      outputsPerUnit: product.outputsPerUnit,
      quantity: Math.ceil(totalIO / product.outputsPerUnit),
      unit: product.unit,
      category: "smart_home",
      priceEst: allPrices.find(c => String(c.sku) === product.partNumber)?.price_pln ?? 0,
    };
  }).filter(Boolean);

  const materialItems = Object.entries(matCount).map(([name, qty]) => {
    const price = allPrices.find(c => c.name === name)?.price_pln ?? 0;
    return {
      id: `mat-${name}`,
      name,
      quantity: qty,
      unit: "szt.",
      category: "cables",
      priceEst: price,
    };
  });

  return { deviceItems, materialItems };
}

// Próba odgadnięcia resourceType z nazwy warstwy DWG
function guessResourceType(layer) {
  const l = layer.toLowerCase();
  if (l.includes("dim"))                              return "dimmer_output";
  if (l.includes("rgb") || l.includes("led"))         return "rgbw_output";
  if (l.includes("bld") || l.includes("motor") || l.includes("rol")) return "motor_output";
  if (l.includes("tmp") || l.includes("analog"))      return "analog_input";
  if (l.includes("btn") || l.includes("dig"))         return "digital_input";
  return "relay_output";
}

// ─────────────────────────────────────────────────────────────────────────────
// MaterialRow — jeden wiersz materiału przypisanego do punktu
// ─────────────────────────────────────────────────────────────────────────────

function MaterialRow({ mat, onQtyChange, onRemove }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="flex-1 text-xs text-slate-700 truncate">{mat.name}</span>
      <input
        type="number" min="1" value={mat.qty}
        onChange={e => onQtyChange(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-12 text-center border border-slate-200 rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-orange-400"
      />
      <span className="text-xs text-slate-400">szt.</span>
      <button onClick={onRemove} className="p-0.5 text-slate-300 hover:text-red-500 rounded">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AddMaterialRow — formularz dodawania materiału z autocomplete
// ─────────────────────────────────────────────────────────────────────────────

function AddMaterialRow({ matOptions, onAdd }) {
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState(1);
  const [showSugg, setShowSugg] = useState(false);
  const ref = useRef(null);

  const suggestions = useMemo(() => {
    if (search.length < 2) return [];
    const q = search.toLowerCase();
    return matOptions.filter(m => m.name && m.name.toLowerCase().includes(q)).slice(0, 6);
  }, [search, matOptions]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShowSugg(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = (name = search) => {
    if (!name.trim()) return;
    onAdd({ id: `m-${Date.now()}`, name: name.trim(), qty });
    setSearch("");
    setQty(1);
    setShowSugg(false);
  };

  return (
    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-1" ref={ref}>
      <div className="relative flex-1">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setShowSugg(true); }}
          onFocus={() => setShowSugg(true)}
          placeholder="Szukaj materiału…"
          className="w-full text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-400"
        />
        {showSugg && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full mt-0.5 w-64 bg-white border border-slate-200 rounded shadow-lg z-50 max-h-40 overflow-y-auto">
            {suggestions.map(m => (
              <li
                key={m.name}
                onMouseDown={() => { setSearch(m.name); setShowSugg(false); }}
                className="px-3 py-1.5 text-xs hover:bg-orange-50 cursor-pointer flex items-center justify-between"
              >
                <span className="truncate">{m.name}</span>
                {m.price_pln != null && (
                  <span className="text-orange-600 ml-2 shrink-0">{m.price_pln} zł</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        type="number" min="1" value={qty}
        onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-12 text-center border border-slate-200 rounded px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-orange-400"
      />
      <button
        onMouseDown={() => handleAdd()}
        className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PointRow — jeden wiersz punktu instalacyjnego
// ─────────────────────────────────────────────────────────────────────────────

function PointRow({ point, assignment, onAssignmentChange, matOptions, isExpanded, onToggleExpand }) {
  const updateControl = (deviceId) =>
    onAssignmentChange({ ...assignment, controlDevice: deviceId });

  const updateIoCount = (count) =>
    onAssignmentChange({ ...assignment, ioCount: count });

  const addMaterial = (mat) =>
    onAssignmentChange({ ...assignment, materials: [...(assignment.materials ?? []), mat] });

  const updateMaterialQty = (idx, qty) => {
    const mats = [...(assignment.materials ?? [])];
    mats[idx] = { ...mats[idx], qty };
    onAssignmentChange({ ...assignment, materials: mats });
  };

  const removeMaterial = (idx) => {
    const mats = [...(assignment.materials ?? [])];
    mats.splice(idx, 1);
    onAssignmentChange({ ...assignment, materials: mats });
  };

  const matCount = assignment.materials?.length ?? 0;

  return (
    <>
      <tr className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
        {/* ID */}
        <td className="px-3 py-2 font-mono text-xs text-slate-400 whitespace-nowrap">{point.id}</td>
        {/* Funkcja */}
        <td className="px-3 py-2 text-sm text-slate-800">{point.function}</td>
        {/* Typ zasobu */}
        <td className="px-3 py-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${RESOURCE_BADGE_COLOR[point.resourceType] ?? "bg-slate-100 text-slate-500"}`}>
            {RESOURCE_LABEL[point.resourceType] ?? point.resourceType}
          </span>
        </td>
        {/* Element sterujący */}
        <td className="px-3 py-2">
          <select
            value={assignment.controlDevice ?? "uncontrolled"}
            onChange={e => updateControl(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-orange-400 bg-white max-w-[190px] w-full"
          >
            <option value="uncontrolled">— niesterowane —</option>
            {CATALOG.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </td>
        {/* I/O */}
        <td className="px-3 py-2 text-center">
          {assignment.controlDevice !== "uncontrolled" ? (
            <input
              type="number" min="1" max="12" value={assignment.ioCount ?? 1}
              onChange={e => updateIoCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center border border-slate-200 rounded px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-orange-400 tabular-nums"
            />
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
        </td>
        {/* Materiały — przycisk otwierający inline panel */}
        <td className="px-3 py-2">
          <button
            onClick={onToggleExpand}
            className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1 transition-colors ${
              isExpanded
                ? "bg-orange-100 text-orange-700"
                : matCount > 0
                  ? "bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  : "text-slate-400 hover:text-orange-500 hover:bg-orange-50"
            }`}
          >
            {matCount > 0 ? (
              <>
                <span className="w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">{matCount}</span>
                mat.
              </>
            ) : (
              <><Plus className="w-3 h-3" /> dodaj</>
            )}
          </button>
        </td>
      </tr>
      {/* Rozwijany panel materiałów */}
      {isExpanded && (
        <tr className="bg-orange-50/40 border-b border-orange-100/60">
          <td colSpan={6} className="px-6 py-2">
            <div className="max-w-sm">
              {(assignment.materials ?? []).map((mat, idx) => (
                <MaterialRow
                  key={mat.id ?? idx}
                  mat={mat}
                  onQtyChange={qty => updateMaterialQty(idx, qty)}
                  onRemove={() => removeMaterial(idx)}
                />
              ))}
              <AddMaterialRow matOptions={matOptions} onAdd={addMaterial} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomGroup — sekcja z punktami z jednego pomieszczenia
// ─────────────────────────────────────────────────────────────────────────────

function RoomGroup({ room, points, assignments, onAssignmentChange, matOptions, expandedRows, onToggleRow }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <tr
        className="bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <td colSpan={6} className="px-3 py-2">
          <div className="flex items-center gap-2">
            {open
              ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            }
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{room}</span>
            <span className="text-[10px] text-slate-400">({points.length} pkt.)</span>
          </div>
        </td>
      </tr>
      {open && points.map(pt => (
        <PointRow
          key={pt.id}
          point={pt}
          assignment={assignments[pt.id] ?? { controlDevice: "uncontrolled", ioCount: 1, materials: [] }}
          onAssignmentChange={a => onAssignmentChange(pt.id, a)}
          matOptions={matOptions}
          isExpanded={expandedRows.has(pt.id)}
          onToggleExpand={() => onToggleRow(pt.id)}
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SummaryTable — zestawienie obliczone z przypisań
// ─────────────────────────────────────────────────────────────────────────────

function SummaryTable({ deviceItems, materialItems }) {
  const total = [...deviceItems, ...materialItems].reduce((s, i) => s + i.quantity * (i.priceEst ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Urządzenia sterujące */}
      {deviceItems.length > 0 && (
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" /> Urządzenia sterujące
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                  <th className="text-left px-3 py-2.5">Urządzenie</th>
                  <th className="text-left px-3 py-2.5 w-24">Nr kat.</th>
                  <th className="text-center px-3 py-2.5 w-28">Zajęte / dostępne I/O</th>
                  <th className="text-center px-3 py-2.5 w-20">Ilość</th>
                  <th className="text-right px-3 py-2.5 w-28">Cena jedn.</th>
                  <th className="text-right px-3 py-2.5 w-28">Wartość</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deviceItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-medium text-slate-800">{item.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">{item.partNumber}</td>
                    <td className="px-3 py-2 text-center text-xs text-slate-500 tabular-nums">
                      {item.totalIO} / {item.quantity * item.outputsPerUnit}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-orange-600">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500 tabular-nums">
                      {item.priceEst > 0 ? `${item.priceEst.toLocaleString("pl-PL")} zł` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700 tabular-nums">
                      {item.priceEst > 0 ? `${(item.quantity * item.priceEst).toLocaleString("pl-PL")} zł` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Materiały */}
      {materialItems.length > 0 && (
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Materiały
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                  <th className="text-left px-3 py-2.5">Materiał</th>
                  <th className="text-center px-3 py-2.5 w-20">Ilość</th>
                  <th className="text-right px-3 py-2.5 w-28">Cena jedn.</th>
                  <th className="text-right px-3 py-2.5 w-28">Wartość</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-slate-800">{item.name}</td>
                    <td className="px-3 py-2 text-center font-bold text-orange-600 tabular-nums">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500 tabular-nums">
                      {item.priceEst > 0 ? `${item.priceEst.toLocaleString("pl-PL")} zł` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700 tabular-nums">
                      {item.priceEst > 0 ? `${(item.quantity * item.priceEst).toLocaleString("pl-PL")} zł` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suma */}
      {total > 0 && (
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <div className="text-right">
            <div className="text-xs text-slate-400">Łączna wartość zestawienia</div>
            <div className="text-2xl font-bold text-orange-600">{total.toLocaleString("pl-PL")} zł</div>
            <div className="text-xs text-slate-400">netto</div>
          </div>
        </div>
      )}

      {deviceItems.length === 0 && materialItems.length === 0 && (
        <div className="text-center py-8 text-slate-300 text-sm">
          Brak przypisanych urządzeń ani materiałów
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PointCalculator — główny komponent kalkulatora
// ─────────────────────────────────────────────────────────────────────────────

function PointCalculator({ projects }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [points, setPoints] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [view, setView] = useState("points"); // "points" | "summary"
  const [cennik, setCennik] = useState([]);
  const [matList, setMatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  const project = projects.find(p => p.id === selectedProjectId) ?? null;

  // Wczytaj cennik i listę materiałów
  useEffect(() => {
    if (!GAS_ON) return;
    Promise.all([
      gasGet("getCennik").catch(() => []),
      gasGet("getMaterialyJson").catch(() => []),
    ]).then(([cennikData, matData]) => {
      setCennik(Array.isArray(cennikData) ? cennikData : []);
      setMatList(Array.isArray(matData) ? matData : []);
    });
  }, []);

  // Połączona lista do autocomplete materiałów
  const matOptions = useMemo(() => {
    const all = [
      ...cennik.map(c => ({ name: c.name, price_pln: c.price_pln })),
      ...matList.map(m => ({ name: m.name, price_pln: m.price_pln })),
    ];
    const seen = new Set();
    return all.filter(m => m.name && !seen.has(m.name) && seen.add(m.name));
  }, [cennik, matList]);

  // Wczytaj punkty dla wybranego projektu
  const handleLoadPoints = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setLoadError(null);
    setPoints([]);
    setAssignments({});
    setExpandedRows(new Set());
    setView("points");

    try {
      let pts = [];

      // Najpierw próbujemy danych testowych (po kodzie projektu)
      try {
        pts = loadInstallationPoints(project.code);
      } catch {
        // Jeśli brak hardcoded danych — próbujemy GAS (plik projekt.json)
        if (GAS_ON) {
          const result = await GAS.getDwgViewerContent(project.code).catch(() => null);
          if (result?.attribs) {
            pts = Object.entries(result.attribs).map(([handle, a]) => ({
              id: a.tag ?? handle,
              room: a.floor ?? a.layer ?? "—",
              function: a.desc ?? a.tag ?? handle,
              resourceType: guessResourceType(a.layer ?? ""),
              outputCount: 1,
            }));
          }
        }
      }

      if (pts.length === 0) {
        setLoadError("Brak danych instalacyjnych dla tego projektu. Wgraj plik projekt.json do Google Drive.");
      } else {
        setPoints(pts);
        setAssignments(buildDefaultAssignments(pts));
      }
    } catch (e) {
      setLoadError("Błąd ładowania punktów: " + (e?.message ?? "nieznany błąd"));
    } finally {
      setLoading(false);
    }
  }, [project]);

  // Grupowanie punktów po pomieszczeniu
  const rooms = useMemo(() => {
    const map = {};
    for (const pt of points) {
      const r = pt.room ?? "—";
      if (!map[r]) map[r] = [];
      map[r].push(pt);
    }
    return map;
  }, [points]);

  const summary = useMemo(
    () => calculateSummary(points, assignments, matList, cennik),
    [points, assignments, matList, cennik],
  );

  const handleToggleRow = useCallback((id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleAssignmentChange = useCallback((pointId, a) => {
    setAssignments(prev => ({ ...prev, [pointId]: a }));
  }, []);

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const allItems = [...summary.deviceItems, ...summary.materialItems].map(item => ({
        id: item.id,
        name: item.name,
        category: item.category ?? "smart_home",
        quantity: item.quantity,
        unit: item.unit,
        priceEst: item.priceEst ?? 0,
        link: "",
        status: "Oczekuje",
      }));

      let existingId;
      let existingItems = [];
      if (GAS_ON) {
        const existing = await GAS.getZakupy(project.id).catch(() => null);
        if (existing?.items) { existingItems = existing.items; existingId = existing.id; }
      }

      const existingIds = new Set(existingItems.map(i => i.id));
      const newItems = allItems.filter(i => !existingIds.has(i.id));

      if (GAS_ON) {
        await GAS.upsertZakupy({
          id: existingId,
          projectId: project.id,
          items: [...existingItems, ...newItems],
          updatedDate: TODAY,
        });
      }
      setSaveResult("ok");
    } catch {
      setSaveResult("err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-4 h-4 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800">Kalkulator instalacji</div>
          <div className="text-xs text-slate-400 mt-0.5">
            Przypisz urządzenia i materiały do punktów — system wyliczy zestawienie
          </div>
        </div>
        {points.length > 0 && (
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setView("points")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === "points" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Punkty
            </button>
            <button
              onClick={() => setView("summary")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === "summary" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Zestawienie
            </button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-5">

        {/* Wybór projektu + wczytaj */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Projekt
            </label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-400 transition-all bg-white">
              <FolderKanban className="w-4 h-4 text-slate-300 flex-shrink-0" />
              <select
                value={selectedProjectId}
                onChange={e => {
                  setSelectedProjectId(e.target.value);
                  setPoints([]);
                  setAssignments({});
                  setSaveResult(null);
                  setLoadError(null);
                  setView("points");
                }}
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
            onClick={handleLoadPoints}
            disabled={!selectedProjectId || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:from-orange-700 hover:to-orange-600 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Wczytaj punkty
          </button>
        </div>

        {/* Błąd ładowania */}
        {loadError && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {loadError}
          </div>
        )}

        {/* Widok: punkty instalacyjne */}
        {view === "points" && points.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Punkty instalacyjne</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                  {points.length} pkt.
                </span>
              </div>
              <button
                onClick={() => setView("summary")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" /> Oblicz zestawienie
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                    <th className="text-left px-3 py-2.5 w-24">ID</th>
                    <th className="text-left px-3 py-2.5">Funkcja</th>
                    <th className="text-left px-3 py-2.5 w-28">Typ</th>
                    <th className="text-left px-3 py-2.5 w-52">Element sterujący</th>
                    <th className="text-center px-3 py-2.5 w-16">I/O</th>
                    <th className="text-left px-3 py-2.5 w-28">Materiały</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(rooms).map(([room, pts]) => (
                    <RoomGroup
                      key={room}
                      room={room}
                      points={pts}
                      assignments={assignments}
                      onAssignmentChange={handleAssignmentChange}
                      matOptions={matOptions}
                      expandedRows={expandedRows}
                      onToggleRow={handleToggleRow}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Widok: zestawienie */}
        {view === "summary" && points.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Zestawienie materiałów</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                  z {points.length} pkt.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <AnimatePresence>
                  {saveResult === "ok" && (
                    <motion.div
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-green-600 text-sm font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Zapisano w zakupach
                    </motion.div>
                  )}
                  {saveResult === "err" && (
                    <div className="flex items-center gap-1.5 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" /> Błąd zapisu
                    </div>
                  )}
                </AnimatePresence>
                <button
                  onClick={handleSave}
                  disabled={saving || !project}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-bold hover:from-slate-900 hover:to-slate-800 disabled:opacity-40 transition-all shadow-sm"
                >
                  {saving
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Zapisuję…</>
                    : <><ShoppingCart className="w-4 h-4" /> Zapisz do zakupów</>
                  }
                </button>
              </div>
            </div>

            <SummaryTable
              deviceItems={summary.deviceItems}
              materialItems={summary.materialItems}
            />
          </div>
        )}

        {/* Empty state */}
        {!selectedProjectId && points.length === 0 && !loadError && (
          <div className="text-center py-8 text-slate-300 text-sm">
            Wybierz projekt i kliknij „Wczytaj punkty"
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
          <p className="text-xs text-slate-400">Przypisz urządzenia i materiały — system wyliczy zestawienie</p>
        </div>
      </div>

      <PointCalculator projects={projects} />
    </div>
  );
}
