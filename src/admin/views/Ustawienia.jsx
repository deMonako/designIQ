import React, { useState, useEffect, useMemo } from "react";
import {
  Settings, Calculator, Plus, Trash2, Save, RefreshCw,
  ChevronDown, Info, RotateCcw,
} from "lucide-react";
import { gasGet } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";
import {
  DEFAULT_TYP_MAPPINGS, DEFAULT_SKU_SPECS, EMPTY_KALKULATOR_SETTINGS,
} from "../../lib/shoppingList/kalkulatorDefaults";
import { RESOURCE, RESOURCE_LABEL } from "../../lib/shoppingList/resourceTypes";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

// Wszystkie dostępne typy zasobów
const RESOURCE_OPTIONS = Object.entries(RESOURCE).map(([, v]) => ({
  value: v,
  label: RESOURCE_LABEL[v] ?? v,
}));

// Etykieta dla device ID
function deviceLabel(id) {
  if (!id || id === "uncontrolled") return "— niesterowane —";
  return id;
}

// ── Mały komponent: select stylowany ─────────────────────────────────────────

function Select({ value, onChange, options, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 pr-7"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ── Zakładka: Mapowania kategorii ─────────────────────────────────────────────

function KategorieMappings({ settings, onSave, deviceOptions }) {
  // Scalamy domyślne z nadpisaniami użytkownika
  const merged = useMemo(() => {
    const result = {};
    for (const [typ, def] of Object.entries(DEFAULT_TYP_MAPPINGS)) {
      result[typ] = { ...def, ...(settings.typMappings?.[typ] ?? {}) };
    }
    for (const [typ, override] of Object.entries(settings.typMappings ?? {})) {
      if (!result[typ]) {
        result[typ] = {
          resourceType: RESOURCE.RELAY, defaultDevice: "uncontrolled",
          ioCount: 1, uncontrolled: false, slaveGetsDevice: false, ...override,
        };
      }
    }
    return result;
  }, [settings]);

  const [rows, setRows]       = useState(() => Object.entries(merged).map(([typ, cfg]) => ({ typ, ...cfg })));
  const [newTyp, setNewTyp]   = useState("");
  const [dirty, setDirty]     = useState(false);

  // Sync gdy settings zmienią się z zewnątrz (reset)
  useEffect(() => {
    setRows(Object.entries(merged).map(([typ, cfg]) => ({ typ, ...cfg })));
    setDirty(false);
  }, [settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    setDirty(true);
  };

  const addRow = () => {
    const t = newTyp.trim();
    if (!t || rows.some(r => r.typ === t)) return;
    setRows(prev => [...prev, { typ: t, resourceType: RESOURCE.RELAY, defaultDevice: "uncontrolled", ioCount: 1, uncontrolled: false, slaveGetsDevice: false }]);
    setNewTyp("");
    setDirty(true);
  };

  const removeRow = (idx) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const handleSave = () => {
    const typMappings = {};
    for (const { typ, ...cfg } of rows) {
      typMappings[typ] = { ...cfg, ioCount: Number(cfg.ioCount) || 1 };
    }
    onSave({ typMappings });
    setDirty(false);
  };

  const handleReset = () => {
    setRows(Object.entries(DEFAULT_TYP_MAPPINGS).map(([typ, cfg]) => ({ typ, ...cfg })));
    setDirty(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Mapowania kategorii</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dla każdego typu punktu instalacyjnego ustaw domyślne urządzenie sterujące, typ zasobu i liczbę kanałów.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Przywróć domyślne
          </button>
          <button onClick={handleSave} disabled={!dirty}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <Save className="w-3.5 h-3.5" /> Zapisz
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Typ</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Typ zasobu</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Urządzenie domyślne</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Kanałów/pkt</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Niesterowane</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Slave→urządz.</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => (
                <tr key={row.typ} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2 font-medium text-slate-800 text-sm whitespace-nowrap">{row.typ}</td>
                  <td className="px-3 py-2 min-w-[160px]">
                    <Select
                      value={row.resourceType}
                      onChange={v => update(idx, "resourceType", v)}
                      options={RESOURCE_OPTIONS}
                    />
                  </td>
                  <td className="px-3 py-2 min-w-[200px]">
                    <Select
                      value={row.defaultDevice}
                      onChange={v => update(idx, "defaultDevice", v)}
                      options={[
                        { value: "uncontrolled", label: "— niesterowane —" },
                        ...deviceOptions.map(d => ({ value: d.id, label: d.label })),
                      ]}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number" min="1" max="99"
                      value={row.ioCount}
                      onChange={e => update(idx, "ioCount", e.target.value)}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!row.uncontrolled}
                      onChange={e => update(idx, "uncontrolled", e.target.checked)}
                      className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!row.slaveGetsDevice}
                      onChange={e => update(idx, "slaveGetsDevice", e.target.checked)}
                      className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {!DEFAULT_TYP_MAPPINGS[row.typ] && (
                      <button onClick={() => removeRow(idx)} className="p-1 text-slate-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dodaj nowy typ */}
      <div className="flex items-center gap-2">
        <input
          value={newTyp}
          onChange={e => setNewTyp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addRow()}
          placeholder="Nowy typ (np. Klimatyzacja)"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 max-w-xs"
        />
        <button onClick={addRow} disabled={!newTyp.trim()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Dodaj typ
        </button>
      </div>
    </div>
  );
}

// ── Zakładka: Materiały Loxone (SKU specs) ────────────────────────────────────

function MaterialyLoxone({ settings, onSave }) {
  const [cennik, setCennik]   = useState([]);
  const [loading, setLoading] = useState(GAS_ON);

  useEffect(() => {
    if (!GAS_ON) { setLoading(false); return; }
    setLoading(true);
    gasGet("getCennik")
      .then(data => setCennik(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Buduj tabelę: każdy wpis z DEFAULT_SKU_SPECS + cennik nieznane SKU
  const baseSpecs = useMemo(() => {
    const result = { ...DEFAULT_SKU_SPECS };
    // Dołącz nadpisania z ustawień
    for (const [sku, override] of Object.entries(settings.skuSpecs ?? {})) {
      if (result[sku]) {
        result[sku] = { ...result[sku], ...override };
      } else {
        result[sku] = override;
      }
    }
    return result;
  }, [settings]);

  // Cennik items z zaznaczeniem czy są już w specs
  const cennikRows = useMemo(() => {
    const rows = [];
    // Najpierw już zdefiniowane SKU
    for (const [sku, spec] of Object.entries(baseSpecs)) {
      const cennikItem = cennik.find(c => String(c.sku) === sku);
      rows.push({ sku, name: cennikItem?.name ?? spec.id, ...spec, fromCennik: !!cennikItem });
    }
    // Potem pozostałe z cennika
    for (const c of cennik) {
      const sku = String(c.sku ?? "");
      if (!sku || baseSpecs[sku]) continue;
      rows.push({ sku, name: c.name, id: "", resourceType: RESOURCE.RELAY, outputsPerUnit: 1, notes: "", fromCennik: true, isNew: true });
    }
    return rows;
  }, [cennik, baseSpecs]);

  const [rows, setRows]   = useState(cennikRows);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setRows(cennikRows);
    setDirty(false);
  }, [cennikRows]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    setDirty(true);
  };

  const handleSave = () => {
    const skuSpecs = {};
    for (const { sku, id, resourceType, outputsPerUnit, notes, isNew } of rows) {
      if (!sku) continue;
      // Zapisz tylko te które zostały zmodyfikowane lub dodane (isNew i mają id)
      const defSpec = DEFAULT_SKU_SPECS[sku];
      if (!defSpec || defSpec.outputsPerUnit !== Number(outputsPerUnit) || defSpec.resourceType !== resourceType || (id && id !== defSpec.id) || isNew) {
        skuSpecs[sku] = { id: id || `custom-${sku}`, resourceType, outputsPerUnit: Number(outputsPerUnit) || 1, notes: notes ?? "" };
      }
    }
    onSave({ skuSpecs });
    setDirty(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Materiały Loxone – specyfikacja I/O</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dla każdego elementu z cennika zadeklaruj ile kanałów I/O ma dane urządzenie (outputsPerUnit).
            {!GAS_ON && <span className="ml-1 text-amber-600">Wymagane połączenie z GAS – pełna lista z cennika.</span>}
          </p>
        </div>
        <button onClick={handleSave} disabled={!dirty}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <Save className="w-3.5 h-3.5" /> Zapisz
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 p-6 text-slate-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Ładowanie cennika…
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">SKU</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nazwa</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID urządzenia</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Typ zasobu</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Kanały/szt.</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Uwagi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => (
                  <tr key={row.sku} className={`hover:bg-slate-50/50 transition-colors ${row.isNew ? "bg-blue-50/30" : ""}`}>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {row.sku}
                      {row.isNew && <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1 rounded">nowe</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-800 text-sm max-w-[200px] truncate" title={row.name}>{row.name}</td>
                    <td className="px-3 py-2 min-w-[160px]">
                      <input
                        value={row.id ?? ""}
                        onChange={e => update(idx, "id", e.target.value)}
                        placeholder="np. lox-relay-14"
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                      />
                    </td>
                    <td className="px-3 py-2 min-w-[160px]">
                      <Select
                        value={row.resourceType}
                        onChange={v => update(idx, "resourceType", v)}
                        options={RESOURCE_OPTIONS}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number" min="1" max="999"
                        value={row.outputsPerUnit}
                        onChange={e => update(idx, "outputsPerUnit", e.target.value)}
                        className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                      />
                    </td>
                    <td className="px-3 py-2 min-w-[160px]">
                      <input
                        value={row.notes ?? ""}
                        onChange={e => update(idx, "notes", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                      />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                      {GAS_ON ? "Brak danych z cennika." : "Tryb offline – brak cennika. Poniżej domyślne specyfikacje z kodu."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Kanały/szt.</strong> – ile wyjść/wejść obsługuje 1 sztuka urządzenia (np. relay 14-kanałowy = 14).
          Kalkulator użyje: <em>ilość = ceil(suma punktów / kanały na urządzenie)</em>.
        </span>
      </div>
    </div>
  );
}

// ── Główny eksport ────────────────────────────────────────────────────────────

export default function Ustawienia({ kalkulatorSettings = EMPTY_KALKULATOR_SETTINGS, onUpdateKalkulatorSettings }) {
  const [activeTab, setActiveTab] = useState("kalkulator");
  const [kalkulatorSubTab, setKalkulatorSubTab] = useState("kategorie");

  // Opcje urządzeń dla dropdownu (z DEFAULT_SKU_SPECS + nadpisania)
  const deviceOptions = useMemo(() => {
    const specs = { ...DEFAULT_SKU_SPECS };
    for (const [sku, override] of Object.entries(kalkulatorSettings.skuSpecs ?? {})) {
      if (specs[sku]) specs[sku] = { ...specs[sku], ...override };
      else specs[sku] = override;
    }
    const seen = new Set();
    return Object.values(specs)
      .filter(s => s.id && !seen.has(s.id) && seen.add(s.id))
      .map(s => ({ id: s.id, label: s.id }));
  }, [kalkulatorSettings]);

  const handleSavePart = (part) => {
    onUpdateKalkulatorSettings?.(prev => ({ ...prev, ...part }));
  };

  const TABS = [
    { id: "kalkulator", label: "Kalkulator", icon: Calculator },
  ];

  const KALKULATOR_SUB_TABS = [
    { id: "kategorie",  label: "Mapowania kategorii" },
    { id: "materialy",  label: "Materiały Loxone" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Nagłówek */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          <Settings className="w-4 h-4 text-slate-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ustawienia</h2>
          <p className="text-xs text-slate-400">Konfiguracja systemu i kalkulatora</p>
        </div>
      </div>

      {/* Zakładki główne */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Kalkulator ── */}
      {activeTab === "kalkulator" && (
        <div className="space-y-5">
          {/* Pod-zakładki */}
          <div className="flex gap-1 border-b border-slate-200">
            {KALKULATOR_SUB_TABS.map(sub => (
              <button key={sub.id} onClick={() => setKalkulatorSubTab(sub.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  kalkulatorSubTab === sub.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}>
                {sub.label}
              </button>
            ))}
          </div>

          {kalkulatorSubTab === "kategorie" && (
            <KategorieMappings
              settings={kalkulatorSettings}
              onSave={handleSavePart}
              deviceOptions={deviceOptions}
            />
          )}

          {kalkulatorSubTab === "materialy" && (
            <MaterialyLoxone
              settings={kalkulatorSettings}
              onSave={handleSavePart}
            />
          )}
        </div>
      )}
    </div>
  );
}
