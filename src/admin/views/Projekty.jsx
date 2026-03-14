import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Search, FolderKanban, User, Calendar,
  MapPin, Tag, CheckCircle2, Clock, AlertTriangle, ChevronRight,
  Edit3, Trash2, X, StickyNote, FileText, Eye, EyeOff, ExternalLink,
  DollarSign, Save, List, Key, Layers, Receipt, Download, Upload,
  ChevronUp, ChevronDown, RefreshCw,
} from "lucide-react";
import { isOverdue, TODAY } from "../mockData";
import { uploadFile, getProjectFiles } from "../api/gasApi";
import WycenaEditor from "./WycenaEditor";
import DwgViewer from "../../components/investment/DwgViewer";
import { GAS_CONFIG } from "../api/gasConfig";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

// rozszerzenie → typ dokumentu
const EXT_TYPE = {
  pdf: "pdf", xlsx: "xlsx", xls: "xlsx",
  dwg: "dwg", dxf: "dwg",
  docx: "docx", doc: "docx",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image",
};

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

const TASK_PRIORITIES = ["Niski", "Normalny", "Wysoki", "Krytyczny"];

const FINANCE_STAGES = [
  { key: "projekt",       label: "Projekt",       profitKey: "profitProjekt",       paidKey: "paidProjekt" },
  { key: "prefabrykacja", label: "Prefabrykacja",  profitKey: "profitPrefabrykacja", paidKey: "paidPrefabrykacja" },
  { key: "uruchomienie",  label: "Uruchomienie",   profitKey: "profitUruchomienie",  paidKey: "paidUruchomienie" },
];
const fmtPLN = (v) => (v || 0).toLocaleString("pl-PL") + " PLN";

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

