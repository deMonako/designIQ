import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Zap, TrendingUp, Activity, Info } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

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
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-base leading-none transition-colors"
      >−</button>
      <input
        type="number" min={min} value={value}
        onChange={e => onChange(Math.max(min, parseInt(e.target.value) || 0))}
        className="w-14 text-center border border-slate-200 rounded-lg py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
      />
      <button
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-base leading-none transition-colors"
      >+</button>
    </div>
  );
}

// ── Loxone Module Calculator ──────────────────────────────────────────────────

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

  const doNeeded  = v.lights + v.heating;
  const diNeeded  = Math.ceil((v.lights + v.blinds + v.dimmers) * 1.5 + v.sensors);
  const ext       = Math.max(Math.ceil((Math.max(doNeeded, diNeeded) - 8) / 8), 0);
  const dimExt    = Math.ceil(v.dimmers / 8);
  const blindExt  = Math.ceil(v.blinds / 4);
  const treeExt   = Math.ceil(v.sensors / 10);
  const total     = 1 + ext + dimExt + blindExt + treeExt;
  const cost      = 2490 + ext * 790 + dimExt * 1190 + blindExt * 1190 + treeExt * 890;
  const totalPoints = v.lights + v.dimmers + v.blinds + v.heating + v.sensors;

  const modules = [
    { key: "miniserver", count: 1,       price: 2490 },
    { key: "extension",  count: ext,     price: 790  },
    { key: "dimmer",     count: dimExt,  price: 1190 },
    { key: "blind",      count: blindExt,price: 1190 },
    { key: "tree",       count: treeExt, price: 890  },
  ];

  return (
    <SectionCard icon={Zap} title="Kalkulator modułów Loxone" badge="Instalacje">
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

          <div className="border-t border-slate-100 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Łącznie modułów</span>
              <span className="font-semibold text-slate-800">{total} szt.</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Punktów logiki</span>
              <span className="font-semibold text-slate-800">{totalPoints}</span>
            </div>
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

// ── Cable Cost Calculator ─────────────────────────────────────────────────────

const CABLE_TYPES = [
  { id: 1, type: "YDY 3×1.5 mm²",       hint: "oświetlenie",         pricePerM: 2.5  },
  { id: 2, type: "YDY 5×2.5 mm²",       hint: "obwody siłowe",       pricePerM: 4.2  },
  { id: 3, type: "YSLCY 3×1.5 mm²",     hint: "ekranowany (silniki)", pricePerM: 3.8  },
  { id: 4, type: "UTP Cat6",            hint: "sieć / BUS / IP",     pricePerM: 1.8  },
  { id: 5, type: "Loxone Tree Bus",     hint: "magistrala drzewkowa", pricePerM: 3.2  },
  { id: 6, type: "KNX (YCYM 2×2×0.8)", hint: "KNX / EIB",           pricePerM: 4.8  },
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
                  <input
                    type="number" min="0" placeholder="0" value={c.meters || ""}
                    onChange={e => set(c.id, "meters", parseFloat(e.target.value) || 0)}
                    className="w-20 text-right border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                  />
                </td>
                <td className="py-2.5 pr-2 text-right">
                  <input
                    type="number" min="0" step="0.1" value={c.pricePerM}
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
        <div className="text-sm text-slate-500">
          Łącznie: <span className="font-semibold text-slate-700">{totalMeters.toFixed(0)} m</span> kabla
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Łączny koszt okablowania</div>
          <div className="text-xl font-bold text-orange-600">{total.toFixed(2)} zł</div>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Quick Project Price Estimator ─────────────────────────────────────────────

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

  const base        = metraz * PACKAGES[pakiet].price;
  const extrasTotal = EXTRAS.reduce((s, e) => s + (extras[e.key] ? e.price : 0), 0);
  const total       = base + extrasTotal;
  const margin      = total * 0.25;

  return (
    <SectionCard icon={TrendingUp} title="Szybka wycena projektu">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          {/* Metraz */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">Powierzchnia obiektu</label>
              <span className="text-sm font-bold text-slate-800">{metraz} m²</span>
            </div>
            <input
              type="range" min="30" max="600" step="5" value={metraz}
              onChange={e => setMetraz(+e.target.value)}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>30 m²</span><span>600 m²</span>
            </div>
          </div>

          {/* Pakiet */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pakiet</label>
            <div className="space-y-2">
              {Object.entries(PACKAGES).map(([key, { price, desc }]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${pakiet === key ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-slate-300"}`}
                >
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

          {/* Extras */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Systemy dodatkowe</label>
            <div className="grid grid-cols-2 gap-2">
              {EXTRAS.map(e => (
                <label
                  key={e.key}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${extras[e.key] ? "border-orange-300 bg-orange-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <input
                    type="checkbox" checked={!!extras[e.key]}
                    onChange={ev => setExtras(p => ({ ...p, [e.key]: ev.target.checked }))}
                    className="mt-0.5 accent-orange-500"
                  />
                  <div>
                    <div className="text-xs font-medium text-slate-700 leading-tight">{e.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">+{e.price.toLocaleString("pl")} zł</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
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

// ── Main export ───────────────────────────────────────────────────────────────

export default function Kalkulator() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kalkulatory instalacyjne</h2>
          <p className="text-xs text-slate-400">Loxone · Okablowanie · Wycena projektu</p>
        </div>
      </div>

      <LoxoneCalc />
      <CableCalc />
      <PriceEstimator />
    </div>
  );
}
