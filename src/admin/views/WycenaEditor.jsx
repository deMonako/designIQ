import React, { useState, useEffect } from "react";
import {
  X, Plus, Trash2, Save, Loader2, DollarSign, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { getWycena, upsertWycena } from "../api/gasApi";
import { GAS_CONFIG } from "../api/gasConfig";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

const CATEGORIES = [
  { key: "materials",       label: "Sprzęt i komponenty Smart Home" },
  { key: "cabling",         label: "Instalacja elektryczna i okablowanie" },
  { key: "control_cabinet", label: "Szafa sterownicza i infrastruktura" },
  { key: "audio",           label: "Systemy Multiroom Audio" },
  { key: "security",        label: "Monitoring i bezpieczeństwo" },
  { key: "programming",     label: "Programowanie i logika systemu" },
  { key: "commissioning",   label: "Uruchomienie i szkolenie" },
  { key: "project",         label: "Projekt i dokumentacja" },
  { key: "service",         label: "Serwis, wsparcie i gwarancja" },
];

function emptyItem() {
  return {
    id:         `wi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name:       "",
    category:   "materials",
    quantity:   1,
    unit_price: 0,
    vat_rate:   23,
  };
}

function calcGross(item) {
  return (item.quantity || 0) * (item.unit_price || 0) * (1 + (item.vat_rate ?? 23) / 100);
}

export default function WycenaEditor({ project, onClose }) {
  const [items, setItems]     = useState([]);
  const [status, setStatus]   = useState("Czeka na akceptację");
  const [wycenaId, setId]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [collapsed, setCollapsed] = useState({});

  // Załaduj istniejącą wycenę
  useEffect(() => {
    if (!GAS_ON) { setLoading(false); return; }
    getWycena(project.id)
      .then(w => {
        if (w && w.id) {
          setId(w.id);
          setItems(Array.isArray(w.items) ? w.items : []);
          setStatus(w.status || "Czeka na akceptację");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [project.id]);

  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(it =>
      it.id === id ? { ...it, [field]: field === "quantity" || field === "unit_price" || field === "vat_rate" ? Number(value) : value } : it
    ));
  };

  const removeItem = (id) => setItems(prev => prev.filter(it => it.id !== id));

  const handleSave = async () => {
    setSaving(true);
    try {
      const wycena = {
        id:        wycenaId || undefined,
        projectId: project.id,
        items,
        status,
      };
      const saved = await upsertWycena(wycena);
      if (saved && saved.id) setId(saved.id);
      toast.success("Wycena zapisana");
    } catch (e) {
      toast.error("Błąd zapisu: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Sumy
  const totalNet   = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);
  const totalGross = items.reduce((s, i) => s + calcGross(i), 0);

  // Pogrupuj pozycje wg kategorii
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    items: items.filter(i => i.category === cat.key),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-stretch justify-end">
      <div className="w-full max-w-4xl bg-white h-full flex flex-col shadow-2xl">

        {/* Nagłówek */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">Edytor wyceny</div>
            <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Tabela pozycji */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-semibold">Pozycja</th>
                      <th className="text-left p-3 font-semibold w-44">Kategoria</th>
                      <th className="text-right p-3 font-semibold w-20">Ilość</th>
                      <th className="text-right p-3 font-semibold w-28">Cena netto</th>
                      <th className="text-right p-3 font-semibold w-20">VAT %</th>
                      <th className="text-right p-3 font-semibold w-28">Suma brutto</th>
                      <th className="p-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                          Brak pozycji — kliknij „Dodaj pozycję"
                        </td>
                      </tr>
                    )}
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <input
                            value={item.name}
                            onChange={e => updateItem(item.id, "name", e.target.value)}
                            placeholder="Nazwa pozycji"
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.category}
                            onChange={e => updateItem(item.id, "category", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
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
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number" min="0" step="0.01"
                            value={item.unit_price}
                            onChange={e => updateItem(item.id, "unit_price", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                          />
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
                          {calcGross(item).toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
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
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-orange-400 hover:text-orange-600 text-sm font-medium w-full justify-center transition-colors"
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
                    const catGross = cat.items.reduce((s, i) => s + calcGross(i), 0);
                    const isOpen   = !collapsed[cat.key];
                    return (
                      <div key={cat.key} className="border-b border-slate-100 last:border-0">
                        <button
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-left"
                          onClick={() => setCollapsed(p => ({ ...p, [cat.key]: !p[cat.key] }))}
                        >
                          <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-orange-600">
                              {catGross.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
                            </span>
                            {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-2 space-y-1">
                            {cat.items.map(i => (
                              <div key={i.id} className="flex justify-between text-xs text-slate-600 py-0.5">
                                <span>{i.name || <em className="text-slate-400">bez nazwy</em>} × {i.quantity}</span>
                                <span>{calcGross(i).toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł</span>
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

        {/* Stopka z sumami */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex gap-8 text-sm">
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wider">Suma netto</div>
              <div className="font-bold">{totalNet.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wider">Suma brutto</div>
              <div className="font-bold text-orange-400 text-lg">{totalGross.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">{items.length} pozycji</div>
        </div>
      </div>
    </div>
  );
}