function ProjectCard({ project, client, onClick, onDelete }) {
  const overdue = isOverdue(project.deadline, project.status);
  const [delConfirm, setDelConfirm] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all p-5"
    >
      {/* Delete confirm overlay */}
      <AnimatePresence>
        {delConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center gap-3 p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900 text-sm">Usunąć projekt?</p>
              <p className="text-xs text-slate-400 mt-1">Zostaną usunięte też zadania i dokumenty</p>
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={() => setDelConfirm(false)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                Anuluj
              </button>
              <button onClick={() => onDelete?.(project.id)}
                className="flex-1 px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">
                Usuń
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trash button (hover) */}
      {!delConfirm && (
        <button
          onClick={(e) => { e.stopPropagation(); setDelConfirm(true); }}
          className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
          title="Usuń projekt"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-start justify-between gap-2 mb-3 cursor-pointer" onClick={() => onClick(project)}>
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

      <div className="flex items-center gap-2 mb-3 flex-wrap cursor-pointer" onClick={() => onClick(project)}>
        <PackageBadge pkg={project.package} />
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {project.stages[project.stageIndex]}
        </span>
      </div>

      <div className="mb-3 cursor-pointer" onClick={() => onClick(project)}>
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

      <div className="flex items-center text-xs cursor-pointer" onClick={() => onClick(project)}>
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
  onBack, onUpdateProject, onDeleteProject, onAddTask, onUpdateTask, onDeleteTask,
  onAddProjectDoc, onDeleteProjectDoc, onToggleDocClientVisible,
  onAddChecklist, onToggleChecklistItem, onNavigateToZakupy,
}) {
  const [activeTab,     setActiveTab]     = useState("tasks");
  const [editingNote,   setEditingNote]   = useState(false);
  const [note,          setNote]          = useState(project.notes);
  const [showAddDoc,    setShowAddDoc]    = useState(false);
  const [newDoc,        setNewDoc]        = useState({ name: "", type: "pdf", description: "" });
  const [docFile,       setDocFile]       = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const [uploadError,   setUploadError]   = useState(null);
  const [showAddTask,   setShowAddTask]   = useState(false);
  const [newTask,       setNewTask]       = useState({ title: "", dueDate: TODAY, priority: "Normalny" });
  const [delConfirmProject, setDelConfirmProject] = useState(false);
  const [showWycena,        setShowWycena]        = useState(false);
  const [driveFiles,        setDriveFiles]        = useState([]);
  const [driveFilesLoading, setDriveFilesLoading] = useState(GAS_ON);

  const loadDriveFiles = useCallback(() => {
    if (!GAS_ON) return;
    setDriveFilesLoading(true);
    getProjectFiles(project.id, project.code)
      .then(files => setDriveFiles(Array.isArray(files) ? files : []))
      .catch(() => {})
      .finally(() => setDriveFilesLoading(false));
  }, [project.id, project.code]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadDriveFiles(); }, [project.id, project.code]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Edit project ──
  const [editingProject, setEditingProject] = useState(false);
  const [editForm,       setEditForm]       = useState({ ...project });
  useEffect(() => { if (!editingProject) setEditForm({ ...project }); }, [project]); // eslint-disable-line
  const setEF = (k, v) => setEditForm(f => ({ ...f, [k]: v }));
  const handleSaveProject = () => {
    const newStages = (editForm.stages || project.stages).filter(s => s.trim());
    const oldSched  = project.stageSchedule || [];
    const newSched  = newStages.map(name => {
      const existing = oldSched.find(s => s.name === name);
      return existing || { name, start: editForm.startDate || project.startDate || TODAY, end: editForm.deadline || project.deadline || TODAY };
    });
    onUpdateProject({
      ...editForm,
      stages:    newStages,
      stageIndex: Math.min(editForm.stageIndex ?? 0, newStages.length - 1),
      stageSchedule: newSched,
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

  // ── Finance state ──
  const [editingPaid,    setEditingPaid]    = useState(false);
  const [paidForm,       setPaidForm]       = useState({
    paidProjekt:       project.paidProjekt       ?? 0,
    paidPrefabrykacja: project.paidPrefabrykacja ?? 0,
    paidUruchomienie:  project.paidUruchomienie  ?? 0,
  });
  useEffect(() => {
    if (!editingPaid) setPaidForm({
      paidProjekt:       project.paidProjekt       ?? 0,
      paidPrefabrykacja: project.paidPrefabrykacja ?? 0,
      paidUruchomienie:  project.paidUruchomienie  ?? 0,
    });
  }, [project]); // eslint-disable-line
  const handleSavePaid = () => {
    onUpdateProject({
      ...project,
      paidProjekt:       parseFloat(paidForm.paidProjekt)       || 0,
      paidPrefabrykacja: parseFloat(paidForm.paidPrefabrykacja) || 0,
      paidUruchomienie:  parseFloat(paidForm.paidUruchomienie)  || 0,
    });
    setEditingPaid(false);
  };
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [newInvoice,     setNewInvoice]     = useState({ name: "", amount: "", stageKey: "projekt", date: TODAY, file: null });
  const submitInvoice = () => {
    if (!newInvoice.name.trim() || !newInvoice.amount) return;
    const doSave = (fileData, fileName, fileType) => {
      const inv = {
        id:       `inv-${Date.now()}`,
        name:     newInvoice.name.trim(),
        amount:   parseFloat(newInvoice.amount) || 0,
        stageKey: newInvoice.stageKey,
        date:     newInvoice.date,
        fileData: fileData || null,
        fileName: fileName || null,
        fileType: fileType || null,
      };
      onUpdateProject({ ...project, invoices: [...(project.invoices || []), inv] });
      setNewInvoice({ name: "", amount: "", stageKey: "projekt", date: TODAY, file: null });
      setShowAddInvoice(false);
    };
    if (newInvoice.file) {
      const reader = new FileReader();
      reader.onload = (e) => doSave(e.target.result, newInvoice.file.name, newInvoice.file.type);
      reader.readAsDataURL(newInvoice.file);
    } else {
      doSave(null, null, null);
    }
  };
  const deleteInvoice = (invId) =>
    onUpdateProject({ ...project, invoices: (project.invoices || []).filter(i => i.id !== invId) });
  const invoiceList    = project.invoices || [];

  // ── Schedule (Harmonogram) state ──
  const buildScheduleForm = () =>
    project.stageSchedule?.length
      ? project.stageSchedule.map(s => ({ ...s }))
      : project.stages.map(s => ({ name: s, start: project.startDate || TODAY, end: project.deadline || TODAY }));
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleForm,    setScheduleForm]    = useState(buildScheduleForm);
  const [milestoneForm,   setMilestoneForm]   = useState(() => project.milestones ?? []);
  useEffect(() => { if (!editingSchedule) { setScheduleForm(buildScheduleForm()); setMilestoneForm(project.milestones ?? []); } }, [project]); // eslint-disable-line
  const setStageDate = (i, key, val) =>
    setScheduleForm(f => f.map((s, j) => j === i ? { ...s, [key]: val } : s));
  const addMilestone = () =>
    setMilestoneForm(f => [...f, { id: `ms-${Date.now()}`, label: "", date: TODAY }]);
  const setMilestone = (id, key, val) =>
    setMilestoneForm(f => f.map(m => m.id === id ? { ...m, [key]: val } : m));
  const removeMilestone = (id) =>
    setMilestoneForm(f => f.filter(m => m.id !== id));
  const saveSchedule = () => {
    onUpdateProject({ ...project, stageSchedule: scheduleForm, milestones: milestoneForm.filter(m => m.label && m.date) });
    setEditingSchedule(false);
  };

  // ── Gantt helpers ──
  const gantt = useMemo(() => {
    if (!scheduleForm.length) return null;
    const minMs = Math.min(...scheduleForm.map(s => +new Date(s.start)));
    const maxMs = Math.max(...scheduleForm.map(s => +new Date(s.end)));
    const totalMs = maxMs - minMs;
    if (totalMs <= 0) return null;
    const pct = (ms) => ((ms - minMs) / totalMs) * 100;
    // month labels
    const months = [];
    let d = new Date(minMs);
    d.setDate(1);
    while (d <= new Date(maxMs)) {
      const next   = new Date(d); next.setMonth(next.getMonth() + 1);
      const mStart = Math.max(+new Date(d), minMs);
      const mEnd   = Math.min(+next, maxMs);
      months.push({ label: d.toLocaleDateString("pl-PL", { month: "short", year: "2-digit" }), left: pct(mStart), width: pct(mEnd) - pct(mStart) });
      d = next;
    }
    const bars = scheduleForm.map((s, i) => ({
      left:  Math.max(0, pct(+new Date(s.start))),
      width: Math.max(1, pct(+new Date(s.end)) - pct(+new Date(s.start))),
      days:  Math.round((+new Date(s.end) - +new Date(s.start)) / 86400000),
      done:    i < project.stageIndex,
      current: i === project.stageIndex,
    }));
    // Auto-milestones: start date of each stage (orange)
    const autoMilestones = scheduleForm
      .map((s, i) => ({ id: `auto-${i}`, label: s.name, date: s.start, auto: true }))
      .map(m => ({ ...m, pct: pct(+new Date(m.date)) }))
      .filter(m => m.pct >= 0 && m.pct <= 100);
    // Manual milestones from project.milestones (blue)
    const manualMilestones = (project.milestones ?? [])
      .filter(m => m.label && m.date)
      .map(m => ({ ...m, pct: pct(+new Date(m.date)) }))
      .filter(m => m.pct >= 0 && m.pct <= 100);
    const milestones = [...autoMilestones, ...manualMilestones];
    return { months, bars, milestones };
  }, [scheduleForm, project.stageIndex]); // eslint-disable-line
  const totalExpected  = FINANCE_STAGES.reduce((s, st) => s + (project[st.profitKey] || 0), 0);
  const totalPaid      = FINANCE_STAGES.reduce((s, st) => s + (project[st.paidKey]   || 0), 0);
  const totalRemaining = Math.max(0, totalExpected - totalPaid);
  const paidPct        = totalExpected > 0 ? Math.min(100, Math.round((totalPaid / totalExpected) * 100)) : 0;

  const projectTasks      = tasks.filter(t => t.projectId === project.id);
  const projectChecklists = checklists.filter(c => c.projectId === project.id);
  const projectDocList    = (projectDocs ?? []).filter(d => d.projectId === project.id);
  const sheetDocUrls      = new Set(projectDocList.map(d => d.url).filter(Boolean));
  const SYSTEM_FILES      = new Set(["projekt.svg", "projekt.json"]);
  const driveOnlyFiles    = driveFiles.filter(f =>
    !SYSTEM_FILES.has(f.name.toLowerCase()) &&
    !sheetDocUrls.has(f.webViewLink) &&
    !sheetDocUrls.has(f.webContentLink)
  );
  const tasksDone         = projectTasks.filter(t => t.status === "Zrobione").length;

  const tabs = [
    { id: "tasks",        label: `Zadania (${projectTasks.length})` },
    { id: "checklists",   label: `Checklisty (${projectChecklists.length})` },
    { id: "dokumentacja", label: `Dokumentacja (${projectDocList.length + driveOnlyFiles.length})` },
    { id: "finanse",      label: "Finanse" },
    { id: "harmonogram",  label: "Harmonogram" },
    { id: "notes",        label: "Notatki" },
    { id: "rzut",         label: "Rzut DWG" },
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
            {!editingProject && (
              <button
                onClick={() => setDelConfirmProject(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  delConfirmProject
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {delConfirmProject ? "Anuluj" : "Usuń"}
              </button>
            )}
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

        {/* Delete confirmation banner */}
        <AnimatePresence>
          {delConfirmProject && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 flex-1">
                  Usunąć projekt <strong>{project.name}</strong>? Zostaną usunięte też zadania, checklisty i dokumenty. Operacji nie można cofnąć.
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setDelConfirmProject(false)}
                    className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-white transition-colors font-medium">
                    Anuluj
                  </button>
                  <button onClick={() => { onDeleteProject?.(project.id); onBack(); }}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">
                    Usuń projekt
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

                {/* Row 5: stages */}
                <div>
                  <label className={lCls + " flex items-center gap-1 mb-2"}><Layers className="w-3 h-3" /> Etapy projektu</label>
                  <StagesEditor
                    stages={editForm.stages || project.stages}
                    onChange={v => setEF("stages", v)}
                  />
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

          {/* ══ HARMONOGRAM (scalony z Przeglądem) ══ */}
          {activeTab === "harmonogram" && (
            <div className="space-y-4">

              {/* ── Etapy + Gantt ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Harmonogram etapów</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{project.startDate} → {project.deadline}</p>
                  </div>
                  <button
                    onClick={() => { setEditingSchedule(v => !v); if (editingSchedule) setScheduleForm(buildScheduleForm()); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      editingSchedule
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {editingSchedule ? "Anuluj" : "Edytuj daty"}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <div style={{ minWidth: "480px" }}>
                    {/* Nagłówek miesięcy (offset = szerokość kolumny etapów) */}
                    {gantt && (
                      <div className="flex mb-1.5 pl-44">
                        {gantt.months.map((m, mi) => (
                          <div key={mi} style={{ width: `${m.width}%` }}
                            className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-1 border-l border-slate-100 first:border-l-0 truncate">
                            {m.label}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Wiersze: kafelek etapu + pasek Gantta — ta sama wysokość h-7 */}
                    {(() => {
                      const minMs    = gantt ? Math.min(...scheduleForm.map(s => +new Date(s.start))) : 0;
                      const maxMs    = gantt ? Math.max(...scheduleForm.map(s => +new Date(s.end))) : 0;
                      const todayPct = gantt && maxMs > minMs
                        ? ((+new Date(TODAY) - minMs) / (maxMs - minMs)) * 100
                        : -1;
                      return project.stages.map((stage, idx) => {
                        const done    = idx < project.stageIndex;
                        const current = idx === project.stageIndex;
                        const bar     = gantt?.bars[idx];
                        return (
                          <div key={idx} className="flex items-center mb-1.5">
                            {/* Kafelek etapu – kliknięcie ustawia bieżący, wysokość h-7 jak pasek */}
                            <button
                              onClick={() => onUpdateProject({ ...project, stageIndex: idx })}
                              className={`w-44 flex-shrink-0 h-7 flex items-center gap-1.5 px-1.5 rounded-md transition-all text-left group ${
                                current ? "bg-orange-50 border border-orange-200" : "hover:bg-slate-50 border border-transparent"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-colors ${
                                done ? "bg-green-500 text-white" : current ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                              }`}>{done ? "✓" : idx + 1}</div>
                              <span className={`text-xs font-medium truncate flex-1 ${
                                done ? "text-slate-400 line-through" : current ? "text-slate-900 font-semibold" : "text-slate-500"
                              }`}>{stage}</span>
                              {current && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />}
                            </button>

                            {/* Pasek Gantta – wysokość h-7 */}
                            {gantt && bar ? (
                              <div className="flex-1 relative h-7 bg-slate-50 rounded-lg overflow-hidden">
                                {gantt.months.map((m, mi) => mi > 0 && (
                                  <div key={mi} style={{ left: `${m.left}%` }}
                                    className="absolute top-0 bottom-0 border-l border-slate-200/70" />
                                ))}
                                {todayPct > 0 && todayPct < 100 && (
                                  <div style={{ left: `${todayPct}%` }}
                                    className="absolute top-0 bottom-0 border-l-2 border-orange-400/70 z-10 pointer-events-none" />
                                )}
                                <div
                                  style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                                  className={`absolute top-1 bottom-1 rounded flex items-center justify-center text-[10px] font-semibold ${
                                    bar.done    ? "bg-green-200 text-green-800 border border-green-300"
                                    : bar.current ? "bg-orange-200 text-orange-900 border border-orange-300 shadow-sm"
                                    : "bg-slate-200 text-slate-600 border border-slate-300"
                                  }`}
                                >
                                  {bar.width > 10 ? `${bar.days}d` : ""}
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 h-7 bg-slate-50/50 rounded-lg border border-dashed border-slate-200" />
                            )}
                          </div>
                        );
                      });
                    })()}

                    {/* Legenda */}
                    {gantt ? (
                      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-100 pl-44">
                        {[
                          { cls: "bg-green-200 border-green-300", label: "Ukończony" },
                          { cls: "bg-orange-200 border-orange-300", label: "Bieżący" },
                          { cls: "bg-slate-200 border-slate-300", label: "Zaplanowany" },
                        ].map(({ cls, label, isDot }) => (
                          <div key={label} className="flex items-center gap-1">
                            {isDot
                              ? <div className={`w-2 h-2 rounded-full ${cls}`} />
                              : <div className={`w-3 h-3 rounded border ${cls}`} />
                            }
                            <span className="text-[10px] text-slate-400">{label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-2 pl-1">
                        Kliknij <strong className="text-orange-600">Edytuj daty</strong> aby dodać daty etapów i zobaczyć wykres.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Edycja dat (rozwijana) ── */}
              <AnimatePresence>
                {editingSchedule && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-5">
                      <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500" /> Edycja dat etapów
                      </h3>
                      <div className="space-y-2 mb-5">
                        <div className="grid grid-cols-[1fr_140px_140px] gap-3 px-1 mb-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Etap</span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Rozpoczęcie</span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Zakończenie</span>
                        </div>
                        {scheduleForm.map((stage, i) => {
                          const isDone    = i < project.stageIndex;
                          const isCurrent = i === project.stageIndex;
                          const durDays   = Math.round((+new Date(stage.end) - +new Date(stage.start)) / 86400000);
                          return (
                            <div key={i} className={`grid grid-cols-[1fr_140px_140px] items-center gap-3 p-2 rounded-xl ${
                              isCurrent ? "bg-orange-50" : isDone ? "bg-green-50/50" : "hover:bg-slate-50"
                            }`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                                  isDone ? "bg-green-100 text-green-700" : isCurrent ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"
                                }`}>{isDone ? "✓" : i + 1}</span>
                                <span className="text-sm font-medium text-slate-700 truncate">{stage.name}</span>
                                {durDays > 0 && <span className="text-[10px] text-slate-400 ml-auto flex-shrink-0">{durDays}d</span>}
                              </div>
                              <input type="date" value={stage.start} onChange={e => setStageDate(i, "start", e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all" />
                              <input type="date" value={stage.end} onChange={e => setStageDate(i, "end", e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all" />
                            </div>
                          );
                        })}
                      </div>
                      {/* Kamienie milowe */}
                      <div className="pt-4 mt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            Kamienie milowe
                          </span>
                          <button onClick={addMilestone}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                            <Plus className="w-3 h-3" /> Dodaj
                          </button>
                        </div>
                        {milestoneForm.length === 0 && (
                          <p className="text-[11px] text-slate-400 italic">Brak kamieni milowych — kliknij Dodaj</p>
                        )}
                        <div className="space-y-1.5">
                          {milestoneForm.map(ms => (
                            <div key={ms.id} className="flex items-center gap-2">
                              <input
                                value={ms.label}
                                onChange={e => setMilestone(ms.id, "label", e.target.value)}
                                placeholder="Nazwa kamienia…"
                                className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                              />
                              <input
                                type="date" value={ms.date}
                                onChange={e => setMilestone(ms.id, "date", e.target.value)}
                                className="w-36 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                              />
                              <button onClick={() => removeMilestone(ms.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-slate-100">
                        <button onClick={() => { setEditingSchedule(false); setScheduleForm(buildScheduleForm()); setMilestoneForm(project.milestones ?? []); }}
                          className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                          Anuluj
                        </button>
                        <button onClick={saveSchedule}
                          className="flex-1 px-3 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-md transition-all flex items-center justify-center gap-1.5">
                          <Save className="w-3.5 h-3.5" /> Zapisz harmonogram
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Statystyki ── */}
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
                                  {onDeleteTask && (
                                    <button
                                      onClick={() => { onDeleteTask(t.id); setEditingTaskId(null); }}
                                      className="px-3 py-1.5 border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                      title="Usuń zadanie"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
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
              <div className="flex justify-end gap-2">
                <button onClick={loadDriveFiles} disabled={driveFilesLoading}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
                  title="Odśwież pliki z Drive">
                  <RefreshCw className={`w-4 h-4 ${driveFilesLoading ? "animate-spin" : ""}`} />
                </button>
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
                    {/* File picker */}
                    {!docFile ? (
                      <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-slate-200 rounded-xl px-4 py-4 hover:border-orange-300 hover:bg-orange-50/40 transition-all">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Upload className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-700">Kliknij aby wybrać plik</div>
                          <div className="text-xs text-slate-400 mt-0.5">PDF, DWG, XLSX, DOCX, obraz…</div>
                        </div>
                        <input type="file" className="hidden" onChange={e => {
                          const f = e.target.files[0];
                          if (!f) return;
                          setDocFile(f);
                          setUploadError(null);
                          const ext = f.name.split(".").pop().toLowerCase();
                          setNewDoc(d => ({ ...d, name: f.name, type: EXT_TYPE[ext] || "inne" }));
                        }} />
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50">
                        <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{docFile.name}</div>
                          <div className="text-xs text-slate-400">{(docFile.size / 1024).toFixed(0)} KB</div>
                        </div>
                        <button type="button" onClick={() => { setDocFile(null); setUploadError(null); }}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className={lCls}>Nazwa wyświetlana</label>
                        <input value={newDoc.name} onChange={e => setNewDoc(d => ({ ...d, name: e.target.value }))}
                          placeholder="np. Schemat szafy v2" className={iCls} />
                      </div>
                      <div>
                        <label className={lCls}>Typ</label>
                        <select value={newDoc.type} onChange={e => setNewDoc(d => ({ ...d, type: e.target.value }))} className={iCls}>
                          {["pdf","xlsx","dwg","docx","image","inne"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lCls}>Opis</label>
                        <input value={newDoc.description} onChange={e => setNewDoc(d => ({ ...d, description: e.target.value }))}
                          placeholder="Krótki opis…" className={iCls} />
                      </div>
                    </div>

                    {uploadError && (
                      <p className="text-xs text-red-500 font-medium">{uploadError}</p>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => { setShowAddDoc(false); setDocFile(null); setUploadError(null); }}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                        Anuluj
                      </button>
                      <button
                        disabled={!docFile || uploading}
                        onClick={async () => {
                          if (!docFile) return;
                          setUploading(true);
                          setUploadError(null);
                          try {
                            const uploaded = await uploadFile(docFile, project.id, project.code);
                            onAddProjectDoc({
                              id: `pd-${Date.now()}`, projectId: project.id,
                              name: newDoc.name || docFile.name,
                              type: newDoc.type, description: newDoc.description,
                              url: uploaded.url, driveId: uploaded.driveId,
                              date: TODAY, clientVisible: false,
                            });
                            setNewDoc({ name: "", type: "pdf", description: "" });
                            setDocFile(null);
                            setShowAddDoc(false);
                          } catch(err) {
                            setUploadError("Błąd przesyłania: " + err.message);
                          } finally {
                            setUploading(false);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {uploading
                          ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Przesyłanie…</>
                          : "Dodaj dokument"
                        }
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {projectDocList.length === 0 && driveOnlyFiles.length === 0 && !showAddDoc ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" /> Brak dokumentów dla tego projektu
                </div>
              ) : (
                <>
                  {projectDocList.map(doc => (
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
                  ))}

                  {driveOnlyFiles.length > 0 && (
                    <>
                      {projectDocList.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="flex-1 border-t border-slate-200" />
                          <span className="text-xs text-slate-400 font-medium">Pliki na dysku (niezarejestrowane)</span>
                          <div className="flex-1 border-t border-slate-200" />
                        </div>
                      )}
                      {driveOnlyFiles.map(f => {
                        const ext = f.name.split('.').pop()?.toLowerCase() ?? "";
                        const promoteDoc = (clientVisible) => {
                          onAddProjectDoc({
                            id: `doc-${Date.now()}-${f.id}`,
                            projectId: project.id,
                            name: f.name,
                            type: EXT_TYPE[ext] ?? "pdf",
                            description: "",
                            url: f.webViewLink,
                            driveId: f.id,
                            date: TODAY,
                            clientVisible,
                          });
                        };
                        return (
                          <div key={f.id} className="bg-blue-50/40 rounded-xl border border-blue-200/60 p-4 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 text-sm truncate">{f.name}</div>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {f.modifiedTime && (
                                  <span className="text-xs text-slate-400">{f.modifiedTime.substring(0, 10)}</span>
                                )}
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Widoczny dla klienta
                                </span>
                                <span className="text-xs text-slate-400">Dysk Google</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => promoteDoc(false)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Ukryj przed klientem">
                                <EyeOff className="w-4 h-4" />
                              </button>
                              <a href={f.webViewLink} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              {f.webContentLink && (
                                <a href={f.webContentLink} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors" title="Pobierz">
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
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

          {/* ══ RZUT DWG ══ */}
          {activeTab === "rzut" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="mb-3">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-500" /> Rzut projektu automatyki
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Umieść <code className="bg-slate-100 px-1 rounded">projekt.svg</code> i{" "}
                  <code className="bg-slate-100 px-1 rounded">projekt.json</code> w folderze projektu na Drive
                </p>
              </div>
              <DwgViewer projectCode={project.code} />
            </div>
          )}

          {/* ══ FINANSE ══ */}
          {activeTab === "finanse" && (
            <div className="space-y-4">

              {/* Wycena klienta */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-orange-500" /> Wycena dla klienta
                  </h3>
                  <button
                    onClick={() => setShowWycena(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Edytuj wycenę
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Wycena widoczna dla klienta w panelu po zatwierdzeniu. Kliknij „Edytuj wycenę" aby dodać lub zmienić pozycje.
                </p>
              </div>

              {/* Lista zakupów */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <List className="w-4 h-4 text-green-600" /> Lista zakupów
                  </h3>
                  <button
                    onClick={() => onNavigateToZakupy?.(project)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                  >
                    <List className="w-3.5 h-3.5" /> Edytuj zakupy
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Materiały i urządzenia do zamówienia. Klient widzi status każdej pozycji (Oczekuje / Zamówione / Dostarczone).
                </p>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-500" /> Podsumowanie finansowe
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Budżet łącznie</div>
                    <div className="text-lg font-bold text-slate-900">{fmtPLN(totalExpected)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Wpłacono</div>
                    <div className="text-lg font-bold text-green-600">{fmtPLN(totalPaid)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Pozostało</div>
                    <div className={`text-lg font-bold ${totalRemaining > 0 ? "text-orange-600" : "text-green-600"}`}>
                      {fmtPLN(totalRemaining)}
                    </div>
                  </div>
                </div>
                {totalExpected > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Całkowite wpłaty</span>
                      <span>{paidPct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Stage cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FINANCE_STAGES.map(st => {
                  const budget    = project[st.profitKey] || 0;
                  const paid      = project[st.paidKey]   || 0;
                  const remaining = Math.max(0, budget - paid);
                  const pct       = budget > 0 ? Math.min(100, Math.round((paid / budget) * 100)) : 0;
                  return (
                    <div key={st.key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                      <div className="font-semibold text-slate-800 text-sm mb-3">{st.label}</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400 text-xs">Budżet</span>
                          <span className="font-medium text-slate-700">{fmtPLN(budget)}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-slate-400 text-xs">Wpłacono</span>
                          {editingPaid ? (
                            <div className="relative w-32">
                              <input
                                type="number" min="0" step="100"
                                value={paidForm[st.paidKey]}
                                onChange={e => setPaidForm(f => ({ ...f, [st.paidKey]: e.target.value }))}
                                className="w-full border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 pr-8"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">PLN</span>
                            </div>
                          ) : (
                            <span className="font-semibold text-green-600 text-sm">{fmtPLN(paid)}</span>
                          )}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400 text-xs">Pozostało</span>
                          <span className={`font-medium text-xs ${remaining > 0 ? "text-orange-600" : "text-green-600"}`}>
                            {fmtPLN(remaining)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 text-right">{pct}% wpłacono</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Edit paid amounts button */}
              <div className="flex justify-end gap-2">
                {editingPaid ? (
                  <>
                    <button onClick={() => setEditingPaid(false)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 font-medium">
                      Anuluj
                    </button>
                    <button onClick={handleSavePaid}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-all">
                      <Save className="w-3 h-3" /> Zapisz wpłaty
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditingPaid(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" /> Edytuj wpłaty
                  </button>
                )}
              </div>

              {/* Invoices */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-orange-500" /> Faktury ({invoiceList.length})
                  </h3>
                  <button
                    onClick={() => setShowAddInvoice(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-xs font-bold hover:shadow-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Dodaj fakturę
                  </button>
                </div>

                <AnimatePresence>
                  {showAddInvoice && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="p-4 bg-orange-50/50 border-b border-orange-100 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className={lCls}>Numer / nazwa faktury *</label>
                            <input
                              autoFocus
                              value={newInvoice.name}
                              onChange={e => setNewInvoice(f => ({ ...f, name: e.target.value }))}
                              placeholder="np. FV 2026/03/001"
                              className={iCls}
                            />
                          </div>
                          <div>
                            <label className={lCls}>Kwota *</label>
                            <div className="relative">
                              <input
                                type="number" min="0" step="100"
                                value={newInvoice.amount}
                                onChange={e => setNewInvoice(f => ({ ...f, amount: e.target.value }))}
                                placeholder="0"
                                className={iCls + " pr-10"}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">PLN</span>
                            </div>
                          </div>
                          <div>
                            <label className={lCls}>Etap</label>
                            <select value={newInvoice.stageKey} onChange={e => setNewInvoice(f => ({ ...f, stageKey: e.target.value }))} className={iCls}>
                              <option value="projekt">Projekt</option>
                              <option value="prefabrykacja">Prefabrykacja</option>
                              <option value="uruchomienie">Uruchomienie</option>
                            </select>
                          </div>
                          <div>
                            <label className={lCls}>Data wystawienia</label>
                            <input type="date" value={newInvoice.date} onChange={e => setNewInvoice(f => ({ ...f, date: e.target.value }))} className={iCls} />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={lCls}>Plik faktury</label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
                              onChange={e => setNewInvoice(f => ({ ...f, file: e.target.files[0] || null }))}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                            />
                            {newInvoice.file && (
                              <p className="text-[11px] text-slate-400 mt-1 truncate">{newInvoice.file.name} ({(newInvoice.file.size / 1024).toFixed(0)} KB)</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowAddInvoice(false); setNewInvoice({ name: "", amount: "", stageKey: "projekt", date: TODAY, file: null }); }}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium"
                          >Anuluj</button>
                          <button
                            onClick={submitInvoice}
                            disabled={!newInvoice.name.trim() || !newInvoice.amount}
                            className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-40"
                          >Dodaj fakturę</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {invoiceList.length === 0 && !showAddInvoice ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Brak faktur dla tego projektu
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {invoiceList.map(inv => {
                      const stageLabel = inv.stageKey === "projekt" ? "Projekt" : inv.stageKey === "prefabrykacja" ? "Prefabrykacja" : "Uruchomienie";
                      return (
                        <div key={inv.id} className="px-5 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <Receipt className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 text-sm">{inv.name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                              <span>{inv.date}</span>
                              <span>·</span>
                              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{stageLabel}</span>
                              {inv.fileName && <span className="text-slate-300">· {inv.fileName}</span>}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-slate-800 flex-shrink-0">{fmtPLN(inv.amount)}</div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {inv.fileData && (
                              <a
                                href={inv.fileData}
                                download={inv.fileName || inv.name}
                                className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                                title={`Pobierz: ${inv.fileName || inv.name}`}
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => deleteInvoice(inv.id)}
                              className="p-1.5 text-slate-300 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {showWycena && (
        <WycenaEditor
          project={project}
          onClose={() => setShowWycena(false)}
        />
      )}

    </div>
  );
}

export default function Projekty({ projects, tasks, checklists, clients, onUpdateProject, onDeleteProject, onAddTask, onUpdateTask, onDeleteTask, onAddChecklist, onToggleChecklistItem, selectedProject, setSelectedProject, projectDocs, onAddProjectDoc, onDeleteProjectDoc, onToggleDocClientVisible, onOpenAddProject, onNavigateToZakupy }) {
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
        onDeleteProject={onDeleteProject}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onAddChecklist={onAddChecklist}
        onToggleChecklistItem={onToggleChecklistItem}
        onAddProjectDoc={onAddProjectDoc}
        onDeleteProjectDoc={onDeleteProjectDoc}
        onToggleDocClientVisible={onToggleDocClientVisible}
        onNavigateToZakupy={onNavigateToZakupy}
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
            <ProjectCard key={p.id} project={p} client={getClient(p.clientId)} onClick={setSelectedProject} onDelete={onDeleteProject} />
          ))}
        </div>
      )}

    </div>
  );
}
