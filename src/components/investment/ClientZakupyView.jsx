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

function fmtPL(value, digits = 2) {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function calcItem(item) {
  const net   = (item.quantity || 0) * (item.priceEst || 0);
  const vat   = net * ((item.vat ?? 8) / 100);
  const gross = net + vat;
  return { net, vat, gross, vatRate: item.vat ?? 8 };
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

  const totals = items.reduce((acc, i) => {
    const c = calcItem(i);
    return { net: acc.net + c.net, vat: acc.vat + c.vat, gross: acc.gross + c.gross };
  }, { net: 0, vat: 0, gross: 0 });

  const hasPrices = items.some(i => (i.priceEst || 0) > 0);

  const toggleGroup = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  if (!zakupy || items.length === 0) {
    return (
      <div className="space-y-4 pb-12">
        <Button onClick={onBack} variant="outline" className="mb-4 hover:bg-slate-100 border-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2" /> Powrót do statusu
        </Button>
        <Card className="border-2 border-slate-200 bg-white shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Brak listy zakupów</h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
              Lista materiałów do zamówienia nie została jeszcze przygotowana dla tego projektu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Button onClick={onBack} variant="outline" className="hover:bg-slate-100 border-slate-200">
        <ArrowLeft className="w-4 h-4 mr-2" /> Powrót do statusu
      </Button>

      {/* Nagłówek */}
      <Card className="border-2 border-orange-100 bg-[#FFF9F2] shadow-sm overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lista zakupów</h1>
              </div>
              <div className="flex flex-col space-y-2 text-sm mb-5">
                <div className="flex gap-2">
                  <span className="text-slate-500">Projekt:</span>
                  <span className="font-semibold text-slate-800">{investment.project_name}</span>
                </div>
              </div>
              {/* Statystyki */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-2xl font-bold text-slate-900">{totalItems}</span>
                  <div className="text-xs text-slate-500">Pozycji</div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-blue-600">{orderedItems}</span>
                  <div className="text-xs text-slate-500">Zamówionych</div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-green-600">{doneItems}</span>
                  <div className="text-xs text-slate-500">Dostarczonych</div>
                </div>
              </div>
            </div>

            {hasPrices && (
              <div className="text-center lg:text-right bg-[#1A202C] text-white rounded-2xl p-8 lg:min-w-[280px] shadow-xl border border-slate-800">
                <div className="text-[13px] font-bold text-orange-400 tracking-[0.1em] mb-3">
                  Szacowana wartość zamówienia
                </div>
                <div className="text-3xl font-bold mb-1 tracking-tight">
                  {fmtPL(totals.gross)} zł
                </div>
                <div className="text-xs text-slate-400 mb-3">brutto</div>
                <div className="border-t border-slate-700 pt-3 space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between gap-4">
                    <span>Netto:</span>
                    <span className="font-semibold text-slate-300">{fmtPL(totals.net)} zł</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>VAT:</span>
                    <span className="font-semibold text-slate-300">{fmtPL(totals.vat)} zł</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pasek postępu */}
          <div className="mt-6 pt-6 border-t border-orange-100">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-medium">Postęp dostaw</span>
              <span className="font-bold text-orange-600">{progressPct}%</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-500"
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
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
          />
        </div>
      )}

      {/* Grupy kategorii */}
      {groups.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          Brak wyników dla „{search}"
        </div>
      ) : (
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {groups.map(group => {
                const catTotals = group.items.reduce((acc, i) => {
                  const c = calcItem(i);
                  return { net: acc.net + c.net, vat: acc.vat + c.vat, gross: acc.gross + c.gross };
                }, { net: 0, vat: 0, gross: 0 });
                const catHasPrices = group.items.some(i => (i.priceEst || 0) > 0);
                const isCollapsed  = collapsed[group.key];

                return (
                  <div key={group.key} className="bg-white">
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-orange-50/30 transition-colors text-left"
                      onClick={() => toggleGroup(group.key)}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${group.dot}`} />
                        <span className="font-semibold text-slate-800">{group.label}</span>
                        <span className="text-xs text-slate-400 font-normal">({group.items.length})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {catHasPrices && (
                          <>
                            <span className="text-xs text-slate-400 hidden sm:inline">
                              {fmtPL(catTotals.net)} zł netto /
                            </span>
                            <span className="text-sm font-bold text-orange-600 tabular-nums">
                              {fmtPL(catTotals.gross)} zł brutto
                            </span>
                          </>
                        )}
                        <div className="flex gap-1.5">
                          {group.items.some(i => i.status === "Dostarczone") && (
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                          {group.items.some(i => i.status === "Zamówione") && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                          {group.items.some(i => i.status === "Oczekuje") && (
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                          )}
                        </div>
                        {isCollapsed
                          ? <ChevronDown className="w-4 h-4 text-slate-400" />
                          : <ChevronUp   className="w-4 h-4 text-slate-400" />
                        }
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="border-t border-slate-100 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/60 border-b border-slate-100">
                              <th className="text-left px-5 py-2 font-medium">Nazwa</th>
                              <th className="text-center px-3 py-2 w-16 font-medium">Ilość</th>
                              {catHasPrices && (
                                <>
                                  <th className="text-right px-3 py-2 w-24 font-medium hidden sm:table-cell">Cena netto</th>
                                  <th className="text-center px-3 py-2 w-12 font-medium hidden sm:table-cell">VAT</th>
                                  <th className="text-right px-3 py-2 w-24 font-medium hidden sm:table-cell">Netto</th>
                                  <th className="text-right px-3 py-2 w-24 font-medium hidden sm:table-cell">VAT zł</th>
                                  <th className="text-right px-3 py-2 w-24 font-medium">Brutto</th>
                                </>
                              )}
                              <th className="w-8 px-3 py-2" />
                              <th className="text-right px-5 py-2 w-28 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.items.map(item => {
                              const c = calcItem(item);
                              return (
                                <tr
                                  key={item.id}
                                  className={`transition-colors ${item.status === "Dostarczone" ? "bg-green-50/40" : "hover:bg-slate-50/60"}`}
                                >
                                  <td className="px-5 py-3">
                                    <div className={`font-medium truncate max-w-xs ${item.status === "Dostarczone" ? "line-through text-slate-400" : "text-slate-900"}`}>
                                      {item.name || <em className="text-slate-400 not-italic">Bez nazwy</em>}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-center text-slate-600 tabular-nums text-xs">
                                    {item.quantity} {item.unit}
                                  </td>
                                  {catHasPrices && (
                                    <>
                                      <td className="px-3 py-3 text-right tabular-nums text-xs text-slate-500 hidden sm:table-cell">
                                        {(item.priceEst || 0) > 0 ? `${fmtPL(item.priceEst)} zł` : "—"}
                                      </td>
                                      <td className="px-3 py-3 text-center tabular-nums text-xs text-slate-400 hidden sm:table-cell">
                                        {c.vatRate}%
                                      </td>
                                      <td className="px-3 py-3 text-right tabular-nums text-xs text-slate-500 hidden sm:table-cell">
                                        {c.net > 0 ? `${fmtPL(c.net)} zł` : "—"}
                                      </td>
                                      <td className="px-3 py-3 text-right tabular-nums text-xs text-slate-400 hidden sm:table-cell">
                                        {c.vat > 0 ? `${fmtPL(c.vat)} zł` : "—"}
                                      </td>
                                      <td className="px-3 py-3 text-right tabular-nums text-sm font-semibold text-slate-900">
                                        {c.gross > 0 ? `${fmtPL(c.gross)} zł` : "—"}
                                      </td>
                                    </>
                                  )}
                                  <td className="px-3 py-3 text-center">
                                    {item.link ? (
                                      <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Otwórz link produktu"
                                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-50 text-orange-500 hover:bg-orange-100 hover:text-orange-700 transition-colors"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    ) : (
                                      <span className="inline-block w-7" />
                                    )}
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <StatusBadge status={item.status} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>

                          {catHasPrices && catTotals.gross > 0 && (
                            <tfoot className="border-t border-slate-200 bg-slate-50/60">
                              <tr>
                                <td colSpan={catHasPrices ? 5 : 2} className="px-5 py-2 text-xs text-slate-400 text-right font-medium hidden sm:table-cell">
                                  Suma kategorii
                                </td>
                                <td className="px-3 py-2 text-right text-xs text-slate-500 tabular-nums hidden sm:table-cell">
                                  {fmtPL(catTotals.vat)} zł
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
                                  {fmtPL(catTotals.gross)} zł
                                </td>
                                <td />
                                <td className="px-5 py-2 text-right text-xs text-slate-400 tabular-nums">
                                  netto: {fmtPL(catTotals.net)} zł
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Łączna wartość */}
            {hasPrices && totals.gross > 0 && !search && (
              <div className="p-8 bg-slate-900 text-white rounded-b-xl flex flex-col items-end gap-2">
                <div className="flex justify-between w-full max-w-xs text-sm text-slate-400">
                  <span>Wartość netto:</span>
                  <span>{fmtPL(totals.net)} zł</span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-sm text-slate-400 border-b border-slate-700 pb-2">
                  <span>Podatek VAT:</span>
                  <span>{fmtPL(totals.vat)} zł</span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-2xl font-bold pt-2 text-orange-400 uppercase tracking-tight">
                  <span>Razem brutto:</span>
                  <span>{fmtPL(totals.gross)} zł</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
