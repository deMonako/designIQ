import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FolderKanban, CheckSquare, AlertTriangle, TrendingUp,
  Users, BarChart2, Download, FileText, Clock, Banknote,
  Calendar, Target, ArrowRight, CheckCircle2,
} from "lucide-react";
import { isOverdue, TODAY } from "../mockData";

// ── Exports ───────────────────────────────────────────────────────────────────
function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(";")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

function downloadPDF(projects, tasks, clients) {
  const doc = new jsPDF("p", "mm", "a4");
  const ORANGE = [234, 88, 12];
  doc.setFontSize(18); doc.setTextColor(30, 41, 59);
  doc.text("Raport designiQ", 14, 20);
  doc.setFontSize(9); doc.setTextColor(100, 116, 139);
  doc.text(`Wygenerowano: ${TODAY}`, 14, 28);
  doc.setFontSize(12); doc.setTextColor(30, 41, 59); doc.text("Projekty", 14, 38);
  autoTable(doc, {
    startY: 42,
    head: [["Projekt", "Status", "Pakiet", "Postęp", "Termin"]],
    body: projects.map(p => [p.name, p.status, p.package, `${p.progress}%`, p.deadline]),
    headStyles: { fillColor: ORANGE, fontSize: 8 }, styles: { fontSize: 8 },
  });
  const afterProj = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(12); doc.text("Zadania", 14, afterProj);
  autoTable(doc, {
    startY: afterProj + 4,
    head: [["Tytuł", "Status", "Priorytet", "Termin"]],
    body: tasks.filter(t => t.type === "task").map(t => [t.title, t.status, t.priority, t.dueDate]),
    headStyles: { fillColor: ORANGE, fontSize: 8 }, styles: { fontSize: 8 },
  });
  doc.save(`raport-designiq-${TODAY}.pdf`);
}

