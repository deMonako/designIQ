import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, ChevronUp, ChevronDown, FolderKanban, User, MapPin, DollarSign, Calendar, Key, Layers,
} from "lucide-react";
import { TODAY } from "./mockData";

const DEFAULT_STAGES = ["Wycena", "Projekt automatyki", "Projekt szafy", "Prefabrykacja", "Montaż", "Uruchomienie", "Szkolenie", "Odbiór"];

function StagesEditor({ stages, onChange }) {
  const add    = () => onChange([...stages, ""]);
  const remove = (i) => stages.length > 1 && onChange(stages.filter((_, j) => j !== i));
  const update = (i, v) => onChange(stages.map((x, j) => j === i ? v : x));
  const move   = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= stages.length) return;
    const a = [...stages]; [a[i], a[j]] = [a[j], a[i]]; onChange(a);
  };
  return (
    <div>
      <div className="space-y-1.5 mb-3">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 select-none">{i + 1}</span>
            <input
              value={s}
              onChange={e => update(i, e.target.value)}
              placeholder={`Etap ${i + 1}`}
              className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
            />
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
              className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === stages.length - 1}
              className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => remove(i)} disabled={stages.length <= 1}
              className="p-1 text-slate-300 hover:text-red-500 disabled:opacity-20 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">
        <Plus className="w-3.5 h-3.5" /> Dodaj etap
      </button>
    </div>
  );
}

const NEW_CLIENT_ID = "__new__";
const PACKAGES = ["Smart design", "Smart design+", "Full house"];
const STATUSES  = ["Wstępny", "W trakcie"];

function generateCode(clientName, projects) {
  const parts    = (clientName || "").trim().split(/\s+/);
  const surname  = parts[parts.length - 1] || parts[0] || "XXX";
  const normal   = surname
    .replace(/ł/gi, "L").replace(/ą/gi, "A").replace(/ę/gi, "E")
    .replace(/ó/gi, "O").replace(/ś/gi, "S").replace(/ź/gi, "Z")
    .replace(/ż/gi, "Z").replace(/ć/gi, "C").replace(/ń/gi, "N");
  const prefix   = normal.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
  const year     = new Date().getFullYear();
  const pat      = `${prefix}-${year}-`;
  const existing = projects.filter(p => (p.code || "").startsWith(pat)).length;
  return `${prefix}-${year}-${String(existing + 1).padStart(3, "0")}`;
}

