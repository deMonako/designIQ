import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, CheckSquare, ClipboardList,
  BarChart2, Package, Settings, LogOut, Menu, X, Zap, Bell,
  ChevronRight, Users, Search, Plus, User, Calendar,
  CheckCircle2, AlertCircle, RefreshCw, Calculator,
} from "lucide-react";
import { TODAY } from "./mockData";

const PRIORITIES = ["Niski", "Normalny", "Wysoki", "Krytyczny"];

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { id: "projekty",   label: "Projekty",   icon: FolderKanban,   badge: "projekty" },
  { id: "klienci",    label: "Klienci",    icon: Users,          badge: "klienci" },
  { id: "zadania",    label: "Zadania",    icon: CheckSquare,    badge: "zadania" },
  { id: "checklisty", label: "Checklisty", icon: ClipboardList },
  { id: "materialy",  label: "Materiały",  icon: Package },
  { id: "analityka",  label: "Analityka",  icon: BarChart2 },
  { id: "kalkulator", label: "Kalkulator", icon: Calculator },
];
const NAV_BOTTOM = [{ id: "ustawienia", label: "Ustawienia", icon: Settings }];

function NavLink({ item, active, onClick, badge }) {
  return (
    <button
      onClick={() => onClick(item.id)}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-400 shadow-sm"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={`w-1 h-4 rounded-full flex-shrink-0 transition-all ${active ? "bg-orange-500" : "bg-transparent"}`} />
        <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-orange-400" : "text-slate-500"}`} />
        {item.label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
          active ? "bg-orange-500 text-white" : "bg-slate-700/80 text-slate-300"
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export default function AdminLayout({
  currentView, setCurrentView, onLogout,
  projects = [], tasks = [], clients = [],
  onAddTask, onOpenProject, onNavigateToClient,
  syncStatus = "synced",
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Quick-add ──────────────────────────────────────────────────────────────
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qaForm, setQaForm] = useState({ title: "", dueDate: TODAY, priority: "Normalny", type: "task", projectId: "" });
  const qaRef = useRef(null);

  const submitQuickAdd = () => {
    if (!qaForm.title.trim() || !onAddTask) return;
    onAddTask({
      id: `t-${Date.now()}`,
      type: qaForm.type,
      projectId: qaForm.projectId || null,
      title: qaForm.title.trim(),
      assignee: "Adam",
      status: "Niezrobione",
      priority: qaForm.priority,
      dueDate: qaForm.dueDate,
      description: "",
    });
    setQaForm({ title: "", dueDate: TODAY, priority: "Normalny", type: "task", projectId: "" });
    setShowQuickAdd(false);
  };

  // ── Globalne wyszukiwanie ──────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const searchRef = useRef(null);

  const searchResults = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return { projects: [], clients: [], tasks: [] };
    return {
      projects: projects.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5),
      clients:  clients.filter(c => c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q)).slice(0, 5),
      tasks:    tasks.filter(t => t.title.toLowerCase().includes(q) && t.status !== "Zrobione").slice(0, 5),
    };
  }, [searchQ, projects, clients, tasks]);

  const noResults = searchQ.trim() && !searchResults.projects.length && !searchResults.clients.length && !searchResults.tasks.length;

  // ── Skróty klawiszowe ──────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); setShowQuickAdd(false); }
      if (e.key === "Escape") { setShowSearch(false); setShowQuickAdd(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => { if (showSearch)   setTimeout(() => searchRef.current?.focus(), 50); }, [showSearch]);
  useEffect(() => { if (showQuickAdd) setTimeout(() => qaRef.current?.focus(), 50);     }, [showQuickAdd]);

  // ── Badges ─────────────────────────────────────────────────────────────────
  const badges = {
    projekty: projects.filter(p => p.status !== "Ukończony").length || undefined,
    zadania:  tasks.filter(t => t.status !== "Zrobione").length || undefined,
    klienci:  clients.filter(c => !c.isArchived).length || undefined,
  };

  const VIEW_TITLES = {
    dashboard: "Dashboard", projekty: "Projekty", klienci: "Klienci",
    zadania: "Zadania", checklisty: "Checklisty", materialy: "Materiały",
    analityka: "Analityka", kalkulator: "Kalkulator", ustawienia: "Ustawienia",
  };

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/60">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-800/60 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/40 ring-1 ring-orange-400/20">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-none tracking-tight">designiQ</div>
          <div className="text-slate-500 text-[10px] leading-none mt-0.5 font-medium tracking-widest uppercase">Studio</div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.id} item={item}
            active={currentView === item.id}
            onClick={(id) => { setCurrentView(id); setSidebarOpen(false); }}
            badge={item.badge ? badges[item.badge] : undefined}
          />
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-slate-800/60 space-y-0.5">
        {NAV_BOTTOM.map(item => (
          <NavLink key={item.id} item={item} active={currentView === item.id}
            onClick={(id) => { setCurrentView(id); setSidebarOpen(false); }}
          />
        ))}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <span className="w-1 h-4 rounded-full flex-shrink-0" />
          <LogOut className="w-4 h-4" /> Wyloguj
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f5f6f8] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-60 flex-shrink-0 h-screen fixed left-0 top-0 z-30">
        {Sidebar}
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}
            />
            <motion.div initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed left-0 top-0 w-60 h-full z-50 lg:hidden"
            >
              <div className="h-full relative">
                {Sidebar}
                <button onClick={() => setSidebarOpen(false)}
                  className="absolute top-3.5 right-2.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-slate-900 text-sm lg:text-[15px] leading-tight tracking-tight">
                {VIEW_TITLES[currentView] || "Panel"}
              </h1>
              <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <span>designiQ</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-500 font-medium">{VIEW_TITLES[currentView]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync status chip */}
            {syncStatus === "syncing" && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Synchronizuję…</span>
              </div>
            )}
            {syncStatus === "synced" && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>Zsynchronizowano</span>
              </div>
            )}
            {syncStatus === "error" && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>Niezsynchronizowano</span>
              </div>
            )}
            <div className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-100 transition-colors cursor-default">
              <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-sm">A</div>
              <span className="hidden sm:block text-sm font-semibold text-slate-700">Adam</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* FAB – nowe zadanie */}
        <button
          onClick={() => { setShowQuickAdd(true); setShowSearch(false); }}
          className="fixed bottom-6 right-6 z-40 w-13 h-13 w-[52px] h-[52px] bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-2xl shadow-xl shadow-orange-500/35 hover:shadow-2xl hover:shadow-orange-500/45 hover:scale-105 active:scale-95 transition-all flex items-center justify-center ring-1 ring-orange-400/30"
          title="Nowe zadanie (lub Ctrl+K → szukaj)"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* ── Modal: szybkie zadanie ── */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuickAdd(false)}
          >
            <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.14 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl shadow-slate-900/15 w-full max-w-md overflow-hidden ring-1 ring-black/5"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100/80">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-orange-200">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm flex-1">Szybkie zadanie</h3>
                <button onClick={() => setShowQuickAdd(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <input
                  ref={qaRef}
                  value={qaForm.title}
                  onChange={e => setQaForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && submitQuickAdd()}
                  placeholder="Tytuł zadania…"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Termin</label>
                    <input type="date" value={qaForm.dueDate}
                      onChange={e => setQaForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Priorytet</label>
                    <select value={qaForm.priority} onChange={e => setQaForm(f => ({ ...f, priority: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    >
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Projekt</label>
                  <select value={qaForm.projectId} onChange={e => setQaForm(f => ({ ...f, projectId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="">— bez projektu —</option>
                    <option value="__designiq__">designIQ</option>
                    {projects.filter(p => p.status !== "Ukończony").map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowQuickAdd(false)}
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                  >Anuluj</button>
                  <button onClick={submitQuickAdd} disabled={!qaForm.title.trim()}
                    className="flex-1 px-3 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md transition-all"
                  >Dodaj zadanie</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: globalne wyszukiwanie ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-start justify-center pt-20 px-4"
            onClick={() => { setShowSearch(false); setSearchQ(""); }}
          >
            <motion.div initial={{ scale: 0.96, y: -8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.14 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl shadow-slate-900/15 w-full max-w-lg overflow-hidden ring-1 ring-black/5"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Szukaj projektów, klientów, zadań…"
                  className="flex-1 text-sm outline-none text-slate-900 placeholder-slate-400"
                />
                {searchQ
                  ? <button onClick={() => setSearchQ("")} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                  : <kbd className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-400 font-mono hidden sm:block">Esc</kbd>
                }
              </div>

              <div className="max-h-[22rem] overflow-y-auto">
                {!searchQ.trim() && (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">Wpisz frazę, aby wyszukać…</p>
                )}
                {noResults && (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">Brak wyników dla „{searchQ}"</p>
                )}
                {!noResults && searchQ.trim() && (
                  <div className="py-1.5">
                    {searchResults.projects.length > 0 && (
                      <div>
                        <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Projekty</p>
                        {searchResults.projects.map(p => (
                          <button key={p.id}
                            onClick={() => { onOpenProject?.(p); setShowSearch(false); setSearchQ(""); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors text-left"
                          >
                            <FolderKanban className="w-4 h-4 text-orange-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                              <p className="text-xs text-slate-400">{p.status} · {p.progress}%</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.clients.length > 0 && (
                      <div>
                        <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klienci</p>
                        {searchResults.clients.map(c => (
                          <button key={c.id}
                            onClick={() => { onNavigateToClient?.(); setShowSearch(false); setSearchQ(""); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors text-left"
                          >
                            <User className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                              <p className="text-xs text-slate-400">{c.pipelineStatus} · {c.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.tasks.length > 0 && (
                      <div>
                        <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zadania</p>
                        {searchResults.tasks.map(t => (
                          <button key={t.id}
                            onClick={() => { setCurrentView("zadania"); setShowSearch(false); setSearchQ(""); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors text-left"
                          >
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{t.title}</p>
                              <p className="text-xs text-slate-400">{t.dueDate} · {t.priority}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
