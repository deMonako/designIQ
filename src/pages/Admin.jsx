import React, { useState, useEffect } from "react";
import AdminLogin from "../admin/AdminLogin";
import AdminLayout from "../admin/AdminLayout";
import Dashboard from "../admin/views/Dashboard";
import Projekty from "../admin/views/Projekty";
import Klienci from "../admin/views/Klienci";
import Zadania from "../admin/views/Zadania";
import Checklisty from "../admin/views/Checklisty";
import Analityka from "../admin/views/Analityka";
import Materialy from "../admin/views/Materialy";
import { mockProjects, mockTasks, mockChecklists, mockMaterials, mockProjectDocs, mockClients } from "../admin/mockData";

// ── Przełączenie na GAS ────────────────────────────────────────────────────────
// Gdy backend GAS będzie gotowy:
// 1. import { GAS_CONFIG, getProjects, getTasks, ... } from "../admin/api";
// 2. Ustaw GAS_CONFIG.enabled = true w admin/api/gasConfig.js
// 3. Zamień inicjalizację stanu na:
//    const [projects, setProjects] = useState([]);
//    useEffect(() => { getProjects().then(setProjects); }, []);
// 4. Zamień handlery na wywołania API + lokalny setState dla optymistycznych aktualizacji
// ──────────────────────────────────────────────────────────────────────────────

function PlaceholderView({ title }) {
  return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-center text-slate-400">
        <div className="text-4xl mb-3">🚧</div>
        <div className="font-semibold text-slate-600">{title}</div>
        <div className="text-sm mt-1">Sekcja w przygotowaniu</div>
      </div>
    </div>
  );
}

