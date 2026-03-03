import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Search, FolderKanban, User, Calendar,
  MapPin, Tag, CheckCircle2, Clock, AlertTriangle, ChevronRight,
  Edit3, Trash2, X, StickyNote, FileText, Eye, EyeOff, ExternalLink,
} from "lucide-react";
import { isOverdue } from "../mockData";

function StatusBadge({ status }) {
  const s = {
    "Wstępny":   "bg-slate-100 text-slate-600",
    "W trakcie": "bg-blue-50 text-blue-700 border border-blue-200",
    "Wstrzymany":"bg-amber-50 text-amber-700 border border-amber-200",
    "Ukończony": "bg-green-50 text-green-700 border border-green-200",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s[status] || s["Wstępny"]}`}>{status}</span>;
}

function PackageBadge({ pkg }) {
  const s = {
    "Smart design":  "bg-slate-100 text-slate-600",
    "Smart design+": "bg-indigo-50 text-indigo-700 border border-indigo-200",
    "Full house":    "bg-orange-50 text-orange-700 border border-orange-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${s[pkg] || "bg-slate-100 text-slate-600"}`}>{pkg}</span>;
}

function ProjectCard({ project, client, onClick }) {
  const overdue = isOverdue(project.deadline, project.status);
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => onClick(project)}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer p-5"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <User className="w-3 h-3" />
            {client?.name ?? "—"}
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <PackageBadge pkg={project.package} />
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {project.stages[project.stageIndex]}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Postęp</span>
          <span className="font-semibold text-slate-700">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center text-xs">
        <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-semibold" : "text-slate-400"}`}>
          {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          {overdue ? "Opóźniony" : project.deadline}
        </span>
      </div>
    </motion.div>
  );
}

