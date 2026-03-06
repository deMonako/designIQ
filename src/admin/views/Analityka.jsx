import React, { useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FolderKanban, CheckSquare, AlertTriangle, TrendingUp,
  BarChart2, Download, FileText, Clock, Banknote,
  Calendar, Target, CheckCircle2, Wallet, Timer,
} from "lucide-react";
import { isOverdue, TODAY } from "../mockData";

// ── Formatters ────────────────────────────────────────────────────────────────
const formatPLN = (v) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(v ?? 0);

function safeDate(str) {
  if (!str) return null;
  const s = String(str).substring(0, 10);
  return s.length === 10 ? new Date(s + "T12:00:00") : null;
}

function dateDiffDays(start, end) {
  const s = safeDate(start), e = safeDate(end);
  if (!s || !e) return 0;
  return Math.round((e - s) / 86_400_000);
}

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

function downloadPDF(projects, tasks) {
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
    teal:   "bg-teal-50   text-teal-600",
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

// ── Project health card ───────────────────────────────────────────────────────
function ProjectHealthCard({ project, tasks, onNavigate }) {
  const projTasks = tasks.filter(t => t.projectId === project.id && t.type === "task");
  const doneTasks = projTasks.filter(t => t.status === "Zrobione").length;
  const lateTasks = projTasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const days      = Math.ceil((safeDate(project.deadline) - safeDate(TODAY)) / 86_400_000);
  const isLate    = days < 0;
  const isUrgent  = !isLate && days <= 7;

  const deadlineColor = isLate ? "text-red-600" : isUrgent ? "text-orange-600" : "text-slate-400";
  const deadlineText  = isLate
    ? `${Math.abs(days)} dni po terminie`
    : days === 0 ? "Termin dziś!"
    : `${days} dni do terminu`;

  const statusStyle = {
    "Wstępny":   "bg-slate-100 text-slate-600",
    "W trakcie": "bg-blue-50 text-blue-700",
    "Wstrzymany":"bg-amber-50 text-amber-700",
    "Ukończony": "bg-green-50 text-green-700",
  };

  return (
    <div
      onClick={() => onNavigate?.(project)}
      className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isLate ? "border-red-200 hover:border-red-300" : isUrgent ? "border-orange-200 hover:border-orange-300" : "border-slate-200 hover:border-slate-300"
      }`}
    >
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

// ── Gantt timeline (per-stage colors, no gaps, floating tooltip) ─────────────
const STAGE_PALETTE = [
  "#3b82f6", "#f97316", "#10b981", "#8b5cf6", "#f43f5e",
  "#14b8a6", "#d97706", "#6366f1", "#ec4899", "#06b6d4",
];

function stageColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return STAGE_PALETTE[h % STAGE_PALETTE.length];
}

function GanttTimeline({ projects }) {
  const [hover, setHover] = useState(null); // { dateStr, clientX, clientY, xPct, flipped }

  const winStart = useMemo(() => {
    const d = new Date(TODAY + "T00:00:00"); d.setDate(d.getDate() - 14); return d;
  }, []);
  const winEnd = useMemo(() => {
    const d = new Date(TODAY + "T00:00:00"); d.setDate(d.getDate() + 70); return d;
  }, []);
  const winMs = winEnd - winStart;

  const todayPct = ((new Date(TODAY + "T00:00:00") - winStart) / winMs) * 100;

  const months = useMemo(() => {
    const list = [];
    let d = new Date(winStart.getFullYear(), winStart.getMonth(), 1);
    while (d <= winEnd) {
      const pct = ((d - winStart) / winMs) * 100;
      if (pct >= 0 && pct <= 100) list.push({
        label: d.toLocaleDateString("pl-PL", { month: "short", day: "numeric" }),
        pct,
      });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return list;
  }, [winStart, winEnd, winMs]);

  const visible = useMemo(() =>
    projects
      .filter(p => {
        const s = safeDate(p.startDate), e = safeDate(p.deadline);
        return s && e && e >= winStart && s <= winEnd;
      })
      .sort((a, b) => {
        const da = safeDate(a.deadline) || new Date("9999-12-31");
        const db = safeDate(b.deadline) || new Date("9999-12-31");
        return da - db;
      }),
  [projects, winStart, winEnd]);

  // All unique stage names in view (for legend)
  const allStageNames = useMemo(() => {
    const names = new Set();
    visible.forEach(p => (p.stageSchedule || []).forEach(st => names.add(st.name)));
    return [...names];
  }, [visible]);

  // Tooltip entries for hovered date
  const tooltipEntries = useMemo(() => {
    if (!hover) return [];
    return visible.flatMap(p => {
      const stage = (p.stageSchedule || []).find(
        st => st.start <= hover.dateStr && st.end >= hover.dateStr
      );
      return stage ? [{ project: p, stageName: stage.name, color: stageColor(stage.name) }] : [];
    });
  }, [hover, visible]);

  const handleBarMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const dateMs = winStart.getTime() + relX * winMs;
    const dateStr = new Date(dateMs).toISOString().slice(0, 10);
    const flipped = e.clientX > window.innerWidth * 0.62;
    setHover({ dateStr, clientX: e.clientX, clientY: e.clientY, xPct: relX * 100, flipped });
  }, [winStart, winMs]);

  return (
    <div>
      {/* Month labels */}
      <div className="relative h-5 mb-1 ml-36">
        {months.map((m, i) => (
          <span key={i} style={{ left: `${m.pct}%` }}
            className="absolute text-[10px] text-slate-400 -translate-x-1/2 font-medium whitespace-nowrap">
            {m.label}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {visible.map(p => {
          const schedule = p.stageSchedule || [];
          const pStart = safeDate(p.startDate), pEnd = safeDate(p.deadline);

          // Background span (include deadline day: +1 day)
          const bgLeft  = pStart ? Math.max(0, ((pStart.getTime() - winStart.getTime()) / winMs) * 100) : 0;
          const bgRight = pEnd   ? Math.min(100, ((pEnd.getTime() + 86_400_000 - winStart.getTime()) / winMs) * 100) : 100;
          const bgWidth = Math.max(0.5, bgRight - bgLeft);

          return (
            <div key={p.id} className="flex items-center gap-2">
              <div className="text-xs text-slate-600 truncate text-right flex-shrink-0 pr-2 leading-tight"
                style={{ width: "9rem" }}>
                <div className="font-medium">{p.name}</div>
                {p.code && <div className="text-[10px] text-slate-400">{p.code}</div>}
              </div>
              <div
                className="flex-1 relative h-5 bg-slate-100 rounded-sm overflow-visible cursor-crosshair"
                onMouseMove={handleBarMove}
                onMouseLeave={() => setHover(null)}
              >
                {/* Full-project thin background */}
                <div style={{ left: `${bgLeft}%`, width: `${bgWidth}%` }}
                  className="absolute h-full rounded-sm bg-slate-300/40" />

                {/* Stage segments — colored by stage name */}
                {schedule.length > 0 ? schedule.map((st, si) => {
                  const ss = new Date(st.start + "T00:00:00").getTime();
                  // +1 day so end date is fully included (no gap when next starts the day after)
                  const se = new Date(st.end + "T00:00:00").getTime() + 86_400_000;
                  const ls = Math.max(ss, winStart.getTime());
                  const le = Math.min(se, winEnd.getTime());
                  if (le <= ls) return null;
                  const lft = ((ls - winStart.getTime()) / winMs) * 100;
                  const wid = Math.max(0.3, ((le - ls) / winMs) * 100);
                  return (
                    <div key={si}
                      style={{ left: `${lft}%`, width: `${wid}%`, backgroundColor: stageColor(st.name) }}
                      className="absolute h-full rounded-sm opacity-80"
                    />
                  );
                }) : (
                  <div style={{ left: `${bgLeft}%`, width: `${bgWidth}%` }}
                    className="absolute h-full rounded-sm bg-slate-400/60" />
                )}

                {/* Today marker */}
                {todayPct >= 0 && todayPct <= 100 && (
                  <div style={{ left: `${todayPct}%` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none" />
                )}

                {/* Crosshair */}
                {hover && (
                  <div style={{ left: `${hover.xPct}%` }}
                    className="absolute top-0 bottom-0 w-px bg-slate-500/30 z-20 pointer-events-none" />
                )}
              </div>
            </div>
          );
        })}
        {!visible.length && <p className="text-sm text-slate-400 text-center py-3">Brak projektów w tym oknie</p>}
      </div>

      {/* Floating tooltip — follows mouse cursor */}
      {hover && (
        <div
          style={{
            position: "fixed",
            left: hover.flipped ? hover.clientX - 228 : hover.clientX + 14,
            top: hover.clientY - 10,
            zIndex: 9999,
            pointerEvents: "none",
            minWidth: "13rem",
            maxWidth: "18rem",
          }}
          className="bg-slate-900 text-white text-xs rounded-xl shadow-2xl border border-slate-700 p-3"
        >
          <div className="font-bold text-slate-200 mb-2">
            {new Date(hover.dateStr + "T12:00:00").toLocaleDateString("pl-PL", {
              weekday: "short", day: "numeric", month: "long",
            })}
          </div>
          {tooltipEntries.length > 0 ? (
            <div className="space-y-1.5">
              {tooltipEntries.map(e => (
                <div key={e.project.id} className="flex items-center gap-2">
                  <span style={{ backgroundColor: e.color }}
                    className="w-2 h-2 rounded-sm flex-shrink-0 inline-block" />
                  <span className="text-slate-300 truncate">{e.project.name}</span>
                  <span className="text-slate-600">·</span>
                  <span style={{ color: e.color }} className="font-semibold truncate">{e.stageName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500">Brak aktywnych etapów</div>
          )}
        </div>
      )}

      {/* Legend — stage names */}
      <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-400">
        {allStageNames.map(name => (
          <span key={name} className="flex items-center gap-1">
            <span style={{ backgroundColor: stageColor(name) }} className="w-2.5 h-2.5 rounded-sm inline-block" />
            {name}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-0.5 h-3 bg-red-500 rounded-full inline-block" /> Dziś
        </span>
      </div>
    </div>
  );
}

// ── Finance Overview ──────────────────────────────────────────────────────────
function FinanceOverview({ projects }) {
  const active = projects
    .filter(p => p.status !== "Ukończony" && (p.budget || 0) > 0)
    .sort((a, b) => {
      const remA = (a.budget || 0) - ((a.paidProjekt || 0) + (a.paidPrefabrykacja || 0) + (a.paidUruchomienie || 0));
      const remB = (b.budget || 0) - ((b.paidProjekt || 0) + (b.paidPrefabrykacja || 0) + (b.paidUruchomienie || 0));
      return remB - remA;
    });

  if (active.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-6">Brak danych finansowych</p>;
  }

  const totBudget   = active.reduce((s, p) => s + (p.budget || 0), 0);
  const totPaid     = active.reduce((s, p) => s + ((p.paidProjekt || 0) + (p.paidPrefabrykacja || 0) + (p.paidUruchomienie || 0)), 0);
  const totRemain   = Math.max(0, totBudget - totPaid);

  return (
    <div className="space-y-4">
      {active.map(p => {
        const paid    = (p.paidProjekt || 0) + (p.paidPrefabrykacja || 0) + (p.paidUruchomienie || 0);
        const budget  = p.budget || 0;
        const remain  = Math.max(0, budget - paid);
        const pct     = budget > 0 ? Math.round((paid / budget) * 100) : 0;
        return (
          <div key={p.id}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[55%]">{p.name}</span>
              <span className="text-xs text-slate-400 text-right">
                {pct}% wpłacono · <span className={remain > 0 ? "text-orange-600 font-semibold" : "text-green-600 font-semibold"}>
                  {remain > 0 ? `pozostało ${formatPLN(remain)}` : "opłacono w całości"}
                </span>
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : "bg-gradient-to-r from-orange-500 to-orange-400"}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Budżet: {formatPLN(budget)}</span>
              <span>Wpłacono: {formatPLN(paid)}</span>
            </div>
          </div>
        );
      })}

      {/* Totals */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Łączny budżet</div>
          <div className="text-sm font-bold text-slate-800">{formatPLN(totBudget)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Wpłacono</div>
          <div className="text-sm font-bold text-green-600">{formatPLN(totPaid)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Do zapłaty</div>
          <div className="text-sm font-bold text-orange-600">{formatPLN(totRemain)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Stage Duration Analysis ───────────────────────────────────────────────────
function StageDurations({ projects }) {
  const stats = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      (p.stageSchedule || []).forEach(st => {
        const days = dateDiffDays(st.start, st.end);
        if (days <= 0 || days > 365) return;
        if (!map[st.name]) map[st.name] = [];
        map[st.name].push(days);
      });
    });
    return Object.entries(map)
      .map(([name, vals]) => ({
        name,
        avg:  Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
        min:  Math.min(...vals),
        max:  Math.max(...vals),
        count: vals.length,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [projects]);

  if (stats.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-6">
        Brak danych harmonogramów — uzupełnij harmonogram w edytorze projektów
      </div>
    );
  }

  const maxAvg = Math.max(...stats.map(d => d.avg), 1);

  return (
    <div className="space-y-3">
      {stats.map(d => (
        <div key={d.name}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-medium text-slate-700 truncate max-w-[60%]">{d.name}</span>
            <span className="text-[10px] text-slate-400">
              śr. <span className="font-bold text-slate-700">{d.avg} dni</span>
              {d.count > 1 && ` (${d.min}–${d.max}) · ×${d.count}`}
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.avg / maxAvg) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Package breakdown ─────────────────────────────────────────────────────────
function PackageBreakdown({ projects }) {
  const data = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      const key = p.package || "Brak";
      if (!map[key]) map[key] = { count: 0, budget: 0, active: 0 };
      map[key].count++;
      map[key].budget += p.budget || 0;
      if (p.status === "W trakcie") map[key].active++;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.name} className="flex items-center gap-3">
          <div className="w-32 text-xs font-medium text-slate-700 text-right truncate flex-shrink-0">{d.name}</div>
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.count / maxCount) * 100}%` }}
              transition={{ duration: 0.7 }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
            />
          </div>
          <div className="text-xs font-bold text-slate-700 w-5 flex-shrink-0">{d.count}</div>
          {d.budget > 0 && (
            <div className="text-[10px] text-slate-400 w-20 text-right flex-shrink-0">{formatPLN(d.budget)}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Analityka({ projects, tasks, checklists, clients = [], onNavigateToProject }) {
  const onlyTasks    = tasks.filter(t => t.type === "task");
  const overdueCount = onlyTasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const openTasks    = onlyTasks.filter(t => t.status !== "Zrobione");

  // Active projects sorted by closest deadline
  const activeProj = useMemo(() =>
    projects
      .filter(p => p.status === "W trakcie")
      .sort((a, b) => {
        const da = safeDate(a.deadline) || new Date("9999-12-31");
        const db = safeDate(b.deadline) || new Date("9999-12-31");
        return da - db;
      }),
  [projects]);

  const avgProgress = activeProj.length
    ? Math.round(activeProj.reduce((s, p) => s + p.progress, 0) / activeProj.length) : 0;

  // Remaining to pay by clients (active projects only)
  const remainingToPay = useMemo(() =>
    projects
      .filter(p => p.status !== "Ukończony")
      .reduce((s, p) => {
        const paid = (p.paidProjekt || 0) + (p.paidPrefabrykacja || 0) + (p.paidUruchomienie || 0);
        return s + Math.max(0, (p.budget || 0) - paid);
      }, 0),
  [projects]);

  const completedThisYear = useMemo(() =>
    projects.filter(p => p.status === "Ukończony" && (p.deadline || "").startsWith(new Date().getFullYear().toString())).length,
  [projects]);

  const activeClients = clients.filter(c => !c.isArchived);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Nagłówek ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-500" /> Analityka studia
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Finanse, harmonogram i kondycja projektów · {TODAY}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV("projekty.csv", projects.map(p => ({
              Nazwa: p.name, Status: p.status, Pakiet: p.package,
              Postep: `${p.progress}%`, Termin: p.deadline,
              Budzet: p.budget, Pozostalo: Math.max(0, (p.budget||0) - ((p.paidProjekt||0)+(p.paidPrefabrykacja||0)+(p.paidUruchomienie||0))),
            })))}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => downloadPDF(projects, tasks)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all"
          >
            <FileText className="w-3.5 h-3.5" /> Raport PDF
          </button>
        </div>
      </div>

      {/* ── KPI ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard icon={Wallet}        label="Do zapłaty przez klientów" variant="orange"
          value={formatPLN(remainingToPay)} sub={`${activeProj.length} aktywnych proj.`} />
        <KpiCard icon={FolderKanban}  label="Aktywne projekty"          variant="blue"
          value={activeProj.length} sub={`śr. postęp ${avgProgress}%`} />
        <KpiCard icon={CheckSquare}   label="Otwarte zadania"            variant="slate"
          value={openTasks.length} sub={`z ${onlyTasks.length} łącznie`} />
        <KpiCard icon={AlertTriangle} label="Zadania po terminie"        variant={overdueCount ? "red" : "green"} alert={overdueCount > 0}
          value={overdueCount} sub={overdueCount ? "Wymaga uwagi!" : "Wszystko OK"} />
        <KpiCard icon={CheckCircle2}  label="Ukończone w tym roku"       variant="teal"
          value={completedThisYear} sub={`${clients.length} klientów łącznie`} />
      </div>

      {/* ── Projekty pod lupą (sorted by deadline) ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={Target} title="Projekty pod lupą"
          sub="Aktywne projekty · sortowane od najbliższego terminu" />
        {activeProj.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeProj.map(p => (
              <ProjectHealthCard key={p.id} project={p} tasks={tasks} onNavigate={onNavigateToProject} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">Brak aktywnych projektów</p>
        )}
      </section>

      {/* ── Harmonogram ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={Calendar} title="Harmonogram projektów"
          sub="Przesuń mysz nad linię czasu aby zobaczyć szczegóły etapów danego dnia" />
        <GanttTimeline projects={projects} />
      </section>

      {/* ── Finanse + Czas etapów ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader icon={Banknote} title="Finanse projektów"
            sub="Budżet, wpłaty i kwota pozostała do zapłaty" />
          <FinanceOverview projects={projects} />
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader icon={Timer} title="Czas realizacji etapów"
            sub="Średni czas trwania etapów na podstawie harmonogramów" />
          <StageDurations projects={projects} />
        </section>
      </div>

      {/* ── Pakiety ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={TrendingUp} title="Podział wg pakietów"
          sub="Liczba projektów i łączna wartość budżetu na pakiet" />
        <PackageBreakdown projects={projects} />
        {projects.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Brak projektów</p>
        )}
      </section>

    </div>
  );
}
