import React from "react";
import { motion } from "framer-motion";
import { FolderKanban, CheckSquare, AlertTriangle, TrendingUp, Users, Banknote } from "lucide-react";
import { isOverdue } from "../mockData";

function HorizontalBar({ label, value, max, color, count }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-slate-600 text-right flex-shrink-0">{label}</div>
      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <div className="w-6 text-xs font-bold text-slate-700 flex-shrink-0">{count}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function Analityka({ projects, tasks, checklists }) {
  // Project stats
  const statuses = ["Wstępny", "W trakcie", "Wstrzymany", "Ukończony"];
  const statusCounts = statuses.map(s => ({ label: s, count: projects.filter(p => p.status === s).length }));
  const maxStatusCount = Math.max(...statusCounts.map(s => s.count), 1);

  const packages = ["Smart design", "Smart design+", "Full house"];
  const packageCounts = packages.map(pkg => ({ label: pkg, count: projects.filter(p => p.package === pkg).length }));
  const maxPkgCount = Math.max(...packageCounts.map(p => p.count), 1);

  // Task stats
  const taskStatuses = ["Todo", "W trakcie", "Zrobione"];
  const taskStatusCounts = taskStatuses.map(s => ({ label: s, count: tasks.filter(t => t.status === s).length }));
  const maxTaskCount = Math.max(...taskStatusCounts.map(t => t.count), 1);

  const priorities = ["Krytyczny", "Wysoki", "Normalny", "Niski"];
  const priorityCounts = priorities.map(p => ({ label: p, count: tasks.filter(t => t.priority === p).length }));
  const maxPriorityCount = Math.max(...priorityCounts.map(p => p.count), 1);

  // Assignee workload
  const assignees = [...new Set(tasks.map(t => t.assignee))];
  const assigneeData = assignees.map(a => ({
    name: a,
    total: tasks.filter(t => t.assignee === a).length,
    open:  tasks.filter(t => t.assignee === a && t.status !== "Zrobione").length,
  }));
  const maxAssignee = Math.max(...assigneeData.map(a => a.total), 1);

  // Checklist stats
  const totalCheckItems = checklists.reduce((acc, cl) => acc + cl.items.length, 0);
  const doneCheckItems  = checklists.reduce((acc, cl) => acc + cl.items.filter(i => i.done).length, 0);

  // Budget
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const activeBudget = projects.filter(p => p.status !== "Ukończony").reduce((acc, p) => acc + p.budget, 0);

  // Avg progress of active projects
  const active = projects.filter(p => p.status === "W trakcie");
  const avgProgress = active.length > 0 ? Math.round(active.reduce((acc, p) => acc + p.progress, 0) / active.length) : 0;
  const overdueCount = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;

  const statusBarColors = {
    "Wstępny": "bg-slate-400", "W trakcie": "bg-blue-500", "Wstrzymany": "bg-amber-500", "Ukończony": "bg-green-500",
  };
  const pkgBarColors = { "Smart design": "bg-slate-500", "Smart design+": "bg-indigo-500", "Full house": "bg-orange-500" };
  const taskStatusColors = { "Todo": "bg-slate-400", "W trakcie": "bg-blue-500", "Zrobione": "bg-green-500" };
  const priorityColors = { "Krytyczny": "bg-red-500", "Wysoki": "bg-orange-500", "Normalny": "bg-blue-400", "Niski": "bg-slate-400" };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Aktywne projekty" value={active.length} sub={`${avgProgress}% śr. postęp`} color="bg-blue-500" />
        <StatCard icon={CheckSquare} label="Zadania otwarte" value={tasks.filter(t => t.status !== "Zrobione").length} sub={`z ${tasks.length} łącznie`} color="bg-orange-500" />
        <StatCard icon={AlertTriangle} label="Po terminie" value={overdueCount} sub={overdueCount > 0 ? "Wymaga uwagi" : "OK"} color={overdueCount > 0 ? "bg-red-500" : "bg-green-500"} />
        <StatCard icon={Banknote} label="Budżet aktywny" value={`${(activeBudget / 1000).toFixed(0)}k zł`} sub={`łącznie: ${(totalBudget / 1000).toFixed(0)}k zł`} color="bg-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-orange-500" />
            Projekty wg statusu
          </h3>
          <div className="space-y-3">
            {statusCounts.map(s => (
              <HorizontalBar key={s.label} label={s.label} value={s.count} max={maxStatusCount} count={s.count} color={statusBarColors[s.label]} />
            ))}
          </div>
        </div>

        {/* Projects by package */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Projekty wg pakietu
          </h3>
          <div className="space-y-3">
            {packageCounts.map(p => (
              <HorizontalBar key={p.label} label={p.label} value={p.count} max={maxPkgCount} count={p.count} color={pkgBarColors[p.label]} />
            ))}
          </div>
        </div>

        {/* Tasks by status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-orange-500" />
            Zadania wg statusu
          </h3>
          <div className="space-y-3">
            {taskStatusCounts.map(s => (
              <HorizontalBar key={s.label} label={s.label} value={s.count} max={maxTaskCount} count={s.count} color={taskStatusColors[s.label]} />
            ))}
          </div>
        </div>

        {/* Tasks by priority */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Zadania wg priorytetu
          </h3>
          <div className="space-y-3">
            {priorityCounts.map(p => (
              <HorizontalBar key={p.label} label={p.label} value={p.count} max={maxPriorityCount} count={p.count} color={priorityColors[p.label]} />
            ))}
          </div>
        </div>

        {/* Assignee workload */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            Obciążenie zadaniami
          </h3>
          <div className="space-y-4">
            {assigneeData.map(a => (
              <div key={a.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {a.name[0]}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{a.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{a.open} otwartych / {a.total} łącznie</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(a.total / maxAssignee) * 100}%` }}
                    transition={{ duration: 0.7 }}
                    className="h-full bg-orange-400 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checklists + project progress */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Postęp checklist</h3>
            <div className="text-center py-2">
              <div className="text-4xl font-bold text-orange-600">
                {totalCheckItems > 0 ? Math.round((doneCheckItems / totalCheckItems) * 100) : 0}%
              </div>
              <div className="text-sm text-slate-500 mt-1">{doneCheckItems} z {totalCheckItems} punktów ukończonych</div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: totalCheckItems > 0 ? `${(doneCheckItems / totalCheckItems) * 100}%` : "0%" }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Postęp aktywnych projektów</h3>
            <div className="space-y-3">
              {projects.filter(p => p.status === "W trakcie").map(p => (
                <div key={p.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 truncate max-w-[60%]">{p.name}</span>
                    <span className="font-semibold text-slate-700">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      transition={{ duration: 0.7 }}
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