function ProjectDetail({ project, client, tasks, checklists, projectDocs, onBack, onUpdateProject, onAddProjectDoc, onDeleteProjectDoc, onToggleDocClientVisible }) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(project.notes);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: "", type: "pdf", description: "", url: "" });

  const projectTasks      = tasks.filter(t => t.projectId === project.id);
  const projectChecklists = checklists.filter(c => c.projectId === project.id);
  const projectDocList    = (projectDocs ?? []).filter(d => d.projectId === project.id);
  const tasksDone         = projectTasks.filter(t => t.status === "Zrobione").length;

  const tabs = [
    { id: "tasks",         label: `Zadania (${projectTasks.length})` },
    { id: "checklists",    label: `Checklisty (${projectChecklists.length})` },
    { id: "dokumentacja",  label: `Dokumentacja (${projectDocList.length})` },
    { id: "notes",         label: "Notatki" },
    { id: "overview",      label: "Przegląd" },
  ];

  const activeTasks = projectTasks.filter(t => t.status !== "Zrobione");
  const doneTasks   = projectTasks.filter(t => t.status === "Zrobione");

  const priorityColor = { "Niski": "text-slate-400", "Normalny": "text-blue-500", "Wysoki": "text-orange-500", "Krytyczny": "text-red-500" };
  const taskStatusStyle = { "Niezrobione": "bg-slate-100 text-slate-600", "Zrobione": "bg-green-50 text-green-700" };

  return (
    <div className="p-4 lg:p-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Powrót do listy
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <div className="flex flex-wrap items-start gap-3 justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <PackageBadge pkg={project.package} />
              <StatusBadge status={project.status} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">{project.progress}%</div>
            <div className="text-xs text-slate-400">postępu</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
            />
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Klient</div>
            <div className="font-medium text-slate-800">{client?.name ?? "—"}</div>
            <div className="text-xs text-slate-500">{client?.phone ?? ""}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Termin</div>
            <div className={`font-medium ${isOverdue(project.deadline, project.status) ? "text-red-600" : "text-slate-800"}`}>
              {project.deadline}
            </div>
            <div className="text-xs text-slate-500">start: {project.startDate}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adres</div>
            <div className="font-medium text-slate-800 text-xs">{project.address}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Stage timeline */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">Etapy realizacji</h3>
                <div className="space-y-2">
                  {project.stages.map((stage, idx) => {
                    const done = idx < project.stageIndex;
                    const current = idx === project.stageIndex;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          done ? "bg-green-500 text-white" : current ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"
                        }`}>
                          {done ? "✓" : idx + 1}
                        </div>
                        <span className={`text-sm ${done ? "line-through text-slate-400" : current ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
                          {stage}
                        </span>
                        {current && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Aktualny</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Zadania", value: `${tasksDone}/${projectTasks.length}`, icon: CheckCircle2, color: "text-blue-500" },
                  { label: "Checklisty", value: projectChecklists.length, icon: Clock, color: "text-orange-500" },
                  { label: "Tagi", value: project.tags.length || "—", icon: Tag, color: "text-slate-500" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                    <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                    <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                    <div className="text-xs text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {project.tags.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Tagi</div>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-4">
              {/* Aktywne zadania */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                {projectTasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Brak zadań dla tego projektu</div>
                ) : activeTasks.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Wszystkie zadania ukończone
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeTasks.map(t => (
                      <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor[t.priority].replace("text-", "bg-")}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800">{t.title}</div>
                          <div className="text-xs text-slate-400">{t.assignee} · {t.dueDate}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${taskStatusStyle[t.status]}`}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Archiwum ukończonych */}
              {doneTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Archiwum ({doneTasks.length})
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm opacity-80">
                    <div className="divide-y divide-slate-100">
                      {doneTasks.map(t => (
                        <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-500 line-through">{t.title}</div>
                            <div className="text-xs text-slate-400">{t.assignee}</div>
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                            ukończono: {t.dueDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "checklists" && (
            <div className="space-y-3">
              {projectChecklists.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 text-sm">Brak checklist dla tego projektu</div>
              ) : projectChecklists.map(cl => {
                const done = cl.items.filter(i => i.done).length;
                const pct = Math.round((done / cl.items.length) * 100);
                return (
                  <div key={cl.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-slate-900 text-sm">{cl.title}</div>
                      <span className="text-xs text-slate-500">{done}/{cl.items.length}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="space-y-1.5">
                      {cl.items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${item.done ? "bg-green-500 border-green-500" : "border-slate-300"}`}>
                            {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={item.done ? "line-through text-slate-400" : "text-slate-700"}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "dokumentacja" && (
            <div className="space-y-3">
              {/* Add doc button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddDoc(!showAddDoc)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" /> Dodaj dokument
                </button>
              </div>

              {/* Add doc form */}
              <AnimatePresence>
                {showAddDoc && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-xl border border-orange-200 p-4 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs text-slate-500 mb-1 font-medium">Nazwa pliku / dokumentu *</label>
                        <input value={newDoc.name} onChange={e => setNewDoc(d => ({ ...d, name: e.target.value }))}
                          placeholder="np. Schemat szafy v2.pdf"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1 font-medium">Typ</label>
                        <select value={newDoc.type} onChange={e => setNewDoc(d => ({ ...d, type: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                          {["pdf","xlsx","dwg","docx","image","link","inne"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1 font-medium">URL / link</label>
                        <input value={newDoc.url} onChange={e => setNewDoc(d => ({ ...d, url: e.target.value }))}
                          placeholder="https://..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-slate-500 mb-1 font-medium">Opis</label>
                        <input value={newDoc.description} onChange={e => setNewDoc(d => ({ ...d, description: e.target.value }))}
                          placeholder="Krótki opis dokumentu..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddDoc(false)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Anuluj</button>
                      <button
                        onClick={() => {
                          if (!newDoc.name.trim()) return;
                          onAddProjectDoc({ ...newDoc, id: `pd-${Date.now()}`, projectId: project.id, date: "2026-03-02", clientVisible: false });
                          setNewDoc({ name: "", type: "pdf", description: "", url: "" });
                          setShowAddDoc(false);
                        }}
                        className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600"
                      >Dodaj</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Doc list */}
              {projectDocList.length === 0 && !showAddDoc ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Brak dokumentów dla tego projektu
                </div>
              ) : (
                projectDocList.map(doc => (
                  <div key={doc.id} className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-all ${doc.clientVisible ? "border-green-200 bg-green-50/20" : "border-slate-200"}`}>
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileText className={`w-4 h-4 ${doc.type === "pdf" ? "text-red-500" : doc.type === "xlsx" ? "text-green-600" : "text-slate-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">{doc.name}</div>
                      {doc.description && <div className="text-xs text-slate-500 mt-0.5">{doc.description}</div>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400">{doc.date}</span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{doc.type}</span>
                        {doc.clientVisible ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Widoczny dla klienta
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Tylko dla mnie
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {doc.url && doc.url !== "#" && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => onToggleDocClientVisible(doc.id)}
                        title={doc.clientVisible ? "Ukryj przed klientem" : "Pokaż klientowi"}
                        className={`p-1.5 rounded-lg transition-colors ${doc.clientVisible ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-slate-400 hover:text-orange-500 hover:bg-orange-50"}`}
                      >
                        {doc.clientVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => onDeleteProjectDoc(doc.id)}
                        className="p-1.5 text-slate-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-orange-500" /> Notatki
                </h3>
                <button
                  onClick={() => {
                    if (editingNote) onUpdateProject({ ...project, notes: note });
                    setEditingNote(!editingNote);
                  }}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                >
                  {editingNote ? <><CheckCircle2 className="w-3 h-3" /> Zapisz</> : <><Edit3 className="w-3 h-3" /> Edytuj</>}
                </button>
              </div>
              {editingNote ? (
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full h-40 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 resize-none outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  placeholder="Dodaj notatki do projektu..."
                />
              ) : (
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {note || <span className="text-slate-400 italic">Brak notatek</span>}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Projekty({ projects, tasks, checklists, clients, onUpdateProject, selectedProject, setSelectedProject, projectDocs, onAddProjectDoc, onDeleteProjectDoc, onToggleDocClientVisible }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.client.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchPackage = packageFilter === "all" || p.package === packageFilter;
      return matchSearch && matchStatus && matchPackage;
    });
  }, [projects, search, statusFilter, packageFilter]);

  const getClient = (clientId) => (clients ?? []).find(c => c.id === clientId);

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        client={getClient(selectedProject.clientId)}
        tasks={tasks}
        checklists={checklists}
        projectDocs={projectDocs}
        onBack={() => setSelectedProject(null)}
        onUpdateProject={(updated) => { onUpdateProject(updated); setSelectedProject(updated); }}
        onAddProjectDoc={onAddProjectDoc}
        onDeleteProjectDoc={onDeleteProjectDoc}
        onToggleDocClientVisible={onToggleDocClientVisible}
      />
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj projektu lub klienta..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-700"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="Wstępny">Wstępny</option>
            <option value="W trakcie">W trakcie</option>
            <option value="Wstrzymany">Wstrzymany</option>
            <option value="Ukończony">Ukończony</option>
          </select>
          <select
            value={packageFilter}
            onChange={e => setPackageFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-700"
          >
            <option value="all">Wszystkie pakiety</option>
            <option value="Smart design">Smart design</option>
            <option value="Smart design+">Smart design+</option>
            <option value="Full house">Full house</option>
          </select>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Nowy projekt
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 flex-wrap text-sm text-slate-600">
        {["Wstępny", "W trakcie", "Wstrzymany", "Ukończony"].map(s => {
          const count = projects.filter(p => p.status === s).length;
          return <span key={s} className="flex items-center gap-1"><span className="font-semibold text-slate-800">{count}</span> {s}</span>;
        })}
        <span className="text-slate-400">·</span>
        <span className="text-slate-500">{filtered.length} wyników</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Brak projektów spełniających kryteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} client={getClient(p.clientId)} onClick={setSelectedProject} />
          ))}
        </div>
      )}

      {/* Add project modal (basic) */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Nowy projekt</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 text-center text-slate-400">
                <Plus className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Formularz tworzenia projektu będzie połączony z backendem GAS.</p>
                <p className="text-xs mt-1 text-slate-300">Placeholder — do implementacji w kolejnej iteracji.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
