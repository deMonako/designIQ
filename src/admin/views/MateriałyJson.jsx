import React, { useState, useEffect } from "react";
import { Package, RefreshCw, Save, Plus, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { gasGet, gasPost } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

function emptyItem() {
  return { _id: `m-${Date.now()}`, name: "", price_pln: 0, link: "" };
}

function normalize(item) {
  return {
    _id: `m-${Math.random().toString(36).slice(2)}`,
    name:      item.name      ?? "",
    price_pln: item.price_pln ?? 0,
    link:      item.link ?? item.sku ?? "",
  };
}

export default function MateriałyJson() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const data = await gasGet("getMaterialyJson");
      setItems(Array.isArray(data) ? data.map(normalize) : []);
    } catch (e) {
      toast.error("Błąd wczytywania: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (GAS_ON) handleLoad(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (id, field, value) =>
    setItems(prev => prev.map(it => it._id === id ? { ...it, [field]: value } : it));

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const remove  = (id) => setItems(prev => prev.filter(it => it._id !== id));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = items.map(({ name, price_pln, link }) => ({
        name,
        price_pln: Number(price_pln),
        link,
      }));
      await gasPost("saveMaterialyJson", { items: payload });
      toast.success("Materiały zapisane");
    } catch (e) {
      toast.error("Błąd zapisu: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Nagłówek */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Materiały</h2>
            <p className="text-xs text-slate-400">Edytor pliku materialy.json z folderu Materiały na Drive</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoad}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Odśwież
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Zapisz zmiany
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide border-b border-slate-200">
                <th className="text-left px-4 py-3">Nazwa</th>
                <th className="text-right px-4 py-3 w-36">Cena (zł)</th>
                <th className="text-left px-4 py-3">Link</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-300 text-sm">
                    Brak elementów — kliknij „Dodaj materiał"
                  </td>
                </tr>
              )}
              {items.map(item => (
                <tr key={item._id} className="hover:bg-slate-50/60 group">
                  <td className="px-4 py-2">
                    <input
                      value={item.name}
                      onChange={e => update(item._id, "name", e.target.value)}
                      className="w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400/50 rounded px-1 py-0.5 text-slate-800 text-sm"
                      placeholder="Nazwa materiału"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number" min="0" step="0.01"
                      value={item.price_pln}
                      onChange={e => update(item._id, "price_pln", e.target.value)}
                      className="w-full text-right bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400/50 rounded px-1 py-0.5 text-slate-800 text-sm tabular-nums"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <input
                        value={item.link}
                        onChange={e => update(item._id, "link", e.target.value)}
                        className="flex-1 bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400/50 rounded px-1 py-0.5 text-slate-500 text-sm"
                        placeholder="https://..."
                      />
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1 text-blue-400 hover:text-blue-600 transition-colors"
                          title="Otwórz link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => remove(item._id)}
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
                <td colSpan={4} className="px-4 py-2.5">
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Dodaj materiał
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