export default function AddProjectModal({ clients, projects, initialClientId, onAdd, onClose }) {
  const activeClients   = (clients || []).filter(c => !c.isArchived);
  const defaultClientId = initialClientId
    || (activeClients[0]?.id)
    || NEW_CLIENT_ID;

  const initClient   = activeClients.find(c => c.id === defaultClientId);
  const defaultCode  = initClient ? generateCode(initClient.name, projects) : "";

  const [stages, setStages] = useState([...DEFAULT_STAGES]);

  const [form, setForm] = useState({
    clientId:            defaultClientId,
    newClientName:       "",
    newClientPhone:      "",
    newClientEmail:      "",
    name:                "",
    code:                defaultCode,
    package:             "Smart design",
    status:              "Wstępny",
    address:             "",
    scope:               "",
    profitProjekt:       "",
    profitPrefabrykacja: "",
    profitUruchomienie:  "",
    startDate:           TODAY,
    deadline:            "",
  });

  const set          = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isNewClient  = form.clientId === NEW_CLIENT_ID;
  const totalProfit  =
    (parseFloat(form.profitProjekt)       || 0) +
    (parseFloat(form.profitPrefabrykacja) || 0) +
    (parseFloat(form.profitUruchomienie)  || 0);

  const handleClientChange = (clientId) => {
    const updates = { clientId };
    if (clientId !== NEW_CLIENT_ID) {
      const client = activeClients.find(c => c.id === clientId);
      if (client) updates.code = generateCode(client.name, projects);
    } else {
      updates.code          = "";
      updates.newClientName = "";
    }
    setForm(f => ({ ...f, ...updates }));
  };

  const handleNewClientName = (name) => {
    const updates = { newClientName: name };
    if (name.trim().length >= 2) updates.code = generateCode(name, projects);
    setForm(f => ({ ...f, ...updates }));
  };

  const canSubmit =
    form.name.trim() &&
    form.code.trim() &&
    (!isNewClient || form.newClientName.trim());

  const doSubmit = (e) => {
    e?.preventDefault();
    if (!canSubmit) return;

    const newClientData = isNewClient
      ? {
          name:           form.newClientName.trim(),
          phone:          form.newClientPhone.trim(),
          email:          form.newClientEmail.trim(),
          company:        null,
          source:         "Inne",
          pipelineStatus: "Realizacja",
          notes:          "",
        }
      : null;

    const project = {
      id:                  `proj-${Date.now()}`,
      clientId:            isNewClient ? null : form.clientId,
      code:                form.code.trim(),
      name:                form.name.trim(),
      package:             form.package,
      status:              form.status,
      stageIndex:          0,
      stages:              stages.filter(s => s.trim()),
      stageSchedule:       [],
      progress:            0,
      startDate:           form.startDate,
      deadline:            form.deadline,
      budget:              totalProfit,
      address:             form.address.trim(),
      scope:               form.scope.trim(),
      profitProjekt:       parseFloat(form.profitProjekt)       || 0,
      profitPrefabrykacja: parseFloat(form.profitPrefabrykacja) || 0,
      profitUruchomienie:  parseFloat(form.profitUruchomienie)  || 0,
      notes:               "",
      tags:                [],
    };

    onAdd(project, newClientData);
  };

  const iCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";
  const lCls = "block text-xs text-slate-500 mb-1 font-medium";
  const sCls = "bg-slate-50 rounded-xl p-4 space-y-3";
  const tCls = "text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-orange-500" />
            Nowy projekt
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={doSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Klient ── */}
          <div className={sCls}>
            <div className={tCls}><User className="w-3.5 h-3.5" /> Klient</div>
            <div>
              <label className={lCls}>Wybierz klienta *</label>
              <select
                value={form.clientId}
                onChange={e => handleClientChange(e.target.value)}
                className={iCls}
              >
                {activeClients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` – ${c.company}` : ""}
                  </option>
                ))}
                <option value={NEW_CLIENT_ID}>— Nowy klient —</option>
              </select>
            </div>

            {isNewClient && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/80 mt-2">
                <div className="sm:col-span-3">
                  <label className={lCls}>Imię i nazwisko *</label>
                  <input
                    value={form.newClientName}
                    onChange={e => handleNewClientName(e.target.value)}
                    placeholder="np. Anna Nowak"
                    className={iCls}
                  />
                </div>
                <div>
                  <label className={lCls}>Telefon</label>
                  <input value={form.newClientPhone} onChange={e => set("newClientPhone", e.target.value)}
                    placeholder="+48 600 000 000" className={iCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={lCls}>Email</label>
                  <input value={form.newClientEmail} onChange={e => set("newClientEmail", e.target.value)}
                    placeholder="email@example.com" className={iCls} />
                </div>
              </div>
            )}
          </div>

          {/* ── Projekt ── */}
          <div className={sCls}>
            <div className={tCls}><FolderKanban className="w-3.5 h-3.5" /> Projekt</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={lCls}>Nazwa projektu *</label>
                <input
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="np. Dom Kowalski – Kraków"
                  required
                  className={iCls}
                />
              </div>
              <div>
                <label className={lCls + " flex items-center gap-1"}>
                  <Key className="w-3 h-3" /> Kod inwestycji *
                </label>
                <input
                  value={form.code}
                  onChange={e => set("code", e.target.value.toUpperCase())}
                  placeholder="np. KOW-2026-001"
                  required
                  className={iCls + " font-mono tracking-wider"}
                />
                <p className="text-[11px] text-slate-400 mt-1">Klient użyje tego kodu do logowania w panelu klienta</p>
              </div>
              <div>
                <label className={lCls}>Pakiet</label>
                <select value={form.package} onChange={e => set("package", e.target.value)} className={iCls}>
                  {PACKAGES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                <div>
                  <label className={lCls}>Status startowy</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)} className={iCls}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Etapy ── */}
          <div className={sCls}>
            <div className={tCls}><Layers className="w-3.5 h-3.5" /> Etapy projektu</div>
            <StagesEditor stages={stages} onChange={setStages} />
          </div>

          {/* ── Szczegóły ── */}
          <div className={sCls}>
            <div className={tCls}><MapPin className="w-3.5 h-3.5" /> Szczegóły</div>
            <div>
              <label className={lCls}>Adres inwestycji</label>
              <input
                value={form.address}
                onChange={e => set("address", e.target.value)}
                placeholder="ul. Przykładowa 1, Miasto"
                className={iCls}
              />
            </div>
            <div>
              <label className={lCls}>Zakres projektu</label>
              <textarea
                value={form.scope}
                onChange={e => set("scope", e.target.value)}
                placeholder="Opisz zakres prac – np. automatyka budynkowa, system oświetlenia, sterowanie ogrzewaniem..."
                className={iCls + " resize-none h-20"}
              />
            </div>
          </div>

          {/* ── Zyski ── */}
          <div className={sCls}>
            <div className={tCls}><DollarSign className="w-3.5 h-3.5" /> Przewidywane zyski</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "profitProjekt",       label: "Projekty" },
                { key: "profitPrefabrykacja", label: "Prefabrykacja" },
                { key: "profitUruchomienie",  label: "Uruchomienie" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className={lCls}>{label}</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={form[key]}
                      onChange={e => set(key, e.target.value)}
                      placeholder="0"
                      className={iCls + " pr-10"}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">PLN</span>
                  </div>
                </div>
              ))}
            </div>
            {totalProfit > 0 && (
              <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-200/80">
                <span className="text-xs text-slate-500">Łącznie:</span>
                <span className="text-sm font-bold text-orange-600">
                  {totalProfit.toLocaleString("pl-PL")} PLN
                </span>
              </div>
            )}
          </div>

          {/* ── Harmonogram ── */}
          <div className={sCls}>
            <div className={tCls}><Calendar className="w-3.5 h-3.5" /> Harmonogram</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lCls}>Data rozpoczęcia</label>
                <input type="date" value={form.startDate}
                  onChange={e => set("startDate", e.target.value)} className={iCls} />
              </div>
              <div>
                <label className={lCls}>Termin zakończenia</label>
                <input type="date" value={form.deadline}
                  onChange={e => set("deadline", e.target.value)} className={iCls} />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={doSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Utwórz projekt →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
