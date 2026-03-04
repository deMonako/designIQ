import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Search, FolderKanban, User, Calendar,
  MapPin, Tag, CheckCircle2, Clock, AlertTriangle, ChevronRight,
  Edit3, Trash2, X, StickyNote, FileText, Eye, EyeOff, ExternalLink,
  DollarSign, Save, List, Key, Layers,
} from "lucide-react";
import { isOverdue, TODAY } from "../mockData";

const TASK_PRIORITIES = ["Niski", "Normalny", "Wysoki", "Krytyczny"];

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
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <User className="w-3 h-3" />
              {client?.name ?? "—"}
            </div>
            {project.code && (
              <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {project.code}
              </span>
            )}
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

function ProjectDetail({
  project, client, tasks, checklists, projectDocs,
  onBack, onUpdateProject, onAddTask, onUpdateTask,
  onAddProjectDoc, onDeleteProjectDoc, onToggleDocClientVisible,
  onAddChecklist, onToggleChecklistItem,
}) {
  const [activeTab,     setActiveTab]     = useState("tasks");
  const [editingNote,   setEditingNote]   = useState(false);
  const [note,          setNote]          = useState(project.notes);
  const [showAddDoc,    setShowAddDoc]    = useState(false);
  const [newDoc,        setNewDoc]        = useState({ name: "", type: "pdf", description: "", url: "" });
  const [showAddTask,   setShowAddTask]   = useState(false);
  const [newTask,       setNewTask]       = useState({ title: "", dueDate: TODAY, priority: "Normalny" });

  // ── Edit project ──
  const [editingProject, setEditingProject] = useState(false);
  const [editForm,       setEditForm]       = useState({ ...project });
  useEffect(() => { if (!editingProject) setEditForm({ ...project }); }, [project]); // eslint-disable-line
  const setEF = (k, v) => setEditForm(f => ({ ...f, [k]: v }));
  const handleSaveProject = () => {
    onUpdateProject({
      ...editForm,
      profitProjekt:       parseFloat(editForm.profitProjekt)       || 0,
      profitPrefabrykacja: parseFloat(editForm.profitPrefabrykacja) || 0,
      profitUruchomienie:  parseFloat(editForm.profitUruchomienie)  || 0,
      budget: (parseFloat(editForm.profitProjekt) || 0)
            + (parseFloat(editForm.profitPrefabrykacja) || 0)
            + (parseFloat(editForm.profitUruchomienie) || 0),
      progress: Math.min(100, Math.max(0, parseInt(editForm.progress) || 0)),
    });
    setEditingProject(false);
  };

  // ── Edit task ──
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskForm,  setEditTaskForm]  = useState(null);
  const setTF = (k, v) => setEditTaskForm(f => ({ ...f, [k]: v }));
  const startEditTask = (t) => { setEditingTaskId(t.id); setEditTaskForm({ ...t }); };
  const saveTask = () => {
    if (!editTaskForm.title.trim()) return;
    onUpdateTask?.({ ...editTaskForm, title: editTaskForm.title.trim() });
    setEditingTaskId(null);
  };
  const toggleTaskDone = (t) =>
    onUpdateTask?.({ ...t, status: t.status === "Zrobione" ? "Niezrobione" : "Zrobione" });

  // ── New checklist ──
  const [showAddCL,  setShowAddCL]  = useState(false);
  const [newCL,      setNewCL]      = useState({ title: "", items: [""] });
  const addCLItem     = () => setNewCL(c => ({ ...c, items: [...c.items, ""] }));
  const removeCLItem  = (i) => setNewCL(c => ({ ...c, items: c.items.filter((_, idx) => idx !== i) }));
  const setCLItem     = (i, v) => setNewCL(c => ({ ...c, items: c.items.map((x, idx) => idx === i ? v : x) }));
  const submitChecklist = () => {
    if (!newCL.title.trim()) return;
    const items = newCL.items
      .filter(s => s.trim())
      .map((s, i) => ({ id: `chi-${Date.now()}-${i}`, text: s.trim(), done: false }));
    onAddChecklist?.({ id: `cl-${Date.now()}`, projectId: project.id, title: newCL.title.trim(), items });
    setNewCL({ title: "", items: [""] });
    setShowAddCL(false);
  };

  const projectTasks      = tasks.filter(t => t.projectId === project.id);
  const projectChecklists = checklists.filter(c => c.projectId === project.id);
  const projectDocList    = (projectDocs ?? []).filter(d => d.projectId === project.id);
  const tasksDone         = projectTasks.filter(t => t.status === "Zrobione").length;

  const tabs = [
    { id: "tasks",        label: `Zadania (${projectTasks.length})` },
    { id: "checklists",   label: `Checklisty (${projectChecklists.length})` },
    { id: "dokumentacja", label: `Dokumentacja (${projectDocList.length})` },
    { id: "notes",        label: "Notatki" },
    { id: "overview",     label: "Przegląd" },
  ];

  const activeTasks = projectTasks.filter(t => t.status !== "Zrobione");
  const doneTasks   = projectTasks.filter(t => t.status === "Zrobione");

  const priorityDot   = { "Niski": "bg-slate-300", "Normalny": "bg-blue-400", "Wysoki": "bg-orange-400", "Krytyczny": "bg-red-500" };
  const priorityLabel = { "Niski": "text-slate-400", "Normalny": "text-blue-500", "Wysoki": "text-orange-500", "Krytyczny": "text-red-500" };

  const iCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";
  const lCls = "block text-xs text-slate-500 mb-1 font-medium";

  return (
    <div className="p-4 lg:p-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Powrót do listy
      </button>

      {/* ── Header card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <div className="flex flex-wrap items-start gap-3 justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
              {project.code && (
                <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                  {project.code}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <PackageBadge pkg={project.package} />
              <StatusBadge status={project.status} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-1">
              <div className="text-2xl font-bold text-orange-600">{project.progress}%</div>
              <div className="text-xs text-slate-400">postępu</div>
            </div>
            <button
              onClick={() => setEditingProject(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                editingProject
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {editingProject ? "Anuluj" : "Edytuj"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
            />
          </div>
        </div>

        {/* Info grid (read-only) */}
        {!editingProject && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Klient</div>
              <div className="font-medium text-slate-800">{client?.name ?? "—"}</div>
              <div className="text-xs text-slate-500">{client?.phone ?? ""}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Termin</div>
              <div className={`font-medium ${isOverdue(project.deadline, project.status) ? "text-red-600" : "text-slate-800"}`}>
                {project.deadline || "—"}
              </div>
              <div className="text-xs text-slate-500">start: {project.startDate}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adres</div>
              <div className="font-medium text-slate-800 text-xs">{project.address || "—"}</div>
            </div>
            {project.scope && (
              <div className="sm:col-span-3">
                <div className="text-xs text-slate-400 mb-1">Zakres</div>
                <div className="text-xs text-slate-600">{project.scope}</div>
              </div>
            )}
            {(project.profitProjekt || project.profitPrefabrykacja || project.profitUruchomienie) ? (
              <div className="sm:col-span-3 flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                {[
                  { label: "Projekty",      val: project.profitProjekt },
                  { label: "Prefabrykacja", val: project.profitPrefabrykacja },
                  { label: "Uruchomienie",  val: project.profitUruchomienie },
                ].map(({ label, val }) => val > 0 && (
                  <div key={label}>
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="text-sm font-semibold text-orange-600">{(val || 0).toLocaleString("pl-PL")} PLN</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* ── Edit form (slide in) ── */}
        <AnimatePresence>
          {editingProject && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={lCls}>Nazwa projektu *</label>
                    <input value={editForm.name || ""} onChange={e => setEF("name", e.target.value)} className={iCls} />
                  </div>
                  <div>
                    <label className={lCls + " flex items-center gap-1"}><Key className="w-3 h-3" /> Kod inwestycji</label>
                    <input value={editForm.code || ""} onChange={e => setEF("code", e.target.value.toUpperCase())}
                      className={iCls + " font-mono tracking-wider"} />
                  </div>
                  <div>
                    <label className={lCls}>Status</label>
                    <select value={editForm.status || "Wstępny"} onChange={e => setEF("status", e.target.value)} className={iCls}>
                      {["Wstępny", "W trakcie", "Wstrzymany", "Ukończony"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lCls}>Pakiet</label>
                    <select value={editForm.package || "Smart design"} onChange={e => setEF("package", e.target.value)} className={iCls}>
                      {["Smart design", "Smart design+", "Full house"].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lCls + " flex items-center gap-1"}><Layers className="w-3 h-3" /> Etap bieżący</label>
                    <select value={editForm.stageIndex ?? 0} onChange={e => setEF("stageIndex", Number(e.target.value))} className={iCls}>
                      {(editForm.stages || project.stages).map((s, i) => <option key={i} value={i}>{i + 1}. {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lCls}>Postęp (%)</label>
                    <input type="number" min="0" max="100" value={editForm.progress ?? 0}
                      onChange={e => setEF("progress", e.target.value)} className={iCls} />
                  </div>
                </div>

                {/* Row 2: adres + zakres */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className={lCls + " flex items-center gap-1"}><MapPin className="w-3 h-3" /> Adres inwestycji</label>
                    <input value={editForm.address || ""} onChange={e => setEF("address", e.target.value)} className={iCls} />
                  </div>
                  <div>
                    <label className={lCls}>Zakres projektu</label>
                    <textarea value={editForm.scope || ""} onChange={e => setEF("scope", e.target.value)}
                      className={iCls + " resize-none h-16"} />
                  </div>
                </div>

                {/* Row 3: zyski */}
                <div>
                  <label className={lCls + " flex items-center gap-1 mb-2"}><DollarSign className="w-3 h-3" /> Przewidywane zyski</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: "profitProjekt", label: "Projekty" },
                      { key: "profitPrefabrykacja", label: "Prefabrykacja" },
                      { key: "profitUruchomienie",  label: "Uruchomienie" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className={lCls}>{label}</label>
                        <div className="relative">
                          <input type="number" min="0" step="100" value={editForm[key] ?? ""}
                            onChange={e => setEF(key, e.target.value)}
                            placeholder="0" className={iCls + " pr-10"} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">PLN</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 4: dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lCls + " flex items-center gap-1"}><Calendar className="w-3 h-3" /> Data rozpoczęcia</label>
                    <input type="date" value={editForm.startDate || ""} onChange={e => setEF("startDate", e.target.value)} className={iCls} />
                  </div>
                  <div>
                    <label className={lCls}>Termin zakończenia</label>
                    <input type="date" value={editForm.deadline || ""} onChange={e => setEF("deadline", e.target.value)} className={iCls} />
                  </div>
                </div>

                {/* Save / cancel */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditingProject(false)}
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                    Anuluj
                  </button>
                  <button onClick={handleSaveProject}
                    disabled={!editForm.name?.trim()}
                    className="flex-1 px-3 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-bold hover:shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                    <Save className="w-3.5 h-3.5" /> Zapisz zmiany
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {/* ══ OVERVIEW ══ */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Etapy realizacji</h3>
                <p className="text-xs text-slate-400 mb-4">Kliknij etap, aby ustawić go jako bieżący</p>
                <div className="space-y-1.5">
                  {project.stages.map((stage, idx) => {
                    const done    = idx < project.stageIndex;
                    const current = idx === project.stageIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => onUpdateProject({ ...project, stageIndex: idx })}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-left group ${
                          current ? "bg-orange-50 border border-orange-200" : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                          done ? "bg-green-500 text-white" : current ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                        }`}>
                          {done ? "✓" : idx + 1}
                        </div>
                        <span className={`text-sm flex-1 ${done ? "line-through text-slate-400" : current ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
                          {stage}
                        </span>
                        {current && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Aktualny</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Zadania", value: `${tasksDone}/${projectTasks.length}`, icon: CheckCircle2, color: "text-blue-500" },
                  { label: "Checklisty", value: projectChecklists.length, icon: List, color: "text-orange-500" },
                  { label: "Tagi", value: project.tags?.length || "—", icon: Tag, color: "text-slate-500" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                    <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                    <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                    <div className="text-xs text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
              {project.tags?.length > 0 && (
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

          {/* ══ ZADANIA ══ */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddTask(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-xs font-bold hover:shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Dodaj zadanie
                </button>
              </div>

              <AnimatePresence>
                {showAddTask && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
                      <input autoFocus value={newTask.title}
                        onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                        placeholder="Tytuł zadania…"
                        className={iCls} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">Termin</label>
                          <input type="date" value={newTask.dueDate}
                            onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))}
                            className={iCls} />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">Priorytet</label>
                          <select value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))} className={iCls}>
                            {TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowAddTask(false)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">Anuluj</button>
                        <button
                          onClick={() => {
                            if (!newTask.title.trim()) return;
                            onAddTask?.({ id: `t-${Date.now()}`, type: "task", projectId: project.id,
                              title: newTask.title.trim(), assignee: "Adam", status: "Niezrobione",
                              priority: newTask.priority, dueDate: newTask.dueDate, description: "" });
                            setNewTask({ title: "", dueDate: TODAY, priority: "Normalny" });
                            setShowAddTask(false);
                          }}
                          disabled={!newTask.title.trim()}
                          className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-40"
                        >Dodaj</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Aktywne */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {projectTasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Brak zadań dla tego projektu</div>
                ) : activeTasks.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> Wszystkie zadania ukończone
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeTasks.map(t => (
                      <div key={t.id}>
                        {/* Task row */}
                        <div className="px-4 py-3 flex items-center gap-3">
                          {/* Done toggle */}
                          <button
                            onClick={() => toggleTaskDone(t)}
                            className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0 hover:border-green-400 transition-colors group"
                            title="Oznacz jako ukończone"
                          >
                            <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-green-400 transition-colors" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800">{t.title}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span className={`font-medium ${priorityLabel[t.priority]}`}>{t.priority}</span>
                              <span>·</span>
                              <span>{t.dueDate}</span>
                              <span>·</span>
                              <span>{t.assignee}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => editingTaskId === t.id ? setEditingTaskId(null) : startEditTask(t)}
                            className="p-1.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edytuj zadanie"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Inline edit form */}
                        <AnimatePresence>
                          {editingTaskId === t.id && editTaskForm && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className="px-4 pb-4 space-y-2 bg-orange-50/50 border-t border-orange-100">
                                <div className="pt-3">
                                  <input value={editTaskForm.title} onChange={e => setTF("title", e.target.value)}
                                    className={iCls} placeholder="Tytuł zadania" autoFocus />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">Termin</label>
                                    <input type="date" value={editTaskForm.dueDate} onChange={e => setTF("dueDate", e.target.value)} className={iCls} />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">Priorytet</label>
                                    <select value={editTaskForm.priority} onChange={e => setTF("priority", e.target.value)} className={iCls}>
                                      {TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingTaskId(null)} className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-white font-medium">Anuluj</button>
                                  <button onClick={saveTask} disabled={!editTaskForm.title.trim()}
                                    className="flex-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 disabled:opacity-40 flex items-center justify-center gap-1">
                                    <Save className="w-3 h-3" /> Zapisz
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ukończone */}
              {doneTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ukończone ({doneTasks.length})</span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 opacity-70">
                    {doneTasks.map(t => (
                      <div key={t.id} className="px-4 py-3 flex items-center gap-3">
                        <button
                          onClick={() => toggleTaskDone(t)}
                          className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 hover:bg-slate-300 transition-colors"
                          title="Oznacz jako nieukończone"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-400 line-through">{t.title}</div>
                          <div className="text-xs text-slate-300">{t.assignee} · {t.dueDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ CHECKLISTY ══ */}
          {activeTab === "checklists" && (
            <div className="space-y-3">
              {/* Nowa checklista */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddCL(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-xs font-bold hover:shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Nowa checklista
                </button>
              </div>

              <AnimatePresence>
                {showAddCL && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
                      <div>
                        <label className={lCls}>Nazwa checklisty *</label>
                        <input
                          autoFocus
                          value={newCL.title}
                          onChange={e => setNewCL(c => ({ ...c, title: e.target.value }))}
                          placeholder="np. Odbiór szafy sterowniczej"
                          className={iCls}
                        />
                      </div>
                      <div>
                        <label className={lCls}>Pozycje</label>
                        <div className="space-y-1.5">
                          {newCL.items.map((item, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <span className="text-xs text-slate-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
                              <input
                                value={item}
                                onChange={e => setCLItem(i, e.target.value)}
                                placeholder={`Pozycja ${i + 1}…`}
                                className={iCls}
                              />
                              {newCL.items.length > 1 && (
                                <button onClick={() => removeCLItem(i)} className="p-1 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={addCLItem}
                          className="mt-2 flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Dodaj pozycję
                        </button>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => { setShowAddCL(false); setNewCL({ title: "", items: [""] }); }}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">Anuluj</button>
                        <button onClick={submitChecklist} disabled={!newCL.title.trim()}
                          className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-40">
                          Utwórz checklistę
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lista checklist */}
              {projectChecklists.length === 0 && !showAddCL ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 text-sm">
                  <List className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Brak checklist dla tego projektu
                </div>
              ) : projectChecklists.map(cl => {
                const done = cl.items.filter(i => i.done).length;
                const pct  = cl.items.length > 0 ? Math.round((done / cl.items.length) * 100) : 0;
                return (
                  <div key={cl.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-slate-900 text-sm">{cl.title || cl.name}</div>
                      <span className="text-xs text-slate-500">{done}/{cl.items.length}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="space-y-1.5">
                      {cl.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => onToggleChecklistItem?.(cl.id, item.id)}
                          className="w-full flex items-center gap-2 text-sm group"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            item.done ? "bg-green-500 border-green-500" : "border-slate-300 group-hover:border-green-400"
                          }`}>
                            {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-left ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>{item.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ DOKUMENTACJA ══ */}
          {activeTab === "dokumentacja" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setShowAddDoc(!showAddDoc)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4" /> Dodaj dokument
                </button>
              </div>
              <AnimatePresence>
                {showAddDoc && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-xl border border-orange-200 p-4 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className={lCls}>Nazwa pliku / dokumentu *</label>
                        <input value={newDoc.name} onChange={e => setNewDoc(d => ({ ...d, name: e.target.value }))}
                          placeholder="np. Schemat szafy v2.pdf" className={iCls} />
                      </div>
                      <div>
                        <label className={lCls}>Typ</label>
                        <select value={newDoc.type} onChange={e => setNewDoc(d => ({ ...d, type: e.target.value }))} className={iCls}>
                          {["pdf","xlsx","dwg","docx","image","link","inne"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lCls}>URL / link</label>
                        <input value={newDoc.url} onChange={e => setNewDoc(d => ({ ...d, url: e.target.value }))}
                          placeholder="https://..." className={iCls} />
                      </div>
                      <div className="col-span-2">
                        <label className={lCls}>Opis</label>
                        <input value={newDoc.description} onChange={e => setNewDoc(d => ({ ...d, description: e.target.value }))}
                          placeholder="Krótki opis dokumentu..." className={iCls} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddDoc(false)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Anuluj</button>
                      <button
                        onClick={() => {
                          if (!newDoc.name.trim()) return;
                          onAddProjectDoc({ ...newDoc, id: `pd-${Date.now()}`, projectId: project.id, date: TODAY, clientVisible: false });
                          setNewDoc({ name: "", type: "pdf", description: "", url: "" });
                          setShowAddDoc(false);
                        }}
                        className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600"
                      >Dodaj</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {projectDocList.length === 0 && !showAddDoc ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" /> Brak dokumentów dla tego projektu
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
                        {doc.clientVisible
                          ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Eye className="w-3 h-3" /> Widoczny dla klienta</span>
                          : <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1"><EyeOff className="w-3 h-3" /> Tylko dla mnie</span>
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {doc.url && doc.url !== "#" && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => onToggleDocClientVisible(doc.id)}
                        className={`p-1.5 rounded-lg transition-colors ${doc.clientVisible ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-slate-400 hover:text-orange-500 hover:bg-orange-50"}`}>
                        {doc.clientVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => onDeleteProjectDoc(doc.id)} className="p-1.5 text-slate-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ══ NOTATKI ══ */}
          {activeTab === "notes" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-orange-500" /> Notatki
                </h3>
                <button
                  onClick={() => { if (editingNote) onUpdateProject({ ...project, notes: note }); setEditingNote(!editingNote); }}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                >
                  {editingNote ? <><CheckCircle2 className="w-3 h-3" /> Zapisz</> : <><Edit3 className="w-3 h-3" /> Edytuj</>}
                </button>
              </div>
              {editingNote ? (
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  className="w-full h-40 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 resize-none outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  placeholder="Dodaj notatki do projektu..." />
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

export default function Projekty({ projects, tasks, checklists, clients, onUpdateProject, onAddTask, onUpdateTask, onAddChecklist, onToggleChecklistItem, selectedProject, setSelectedProject, projectDocs, onAddProjectDoc, onDeleteProjectDoc, onToggleDocClientVisible, onOpenAddProject }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const client = (clients ?? []).find(c => c.id === p.clientId);
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (client?.name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchPackage = packageFilter === "all" || p.package === packageFilter;
      return matchSearch && matchStatus && matchPackage;
    });
  }, [projects, clients, search, statusFilter, packageFilter]);

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
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onAddChecklist={onAddChecklist}
        onToggleChecklistItem={onToggleChecklistItem}
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
          onClick={() => onOpenAddProject?.()}
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

    </div>
  );
}
