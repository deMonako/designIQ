import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FolderKanban, CheckSquare, AlertTriangle, TrendingUp,
  Users, BarChart2, Download, FileText,
} from "lucide-react";
import { isOverdue, TODAY } from "../mockData";

// ── CSV export ─────────────────────────────────────────────────────────────
function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines   = [
    headers.join(";"),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(";")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF export ─────────────────────────────────────────────────────────────
function downloadPDF(projects, tasks, clients) {
  const doc = new jsPDF("p", "mm", "a4");
  const ORANGE = [234, 88, 12];

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text("Raport designiQ", 14, 20);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Wygenerowano: ${TODAY}`, 14, 28);

  // Projects table
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("Projekty", 14, 38);
  autoTable(doc, {
    startY: 42,
    head: [["Projekt", "Status", "Pakiet", "Postęp", "Termin"]],
    body: projects.map(p => [p.name, p.status, p.package, `${p.progress}%`, p.deadline]),
    headStyles: { fillColor: ORANGE, fontSize: 8 },
    styles: { fontSize: 8 },
  });

  // Tasks table
  const afterProj = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.text("Zadania", 14, afterProj);
  autoTable(doc, {
    startY: afterProj + 4,
    head: [["Tytuł", "Status", "Priorytet", "Termin"]],
    body: tasks.filter(t => t.type === "task").map(t => [t.title, t.status, t.priority, t.dueDate]),
    headStyles: { fillColor: ORANGE, fontSize: 8 },
    styles: { fontSize: 8 },
  });

  doc.save(`raport-designiq-${TODAY}.pdf`);
}

// ── Small re-usable chart components ──────────────────────────────────────
function HBar({ label, value, max, color, count }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-slate-600 text-right flex-shrink-0">{label}</div>
      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <div className="w-6 text-xs font-bold text-slate-700 flex-shrink-0">{count}</div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, colorBg, colorText }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorBg}`}>
        <Icon className={`w-4 h-4 ${colorText}`} />
      </div>
      <div className="text-2xl font-bold text-slate-900 leading-none mb-1">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Gantt-style project timeline ──────────────────────────────────────────
function GanttTimeline({ projects }) {
  // Window: 2 weeks ago → 10 weeks ahead = 84 days
  const winStart = useMemo(() => { const d = new Date(TODAY + "T00:00:00"); d.setDate(d.getDate() - 14); return d; }, []);
  const winEnd   = useMemo(() => { const d = new Date(TODAY + "T00:00:00"); d.setDate(d.getDate() + 70); return d; }, []);
  const winMs    = winEnd - winStart;

  const todayPct = ((new Date(TODAY + "T00:00:00") - winStart) / winMs) * 100;

  // Month tick marks
  const months = useMemo(() => {
    const list = [];
    let d = new Date(winStart.getFullYear(), winStart.getMonth(), 1);
    while (d <= winEnd) {
      const pct = ((d - winStart) / winMs) * 100;
      if (pct >= 0 && pct <= 100) list.push({ label: d.toLocaleDateString("pl-PL", { month: "short", year: "2-digit" }), pct });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return list;
  }, [winStart, winEnd, winMs]);

  const visibleProjects = projects.filter(p => {
    const s = new Date(p.startDate + "T00:00:00");
    const e = new Date(p.deadline + "T00:00:00");
    return e >= winStart && s <= winEnd;
  });

  return (
    <div>
      {/* Month labels */}
      <div className="relative h-5 mb-1 ml-36">
        {months.map((m, i) => (
          <span key={i} style={{ left: `${m.pct}%` }} className="absolute text-[9px] text-slate-400 -translate-x-1/2">
            {m.label}
          </span>
        ))}
      </div>
      {/* Today line + project bars */}
      <div className="space-y-1.5">
        {visibleProjects.map(p => {
          const s   = new Date(p.startDate + "T00:00:00");
          const e   = new Date(p.deadline + "T00:00:00");
          const ls  = Math.max(s.getTime(), winStart.getTime());
          const le  = Math.min(e.getTime(), winEnd.getTime());
          const lft = Math.max(0, ((ls - winStart.getTime()) / winMs) * 100);
          const wid = Math.max(1, ((le - ls) / winMs) * 100);

          const barColor =
            p.status === "Ukończony"  ? "bg-green-400" :
            p.status === "Wstrzymany" ? "bg-amber-400" :
            isOverdue(p.deadline, p.status) ? "bg-red-400" : "bg-orange-400";

          return (
            <div key={p.id} className="flex items-center gap-2 h-6">
              <div className="w-34 text-xs text-slate-600 truncate text-right flex-shrink-0 pr-2" style={{ width: "9rem" }}>
                {p.name}
              </div>
              <div className="flex-1 relative h-4 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ left: `${lft}%`, width: `${wid}%` }}
                  className={`absolute h-full rounded-full ${barColor} opacity-75`}
                  title={`${p.startDate} → ${p.deadline}`} />
                {/* Today marker */}
                <div style={{ left: `${todayPct}%` }} className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10" />
              </div>
            </div>
          );
        })}
        {visibleProjects.length === 0 && (
          <div className="text-sm text-slate-400 text-center py-4">Brak projektów w tym oknie czasowym</div>
        )}
      </div>
      {/* Legend */}
      <div className="flex gap-3 mt-3 text-[10px] text-slate-400 flex-wrap">
        {[["bg-orange-400","W trakcie"],["bg-amber-400","Wstrzymany"],["bg-green-400","Ukończony"],["bg-red-400","Po terminie"]].map(([c,l]) => (
          <span key={l} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-full ${c}`} />{l}</span>
        ))}
        <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-red-400 rounded-full" /> Dziś</span>
      </div>
    </div>
  );
}

// ── Task heatmap (last 4 weeks × 7 days) ─────────────────────────────────
function TaskHeatmap({ tasks }) {
  const DAY_NAMES = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

  const { days, maxCount, firstDayOffset } = useMemo(() => {
    const today = new Date(TODAY + "T00:00:00");
    const list  = [];
    for (let i = 27; i >= 0; i--) {
      const d       = new Date(today); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count   = tasks.filter(t => t.dueDate === dateStr && t.type === "task").length;
      list.push({ date: dateStr, count, isToday: dateStr === TODAY });
    }
    const max    = Math.max(...list.map(d => d.count), 1);
    const first  = new Date(list[0].date + "T00:00:00");
    const offset = (first.getDay() + 6) % 7; // Mon = 0
    return { days: list, maxCount: max, firstDayOffset: offset };
  }, [tasks]);

  const intensity = (count) => {
    if (count === 0) return "bg-slate-100";
    const r = count / maxCount;
    if (r <= 0.25) return "bg-orange-100";
    if (r <= 0.5)  return "bg-orange-200";
    if (r <= 0.75) return "bg-orange-300";
    return "bg-orange-500";
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-[10px] text-slate-400 text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        {days.map(day => (
          <div
            key={day.date}
            title={`${day.date}: ${day.count} zadań`}
            className={`aspect-square rounded ${intensity(day.count)} ${day.isToday ? "ring-2 ring-orange-500" : ""} transition-colors`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
        <span>Mniej</span>
        {["bg-slate-100", "bg-orange-100", "bg-orange-200", "bg-orange-300", "bg-orange-500"].map(c => (
          <span key={c} className={`w-3 h-3 rounded ${c}`} />
        ))}
        <span>Więcej</span>
      </div>
    </div>
  );
}

// ── Pipeline funnel (clients) ─────────────────────────────────────────────
const PIPELINE_STAGES = ["Lead", "Wycena", "Negocjacje", "Umowa", "Realizacja"];
const PIPELINE_COLORS = {
  "Lead":       "bg-blue-400",
  "Wycena":     "bg-amber-400",
  "Negocjacje": "bg-purple-400",
  "Umowa":      "bg-green-400",
  "Realizacja": "bg-orange-500",
};

function PipelineFunnel({ clients }) {
  const active   = clients.filter(c => !c.isArchived);
  const maxCount = Math.max(...PIPELINE_STAGES.map(s => active.filter(c => c.pipelineStatus === s).length), 1);
  return (
    <div className="space-y-2">
      {PIPELINE_STAGES.map(stage => {
        const count = active.filter(c => c.pipelineStatus === stage).length;
        return (
          <div key={stage} className="flex items-center gap-3">
            <div className="w-24 text-xs text-slate-600 text-right flex-shrink-0">{stage}</div>
            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / maxCount) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${PIPELINE_COLORS[stage]}`}
              />
            </div>
            <div className="w-6 text-xs font-bold text-slate-700 flex-shrink-0">{count}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Analityka component ───────────────────────────────────────────────
export default function Analityka({ projects, tasks, checklists, clients = [] }) {
  // ── Computed stats ──────────────────────────────────────────────────────
  const onlyTasks    = tasks.filter(t => t.type === "task");
  const active       = projects.filter(p => p.status === "W trakcie");
  const done         = projects.filter(p => p.status === "Ukończony");
  const overdueCount = onlyTasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const avgProgress  = active.length > 0
    ? Math.round(active.reduce((a, p) => a + p.progress, 0) / active.length) : 0;

  const totalCheckItems = checklists.reduce((a, cl) => a + cl.items.length, 0);
  const doneCheckItems  = checklists.reduce((a, cl) => a + cl.items.filter(i => i.done).length, 0);
  const checkPct        = totalCheckItems > 0 ? Math.round((doneCheckItems / totalCheckItems) * 100) : 0;

  const activeClients = clients.filter(c => !c.isArchived).length;

  // ── Upcoming deadlines (next 30 days) ──────────────────────────────────
  const upcomingDeadlines = useMemo(() => {
    return projects
      .filter(p => p.status !== "Ukończony" && p.deadline >= TODAY)
      .map(p => {
        const days = Math.ceil((new Date(p.deadline + "T00:00:00") - new Date(TODAY + "T00:00:00")) / 86_400_000);
        return { ...p, daysLeft: days };
      })
      .filter(p => p.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [projects]);

  // ── Chart data ──────────────────────────────────────────────────────────
  const STATUS_COLORS    = { "Wstępny": "bg-slate-400", "W trakcie": "bg-blue-500", "Wstrzymany": "bg-amber-500", "Ukończony": "bg-green-500" };
  const PKG_COLORS       = { "Smart design": "bg-slate-500", "Smart design+": "bg-indigo-500", "Full house": "bg-orange-500" };
  const PRIORITY_COLORS  = { "Krytyczny": "bg-red-500", "Wysoki": "bg-orange-500", "Normalny": "bg-blue-400", "Niski": "bg-slate-400" };

  const statusData   = ["Wstępny","W trakcie","Wstrzymany","Ukończony"].map(s => ({ label: s, count: projects.filter(p => p.status === s).length }));
  const pkgData      = ["Smart design","Smart design+","Full house"].map(s => ({ label: s, count: projects.filter(p => p.package === s).length }));
  const taskStatData = [{ label: "Otwarte", count: onlyTasks.filter(t => t.status !== "Zrobione").length }, { label: "Zrobione", count: onlyTasks.filter(t => t.status === "Zrobione").length }];
  const prioData     = ["Krytyczny","Wysoki","Normalny","Niski"].map(p => ({ label: p, count: onlyTasks.filter(t => t.priority === p).length }));
  const maxStatus    = Math.max(...statusData.map(d => d.count), 1);
  const maxPkg       = Math.max(...pkgData.map(d => d.count), 1);
  const maxTask      = Math.max(...taskStatData.map(d => d.count), 1);
  const maxPrio      = Math.max(...prioData.map(d => d.count), 1);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    downloadCSV("projekty-designiq.csv", projects.map(p => ({
      Nazwa: p.name,
      Status: p.status,
      Pakiet: p.package,
      Postep: `${p.progress}%`,
      Termin: p.deadline,
      Start: p.startDate,
    })));
  };

  const handleExportPDF = () => downloadPDF(projects, tasks, clients);

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* ── Page header + exports ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-500" /> Analityka
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Podsumowanie stanu projektów i zadań</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all"
          >
            <FileText className="w-3.5 h-3.5" /> Raport PDF
          </button>
        </div>
      </div>

      {/* ── KPI chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={FolderKanban} label="Aktywne projekty" value={active.length}      sub={`${avgProgress}% śr. postęp`}                    colorBg="bg-blue-50"   colorText="text-blue-600" />
        <KpiCard icon={CheckSquare}  label="Zadania otwarte"  value={onlyTasks.filter(t=>t.status!=="Zrobione").length} sub={`z ${onlyTasks.length} łącznie`} colorBg="bg-orange-50" colorText="text-orange-600" />
        <KpiCard icon={AlertTriangle} label="Po terminie"     value={overdueCount}        sub={overdueCount > 0 ? "Wymaga uwagi" : "Wszystko OK"} colorBg={overdueCount > 0 ? "bg-red-50" : "bg-green-50"} colorText={overdueCount > 0 ? "text-red-600" : "text-green-600"} />
        <KpiCard icon={TrendingUp}   label="Ukończone"        value={done.length}         sub={`z ${projects.length} projektów`}                 colorBg="bg-green-50"  colorText="text-green-600" />
        <KpiCard icon={Users}        label="Klienci aktywni"  value={activeClients}       sub={`${clients.length} łącznie`}                      colorBg="bg-purple-50" colorText="text-purple-600" />
        <KpiCard icon={CheckSquare}  label="Checklisty"       value={`${checkPct}%`}      sub={`${doneCheckItems}/${totalCheckItems} pkt`}       colorBg="bg-teal-50"   colorText="text-teal-600" />
      </div>

      {/* ── Section 1: Project charts + Timeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Status + Package bars */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-orange-500" /> Projekty wg statusu
            </h3>
            <div className="space-y-3">
              {statusData.map(d => (
                <HBar key={d.label} label={d.label} value={d.count} max={maxStatus} count={d.count} color={STATUS_COLORS[d.label]} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" /> Projekty wg pakietu
            </h3>
            <div className="space-y-3">
              {pkgData.map(d => (
                <HBar key={d.label} label={d.label} value={d.count} max={maxPkg} count={d.count} color={PKG_COLORS[d.label]} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Gantt + Deadlines */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-orange-500" /> Timeline projektów
            </h3>
            <GanttTimeline projects={projects} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Deadline w ciągu 30 dni
            </h3>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-4">Brak deadline'ów w ciągu miesiąca</div>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map(p => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.deadline}</div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      p.daysLeft === 0 ? "bg-red-100 text-red-600" :
                      p.daysLeft <= 7  ? "bg-orange-100 text-orange-600" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {p.daysLeft === 0 ? "Dziś" : `${p.daysLeft} dni`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Task analysis + Heatmap ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Task status + priority bars */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-orange-500" /> Zadania wg statusu
            </h3>
            <div className="space-y-3">
              {taskStatData.map(d => (
                <HBar key={d.label} label={d.label} value={d.count} max={maxTask} count={d.count}
                  color={d.label === "Zrobione" ? "bg-green-500" : "bg-slate-400"} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Zadania wg priorytetu
            </h3>
            <div className="space-y-3">
              {prioData.map(d => (
                <HBar key={d.label} label={d.label} value={d.count} max={maxPrio} count={d.count} color={PRIORITY_COLORS[d.label]} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Heatmap + progress */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-orange-500" /> Obłożenie (ostatnie 4 tyg.)
            </h3>
            <TaskHeatmap tasks={tasks} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Postęp aktywnych projektów</h3>
            {active.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-4">Brak aktywnych projektów</div>
            ) : (
              <div className="space-y-3">
                {active.map(p => (
                  <div key={p.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 truncate max-w-[65%]">{p.name}</span>
                      <span className={`font-semibold ${isOverdue(p.deadline, p.status) ? "text-red-500" : "text-slate-700"}`}>
                        {p.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.progress}%` }}
                        transition={{ duration: 0.7 }}
                        className={`h-full rounded-full ${isOverdue(p.deadline, p.status) ? "bg-red-400" : "bg-gradient-to-r from-orange-500 to-orange-400"}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Client pipeline + Checklist stats ── */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" /> Pipeline klientów
            </h3>
            <PipelineFunnel clients={clients} />
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
              <span>Aktywnych: <strong className="text-slate-800">{clients.filter(c => !c.isArchived).length}</strong></span>
              <span>Zarchiwizowanych: <strong className="text-slate-800">{clients.filter(c => c.isArchived).length}</strong></span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Postęp checklist</h3>
            <div className="text-center py-2">
              <div className="text-5xl font-bold text-orange-600">{checkPct}%</div>
              <div className="text-sm text-slate-500 mt-1">{doneCheckItems} z {totalCheckItems} punktów ukończonych</div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${checkPct}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
            </div>
            {/* Per-checklist breakdown */}
            <div className="mt-4 space-y-2">
              {checklists.slice(0, 4).map(cl => {
                const done = cl.items.filter(i => i.done).length;
                const pct  = cl.items.length > 0 ? Math.round((done / cl.items.length) * 100) : 0;
                return (
                  <div key={cl.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 truncate max-w-[70%]">{cl.title}</span>
                      <span className="text-slate-400">{done}/{cl.items.length}</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
