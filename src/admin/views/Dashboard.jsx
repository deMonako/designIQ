import React from "react";
import { motion } from "framer-motion";
import {
  FolderKanban, CheckSquare, AlertTriangle, TrendingUp,
  ArrowRight, Clock, Activity, Plus,
} from "lucide-react";
import { TODAY, isOverdue } from "../mockData";

function KpiCard({ icon: Icon, label, value, sub, color, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm cursor-pointer hover:shadow-md transition-all ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {onClick && <ArrowRight className="w-4 h-4 text-slate-300" />}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const s = {
    "Wstępny":   "bg-slate-100 text-slate-600",
    "W trakcie": "bg-blue-50 text-blue-700 border border-blue-200",
    "Wstrzymany":"bg-amber-50 text-amber-700 border border-amber-200",
    "Ukończony": "bg-green-50 text-green-700 border border-green-200",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s[status] || s["Wstępny"]}`}>{status}</span>;
}

function PriorityDot({ priority }) {
  const c = { "Niski": "bg-slate-400", "Normalny": "bg-blue-500", "Wysoki": "bg-orange-500", "Krytyczny": "bg-red-500" };
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${c[priority] || "bg-slate-400"}`} />;
}

export default function Dashboard({ projects, tasks, checklists, setCurrentView, setSelectedProject }) {
  const activeProjects   = projects.filter(p => p.status !== "Ukończony");
  const overdueTasks     = tasks.filter(t => isOverdue(t.dueDate, t.status));
  const openTasks        = tasks.filter(t => t.status !== "Zrobione");
  const completedThisMth = projects.filter(p => p.status === "Ukończony" && p.deadline >= "2026-01-01");
  const needsAttention   = projects.filter(p => p.status === "Wstrzymany" || (p.status !== "Ukończony" && isOverdue(p.deadline)));
  const todayTasks       = tasks.filter(t => t.dueDate === TODAY && t.status !== "Zrobione");
  const upcomingTasks    = openTasks
    .filter(t => t.dueDate >= TODAY)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  const activity = [
    { text: "Dodano zadanie: Schemat szafy – v2", project: "Dom Kowalski", time: "12 min", type: "task" },
    { text: "Ukończono etap: Projekt szafy", project: "Dom Kowalski", time: "2h", type: "stage" },
    { text: "Nowy projekt dodany do systemu", project: "Dom Wiśniewski", time: "5h", type: "project" },
    { text: "Status zmieniony na Wstrzymany", project: "Apt. Nowak", time: "1 dzień", type: "status" },
    { text: "Zaznaczono 2 punkty checklisty", project: "Dom Kowalski", time: "1 dzień", type: "checklist" },
  ];

  const activityIcon = { task: "✅", stage: "🔶", project: "📁", status: "🔄", checklist: "☑️" };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={FolderKanban} label="Aktywne projekty" value={activeProjects.length}
          sub={`${completedThisMth.length} ukończono w tym mies.`}
          color="bg-blue-500" onClick={() => setCurrentView("projekty")}
        />
        <KpiCard
          icon={CheckSquare} label="Zadania otwarte" value={openTasks.length}
          sub={`${todayTasks.length} na dziś`}
          color="bg-orange-500" onClick={() => setCurrentView("zadania")}
        />
        <KpiCard
          icon={AlertTriangle} label="Po terminie" value={overdueTasks.length}
          sub={overdueTasks.length > 0 ? "Wymaga uwagi" : "Wszystko OK"}
          color={overdueTasks.length > 0 ? "bg-red-500" : "bg-green-500"}
          onClick={() => setCurrentView("zadania")}
        />
        <KpiCard
          icon={TrendingUp} label="Ukończone" value={completedThisMth.length}
          sub="w tym miesiącu"
          color="bg-green-500" onClick={() => setCurrentView("projekty")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects needing attention */}
        <div className="lg:col-span-2 space-y-4">
          {needsAttention.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Wymagają uwagi ({needsAttention.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {needsAttention.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProject(p); setCurrentView("projekty"); }}
                    className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.stages[p.stageIndex]} · termin: {p.deadline}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <div className="hidden sm:block w-20">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${p.progress}%` }} />
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 text-right">{p.progress}%</div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All projects progress */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm">Postęp projektów</h2>
              <button
                onClick={() => setCurrentView("projekty")}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                Wszystkie <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {projects.filter(p => p.status !== "Ukończony").slice(0, 4).map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-sm font-medium text-slate-800 truncate max-w-[60%]">{p.name}</div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span className="text-xs font-semibold text-slate-600">{p.progress}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's tasks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Nadchodzące zadania
              </h2>
              <button
                onClick={() => setCurrentView("zadania")}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                Wszystkie <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingTasks.length === 0 && (
                <div className="px-5 py-6 text-center text-sm text-slate-400">Brak zadań</div>
              )}
              {upcomingTasks.map(t => {
                const proj = projects.find(p => p.id === t.projectId);
                const overdue = isOverdue(t.dueDate, t.status);
                return (
                  <div key={t.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <PriorityDot priority={t.priority} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{t.title}</div>
                      <div className="text-xs text-slate-400">{proj?.name} · {t.assignee}</div>
                    </div>
                    <div className={`text-xs font-medium flex-shrink-0 ${overdue ? "text-red-500" : "text-slate-400"}`}>
                      {t.dueDate === TODAY ? "Dziś" : t.dueDate}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: activity + quick actions */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-3">Szybkie akcje</h2>
            <div className="space-y-2">
              {[
                { label: "Nowy projekt", view: "projekty" },
                { label: "Nowe zadanie",  view: "zadania" },
                { label: "Nowa checklista", view: "checklisty" },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={() => setCurrentView(a.view)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-sm text-slate-700 hover:text-orange-700 transition-all font-medium"
                >
                  <Plus className="w-4 h-4" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900 text-sm">Ostatnia aktywność</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {activity.map((a, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{activityIcon[a.type]}</span>
                    <div>
                      <div className="text-xs text-slate-700">{a.text}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{a.project} · {a.time} temu</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats mini */}
          <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-xl p-5 text-white">
            <div className="text-sm font-semibold mb-3 opacity-90">Statystyki ogólne</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-70">Projekty aktywne</span>
                <span className="font-bold">{activeProjects.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Zadania otwarte</span>
                <span className="font-bold">{openTasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Po terminie</span>
                <span className="font-bold">{overdueTasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Ukończone</span>
                <span className="font-bold">{completedThisMth.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
