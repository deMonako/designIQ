import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  ArrowLeft, ShoppingCart, Package, ExternalLink, CheckCircle2,
  Clock, Truck, ChevronDown, ChevronUp, Search,
} from "lucide-react";

const CATEGORY_LABELS = {
  smart_home: "Sprzęt Smart Home",
  cables:     "Kable i osprzęt",
  cabinet:    "Szafa sterownicza",
  audio:      "Audio / Video",
  security:   "Monitoring i bezpieczeństwo",
  other:      "Inne",
};

const CATEGORY_ORDER = ["smart_home", "cables", "cabinet", "audio", "security", "other"];

const CATEGORY_DOT = {
  smart_home: "bg-orange-400",
  cables:     "bg-yellow-400",
  cabinet:    "bg-blue-400",
  audio:      "bg-purple-400",
  security:   "bg-red-400",
  other:      "bg-slate-400",
};

const STATUS_CONFIG = {
  "Oczekuje":    { icon: Clock,        color: "text-slate-500",  bg: "bg-slate-100",  label: "Oczekuje" },
  "Zamówione":   { icon: Truck,        color: "text-blue-600",   bg: "bg-blue-50",    label: "Zamówione" },
  "Dostarczone": { icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50",   label: "Dostarczone" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Oczekuje"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function fmt(value) {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function ClientZakupyView({ investment, zakupy, onBack }) {
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch]       = useState("");

  const items = zakupy?.items || [];

  const filtered = search.trim()
    ? items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()))
    : items;

  const groups = CATEGORY_ORDER
    .map(key => ({
      key,
      label: CATEGORY_LABELS[key] || key,
      dot:   CATEGORY_DOT[key] || "bg-slate-400",
      items: filtered.filter(i => i.category === key),
    }))
    .filter(g => g.items.length > 0);

  const knownKeys = new Set(CATEGORY_ORDER);
  const uncategorized = filtered.filter(i => !knownKeys.has(i.category));
  if (uncategorized.length > 0) {
    groups.push({ key: "__other__", label: "Pozostałe", dot: "bg-slate-400", items: uncategorized });
  }

  const totalItems   = items.length;
  const doneItems    = items.filter(i => i.status === "Dostarczone").length;
  const orderedItems = items.filter(i => i.status === "Zamówione").length;
  const progressPct  = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const totalValue   = items.reduce((s, i) => s + (i.quantity || 0) * (i.priceEst || 0), 0);
  const hasPrices    = items.some(i => (i.priceEst || 0) > 0);

  const toggleGroup = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  if (!zakupy || items.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-slate-200 rounded-xl my-6">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do statusu
        </Button>
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Package className="w-12 h-12 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700">Brak listy zakupów</h2>
          <p className="text-sm max-w-sm">
            Lista materiałów do zamówienia nie została jeszcze przygotowana dla tego projektu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-6">
      {/* Nagłówek */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-xl">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={onBack} variant="ghost" size="sm" className="shrink-0">
              <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md shadow-green-200">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Lista zakupów</div>
                <div className="text-lg font-bold text-slate-900">{investment.project_name}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={`grid gap-4 mb-5 ${hasPrices ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{totalItems}</div>
              <div className="text-xs text-slate-500">Wszystkich pozycji</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{orderedItems}</div>
              <div className="text-xs text-slate-500">Zamówionych</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{doneItems}</div>
              <div className="text-xs text-slate-500">Dostarczonych</div>
            </div>
            {hasPrices && (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">~{fmt(totalValue)} zł</div>
                <div className="text-xs text-slate-500">Szacowana wartość</div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Postęp dostaw</span>
              <span className="font-semibold text-green-600">{progressPct}%</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wyszukiwarka */}
      {totalItems > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj pozycji..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 bg-white"
          />
        </div>
      )}

      {/* Grupy kategorii */}
      {groups.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          Brak wyników dla „{search}"
        </div>
      ) : (
        groups.map(group => {
          const catValue = group.items.reduce((s, i) => s + (i.quantity || 0) * (i.priceEst || 0), 0);
          const catHasPrices = group.items.some(i => (i.priceEst || 0) > 0);

          return (
            <Card key={group.key} className="border border-slate-200 shadow-sm overflow-hidden">
              {/* Nagłówek kategorii */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                onClick={() => toggleGroup(group.key)}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${group.dot}`} />
                  <span className="font-semibold text-slate-800">{group.label}</span>
                  <span className="text-xs text-slate-400 font-normal">({group.items.length})</span>
                </div>
                <div className="flex items-center gap-3">
                  {catHasPrices && !collapsed[group.key] && (
                    <span className="text-sm font-bold text-slate-600 tabular-nums">
                      ~{fmt(catValue)} zł
                    </span>
                  )}
                  <div className="flex gap-1.5">
                    {group.items.some(i => i.status === "Dostarczone") && (
                      <span className="w-2 h-2 rounded-full bg-green-500" title="Dostarczone" />
                    )}
                    {group.items.some(i => i.status === "Zamówione") && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" title="Zamówione" />
                    )}
                    {group.items.some(i => i.status === "Oczekuje") && (
                      <span className="w-2 h-2 rounded-full bg-slate-300" title="Oczekuje" />
                    )}
                  </div>
                  {collapsed[group.key]
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronUp   className="w-4 h-4 text-slate-400" />
                  }
                </div>
              </button>

              {!collapsed[group.key] && (
                <CardContent className="p-0">
                  {/* Tabela pozycji */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/60 border-b border-slate-100">
                          <th className="text-left px-5 py-2 font-medium">Nazwa</th>
                          <th className="text-center px-3 py-2 w-20 font-medium">Ilość</th>
                          {catHasPrices && (
                            <>
                              <th className="text-right px-3 py-2 w-24 font-medium">Cena / szt.</th>
                              <th className="text-right px-3 py-2 w-24 font-medium">Wartość</th>
                            </>
                          )}
                          <th className="text-right px-3 py-2 w-8 font-medium" />
                          <th className="text-right px-5 py-2 w-28 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.items.map(item => {
                          const lineTotal = (item.quantity || 0) * (item.priceEst || 0);
                          return (
                            <tr
                              key={item.id}
                              className={`transition-colors ${item.status === "Dostarczone" ? "bg-green-50/40" : "hover:bg-slate-50/60"}`}
                            >
                              {/* Nazwa */}
                              <td className="px-5 py-3">
                                <div className={`font-medium truncate max-w-xs ${item.status === "Dostarczone" ? "line-through text-slate-400" : "text-slate-900"}`}>
                                  {item.name || <em className="text-slate-400 not-italic">Bez nazwy</em>}
                                </div>
                              </td>

                              {/* Ilość */}
                              <td className="px-3 py-3 text-center text-slate-600 tabular-nums text-xs">
                                {item.quantity} {item.unit}
                              </td>

                              {/* Ceny */}
                              {catHasPrices && (
                                <>
                                  <td className="px-3 py-3 text-right tabular-nums text-xs text-slate-500">
                                    {(item.priceEst || 0) > 0 ? `~${fmt(item.priceEst)} zł` : "—"}
                                  </td>
                                  <td className="px-3 py-3 text-right tabular-nums text-sm font-semibold text-slate-700">
                                    {lineTotal > 0 ? `~${fmt(lineTotal)} zł` : "—"}
                                  </td>
                                </>
                              )}

                              {/* Link */}
                              <td className="px-3 py-3 text-center">
                                {item.link ? (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Otwórz link produktu"
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span className="inline-block w-7" />
                                )}
                              </td>

                              {/* Status */}
                              <td className="px-5 py-3 text-right">
                                <StatusBadge status={item.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* Suma kategorii */}
                      {catHasPrices && catValue > 0 && (
                        <tfoot className="border-t border-slate-200 bg-slate-50/60">
                          <tr>
                            <td colSpan={catHasPrices ? 4 : 2} className="px-5 py-2 text-xs text-slate-400 text-right font-medium">
                              Suma kategorii
                            </td>
                            <td /> {/* link column */}
                            <td className="px-5 py-2 text-right font-bold text-slate-700 tabular-nums">
                              ~{fmt(catValue)} zł
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      {/* Łączna wartość */}
      {hasPrices && totalValue > 0 && !search && (
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white rounded-xl">
          <div className="text-sm text-slate-300">Szacowana łączna wartość zamówienia</div>
          <div className="text-xl font-bold text-orange-400 tabular-nums">~{fmt(totalValue)} zł</div>
        </div>
      )}
    </div>
  );
}