// Lazy init z localStorage + fallback na mockData
function ls(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch { return fallback; }
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem("designiq_admin_auth") === "1"
  );
  const [currentView,    setCurrentView]    = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState(null);

  // ── State z persystencją (mock → zastąpione przez GAS) ────────────────────
  const [clients,     setClients]     = useState(() => ls("diq_clients",     mockClients));
  const [projects,    setProjects]    = useState(() => {
    // Migracja: uzupełnij pola dodane po zapisaniu do localStorage (code, stageSchedule)
    const stored = ls("diq_projects", mockProjects);
    return stored.map(p => {
      const mock = mockProjects.find(m => m.id === p.id);
      if (!mock) return p;
      return {
        code:          mock.code,
        stageSchedule: mock.stageSchedule,
        ...p,  // user-changed fields override (status, progress, notes, etc.)
      };
    });
  });
  const [tasks,       setTasks]       = useState(() => ls("diq_tasks",       mockTasks));
  const [checklists,  setChecklists]  = useState(() => ls("diq_checklists",  mockChecklists));
  const [materials,   setMaterials]   = useState(() => ls("diq_materials",   mockMaterials));
  const [projectDocs, setProjectDocs] = useState(() => ls("diq_projectDocs", mockProjectDocs));

  // Persystencja każdej zmiany stanu
  useEffect(() => { localStorage.setItem("diq_clients",     JSON.stringify(clients));     }, [clients]);
  useEffect(() => { localStorage.setItem("diq_projects",    JSON.stringify(projects));    }, [projects]);
  useEffect(() => { localStorage.setItem("diq_tasks",       JSON.stringify(tasks));       }, [tasks]);
  useEffect(() => { localStorage.setItem("diq_checklists",  JSON.stringify(checklists));  }, [checklists]);
  useEffect(() => { localStorage.setItem("diq_materials",   JSON.stringify(materials));   }, [materials]);
  useEffect(() => { localStorage.setItem("diq_projectDocs", JSON.stringify(projectDocs)); }, [projectDocs]);

  const handleLogout = () => {
    localStorage.removeItem("designiq_admin_auth");
    setIsAuthenticated(false);
  };

  // ── Clients ───────────────────────────────────────────────────────────────
  const handleAddClient    = (c) => setClients(prev => [c, ...prev]);
  const handleUpdateClient = (c) => setClients(prev => prev.map(x => x.id === c.id ? c : x));

  // ── Projects ──────────────────────────────────────────────────────────────
  const handleUpdateProject = (p) => setProjects(prev => prev.map(x => x.id === p.id ? p : x));

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const handleAddTask    = (t) => setTasks(prev => [t, ...prev]);
  const handleUpdateTask = (t) => setTasks(prev => prev.map(x => x.id === t.id ? t : x));

  // ── Checklists ────────────────────────────────────────────────────────────
  const handleToggleChecklistItem = (clId, itemId) =>
    setChecklists(prev => prev.map(cl => cl.id !== clId ? cl : {
      ...cl, items: cl.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i),
    }));
  const handleAddChecklistItem = (clId, text) =>
    setChecklists(prev => prev.map(cl => cl.id !== clId ? cl : {
      ...cl, items: [...cl.items, { id: `chi-${Date.now()}`, text, done: false }],
    }));
  const handleAddChecklist    = (cl) => setChecklists(prev => [cl, ...prev]);
  const handleDeleteChecklist = (id) => setChecklists(prev => prev.filter(cl => cl.id !== id));

  // ── Materials ─────────────────────────────────────────────────────────────
  const handleAddMaterial    = (m) => setMaterials(prev => [m, ...prev]);
  const handleDeleteMaterial = (id) => setMaterials(prev => prev.filter(m => m.id !== id));

  // ── Project docs ──────────────────────────────────────────────────────────
  const handleAddProjectDoc          = (d) => setProjectDocs(prev => [...prev, d]);
  const handleDeleteProjectDoc       = (id) => setProjectDocs(prev => prev.filter(d => d.id !== id));
  const handleToggleDocClientVisible = (id) => setProjectDocs(prev => prev.map(d => d.id === id ? { ...d, clientVisible: !d.clientVisible } : d));

  // ── Nawigacja z wyszukiwarki ───────────────────────────────────────────────
  const openProject = (project) => {
    setSelectedProject(project);
    setCurrentView("projekty");
  };
  const navigateToClient = () => setCurrentView("klienci");

  // ──────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            projects={projects} tasks={tasks} clients={clients}
            onUpdateTask={handleUpdateTask}
            onSelectProject={(p) => { setSelectedProject(p); setCurrentView("projekty"); }}
          />
        );
      case "projekty":
        return (
          <Projekty
            projects={projects} tasks={tasks} checklists={checklists}
            clients={clients}
            onUpdateProject={handleUpdateProject}
            onAddTask={handleAddTask}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            projectDocs={projectDocs}
            onAddProjectDoc={handleAddProjectDoc}
            onDeleteProjectDoc={handleDeleteProjectDoc}
            onToggleDocClientVisible={handleToggleDocClientVisible}
          />
        );
      case "klienci":
        return (
          <Klienci
            clients={clients} projects={projects}
            onAddClient={handleAddClient} onUpdateClient={handleUpdateClient}
            onNavigateToProject={(p) => { setSelectedProject(p); setCurrentView("projekty"); }}
          />
        );
      case "zadania":
        return <Zadania projects={projects} tasks={tasks} onUpdateTask={handleUpdateTask} onAddTask={handleAddTask} />;
      case "checklisty":
        return (
          <Checklisty
            projects={projects} checklists={checklists}
            onToggleItem={handleToggleChecklistItem} onAddItem={handleAddChecklistItem}
            onAddChecklist={handleAddChecklist} onDeleteChecklist={handleDeleteChecklist}
          />
        );
      case "materialy":
        return <Materialy materials={materials} onAddMaterial={handleAddMaterial} onDeleteMaterial={handleDeleteMaterial} />;
      case "analityka":
        return <Analityka projects={projects} tasks={tasks} checklists={checklists} clients={clients} />;
      case "ustawienia":
        return <PlaceholderView title="Ustawienia" />;
      default:
        return <PlaceholderView title={currentView} />;
    }
  };

  return (
    <AdminLayout
      currentView={currentView}
      setCurrentView={(view) => { setCurrentView(view); setSelectedProject(null); }}
      onLogout={handleLogout}
      projects={projects} tasks={tasks} clients={clients}
      onAddTask={handleAddTask}
      onOpenProject={openProject}
      onNavigateToClient={navigateToClient}
    >
      {renderView()}
    </AdminLayout>
  );
}
