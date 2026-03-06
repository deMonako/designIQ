import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  ArrowLeft, ShoppingCart, Package, ExternalLink, CheckCircle2,
  Clock, Truck, ChevronDown, ChevronUp, Search
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

export default function ClientZakupyView({ investment, zakupy, onBack }) {
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch] = useState("");

  const items = zakupy?.items || [];

  // Filter by search
  const filtered = search.trim()
    ? items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()))
    : items;

  // Group by category in defined order
  const groups = CATEGORY_ORDER
    .map(key => ({
      key,
      label: CATEGORY_LABELS[key] || key,
      items: filtered.filter(i => i.category === key),
    }))
    .filter(g => g.items.length > 0);

  // Also collect items with unknown categories
  const knownKeys = new Set(CATEGORY_ORDER);
  const uncategorized = filtered.filter(i => !knownKeys.has(i.category));
  if (uncategorized.length > 0) {
    groups.push({ key: "__other__", label: "Pozostałe", items: uncategorized });
  }

  // Summary stats
  const totalItems   = items.length;
  const doneItems    = items.filter(i => i.status === "Dostarczone").length;
  const orderedItems = items.filter(i => i.status === "Zamówione").length;
  const progressPct  = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

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
          <div className="grid grid-cols-3 gap-4 mb-5">
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
        groups.map(group => (
          <Card key={group.key} className="border border-slate-200 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              onClick={() => toggleGroup(group.key)}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800">{group.label}</span>
                <span className="text-xs text-slate-400 font-normal">({group.items.length})</span>
              </div>
              <div className="flex items-center gap-3">
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
                  : <ChevronUp className="w-4 h-4 text-slate-400" />
                }
              </div>
            </button>

            {!collapsed[group.key] && (
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                        item.status === "Dostarczone" ? "bg-green-50/40" : ""
                      }`}
                    >
                      {/* Status indicator */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        STATUS_CONFIG[item.status]?.bg || "bg-slate-100"
                      }`}>
                        {React.createElement(
                          STATUS_CONFIG[item.status]?.icon || Clock,
                          { className: `w-4 h-4 ${STATUS_CONFIG[item.status]?.color || "text-slate-500"}` }
                        )}
                      </div>

                      {/* Name + details */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${
                          item.status === "Dostarczone" ? "line-through text-slate-400" : "text-slate-900"
                        }`}>
                          {item.name || <em className="text-slate-400 not-italic">Bez nazwy</em>}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.quantity} {item.unit}
                        </div>
                      </div>

                      {/* Link + status badge */}
                      <div className="flex items-center gap-3 shrink-0">
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Otwórz link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
