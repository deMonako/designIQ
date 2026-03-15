import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from "react";
import ReactDOM from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calculator, FolderKanban, RefreshCw, Plus, Download, Search,
  ShoppingCart, CheckCircle2, AlertCircle, ChevronDown, ChevronRight,
  X, ChevronUp, SlidersHorizontal, BarChart3, Package, Cpu, Save, FolderOpen,
} from "lucide-react";
import * as GAS from "../api/gasApi";
import { gasGet } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";
import { TODAY } from "../mockData";
import { buildCatalogFromCennikWithSpecs } from "../../lib/shoppingList/productCatalog";
import { buildEffectiveMappings, EMPTY_KALKULATOR_SETTINGS } from "../../lib/shoppingList/kalkulatorDefaults";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);


// ── Definicje kolumn ─────────────────────────────────────────────────────────

const COLS = [
  { key: "tag",           label: "ID",            sortable: true,  defaultVisible: true,  narrow: true  },
  { key: "kondygnacja",   label: "Kondygnacja",   sortable: true,  defaultVisible: true  },
  { key: "pomieszczenie", label: "Pomieszczenie",  sortable: true,  defaultVisible: true  },
  { key: "typ",           label: "Typ",            sortable: true,  defaultVisible: true  },
  { key: "rola",          label: "Rola",           sortable: true,  defaultVisible: true  },
  { key: "uwagi",         label: "Uwagi",          sortable: false, defaultVisible: false },
  { key: "przewód",       label: "Przewód",        sortable: false, defaultVisible: false },
  { key: "wysokość",      label: "Wysokość",       sortable: false, defaultVisible: false },
  { key: "wariant",       label: "Wariant",        sortable: false, defaultVisible: false },
  { key: "kolor",         label: "Kolor",          sortable: false, defaultVisible: false },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveDefaultDevice(rawTyp, rola, typMappings) {
  const isSlave   = (rola ?? "").toLowerCase().includes("slave");
  const typConfig = typMappings?.[rawTyp];

  if (typConfig?.uncontrolled) return "uncontrolled";
  if (isSlave && !typConfig?.slaveGetsDevice) return "uncontrolled";

  return typConfig?.defaultDevice ?? "uncontrolled";
}

function attribsToRows(attribs, floorName, typMappings) {
  const rows = [];
  for (const [handle, a] of Object.entries(attribs)) {
    if (handle === "_meta" || !a || typeof a !== "object") continue;
    const rawTyp = a.typ ?? "";
    const rola   = a.rola ?? "";
    const typConfig    = typMappings?.[rawTyp];
    const controlDevice = resolveDefaultDevice(rawTyp, rola, typMappings);
    const ioCount = typConfig?.ioCount ?? 1;
    rows.push({
      _id:          `${floorName ?? ""}__${handle}`,
      tag:          a.tag          ?? handle,
      kondygnacja:  a.kondygnacja  ?? floorName ?? "",
      pomieszczenie:a.pomieszczenie?? "",
      typ:          rawTyp,
      rola,
      uwagi:        a.uwagi        ?? "",
      przewód:      a.przewód      ?? "",
      wysokość:     a.wysokość     ?? "",
      wariant:      a.wariant      ?? "",
      kolor:        a.kolor        ?? "",
      // kalkulatorowe
      rawTyp,
      controlDevice,
      ioCount,
      materials:         [],
      requiresAttention: false,
    });
  }
  return rows;
}

function calculateSummary(rows, catalog, matList, cennik) {
  const deviceIO = {};
  const controlMatCount = {}; // materiały wybrane jako element sterujący
  const matCount = {};        // dodatkowe materiały per punkt
  for (const r of rows) {
    if (r.controlDevice && r.controlDevice !== "uncontrolled") {
      if (r.controlDevice.startsWith("mat:")) {
        // Materiał jako element sterujący — zalicza się do urządzeń sterujących
        const name = r.controlDevice.slice(4);
        controlMatCount[name] = (controlMatCount[name] ?? 0) + (r.ioCount ?? 1);
      } else {
        deviceIO[r.controlDevice] = (deviceIO[r.controlDevice] ?? 0) + (r.ioCount ?? 1);
      }
    }
    for (const m of r.materials ?? []) {
      matCount[m.name] = (matCount[m.name] ?? 0) + m.qty;
    }
  }
  const allPrices = [
    ...(cennik ?? []),
    ...(matList ?? []).map(m => ({ name: m.name, price_pln: m.price_pln, sku: null })),
  ];
  const deviceItems = Object.entries(deviceIO).map(([productId, totalIO]) => {
    const product = catalog.find(p => p.id === productId);
    if (!product) return null;
    return {
      id: `dev-${productId}`, name: product.name, partNumber: product.partNumber,
      totalIO, outputsPerUnit: product.outputsPerUnit,
      quantity: Math.ceil(totalIO / product.outputsPerUnit),
      unit: product.unit ?? "szt.",
      priceEst: allPrices.find(c => String(c.sku) === product.partNumber)?.price_pln ?? 0,
    };
  }).filter(Boolean);
  // Materiały wybrane jako element sterujący → zawsze w sekcji urządzeń sterujących
  const controlMatItems = Object.entries(controlMatCount).map(([name, qty]) => ({
    id: `ctrl-mat-${name}`, name,
    partNumber: allPrices.find(c => c.name === name)?.sku ? String(allPrices.find(c => c.name === name).sku) : null,
    totalIO: qty, outputsPerUnit: 1, quantity: qty,
    unit: "szt.",
    priceEst: allPrices.find(c => c.name === name)?.price_pln ?? 0,
  }));
  const materialItems = Object.entries(matCount).map(([name, qty]) => ({
    id: `mat-${name}`, name, quantity: qty, unit: "szt.",
    partNumber: allPrices.find(c => c.name === name)?.sku ? String(allPrices.find(c => c.name === name).sku) : null,
    priceEst: allPrices.find(c => c.name === name)?.price_pln ?? 0,
  }));
  return { deviceItems: [...deviceItems, ...controlMatItems], materialItems };
}

// ── CSV export (bez zewnętrznych zależności, otwieralny w Excelu) ─────────────

function toCsvRow(cells) {
  return cells.map(v => {
    const s = String(v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  }).join(",");
}

function downloadCsv(content, filename) {
  // BOM UTF-8 — Excel wyświetla polskie znaki poprawnie
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportXLSX(rows, catalog, summary) {
  // Arkusz 1 — Punkty instalacyjne
  const headers1 = ["ID/Tag","Kondygnacja","Pomieszczenie","Typ","Rola","Uwagi","Przewód","Wysokosc","Wariant","Kolor","El. sterujacy","I/O","Materialy"];
  const data1 = rows.map(r => [
    r.tag, r.kondygnacja, r.pomieszczenie, r.typ, r.rola, r.uwagi,
    r.przewód, r.wysokość, r.wariant, r.kolor,
    r.controlDevice === "uncontrolled" ? "niesterowane" : r.controlDevice.startsWith("mat:") ? r.controlDevice.slice(4) : (catalog.find(p => p.id === r.controlDevice)?.name ?? r.controlDevice),
    r.controlDevice !== "uncontrolled" ? r.ioCount : "",
    (r.materials ?? []).map(m => `${m.name} x${m.qty}`).join("; "),
  ]);
  const csv1 = [toCsvRow(headers1), ...data1.map(toCsvRow)].join("\n");
  downloadCsv(csv1, "punkty_instalacyjne.csv");

  // Arkusz 2 — Zestawienie (osobny plik)
  if (summary.deviceItems.length > 0 || summary.materialItems.length > 0) {
    const headers2 = ["Kategoria","Nazwa","Nr kat.","Ilosc","Jednostka","Cena jedn.","Wartosc"];
    const data2 = [
      ...summary.deviceItems.map(d => [
        "Urz\u0105dzenie", d.name, d.partNumber, d.quantity, d.unit,
        d.priceEst || "", d.priceEst ? d.quantity * d.priceEst : "",
      ]),
      ...summary.materialItems.map(m => [
        "Materia\u0142", m.name, m.partNumber ?? "", m.quantity, m.unit,
        m.priceEst || "", m.priceEst ? m.quantity * m.priceEst : "",
      ]),
    ];
    const csv2 = [toCsvRow(headers2), ...data2.map(toCsvRow)].join("\n");
    downloadCsv(csv2, "zestawienie.csv");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ControlDevicePicker — picker z wyszukiwaniem urządzeń i materiałów
// ─────────────────────────────────────────────────────────────────────────────

function ControlDevicePicker({ value, catalog, matOptions, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inDropdown) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (open) {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropPos({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 288), // min 288px = w-72
        });
      }
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery("");
    }
  }, [open]);

  const label = value === "uncontrolled"
    ? "— niesterowane —"
    : value?.startsWith("mat:")
      ? value.slice(4)
      : catalog.find(p => p.id === value)?.name ?? value;

  const suggestions = useMemo(() => {
    if (query.length < 3) return [];
    const q = query.toLowerCase();
    const devs = catalog
      .filter(p => (p.name ?? "").toLowerCase().includes(q) || (p.partNumber ?? "").includes(q))
      .map(p => ({ value: p.id, label: p.name, sub: p.partNumber || null }));
    const devNames = new Set(devs.map(d => (d.label ?? "").toLowerCase()));
    const mats = matOptions
      .filter(m =>
        ((m.name ?? "").toLowerCase().includes(q) || (m.sku != null && String(m.sku).toLowerCase().includes(q)))
        && !devNames.has((m.name ?? "").toLowerCase())
      )
      .map(m => ({ value: `mat:${m.name}`, label: m.name, sub: m.sku || null }));
    return [...devs, ...mats].slice(0, 12);
  }, [query, catalog, matOptions]);

  const select = (val) => { onChange(val); setOpen(false); };

  const dropdown = open && ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      className="absolute z-[9999] mt-0.5 bg-white border border-slate-200 rounded-xl shadow-lg"
      style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}
    >
      <div className="p-2 border-b border-slate-100">
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Szukaj urządzenia lub materiału (min. 3 znaki)…"
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-orange-400"
        />
      </div>
      <div className="max-h-52 overflow-y-auto">
        <button
          type="button"
          onClick={() => select("uncontrolled")}
          className={`w-full text-left px-3 py-1.5 text-xs border-b border-slate-50 ${value === "uncontrolled" ? "bg-orange-50 text-orange-700 font-semibold" : "text-slate-500 hover:bg-slate-50"}`}
        >
          — niesterowane —
        </button>

        {query.length < 3 ? (
          <>
            {catalog.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Urządzenia Loxone</div>
                {catalog.map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => select(p.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-orange-50 ${value === p.id ? "bg-orange-50 text-orange-700" : "text-slate-700"}`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">{p.partNumber}</span>
                  </button>
                ))}
              </>
            )}
            <div className="px-3 py-2 text-[11px] text-slate-400 italic border-t border-slate-50">
              Wpisz 3 znaki, aby wyszukać materiały…
            </div>
          </>
        ) : suggestions.length > 0 ? (
          suggestions.map(s => (
            <button
              type="button"
              key={s.value}
              onClick={() => select(s.value)}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-orange-50 ${value === s.value ? "bg-orange-50 text-orange-700" : "text-slate-700"}`}
            >
              <span className="truncate">{s.label}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{s.sub}</span>
            </button>
          ))
        ) : (
          <div className="px-3 py-3 text-xs text-slate-400 text-center">Brak wyników dla &ldquo;{query}&rdquo;</div>
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 w-full border rounded-lg px-2 py-1 text-xs bg-white transition-colors ${open ? "border-orange-400 ring-1 ring-orange-400/20" : "border-slate-200 hover:border-orange-300"}`}
      >
        <span className={`flex-1 text-left truncate ${value === "uncontrolled" ? "text-slate-400" : "text-slate-700"}`}>{label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>
      {dropdown}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditableCell — komórka z edycją inline
// ─────────────────────────────────────────────────────────────────────────────

function EditableCell({ value, onChange, type = "text", placeholder = "—" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-sm text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400 rounded px-1 -mx-1 py-0.5 min-w-0 placeholder:text-slate-300"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AddMaterialRow — autocomplete do dodania materiału
// ─────────────────────────────────────────────────────────────────────────────

function AddMaterialRow({ matOptions, onAdd }) {
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState(1);
  const [showSugg, setShowSugg] = useState(false);
  const ref = useRef(null);

  const suggestions = useMemo(() => {
    if (search.length < 2) return [];
    const q = search.toLowerCase();
    return matOptions.filter(m =>
      m.name && (
        m.name.toLowerCase().includes(q) ||
        (m.sku != null && String(m.sku).toLowerCase().includes(q))
      )
    ).slice(0, 6);
  }, [search, matOptions]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowSugg(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const commit = (name = search) => {
    if (!name.trim()) return;
    onAdd({ id: `m-${Date.now()}`, name: name.trim(), qty });
    setSearch(""); setQty(1); setShowSugg(false);
  };

  return (
    <div className="flex items-center gap-2" ref={ref}>
      <div className="relative flex-1">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setShowSugg(true); }}
          onFocus={() => setShowSugg(true)}
          onKeyDown={e => e.key === "Enter" && commit()}
          placeholder="Szukaj materiału…"
          className="w-full text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-400"
        />
        {showSugg && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full mt-0.5 w-64 bg-white border border-slate-200 rounded shadow-lg z-50 max-h-36 overflow-y-auto">
            {suggestions.map(m => (
              <li
                key={m.name}
                onMouseDown={() => { setSearch(m.name); setShowSugg(false); }}
                className="px-3 py-1.5 text-xs hover:bg-orange-50 cursor-pointer flex justify-between"
              >
                <span className="truncate">{m.name}</span>
                {m.price_pln != null && <span className="text-orange-600 ml-2 shrink-0">{m.price_pln} zł</span>}
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
      <button onMouseDown={() => commit()} className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MaterialsPanel — rozwijany panel materiałów dla jednego wiersza
// ─────────────────────────────────────────────────────────────────────────────

function MaterialsPanel({ row, onRowChange, matOptions, colSpan }) {
  const [matsOpen, setMatsOpen] = useState(true);

  const updateMat = (idx, qty) => {
    const mats = [...row.materials];
    mats[idx] = { ...mats[idx], qty };
    onRowChange({ ...row, materials: mats });
  };
  const removeMat = (idx) => {
    const mats = [...row.materials];
    mats.splice(idx, 1);
    onRowChange({ ...row, materials: mats });
  };
  const addMat = (mat) => {
    onRowChange({ ...row, materials: [...row.materials, mat] });
    setMatsOpen(true);
  };

  return (
    <tr className="bg-orange-50/50 border-b border-orange-100">
      <td colSpan={colSpan} className="px-4 py-2">
        <div className="max-w-lg">
          {row.materials.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setMatsOpen(v => !v)}
                className="flex items-center gap-1 text-xs text-slate-500 font-medium hover:text-slate-700 mb-1.5"
              >
                {matsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Dodane materiały ({row.materials.length})
              </button>
              {matsOpen && (
                <div className="space-y-0.5 pl-1 border-l-2 border-orange-200 mb-2">
                  {row.materials.map((m, i) => (
                    <div key={m.id ?? i} className="flex items-center gap-2 py-0.5">
                      <span className="flex-1 text-xs text-slate-700 truncate">{m.name}</span>
                      <input
                        type="number" min="1" value={m.qty}
                        onChange={e => updateMat(i, Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 text-center border border-slate-200 rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-orange-400"
                      />
                      <span className="text-xs text-slate-400">szt.</span>
                      <button onClick={() => removeMat(i)} className="p-0.5 text-slate-300 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <AddMaterialRow matOptions={matOptions} onAdd={addMat} />
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SummaryPanel — zestawienie urządzeń i materiałów
// ─────────────────────────────────────────────────────────────────────────────

function SummaryPanel({ deviceItems, materialItems }) {
  const total = [...deviceItems, ...materialItems].reduce((s, i) => s + i.quantity * (i.priceEst ?? 0), 0);

  return (
    <div className="space-y-4">
      {deviceItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
            <Cpu className="w-3.5 h-3.5" /> Urządzenia sterujące
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase">
                  <th className="text-left px-3 py-2">Urządzenie</th>
                  <th className="text-left px-3 py-2 w-24">Nr kat.</th>
                  <th className="text-center px-3 py-2 w-28">Zajęte / dost. I/O</th>
                  <th className="text-center px-3 py-2 w-16">Ilość</th>
                  <th className="text-right px-3 py-2 w-24">Cena</th>
                  <th className="text-right px-3 py-2 w-24">Wartość</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deviceItems.map(d => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-medium text-slate-800">{d.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">{d.partNumber}</td>
                    <td className="px-3 py-2 text-center text-xs text-slate-500 tabular-nums">{d.totalIO} / {d.quantity * d.outputsPerUnit}</td>
                    <td className="px-3 py-2 text-center font-bold text-orange-600">{d.quantity}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500">{d.priceEst > 0 ? `${d.priceEst.toLocaleString("pl-PL")} zł` : "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700">{d.priceEst > 0 ? `${(d.quantity * d.priceEst).toLocaleString("pl-PL")} zł` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {materialItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
            <Package className="w-3.5 h-3.5" /> Materiały dodatkowe
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase">
                  <th className="text-left px-3 py-2">Materiał</th>
                  <th className="text-left px-3 py-2 w-24">Nr kat.</th>
                  <th className="text-center px-3 py-2 w-16">Ilość</th>
                  <th className="text-right px-3 py-2 w-24">Cena</th>
                  <th className="text-right px-3 py-2 w-24">Wartość</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialItems.map(m => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 text-slate-800">{m.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">{m.partNumber}</td>
                    <td className="px-3 py-2 text-center font-bold text-orange-600">{m.quantity}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500">{m.priceEst > 0 ? `${m.priceEst.toLocaleString("pl-PL")} zł` : "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700">{m.priceEst > 0 ? `${(m.quantity * m.priceEst).toLocaleString("pl-PL")} zł` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {total > 0 && (
        <div className="flex justify-end border-t border-slate-100 pt-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Łączna wartość zestawienia</div>
            <div className="text-2xl font-bold text-orange-600">{total.toLocaleString("pl-PL")} zł</div>
            <div className="text-xs text-slate-400">netto</div>
          </div>
        </div>
      )}
      {deviceItems.length === 0 && materialItems.length === 0 && (
        <div className="text-center py-8 text-slate-300 text-sm">Brak przypisanych urządzeń ani materiałów</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PointCalculator — główny komponent kalkulatora
// ─────────────────────────────────────────────────────────────────────────────

function PointCalculator({ projects, kalkulatorSettings = EMPTY_KALKULATOR_SETTINGS }) {
  // Dane
  const [rows, setRows] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [cennik, setCennik] = useState([]);
  const [matList, setMatList] = useState([]);

  // Selekcja projektu
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Widok
  const [activeTab, setActiveTab] = useState("table"); // "table" | "summary"
  const [expandedId, setExpandedId] = useState(null);

  // Filtrowanie
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filterTyp, setFilterTyp] = useState("all");
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");

  // Filtr master
  const [filterMasterOnly, setFilterMasterOnly] = useState(false);

  // Filtr: wymaga uwagi
  const [filterNeedsAttention, setFilterNeedsAttention] = useState(false);

  // Sortowanie
  const [sortKey, setSortKey] = useState("pomieszczenie");
  const [sortDir, setSortDir] = useState("asc");

  // Widoczność kolumn
  const [visibleCols, setVisibleCols] = useState(
    () => new Set(COLS.filter(c => c.defaultVisible).map(c => c.key))
  );
  const [showColPicker, setShowColPicker] = useState(false);

  // Zapis do zakupów
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // Konfiguracja kalkulatora (config.json)
  const [pendingConfig, setPendingConfig] = useState(null); // config czekający na decyzję
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaveResult, setConfigSaveResult] = useState(null); // "ok"|"err"|null

  const project = projects.find(p => p.id === selectedProjectId) ?? null;

  // Efektywne mapowania (defaults + nadpisania z ustawień użytkownika)
  const effectiveMappings = useMemo(
    () => buildEffectiveMappings(kalkulatorSettings),
    [kalkulatorSettings]
  );
  // Ref do użycia wewnątrz useCallback bez dodawania do deps
  const effectiveMappingsRef = useRef(effectiveMappings);
  useEffect(() => { effectiveMappingsRef.current = effectiveMappings; }, [effectiveMappings]);

  // Wczytaj katalog Loxone + cennik + materiały
  useEffect(() => {
    if (!GAS_ON) return;
    Promise.all([
      GAS.getLoxoneJson().catch(() => []),
      gasGet("getCennik").catch(() => []),
      gasGet("getMaterialyJson").catch(() => []),
    ]).then(([loxData, cennikData, matData]) => {
      const cennikArr = Array.isArray(cennikData) ? cennikData : [];
      // Buduj katalog z nadpisaniami SKU z ustawień użytkownika
      const fromCennik = buildCatalogFromCennikWithSpecs(cennikArr, effectiveMappingsRef.current.skuSpecs);
      if (Array.isArray(loxData) && loxData.length > 0) {
        const loxIds = new Set(loxData.map(p => p.id));
        setCatalog([...loxData, ...fromCennik.filter(p => !loxIds.has(p.id))]);
      } else {
        setCatalog(fromCennik);
      }
      setCennik(cennikArr);
      setMatList(Array.isArray(matData) ? matData : []);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const matOptions = useMemo(() => {
    const all = [
      ...cennik.map(c => ({ name: c.name, price_pln: c.price_pln, sku: c.sku ?? null })),
      ...matList.map(m => ({ name: m.name, price_pln: m.price_pln, sku: null })),
    ];
    const seen = new Set();
    return all.filter(m => m.name && !seen.has(m.name) && seen.add(m.name));
  }, [cennik, matList]);

  // Zastosuj konfigurację do wierszy
  const applyConfig = useCallback((baseRows, cfg) => {
    if (!cfg?.rows) return baseRows;
    return baseRows.map(r => {
      const override = cfg.rows[r._id];
      if (!override) return r;
      return {
        ...r,
        controlDevice:     override.controlDevice     ?? r.controlDevice,
        ioCount:           override.ioCount           ?? r.ioCount,
        materials:         override.materials          ?? r.materials,
        requiresAttention: override.requiresAttention ?? r.requiresAttention,
      };
    });
  }, []);

  // Wczytaj punkty z Google Drive
  const handleLoadPoints = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setLoadError(null);
    setRows([]);
    setExpandedId(null);
    setActiveTab("table");
    setPendingConfig(null);
    setConfigSaveResult(null);

    try {
      let loaded = [];

      if (GAS_ON) {
        const [result, cfg] = await Promise.all([
          GAS.getDwgViewerContent(project.code).catch(() => null),
          GAS.getKalkulatorConfig(project.code).catch(() => null),
        ]);

        if (result?.floors?.length > 0) {
          for (const floor of result.floors) {
            if (!floor.attribs || typeof floor.attribs !== "object") continue;
            loaded.push(...attribsToRows(floor.attribs, floor.name, effectiveMappingsRef.current.typMappings));
          }
        }

        if (loaded.length > 0 && cfg?.rows && Object.keys(cfg.rows).length > 0) {
          setPendingConfig({ cfg, baseRows: loaded });
          setRows(loaded); // wczytaj bez konfiguracji, czekaj na decyzję
        } else {
          setRows(loaded);
        }
      }

      if (loaded.length === 0) {
        setLoadError("Brak danych instalacyjnych. Wgraj projekt.json do folderu projektu na Google Drive.");
      }
    } catch (e) {
      setLoadError("Błąd ładowania: " + (e?.message ?? "nieznany"));
    } finally {
      setLoading(false);
    }
  }, [project]);

  // Zapisz konfigurację do config.json
  const handleSaveConfig = useCallback(async () => {
    if (!project || rows.length === 0) return;
    setConfigSaving(true);
    setConfigSaveResult(null);
    try {
      const rowOverrides = {};
      for (const r of rows) {
        const defaultIo = effectiveMappingsRef.current.typMappings[r.rawTyp]?.ioCount ?? 1;
        const hasOverride = r.controlDevice !== "uncontrolled" || r.materials.length > 0 || r.ioCount !== defaultIo || r.requiresAttention;
        if (hasOverride) {
          rowOverrides[r._id] = {
            controlDevice:     r.controlDevice,
            ioCount:           r.ioCount,
            materials:         r.materials,
            requiresAttention: r.requiresAttention,
          };
        }
      }
      const config = { version: 1, savedAt: TODAY, rows: rowOverrides };
      if (GAS_ON) await GAS.saveKalkulatorConfig(project.code, config);
      setConfigSaveResult("ok");
    } catch { setConfigSaveResult("err"); }
    finally { setConfigSaving(false); }
  }, [project, rows]);

  // Filtrowanie i sortowanie
  const { uniqueTypy, uniqueFloors } = useMemo(() => ({
    uniqueTypy:  [...new Set(rows.map(r => r.typ).filter(Boolean))].sort(),
    uniqueFloors:[...new Set(rows.map(r => r.kondygnacja).filter(Boolean))].sort(),
  }), [rows]);

  const uniqueRooms = useMemo(() => {
    const base = filterFloor === "all" ? rows : rows.filter(r => r.kondygnacja === filterFloor);
    return [...new Set(base.map(r => r.pomieszczenie).filter(Boolean))].sort();
  }, [rows, filterFloor]);

  // Reset filtra pomieszczenia gdy zmieni się kondygnacja
  useEffect(() => { setFilterRoom("all"); }, [filterFloor]);

  const filteredRows = useMemo(() => {
    const q = deferredSearch.toLowerCase();
    return rows
      .filter(r => {
        if (filterTyp   !== "all" && r.typ          !== filterTyp)   return false;
        if (filterFloor !== "all" && r.kondygnacja  !== filterFloor) return false;
        if (filterRoom  !== "all" && r.pomieszczenie !== filterRoom)  return false;
        if (filterMasterOnly && !(r.rola ?? "").toLowerCase().includes("master")) return false;
        if (filterNeedsAttention && !r.requiresAttention) return false;
        if (q && !["tag","rola","pomieszczenie","uwagi","typ","wariant"].some(k => (r[k] ?? "").toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => {
        const av = (a[sortKey] ?? "").toString().toLowerCase();
        const bv = (b[sortKey] ?? "").toString().toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [rows, deferredSearch, filterTyp, filterFloor, filterRoom, filterMasterOnly, filterNeedsAttention, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const updateRow = useCallback((id, updater) => {
    setRows(prev => prev.map(r => r._id === id ? (typeof updater === "function" ? updater(r) : { ...r, ...updater }) : r));
  }, []);

  const summary = useMemo(
    () => calculateSummary(rows, catalog, matList, cennik),
    [rows, catalog, matList, cennik],
  );

  // Widoczne kolumny do wyświetlenia
  const activeCols = COLS.filter(c => visibleCols.has(c.key));
  const totalColSpan = activeCols.length + 5; // +5 za el.sterujący, I/O, materiały, uwaga, (zapas)

  const handleSave = async () => {
    if (!project) return;
    setSaving(true); setSaveResult(null);
    try {
      const getCategoryForItem = (item) => {
        // Urządzenia z katalogu Loxone → zawsze sprzęt smart home
        if (item.id.startsWith("dev-") || item.id.startsWith("ctrl-mat-")) {
          const name = item.name;
          const matEntry = matList.find(m => m.name === name);
          if (matEntry?.shopCategory) return matEntry.shopCategory;
          if (matEntry?.device === "Loxone") return "smart_home";
          if (catalog.find(p => p.name === name)) return "smart_home";
          // ctrl-mat domyślnie do smart_home (pełnią rolę elementu sterującego)
          if (item.id.startsWith("dev-")) return "smart_home";
          return "smart_home";
        }
        // Materiały dodatkowe → szukaj shopCategory, Loxone → smart_home, reszta → other
        const name = item.name;
        const matEntry = matList.find(m => m.name === name);
        if (matEntry?.shopCategory) return matEntry.shopCategory;
        if (matEntry?.device === "Loxone") return "smart_home";
        if (catalog.find(p => p.name === name)) return "smart_home";
        return "other";
      };
      const allItems = [...summary.deviceItems, ...summary.materialItems].map(item => ({
        id: item.id, name: item.name, category: getCategoryForItem(item),
        quantity: item.quantity, unit: item.unit ?? "szt.",
        priceEst: item.priceEst ?? 0, link: "", status: "Oczekuje",
      }));
      let existingId, existingItems = [];
      if (GAS_ON) {
        const existing = await GAS.getZakupy(project.id).catch(() => null);
        if (existing?.items) { existingItems = existing.items; existingId = existing.id; }
      }
      const existingIds = new Set(existingItems.map(i => i.id));
      if (GAS_ON) {
        await GAS.upsertZakupy({
          id: existingId, projectId: project.id,
          items: [...existingItems, ...allItems.filter(i => !existingIds.has(i.id))],
          updatedDate: TODAY,
        });
      }
      setSaveResult("ok");
    } catch { setSaveResult("err"); }
    finally { setSaving(false); }
  };

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ChevronDown className="w-3 h-3 text-slate-300 shrink-0" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-orange-500 shrink-0" />
      : <ChevronDown className="w-3 h-3 text-orange-500 shrink-0" />;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">

      {/* ── Nagłówek ── */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
          <ShoppingCart className="w-4 h-4 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800">Kalkulator instalacji</div>
          <div className="text-xs text-slate-400 mt-0.5">
            Przeglądaj i edytuj punkty instalacyjne, przypisuj elementy sterujące i generuj zestawienie
          </div>
        </div>
        {rows.length > 0 && (
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 shrink-0">
            <button onClick={() => setActiveTab("table")} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === "table" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              Tabela
            </button>
            <button onClick={() => setActiveTab("summary")} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === "summary" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              Zestawienie
            </button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">

        {/* ── Projekt + wczytaj ── */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Projekt</label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-400 bg-white">
              <FolderKanban className="w-4 h-4 text-slate-300 shrink-0" />
              <select
                value={selectedProjectId}
                onChange={e => { setSelectedProjectId(e.target.value); setRows([]); setLoadError(null); setSaveResult(null); }}
                className="flex-1 outline-none text-sm text-slate-800 bg-transparent"
              >
                <option value="">— wybierz projekt —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={handleLoadPoints}
            disabled={!selectedProjectId || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:shadow-md hover:from-orange-700 hover:to-orange-600 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Wczytaj punkty
          </button>
        </div>

        {/* Błąd */}
        {loadError && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />{loadError}
          </div>
        )}

        {/* Baner: znaleziono zapisaną konfigurację */}
        {pendingConfig && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-blue-800">Znaleziono zapisaną konfigurację</span>
              {pendingConfig.cfg.savedAt && (
                <span className="text-xs text-blue-500 ml-2">z {pendingConfig.cfg.savedAt}</span>
              )}
            </div>
            <button
              onClick={() => {
                setRows(applyConfig(pendingConfig.baseRows, pendingConfig.cfg));
                setPendingConfig(null);
              }}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Wczytaj konfigurację
            </button>
            <button
              onClick={() => setPendingConfig(null)}
              className="px-3 py-1.5 border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
            >
              Użyj tylko projektu
            </button>
          </div>
        )}

        {/* ── WIDOK: TABELA ── */}
        {activeTab === "table" && rows.length > 0 && (
          <>
            {/* Pasek filtrów */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Szukaj */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Szukaj…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400"
                />
                {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>}
              </div>

              {/* Filtr: typ */}
              <select value={filterTyp} onChange={e => setFilterTyp(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-1 focus:ring-orange-400 bg-white max-w-[160px]">
                <option value="all">Wszystkie typy</option>
                {uniqueTypy.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              {/* Filtr: kondygnacja */}
              {uniqueFloors.length > 1 && (
                <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-1 focus:ring-orange-400 bg-white max-w-[140px]">
                  <option value="all">Wszystkie piętra</option>
                  {uniqueFloors.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              )}

              {/* Filtr: pomieszczenie */}
              <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-1 focus:ring-orange-400 bg-white max-w-[160px]">
                <option value="all">Wszystkie pomieszczenia</option>
                {uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              {/* Filtr: tylko master */}
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none whitespace-nowrap border border-slate-200 rounded-lg px-2.5 py-2 hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={filterMasterOnly}
                  onChange={e => setFilterMasterOnly(e.target.checked)}
                  className="rounded accent-orange-500"
                />
                Tylko master
              </label>

              {/* Filtr: wymaga uwagi */}
              <label className={`flex items-center gap-1.5 text-xs cursor-pointer select-none whitespace-nowrap border rounded-lg px-2.5 py-2 transition-colors ${filterNeedsAttention ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                <input
                  type="checkbox"
                  checked={filterNeedsAttention}
                  onChange={e => setFilterNeedsAttention(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                Wymaga uwagi
              </label>

              {/* Licznik */}
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {filteredRows.length} / {rows.length} pkt.
              </span>

              {/* Kolumny toggle */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowColPicker(v => !v)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-2 border rounded-lg transition-colors ${showColPicker ? "border-orange-400 text-orange-600 bg-orange-50" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Kolumny
                </button>
                {showColPicker && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-3 min-w-[180px]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Widoczne kolumny</div>
                    {COLS.map(col => (
                      <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer hover:text-slate-800 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={visibleCols.has(col.key)}
                          onChange={e => {
                            const next = new Set(visibleCols);
                            if (e.target.checked) next.add(col.key); else next.delete(col.key);
                            setVisibleCols(next);
                          }}
                          className="rounded accent-orange-500"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Eksport XLSX */}
              <button
                onClick={() => exportXLSX(rows, catalog, summary)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-2 border border-slate-200 rounded-lg text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Eksport XLSX
              </button>
            </div>

            {/* Tabela */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "calc(100vh - 430px)" }}>
              <table className="w-full text-sm" style={{ minWidth: "860px" }}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide border-b border-slate-200">
                    {activeCols.map(col => (
                      <th
                        key={col.key}
                        className={`text-left px-3 py-1.5 ${col.sortable ? "cursor-pointer select-none hover:text-slate-700" : ""} ${col.narrow ? "w-20" : ""}`}
                        onClick={() => col.sortable && handleSort(col.key)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}<SortIcon col={col} />
                        </div>
                      </th>
                    ))}
                    {/* Stałe kolumny kalkulatora */}
                    <th className="text-center px-3 py-1.5 w-16">Uwaga</th>
                    <th className="text-left px-3 py-1.5 w-48">Element sterujący</th>
                    <th className="text-center px-3 py-1.5 w-14">I/O</th>
                    <th className="text-left px-3 py-1.5 w-24">Materiały</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr><td colSpan={totalColSpan} className="text-center py-8 text-slate-300 text-sm">Brak wyników dla aktywnych filtrów</td></tr>
                  ) : filteredRows.map(row => (
                    <React.Fragment key={row._id}>
                      <tr className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${expandedId === row._id ? "bg-orange-50/30" : ""}`}>
                        {/* Edytowalne kolumny z JSON */}
                        {activeCols.map(col => (
                          <td key={col.key} className="px-3 py-0.5">
                            {col.key === "kolor" ? (
                              <div className="flex items-center gap-1.5">
                                {row.kolor && <span className="w-4 h-4 rounded border border-slate-200 shrink-0" style={{ backgroundColor: row.kolor }} />}
                                <EditableCell value={row.kolor} onChange={v => updateRow(row._id, { kolor: v })} placeholder="#ffffff" />
                              </div>
                            ) : col.key === "typ" ? (
                              <EditableCell value={row.typ} onChange={v => updateRow(row._id, { typ: v, rawTyp: v })} />
                            ) : (
                              <EditableCell value={row[col.key]} onChange={v => updateRow(row._id, { [col.key]: v })} />
                            )}
                          </td>
                        ))}

                        {/* Wymaga uwagi */}
                        <td className="px-3 py-0.5 text-center">
                          <input
                            type="checkbox"
                            checked={row.requiresAttention ?? false}
                            onChange={e => updateRow(row._id, { requiresAttention: e.target.checked })}
                            className="rounded accent-amber-500 cursor-pointer w-4 h-4"
                            title="Wymaga uwagi"
                          />
                        </td>

                        {/* Element sterujący */}
                        <td className="px-3 py-0.5 min-w-[200px]">
                          <ControlDevicePicker
                            value={row.controlDevice ?? "uncontrolled"}
                            catalog={catalog}
                            matOptions={matOptions}
                            onChange={v => updateRow(row._id, { controlDevice: v })}
                          />
                        </td>

                        {/* I/O */}
                        <td className="px-3 py-0.5 text-center">
                          {row.controlDevice !== "uncontrolled" ? (
                            <input
                              type="number" min="1" max="32" value={row.ioCount ?? 1}
                              onChange={e => updateRow(row._id, { ioCount: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-12 text-center border border-slate-200 rounded px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-orange-400 tabular-nums"
                            />
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        {/* Materiały */}
                        <td className="px-3 py-0.5">
                          <button
                            onClick={() => setExpandedId(id => id === row._id ? null : row._id)}
                            className={`flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-1 transition-colors ${
                              expandedId === row._id
                                ? "bg-orange-100 text-orange-700"
                                : row.materials.length > 0
                                  ? "bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                                  : "text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                            }`}
                          >
                            {row.materials.length > 0
                              ? <><span className="w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">{row.materials.length}</span> mat.</>
                              : <><Plus className="w-3 h-3" /> dodaj</>
                            }
                          </button>
                        </td>
                      </tr>

                      {/* Panel materiałów */}
                      {expandedId === row._id && (
                        <MaterialsPanel
                          row={row}
                          onRowChange={updated => updateRow(row._id, () => updated)}
                          matOptions={matOptions}
                          colSpan={totalColSpan}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Akcje pod tabelą */}
            <div className="flex items-center justify-between pt-1 gap-3">
              <div className="text-xs text-slate-400">
                {rows.filter(r => r.controlDevice !== "uncontrolled").length} punktów ze sterowaniem ·{" "}
                {rows.filter(r => r.materials.length > 0).length} z materiałami
                {rows.filter(r => r.requiresAttention).length > 0 && (
                  <span className="text-amber-500 ml-1">· {rows.filter(r => r.requiresAttention).length} wymaga uwagi</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {configSaveResult === "ok" && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Konfiguracja zapisana
                    </motion.span>
                  )}
                  {configSaveResult === "err" && (
                    <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3.5 h-3.5" /> Błąd zapisu</span>
                  )}
                </AnimatePresence>
                <button
                  onClick={handleSaveConfig}
                  disabled={configSaving || !project}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40 transition-colors"
                >
                  {configSaving
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Zapisuję…</>
                    : <><Save className="w-3.5 h-3.5" /> Zapisz konfigurację</>}
                </button>
                <button
                  onClick={() => setActiveTab("summary")}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Oblicz zestawienie
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── WIDOK: ZESTAWIENIE ── */}
        {activeTab === "summary" && rows.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Zestawienie materiałów</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">z {rows.length} pkt.</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => exportXLSX(rows, catalog, summary)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> XLSX
                </button>
                <AnimatePresence>
                  {saveResult === "ok" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Zapisano
                    </motion.div>
                  )}
                  {saveResult === "err" && (
                    <div className="flex items-center gap-1.5 text-red-500 text-sm"><AlertCircle className="w-4 h-4" /> Błąd</div>
                  )}
                </AnimatePresence>
                <button
                  onClick={handleSave}
                  disabled={saving || !project}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-bold hover:from-slate-900 hover:to-slate-800 disabled:opacity-40 transition-all shadow-sm"
                >
                  {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Zapisuję…</> : <><ShoppingCart className="w-4 h-4" /> Zapisz do zakupów</>}
                </button>
              </div>
            </div>
            <SummaryPanel deviceItems={summary.deviceItems} materialItems={summary.materialItems} />
          </div>
        )}

        {/* Empty state */}
        {rows.length === 0 && !loadError && (
          <div className="text-center py-10 text-slate-300 text-sm">
            {selectedProjectId ? "Kliknij \u201eWczytaj punkty\u201c aby za\u0142adowa\u0107 dane" : "Wybierz projekt aby rozpocz\u0105\u0107"}
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function Kalkulator({ projects = [], kalkulatorSettings = EMPTY_KALKULATOR_SETTINGS }) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kalkulator</h2>
          <p className="text-xs text-slate-400">Edytuj punkty instalacyjne, przypisuj urządzenia i generuj zestawienie</p>
        </div>
      </div>
      <PointCalculator projects={projects} kalkulatorSettings={kalkulatorSettings} />
    </div>
  );
}
