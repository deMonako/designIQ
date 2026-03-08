import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, X, ArrowLeft, Phone, Mail, Building2,
  FolderKanban, ChevronRight, Archive, Search, UserPlus,
  Edit3, CheckCircle2, Calendar, Tag, Trash2, AlertTriangle,
  Inbox, UserCheck, ExternalLink,
} from "lucide-react";
import { TODAY } from "../mockData";

// ── Constants ──────────────────────────────────────────────────────────────
const STAGES  = ["Lead", "Wycena", "Negocjacje", "Umowa", "Realizacja"];
const SOURCES = ["Konfigurator", "Polecenie", "Inne"];

const STAGE_META = {
  "Lead":       { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   dot: "bg-blue-500",   dragBg: "bg-blue-100"   },
  "Wycena":     { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-500",  dragBg: "bg-amber-100"  },
  "Negocjacje": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500", dragBg: "bg-purple-100" },
  "Umowa":      { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  dot: "bg-green-500",  dragBg: "bg-green-100"  },
  "Realizacja": { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-500", dragBg: "bg-orange-100" },
};

const SOURCE_COLOR = {
  "Konfigurator": "bg-blue-50 text-blue-700 border-blue-200",
  "Polecenie":    "bg-green-50 text-green-700 border-green-200",
  "Inne":         "bg-slate-100 text-slate-600 border-slate-200",
};

// ── Small badges ───────────────────────────────────────────────────────────
function StageBadge({ status }) {
  const meta = STAGE_META[status] ?? { bg: "bg-slate-100", border: "border-slate-200", text: "text-slate-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.border} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot ?? "bg-slate-400"} mr-1.5`} />
      {status}
    </span>
  );
}

function SourceBadge({ source }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SOURCE_COLOR[source] ?? SOURCE_COLOR["Inne"]}`}>
      {source}
    </span>
  );
}

// ── ClientCard (used in pipeline columns) ──────────────────────────────────
function ClientCard({ client, clientProjects, onClick, onDragStart, onDragEnd }) {
  return (
    <motion.div
      layout
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(client.id); }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(client)}
      whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
      className="bg-white rounded-xl border border-slate-200 cursor-grab active:cursor-grabbing shadow-sm p-3 transition-all hover:border-orange-200 select-none"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 text-sm truncate">{client.name}</div>
          {client.company && (
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{client.company}</span>
            </div>
          )}
        </div>
        <SourceBadge source={client.source} />
      </div>
      <div className="space-y-0.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 flex-shrink-0" />
          {client.phone}
        </div>
        {clientProjects.length > 0 && (
          <div className="flex items-center gap-1.5">
            <FolderKanban className="w-3 h-3 flex-shrink-0 text-orange-400" />
            <span className="text-orange-600 font-medium">
              {clientProjects.length} projekt{clientProjects.length === 1 ? "" : "ów"}
            </span>
          </div>
        )}
      </div>
      {client.notes && (
        <p className="mt-2 text-xs text-slate-400 line-clamp-1 italic">{client.notes}</p>
      )}
    </motion.div>
  );
}

// ── PipelineColumn ─────────────────────────────────────────────────────────
function PipelineColumn({ stage, clients, projects, onDrop, onDragOver, onDragLeave, onClientClick, onDragStart, onDragEnd, isDragTarget }) {
  const meta = STAGE_META[stage];
  const stageClients = clients.filter(c => c.pipelineStatus === stage && !c.isArchived);

  return (
    <div
      className="flex-1 min-w-[210px] max-w-[280px] flex flex-col"
      onDragOver={(e) => { e.preventDefault(); onDragOver(stage); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(stage); }}
    >
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl border ${meta.border} border-b-0 ${meta.bg}`}>
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
        <span className={`text-sm font-semibold ${meta.text}`}>{stage}</span>
        <span className={`ml-auto text-xs font-bold ${meta.text} bg-white/70 px-1.5 py-0.5 rounded-full`}>
          {stageClients.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`flex-1 min-h-[320px] rounded-b-xl border ${meta.border} border-t-0 px-2 py-2 space-y-2 transition-colors ${
          isDragTarget ? `${meta.dragBg} border-dashed` : "bg-slate-50/60"
        }`}
      >
        <AnimatePresence>
          {stageClients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              clientProjects={projects.filter(p => p.clientId === client.id)}
              onClick={onClientClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </AnimatePresence>
        {stageClients.length === 0 && !isDragTarget && (
          <div className={`h-16 flex items-center justify-center text-xs ${meta.text} opacity-40 border-2 border-dashed ${meta.border} rounded-lg`}>
            Brak klientów
          </div>
        )}
        {isDragTarget && (
          <div className={`h-16 flex items-center justify-center text-xs ${meta.text} border-2 border-dashed ${meta.border} rounded-lg font-medium`}>
            Upuść tutaj →
          </div>
        )}
      </div>
    </div>
  );
}

// ── ClientDetail ───────────────────────────────────────────────────────────
function ClientDetail({ client, projects, onBack, onUpdateClient, onDeleteClient, onNavigateToProject, onOpenAddProject }) {
  const [editing, setEditing]      = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [form, setForm]            = useState({ ...client });
  const clientProjects             = projects.filter(p => p.clientId === client.id);

  const handleSave = () => {
    onUpdateClient(form);
    setEditing(false);
  };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-4 lg:p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Powrót do klientów
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
            {client.company && (
              <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
                <Building2 className="w-4 h-4" /> {client.company}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StageBadge status={client.pipelineStatus} />
            <SourceBadge source={client.source} />
          </div>
        </div>

        {!editing ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</div>
                <div className="font-medium text-slate-800">{client.phone || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</div>
                <div className="font-medium text-slate-800">{client.email || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Dodany</div>
                <div className="font-medium text-slate-800">{String(client.createdDate || "").substring(0, 10) || "—"}</div>
              </div>
            </div>
            {!delConfirm ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm hover:bg-orange-100 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edytuj
                </button>
                <button
                  onClick={() => { onUpdateClient({ ...client, isArchived: !client.isArchived }); onBack(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {client.isArchived ? "Przywróć do pipeline" : "Archiwizuj"}
                </button>
                <button
                  onClick={() => setDelConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition-colors ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Usuń klienta
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 flex-1">Usunąć klienta <strong>{client.name}</strong>? Tej operacji nie można cofnąć.</p>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setDelConfirm(false)}
                    className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-white transition-colors font-medium">
                    Anuluj
                  </button>
                  <button onClick={() => { onDeleteClient?.(client.id); onBack(); }}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">
                    Usuń
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 mb-1 font-medium">Imię i nazwisko *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 mb-1 font-medium">Firma</label>
                <input value={form.company ?? ""} onChange={e => set("company", e.target.value || null)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Telefon</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Email</label>
                <input value={form.email} onChange={e => set("email", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Źródło</label>
                <select value={form.source} onChange={e => set("source", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Etap pipeline</label>
                <select value={form.pipelineStatus} onChange={e => set("pipelineStatus", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                  {[...STAGES, "Zakończony"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 mb-1 font-medium">Notatki</label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none resize-none h-20 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Dodaj notatki..." />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zapisz
              </button>
              <button onClick={() => { setForm({ ...client }); setEditing(false); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes (read-only) */}
      {!editing && client.notes && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-500" /> Notatki
          </h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* Projects */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-orange-500" />
            Projekty klienta ({clientProjects.length})
          </h3>
          <button
            onClick={() => onOpenAddProject?.(client.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj projekt
          </button>
        </div>
        {clientProjects.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-6">Brak projektów dla tego klienta</div>
        ) : (
          <div className="space-y-2">
            {clientProjects.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 cursor-pointer transition-all group"
                onClick={() => onNavigateToProject(p)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 group-hover:text-orange-700 truncate">{p.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{p.status} · {p.progress}% · termin: {p.deadline}</div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AddClientModal ─────────────────────────────────────────────────────────
function AddClientModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "",
    source: "Polecenie", pipelineStatus: "Lead", notes: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({
      ...form,
      id:          `cl-${Date.now()}`,
      company:     form.company.trim() || null,
      createdDate: TODAY,
      isArchived:  false,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-500" /> Nowy klient / lead
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1 font-medium">Imię i nazwisko *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="np. Jan Kowalski" required autoFocus
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1 font-medium">Firma (opcjonalnie)</label>
              <input value={form.company} onChange={e => set("company", e.target.value)}
                placeholder="np. ABC Sp. z o.o."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Telefon</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="+48 600 000 000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Email</label>
              <input value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="kontakt@email.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Źródło</label>
              <select value={form.source} onChange={e => set("source", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Etap pipeline</label>
              <select value={form.pipelineStatus} onChange={e => set("pipelineStatus", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1 font-medium">Notatki</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder="Pierwsza rozmowa, zainteresowania..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none resize-none h-16 focus:ring-2 focus:ring-orange-500/20" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">
              Anuluj
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
              Dodaj klienta
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Lead status options ─────────────────────────────────────────────────────
const LEAD_STATUSES = ["Nowy", "W trakcie", "Wyceniony", "Wygrany", "Odrzucony"];

const LEAD_STATUS_META = {
  "Nowy":      { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
  "W trakcie": { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200"  },
  "Wyceniony": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Wygrany":   { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200"  },
  "Odrzucony": { bg: "bg-slate-100", text: "text-slate-500",  border: "border-slate-200"  },
};

function LeadStatusBadge({ status }) {
  const meta = LEAD_STATUS_META[status] ?? LEAD_STATUS_META["Nowy"];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.border} ${meta.text}`}>
      {status}
    </span>
  );
}

// ── LeadDetail ──────────────────────────────────────────────────────────────
function LeadDetail({ lead, onBack, onUpdateLead, onDeleteLead, onConvertToClient }) {
  const [editing,    setEditing]    = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [form,       setForm]       = useState({ status: lead.status, notes: lead.notes || "" });

  const configData = lead.configData || {};
  const hasConfig  = Object.keys(configData).length > 0;

  const handleSave = () => {
    onUpdateLead({ ...lead, status: form.status, notes: form.notes });
    setEditing(false);
  };

  return (
    <div className="p-4 lg:p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Powrót do leadów
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{lead.name}</h2>
            <div className="text-xs text-slate-400 mt-0.5">Lead z konfiguratora · {lead.date?.substring(0, 10)}</div>
          </div>
          <LeadStatusBadge status={lead.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</div>
            <div className="font-medium text-slate-800">{lead.phone || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</div>
            <div className="font-medium text-slate-800">{lead.email || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Wycena</div>
            <div className="font-medium text-green-700">
              {lead.quoteValue ? Number(lead.quoteValue).toLocaleString("pl-PL") + " zł" : "—"}
            </div>
          </div>
        </div>

        {!editing ? (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm hover:bg-orange-100 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edytuj status
            </button>
            <button
              onClick={() => onConvertToClient(lead)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" /> Konwertuj na klienta
            </button>
            {!delConfirm ? (
              <button
                onClick={() => setDelConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition-colors ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Usuń
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl w-full">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 flex-1">Usunąć lead <strong>{lead.name}</strong>?</p>
                <button onClick={() => setDelConfirm(false)} className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-white">Anuluj</button>
                <button onClick={() => { onDeleteLead(lead.id); onBack(); }} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600">Usuń</button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                  {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Notatki</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none resize-none h-20 focus:ring-2 focus:ring-orange-500/20"
                placeholder="Notatki wewnętrzne..." />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zapisz
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Anuluj</button>
            </div>
          </div>
        )}
      </div>

      {/* Notatki */}
      {!editing && lead.notes && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-500" /> Notatki
          </h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}

      {/* Config data z konfiguratora */}
      {hasConfig && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-orange-500" /> Dane z konfiguratora
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(configData).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-sm">
                <span className="text-slate-400 min-w-0 truncate">{key}:</span>
                <span className="font-medium text-slate-800 truncate">{String(value)}</span>
              </div>
            ))}
          </div>
          {lead.quoteValue > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">Szacowana wycena</span>
              <span className="text-lg font-bold text-green-700">{Number(lead.quoteValue).toLocaleString("pl-PL")} zł</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── LeadsList ───────────────────────────────────────────────────────────────
function LeadsList({ leads, onSelectLead, onUpdateLead }) {
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("Wszystkie");

  const filtered = useMemo(() => {
    let list = leads;
    if (statusFilter !== "Wszystkie") list = list.filter(l => l.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.phone ?? "").includes(q)
      );
    }
    return [...list].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [leads, search, statusFilter]);

  const counts = useMemo(() => {
    const c = {};
    LEAD_STATUSES.forEach(s => { c[s] = leads.filter(l => l.status === s).length; });
    return c;
  }, [leads]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj lead..."
            className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 w-52"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex-wrap">
          {["Wszystkie", ...LEAD_STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s}{s !== "Wszystkie" && counts[s] > 0 ? ` (${counts[s]})` : ""}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-400">{leads.length} leadów łącznie</span>
      </div>

      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        {LEAD_STATUSES.map(s => {
          const meta = LEAD_STATUS_META[s];
          return counts[s] > 0 ? (
            <span key={s} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${meta.bg} ${meta.border} ${meta.text}`}>
              {s}: <strong>{counts[s]}</strong>
            </span>
          ) : null;
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search || statusFilter !== "Wszystkie" ? "Brak wyników" : "Brak leadów z konfiguratora"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {filtered.map(lead => (
            <div
              key={lead.id}
              className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors group"
              onClick={() => onSelectLead(lead)}
            >
              <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Inbox className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 text-sm">{lead.name}</div>
                <div className="text-xs text-slate-400">{lead.phone} · {lead.email}</div>
              </div>
              <div className="text-right flex-shrink-0 space-y-1">
                <div><LeadStatusBadge status={lead.status} /></div>
                {lead.quoteValue > 0 && (
                  <div className="text-xs font-semibold text-green-700">{Number(lead.quoteValue).toLocaleString("pl-PL")} zł</div>
                )}
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <div className="text-xs text-slate-400">{lead.date?.substring(0, 10)}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Klienci component ─────────────────────────────────────────────────
export default function Klienci({ clients, projects, leads = [], onUpdateClient, onAddClient, onDeleteClient, onUpdateLead, onDeleteLead, onNavigateToProject, onOpenAddProject }) {
  const [viewMode,       setViewMode]       = useState("pipeline");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedLead,   setSelectedLead]   = useState(null);
  const [draggedId,      setDraggedId]      = useState(null);
  const [dragOverStage,  setDragOverStage]  = useState(null);
  const [search,         setSearch]         = useState("");
  const [showAddModal,   setShowAddModal]   = useState(false);

  const activeClients   = clients.filter(c => !c.isArchived);
  const archivedClients = clients.filter(c => c.isArchived);

  const filteredArchive = useMemo(() => {
    if (!search) return archivedClients;
    const q = search.toLowerCase();
    return archivedClients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  }, [archivedClients, search]);

  const handleDrop = (targetStage) => {
    if (!draggedId) return;
    const client = clients.find(c => c.id === draggedId);
    if (client && client.pipelineStatus !== targetStage) {
      onUpdateClient({ ...client, pipelineStatus: targetStage });
    }
    setDraggedId(null);
    setDragOverStage(null);
  };

  // Keep selectedClient in sync after updates
  const resolvedSelected = selectedClient
    ? (clients.find(c => c.id === selectedClient.id) ?? selectedClient)
    : null;

  // Convert lead to client – pre-fill from lead data
  const handleConvertToClient = (lead) => {
    onAddClient({
      id:             `cl-${Date.now()}`,
      name:           lead.name,
      company:        null,
      email:          lead.email || "",
      phone:          lead.phone || "",
      source:         "Konfigurator",
      pipelineStatus: "Lead",
      createdDate:    TODAY,
      notes:          lead.notes || "",
      isArchived:     false,
    });
    // Mark lead as won
    onUpdateLead?.({ ...lead, status: "Wygrany" });
    setSelectedLead(null);
    setViewMode("pipeline");
  };

  if (resolvedSelected) {
    return (
      <ClientDetail
        client={resolvedSelected}
        projects={projects}
        onBack={() => setSelectedClient(null)}
        onUpdateClient={(updated) => { onUpdateClient(updated); setSelectedClient(updated); }}
        onDeleteClient={onDeleteClient}
        onNavigateToProject={onNavigateToProject}
        onOpenAddProject={onOpenAddProject}
      />
    );
  }

  if (selectedLead) {
    return (
      <LeadDetail
        lead={selectedLead}
        onBack={() => setSelectedLead(null)}
        onUpdateLead={(updated) => { onUpdateLead?.(updated); setSelectedLead(updated); }}
        onDeleteLead={onDeleteLead}
        onConvertToClient={handleConvertToClient}
      />
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setViewMode("pipeline")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === "pipeline" ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setViewMode("leads")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${viewMode === "leads" ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Inbox className="w-3.5 h-3.5" />
            Leady{leads.filter(l => l.status === "Nowy").length > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {leads.filter(l => l.status === "Nowy").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode("archive")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${viewMode === "archive" ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Archive className="w-3.5 h-3.5" />
            Archiwum ({archivedClients.length})
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" /> Nowy klient
        </button>
      </div>

      {/* Stage stats chips – only for pipeline/archive views */}
      {viewMode !== "leads" && (
        <div className="flex gap-2 flex-wrap">
          {STAGES.map(stage => {
            const count = activeClients.filter(c => c.pipelineStatus === stage).length;
            const meta  = STAGE_META[stage];
            return (
              <span key={stage} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${meta.bg} ${meta.border} ${meta.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {stage}: <strong>{count}</strong>
              </span>
            );
          })}
          <span className="ml-auto text-xs text-slate-400 self-center">{activeClients.length} aktywnych</span>
        </div>
      )}

      {/* ── Leads view ── */}
      {viewMode === "leads" && (
        <LeadsList
          leads={leads}
          onSelectLead={setSelectedLead}
          onUpdateLead={onUpdateLead}
        />
      )}

      {/* ── Pipeline view ── */}
      {viewMode === "pipeline" && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {STAGES.map(stage => (
            <PipelineColumn
              key={stage}
              stage={stage}
              clients={activeClients}
              projects={projects}
              onDrop={handleDrop}
              onDragOver={setDragOverStage}
              onDragLeave={() => setDragOverStage(null)}
              onClientClick={setSelectedClient}
              onDragStart={setDraggedId}
              onDragEnd={() => { setDraggedId(null); setDragOverStage(null); }}
              isDragTarget={dragOverStage === stage}
            />
          ))}
        </div>
      )}

      {/* ── Archive view ── */}
      {viewMode === "archive" && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj w archiwum..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>

          {filteredArchive.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? "Brak wyników wyszukiwania" : "Archiwum jest puste"}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
              {filteredArchive.map(client => {
                const clientProjects = projects.filter(p => p.clientId === client.id);
                return (
                  <div
                    key={client.id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-700 text-sm">{client.name}</div>
                      {client.company && <div className="text-xs text-slate-400">{client.company}</div>}
                      <div className="text-xs text-slate-400">{client.phone} · {client.email}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-slate-500 font-medium">{clientProjects.length} projektów</div>
                      <div className="text-xs text-slate-300">od {client.createdDate}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Instrukcja (widoczna gdy brak klientów w pipeline) ── */}
      {viewMode === "pipeline" && activeClients.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-700">
          <strong>Jak korzystać z modułu Klienci?</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside text-blue-600 text-xs">
            <li>Dodaj klienta / lead przyciskiem <strong>Nowy klient</strong></li>
            <li>Przeciągaj karty klientów między etapami pipeline (drag &amp; drop)</li>
            <li>Kliknij kartę klienta, by zobaczyć szczegóły i powiązane projekty</li>
            <li>Z widoku szczegółów przejdź bezpośrednio do projektu klienta</li>
            <li>Zakończonych klientów archiwizuj – pojawią się w zakładce <strong>Archiwum</strong></li>
          </ul>
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddClientModal onAdd={onAddClient} onClose={() => setShowAddModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