// ── Shared components ─────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, sub, children }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-orange-500" />
          </div>
        )}
        <div>
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, variant = "slate", alert }) {
  const variants = {
    orange: "bg-orange-50 text-orange-600",
    blue:   "bg-blue-50   text-blue-600",
    green:  "bg-green-50  text-green-600",
    red:    "bg-red-50    text-red-600",
    slate:  "bg-slate-100 text-slate-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 transition-shadow hover:shadow-md ${
      alert ? "border-red-200" : "border-slate-200"
    }`}>
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 ${variants[variant]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold text-slate-900 leading-none mb-1 tabular-nums">{value}</div>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function HBar({ label, value, max, color, count }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-slate-500 text-right flex-shrink-0 truncate">{label}</div>
      <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <div className="w-5 text-xs font-bold text-slate-700 flex-shrink-0 text-right">{count}</div>
    </div>
  );
}

// ── Project health card ───────────────────────────────────────────────────────
function ProjectHealthCard({ project, tasks }) {
  const projTasks  = tasks.filter(t => t.projectId === project.id && t.type === "task");
  const doneTasks  = projTasks.filter(t => t.status === "Zrobione").length;
  const lateTasks  = projTasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const days       = Math.ceil((new Date(project.deadline + "T00:00:00") - new Date(TODAY + "T00:00:00")) / 86_400_000);
  const isLate     = days < 0;
  const isUrgent   = !isLate && days <= 7;
  const isSoon     = !isLate && !isUrgent && days <= 30;

  const deadlineColor = isLate ? "text-red-600" : isUrgent ? "text-orange-600" : isSoon ? "text-amber-600" : "text-slate-400";
  const deadlineText  = isLate ? `${Math.abs(days)} dni po terminie` : days === 0 ? "Termin dziś!" : `${days} dni do terminu`;

  const statusStyle = {
    "Wstępny":   "bg-slate-100 text-slate-600",
    "W trakcie": "bg-blue-50 text-blue-700",
    "Wstrzymany":"bg-amber-50 text-amber-700",
    "Ukończony": "bg-green-50 text-green-700",
  };

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
      isLate ? "border-red-200" : isUrgent ? "border-orange-200" : "border-slate-200"
    }`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">{project.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{project.package}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle[project.status] ?? statusStyle["Wstępny"]}`}>
          {project.status}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Postęp</span>
          <span className="font-bold text-slate-700">{project.progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className={`h-full rounded-full ${isLate ? "bg-red-400" : "bg-gradient-to-r from-orange-500 to-orange-400"}`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={`flex items-center gap-1 font-semibold ${deadlineColor}`}>
          <Clock className="w-3 h-3" />{deadlineText}
        </span>
        <span className="text-slate-400">{doneTasks}/{projTasks.length} zad.</span>
        {lateTasks > 0 && (
          <span className="flex items-center gap-1 text-red-500 font-semibold">
            <AlertTriangle className="w-3 h-3" />{lateTasks}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Gantt timeline (keep + improve) ──────────────────────────────────────────
function GanttTimeline({ projects }) {
  const winStart = useMemo(() => { const d = new Date(TODAY + "T00:00:00"); d.setDate(d.getDate() - 14); return d; }, []);
  const winEnd   = useMemo(() => { const d = new Date(TODAY + "T00:00:00"); d.setDate(d.getDate() + 70); return d; }, []);
  const winMs    = winEnd - winStart;
  const todayPct = ((new Date(TODAY + "T00:00:00") - winStart) / winMs) * 100;

  const months = useMemo(() => {
    const list = [];
    let d = new Date(winStart.getFullYear(), winStart.getMonth(), 1);
    while (d <= winEnd) {
      const pct = ((d - winStart) / winMs) * 100;
      if (pct >= 0 && pct <= 100) list.push({ label: d.toLocaleDateString("pl-PL", { month: "short" }), pct });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return list;
  }, [winStart, winEnd, winMs]);

  const visible = projects.filter(p => {
    const s = new Date(p.startDate + "T00:00:00");
    const e = new Date(p.deadline + "T00:00:00");
    return e >= winStart && s <= winEnd;
  });

  return (
    <div>
      <div className="relative h-5 mb-1 ml-36">
        {months.map((m, i) => (
          <span key={i} style={{ left: `${m.pct}%` }} className="absolute text-[10px] text-slate-400 -translate-x-1/2 font-medium">{m.label}</span>
        ))}
      </div>
      <div className="space-y-2">
        {visible.map(p => {
          const s   = new Date(p.startDate + "T00:00:00");
          const e   = new Date(p.deadline + "T00:00:00");
          const ls  = Math.max(s.getTime(), winStart.getTime());
          const le  = Math.min(e.getTime(), winEnd.getTime());
          const lft = Math.max(0, ((ls - winStart.getTime()) / winMs) * 100);
          const wid = Math.max(1, ((le - ls) / winMs) * 100);
          const barColor = p.status === "Ukończony" ? "bg-green-400" : p.status === "Wstrzymany" ? "bg-amber-400"
            : isOverdue(p.deadline, p.status) ? "bg-red-400" : "bg-orange-400";
          return (
            <div key={p.id} className="flex items-center gap-2 h-7">
              <div className="text-xs text-slate-600 truncate text-right flex-shrink-0 pr-2" style={{ width: "9rem" }}>{p.name}</div>
              <div className="flex-1 relative h-5 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ left: `${lft}%`, width: `${wid}%` }}
                  className={`absolute h-full rounded-full ${barColor} opacity-80`}
                  title={`${p.startDate} → ${p.deadline}`}
                />
                <div style={{ left: `${todayPct}%` }} className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10" />
              </div>
            </div>
          );
        })}
        {!visible.length && <p className="text-sm text-slate-400 text-center py-3">Brak projektów w tym oknie</p>}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-400">
        {[["bg-orange-400","W trakcie"],["bg-amber-400","Wstrzymany"],["bg-green-400","Ukończony"],["bg-red-400","Po terminie"]].map(([c,l]) => (
          <span key={l} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${c}`} />{l}</span>
        ))}
        <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-red-400 rounded-full inline-block" /> Dziś</span>
      </div>
    </div>
  );
}

// ── Task heatmap ──────────────────────────────────────────────────────────────
function TaskHeatmap({ tasks }) {
  const NAMES = ["Pn","Wt","Śr","Cz","Pt","So","Nd"];
  const { days, maxCount, offset } = useMemo(() => {
    const today = new Date(TODAY + "T00:00:00");
    const list  = Array.from({ length: 28 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (27 - i));
      const dateStr = d.toISOString().slice(0, 10);
      return { date: dateStr, count: tasks.filter(t => t.dueDate === dateStr && t.type === "task").length, isToday: dateStr === TODAY };
    });
    const max    = Math.max(...list.map(d => d.count), 1);
    const off    = (new Date(list[0].date + "T00:00:00").getDay() + 6) % 7;
    return { days: list, maxCount: max, offset: off };
  }, [tasks]);

  const heat = (n) => {
    if (n === 0) return "bg-slate-100";
    const r = n / maxCount;
    return r <= 0.25 ? "bg-orange-100" : r <= 0.5 ? "bg-orange-200" : r <= 0.75 ? "bg-orange-300" : "bg-orange-500";
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {NAMES.map(d => <div key={d} className="text-[10px] text-slate-400 text-center font-medium">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => <div key={`p${i}`} className="aspect-square" />)}
        {days.map(day => (
          <div key={day.date} title={`${day.date}: ${day.count} zadań`}
            className={`aspect-square rounded-md ${heat(day.count)} ${day.isToday ? "ring-2 ring-orange-500" : ""} transition-colors`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
        <span>Mniej</span>
        {["bg-slate-100","bg-orange-100","bg-orange-200","bg-orange-300","bg-orange-500"].map(c => (
          <span key={c} className={`w-3 h-3 rounded ${c}`} />
        ))}
        <span>Więcej</span>
      </div>
    </div>
  );
}

// ── CRM Pipeline ──────────────────────────────────────────────────────────────
const PIPELINE_STAGES = ["Lead","Wycena","Negocjacje","Umowa","Realizacja"];
const STAGE_COLORS = { Lead:"bg-blue-400", Wycena:"bg-amber-400", Negocjacje:"bg-purple-400", Umowa:"bg-green-400", Realizacja:"bg-orange-500" };
const STAGE_TEXT   = { Lead:"text-blue-600", Wycena:"text-amber-600", Negocjacje:"text-purple-600", Umowa:"text-green-600", Realizacja:"text-orange-600" };

function PipelineFunnel({ clients, projects }) {
  const active = clients.filter(c => !c.isArchived);
  const maxCount = Math.max(...PIPELINE_STAGES.map(s => active.filter(c => c.pipelineStatus === s).length), 1);

  return (
    <div className="space-y-2.5">
      {PIPELINE_STAGES.map(stage => {
        const stageClients = active.filter(c => c.pipelineStatus === stage);
        const count  = stageClients.length;
        // Szacowana wartość: powiąż klientów z projektami
        const budget = projects.filter(p => stageClients.some(c => c.id === p.clientId) && p.status !== "Ukończony")
          .reduce((s, p) => s + (p.budget ?? 0), 0);

        return (
          <div key={stage} className="flex items-center gap-3">
            <div className="w-24 text-xs font-semibold text-slate-600 text-right flex-shrink-0">{stage}</div>
            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / maxCount) * 100}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`h-full rounded-full ${STAGE_COLORS[stage]}`}
              />
            </div>
            <div className={`w-5 text-xs font-bold flex-shrink-0 text-right ${count > 0 ? STAGE_TEXT[stage] : "text-slate-300"}`}>{count}</div>
            {budget > 0 && (
              <div className="text-xs text-slate-400 flex-shrink-0 w-24 text-right">
                {new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(budget)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Upcoming tasks ────────────────────────────────────────────────────────────
function UpcomingTask({ task, project }) {
  const days   = Math.ceil((new Date(task.dueDate + "T00:00:00") - new Date(TODAY + "T00:00:00")) / 86_400_000);
  const color  = days < 0 ? "text-red-500" : days === 0 ? "text-orange-600" : "text-slate-500";
  const label  = days < 0 ? `${Math.abs(days)}d po terminie` : days === 0 ? "Dziś" : `za ${days}d`;
  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-slate-50 last:border-0">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${days < 0 ? "bg-red-400" : "bg-orange-400"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">{task.title}</p>
        {project && <p className="text-[10px] text-slate-400 truncate">{project.name}</p>}
      </div>
      <span className={`text-[10px] font-semibold flex-shrink-0 ${color}`}>{label}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Analityka({ projects, tasks, checklists, clients = [] }) {
  const onlyTasks    = tasks.filter(t => t.type === "task");
  const activeProj   = projects.filter(p => p.status === "W trakcie");
  const overdueCount = onlyTasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const openTasks    = onlyTasks.filter(t => t.status !== "Zrobione");

  const pipelineValue = projects
    .filter(p => p.status !== "Ukończony")
    .reduce((s, p) => s + (p.budget ?? 0), 0);

  const activeClients = clients.filter(c => !c.isArchived && c.pipelineStatus !== "Zakończony");

  const avgProgress = activeProj.length
    ? Math.round(activeProj.reduce((s, p) => s + p.progress, 0) / activeProj.length) : 0;

  const formatPLN = (v) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(v);

  // Upcoming tasks (next 14 days + overdue)
  const upcoming = useMemo(() => {
    const cutoff = new Date(TODAY + "T00:00:00"); cutoff.setDate(cutoff.getDate() + 14);
    const cutStr = cutoff.toISOString().slice(0, 10);
    return openTasks.filter(t => t.dueDate <= cutStr).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 10);
  }, [openTasks]);

  const STATUS_COLORS   = { "Wstępny":"bg-slate-400","W trakcie":"bg-blue-500","Wstrzymany":"bg-amber-500","Ukończony":"bg-green-500" };
  const PRIORITY_COLORS = { "Krytyczny":"bg-red-500","Wysoki":"bg-orange-500","Normalny":"bg-blue-400","Niski":"bg-slate-300" };
  const statusData      = ["Wstępny","W trakcie","Wstrzymany","Ukończony"].map(s => ({ label: s, count: projects.filter(p => p.status === s).length }));
  const prioData        = ["Krytyczny","Wysoki","Normalny","Niski"].map(p => ({ label: p, count: openTasks.filter(t => t.priority === p).length }));
  const maxStatus       = Math.max(...statusData.map(d => d.count), 1);
  const maxPrio         = Math.max(...prioData.map(d => d.count), 1);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Nagłówek ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-500" /> Analityka studia
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Puls projektów, zadań i klientów · {TODAY}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV("projekty.csv", projects.map(p => ({ Nazwa: p.name, Status: p.status, Pakiet: p.package, Postep: `${p.progress}%`, Termin: p.deadline })))}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => downloadPDF(projects, tasks, clients)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all"
          >
            <FileText className="w-3.5 h-3.5" /> Raport PDF
          </button>
        </div>
      </div>

      {/* ── KPI ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard icon={Banknote}      label="Wartość w realizacji" variant="orange"
          value={formatPLN(pipelineValue)} sub={`${activeProj.length} aktywnych projektów`} />
        <KpiCard icon={FolderKanban}  label="Aktywne projekty"    variant="blue"
          value={activeProj.length} sub={`śr. postęp ${avgProgress}%`} />
        <KpiCard icon={CheckSquare}   label="Otwarte zadania"      variant="slate"
          value={openTasks.length} sub={`z ${onlyTasks.length} łącznie`} />
        <KpiCard icon={AlertTriangle} label="Po terminie"          variant={overdueCount ? "red" : "green"} alert={overdueCount > 0}
          value={overdueCount} sub={overdueCount ? "Wymaga uwagi!" : "Wszystko OK"} />
        <KpiCard icon={Users}         label="Klienci w pipeline"   variant="purple"
          value={activeClients.length} sub={`${clients.length} łącznie`} />
      </div>

      {/* ── Projekty pod lupą ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={Target} title="Projekty pod lupą" sub="Zdrowie i terminowość aktywnych projektów" />
        {activeProj.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeProj.map(p => <ProjectHealthCard key={p.id} project={p} tasks={tasks} />)}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">Brak aktywnych projektów</p>
        )}
      </section>

      {/* ── Oś czasu ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={Calendar} title="Harmonogram projektów" sub="Okno: 2 tygodnie wstecz → 10 tygodni do przodu" />
        <GanttTimeline projects={projects} />
      </section>

      {/* ── Zadania + Aktywność ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Zadania: rozkład */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader icon={CheckSquare} title="Zadania" sub="Rozkład wg statusu i priorytetu" />
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Projekty wg statusu</p>
              <div className="space-y-2">
                {statusData.map(d => <HBar key={d.label} label={d.label} value={d.count} max={maxStatus} count={d.count} color={STATUS_COLORS[d.label]} />)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Otwarte zadania wg priorytetu</p>
              <div className="space-y-2">
                {prioData.map(d => <HBar key={d.label} label={d.label} value={d.count} max={maxPrio} count={d.count} color={PRIORITY_COLORS[d.label]} />)}
              </div>
            </div>
          </div>
        </section>

        {/* Aktywność + Nadchodzące */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <SectionHeader icon={BarChart2} title="Heatmapa zadań" sub="Aktywność w ostatnich 4 tygodniach" />
            <TaskHeatmap tasks={tasks} />
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <SectionHeader icon={AlertTriangle} title="Nadchodzące" sub="Zadania do 14 dni + zaległe" />
            {upcoming.length > 0 ? (
              <div>
                {upcoming.map(t => (
                  <UpcomingTask key={t.id} task={t} project={projects.find(p => p.id === t.projectId)} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" /> Brak zaległych zadań – studio up to date!
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── Pipeline CRM ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={TrendingUp} title="Pipeline CRM" sub="Klienci wg etapu · szacowana wartość powiązanych projektów" />
        <PipelineFunnel clients={clients} projects={projects} />
        {clients.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Brak danych CRM</p>
        )}
      </section>

    </div>
  );
}
