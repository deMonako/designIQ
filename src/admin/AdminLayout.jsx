import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, CheckSquare, ClipboardList,
  BarChart2, Package, Settings, LogOut, Menu, X, Zap, Bell, ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { id: "projekty",     label: "Projekty",     icon: FolderKanban,    badge: "projekty" },
  { id: "zadania",      label: "Zadania",      icon: CheckSquare,     badge: "zadania" },
  { id: "checklisty",   label: "Checklisty",   icon: ClipboardList },
  { id: "materialy",    label: "Materiały",    icon: Package },
  { id: "analityka",    label: "Analityka",    icon: BarChart2 },
];

const NAV_BOTTOM = [
  { id: "ustawienia", label: "Ustawienia", icon: Settings },
];

function SidebarLink({ item, active, onClick, badge }) {
  return (
    <button
      onClick={() => onClick(item.id)}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
        active
          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent"
      }`}
    >
      <span className="flex items-center gap-3">
        <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-orange-400" : "text-slate-500 group-hover:text-slate-300"}`} />
        {item.label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${active ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-300"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export default function AdminLayout({ currentView, setCurrentView, onLogout, projects, tasks, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeProjCount  = projects.filter(p => p.status !== "Ukończony").length;
  const openTaskCount    = tasks.filter(t => t.status !== "Zrobione").length;

  const getBadge = (id) => {
    if (id === "projekty") return activeProjCount;
    if (id === "zadania")  return openTaskCount;
    return undefined;
  };

  const viewTitles = {
    dashboard:  "Dashboard",
    projekty:   "Projekty",
    zadania:    "Zadania",
    checklisty: "Checklisty",
    materialy:  "Materiały",
    analityka:  "Analityka",
    ustawienia: "Ustawienia",
  };

  const Sidebar = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">designiQ</div>
          <div className="text-slate-500 text-xs leading-tight">Admin</div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <SidebarLink
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={(id) => { setCurrentView(id); setSidebarOpen(false); }}
            badge={getBadge(item.id)}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        {NAV_BOTTOM.map(item => (
          <SidebarLink
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={(id) => { setCurrentView(id); setSidebarOpen(false); }}
          />
        ))}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group border border-transparent"
        >
          <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
          Wyloguj
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 h-screen fixed left-0 top-0 z-30">
        {Sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed left-0 top-0 w-64 h-full z-50 lg:hidden"
            >
              <div className="h-full relative">
                {Sidebar}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-slate-900 text-sm lg:text-base">{viewTitles[currentView] || "Panel"}</h1>
              <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400">
                <span>Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-600">{viewTitles[currentView]}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-sm text-slate-700 font-medium">
              <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
              <span className="hidden sm:block">Marcin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
