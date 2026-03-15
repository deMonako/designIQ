import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import AdminLogin   from "../admin/AdminLogin";
import AdminLayout  from "../admin/AdminLayout";
import Dashboard    from "../admin/views/Dashboard";
import Projekty     from "../admin/views/Projekty";
import Klienci      from "../admin/views/Klienci";
import Zadania      from "../admin/views/Zadania";
import Checklisty   from "../admin/views/Checklisty";
import Analityka    from "../admin/views/Analityka";
import Materialy    from "../admin/views/Materialy";
import ZakupyView   from "../admin/views/Zakupy";
import Kalkulator   from "../admin/views/Kalkulator";
import Ustawienia   from "../admin/views/Ustawienia";
import AddProjectModal from "../admin/AddProjectModal";
import { EMPTY_KALKULATOR_SETTINGS } from "../lib/shoppingList/kalkulatorDefaults";
import {
  mockProjects, mockTasks, mockChecklists, mockMaterials,
  mockProjectDocs, mockClients, TODAY,
} from "../admin/mockData";
import { GAS_CONFIG } from "../admin/api/gasConfig";
import * as GAS from "../admin/api/gasApi";

// true gdy GAS jest w pełni skonfigurowany (enabled + scriptUrl)
const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

// ── Pomocnicze komponenty ─────────────────────────────────────────────────────

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

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 rounded-full border-[3px] border-orange-500 border-t-transparent animate-spin" />
      <span className="text-sm font-medium text-slate-500">Ładowanie danych z Google Sheets…</span>
    </div>
  );
}

function SyncErrorToast({ message, onClose }) {
  return (
    <div className="fixed bottom-5 right-5 z-[90] flex items-start gap-3 bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm animate-fade-in">
      <span className="flex-1 leading-snug">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white font-bold text-lg leading-none mt-0.5 flex-shrink-0">×</button>
    </div>
  );
}

// Lazy init z localStorage + fallback na mockData
function ls(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch { return fallback; }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem("designiq_admin_auth") === "1"
  );
  const [currentView,        setCurrentView]        = useState("dashboard");
  const [selectedProject,    setSelectedProject]    = useState(null);
  const [addProjectOpen,     setAddProjectOpen]     = useState(false);
  const [addProjectClientId, setAddProjectClientId] = useState(null);
  const [loading,            setLoading]            = useState(GAS_ON);
  const [syncError,          setSyncError]          = useState(null);
  const [syncStatus,         setSyncStatus]         = useState("synced"); // "synced" | "syncing" | "error"
  const [zakupyInitProjectId, setZakupyInitProjectId] = useState(null);

  // ── State (inicjalizacja zależy od trybu) ──────────────────────────────────
  const [clients, setClients] = useState(() =>
    GAS_ON ? [] : ls("diq_clients", mockClients)
  );

  const [projects, setProjects] = useState(() => {
    if (GAS_ON) return [];
    // Migracja: uzupełnij pola dodane po zapisaniu do localStorage
    const stored = ls("diq_projects", mockProjects);
    return stored.map(p => {
      const mock = mockProjects.find(m => m.id === p.id);
      if (!mock) return p;
      return { ...p, code: mock.code, stageSchedule: p.stageSchedule || mock.stageSchedule };
    });
  });

  const [tasks,       setTasks]       = useState(() => GAS_ON ? [] : ls("diq_tasks",       mockTasks));
  const [checklists,  setChecklists]  = useState(() => GAS_ON ? [] : ls("diq_checklists",  mockChecklists));
  const [materials,   setMaterials]   = useState(() => GAS_ON ? [] : ls("diq_materials",   mockMaterials));
  const [projectDocs, setProjectDocs] = useState(() => GAS_ON ? [] : ls("diq_projectDocs", mockProjectDocs));
  const [leads,       setLeads]       = useState(() => GAS_ON ? [] : ls("diq_leads", []));
  const [kalkulatorSettings, setKalkulatorSettings] = useState(() =>
    ls("diq_kalkulator_settings", EMPTY_KALKULATOR_SETTINGS)
  );

  // ── Ładowanie danych z GAS (jednorazowo po zalogowaniu) ───────────────────
  useEffect(() => {
    if (!GAS_ON) return;
    Promise.all([
      GAS.getClients(),
      GAS.getProjects(),
      GAS.getTasks(),
      GAS.getChecklists(),
      GAS.getMaterials(),
      GAS.getProjectDocs(),
      GAS.getLeads(),
    ]).then(([c, p, t, cl, m, d, l]) => {
      setClients(c);
      setProjects(p);
      setTasks(t);
      setChecklists(cl);
      setMaterials(m);
      setProjectDocs(d);
      setLeads(l);
    }).catch(e => {
      setSyncError("Błąd ładowania danych z GAS: " + e.message);
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── localStorage (tylko gdy GAS wyłączony) ────────────────────────────────
  useEffect(() => { if (!GAS_ON) localStorage.setItem("diq_clients",     JSON.stringify(clients));     }, [clients]);
  useEffect(() => { if (!GAS_ON) localStorage.setItem("diq_projects",    JSON.stringify(projects));    }, [projects]);
  useEffect(() => { if (!GAS_ON) localStorage.setItem("diq_tasks",       JSON.stringify(tasks));       }, [tasks]);
  useEffect(() => { if (!GAS_ON) localStorage.setItem("diq_checklists",  JSON.stringify(checklists));  }, [checklists]);
  useEffect(() => { if (!GAS_ON) localStorage.setItem("diq_materials",   JSON.stringify(materials));   }, [materials]);
  useEffect(() => { if (!GAS_ON) localStorage.setItem("diq_projectDocs", JSON.stringify(projectDocs)); }, [projectDocs]);
  useEffect(() => { if (!GAS_ON) localStorage.setItem("diq_leads",       JSON.stringify(leads));       }, [leads]);
  useEffect(() => { localStorage.setItem("diq_kalkulator_settings", JSON.stringify(kalkulatorSettings)); }, [kalkulatorSettings]);

  const handleLogout = () => {
    localStorage.removeItem("designiq_admin_auth");
    setIsAuthenticated(false);
  };

  const syncErr = (msg) => {
    setSyncError(msg);
    setSyncStatus("error");
  };

  // Wrap a GAS call: sets syncing → synced/error, handles errors
  const gasSync = async (fn, onError) => {
    if (!GAS_ON) return;
    setSyncStatus("syncing");
    try {
      await fn();
      setSyncStatus("synced");
    } catch (e) {
      onError?.();
      setSyncStatus("error");
    }
  };

  // ── Clients ───────────────────────────────────────────────────────────────
  const handleAddClient = async (c) => {
    setClients(prev => [c, ...prev]);
    await gasSync(() => GAS.createClient(c), () => {
      setClients(prev => prev.filter(x => x.id !== c.id));
      syncErr("Błąd dodawania klienta");
    });
  };

  const handleUpdateClient = async (c) => {
    const snap = clients.find(x => x.id === c.id);
    setClients(prev => prev.map(x => x.id === c.id ? c : x));
    await gasSync(() => GAS.updateClient(c), () => {
      if (snap) setClients(prev => prev.map(x => x.id === c.id ? snap : x));
      syncErr("Błąd aktualizacji klienta");
    });
  };

  const handleDeleteClient = async (id) => {
    const snap = clients.find(x => x.id === id);
    setClients(prev => prev.filter(c => c.id !== id));
    await gasSync(() => GAS.deleteClient(id), () => {
      if (snap) setClients(prev => [snap, ...prev]);
      syncErr("Błąd usuwania klienta");
    });
  };

  // ── Projects ──────────────────────────────────────────────────────────────
  const handleUpdateProject = async (p) => {
    const snap = projects.find(x => x.id === p.id);
    setProjects(prev => prev.map(x => x.id === p.id ? p : x));
    if (selectedProject?.id === p.id) setSelectedProject(p);
    await gasSync(() => GAS.updateProject(p), () => {
      if (snap) setProjects(prev => prev.map(x => x.id === p.id ? snap : x));
      syncErr("Błąd aktualizacji projektu");
    });
  };

  const handleDeleteProject = async (id) => {
    const snapProject    = projects.find(p  => p.id        === id);
    const snapDocs       = projectDocs.filter(d  => d.projectId === id);
    const snapTasks      = tasks.filter(t  => t.projectId === id);
    const snapChecklists = checklists.filter(cl => cl.projectId === id);
    setProjects(prev    => prev.filter(p  => p.id        !== id));
    setProjectDocs(prev => prev.filter(d  => d.projectId !== id));
    setTasks(prev       => prev.filter(t  => t.projectId !== id));
    setChecklists(prev  => prev.filter(cl => cl.projectId !== id));
    if (selectedProject?.id === id) setSelectedProject(null);
    await gasSync(() => GAS.deleteProject(id), () => {
      if (snapProject) setProjects(prev => [snapProject, ...prev]);
      setProjectDocs(prev => [...prev, ...snapDocs]);
      setTasks(prev       => [...prev, ...snapTasks]);
      setChecklists(prev  => [...prev, ...snapChecklists]);
      syncErr("Błąd usuwania projektu – przywrócono dane lokalnie");
    });
  };

  const handleAddProject = async (project, newClientData) => {
    let finalProject = project;
    let newClient    = null;
    if (newClientData) {
      newClient    = { ...newClientData, id: `cl-${Date.now()}`, createdDate: TODAY, isArchived: false };
      setClients(prev => [newClient, ...prev]);
      finalProject = { ...project, clientId: newClient.id };
    }
    setProjects(prev => [finalProject, ...prev]);
    setAddProjectOpen(false);
    setAddProjectClientId(null);
    setSelectedProject(finalProject);
    setCurrentView("projekty");
    await gasSync(async () => {
      if (newClient) await GAS.createClient(newClient);
      await GAS.createProject(finalProject);
    }, () => syncErr("Błąd tworzenia projektu"));
  };

  const openAddProject = (clientId = null) => {
    setAddProjectClientId(clientId ?? null);
    setAddProjectOpen(true);
  };

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const handleAddTask = async (t) => {
    setTasks(prev => [t, ...prev]);
    await gasSync(() => GAS.createTask(t), () => {
      setTasks(prev => prev.filter(x => x.id !== t.id));
      syncErr("Błąd dodawania zadania");
    });
  };

  const handleUpdateTask = async (t) => {
    const snap = tasks.find(x => x.id === t.id);
    setTasks(prev => prev.map(x => x.id === t.id ? t : x));
    await gasSync(() => GAS.updateTask(t), () => {
      if (snap) setTasks(prev => prev.map(x => x.id === t.id ? snap : x));
      syncErr("Błąd aktualizacji zadania");
    });
  };

  const handleDeleteTask = async (id) => {
    const snap = tasks.find(x => x.id === id);
    setTasks(prev => prev.filter(x => x.id !== id));
    await gasSync(() => GAS.deleteTask(id), () => {
      if (snap) setTasks(prev => [snap, ...prev]);
      syncErr("Błąd usuwania zadania");
    });
  };

  // ── Checklists ────────────────────────────────────────────────────────────
  const handleToggleChecklistItem = async (clId, itemId) => {
    setChecklists(prev => prev.map(cl => cl.id !== clId ? cl : {
      ...cl, items: cl.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i),
    }));
    await gasSync(() => GAS.toggleChecklistItem(clId, itemId), () =>
      syncErr("Błąd aktualizacji checklisty")
    );
  };

  const handleAddChecklistItem = async (clId, text) => {
    const newItem = { id: `chi-${Date.now()}`, text, done: false };
    setChecklists(prev => prev.map(cl => cl.id !== clId ? cl : {
      ...cl, items: [...cl.items, newItem],
    }));
    if (GAS_ON) {
      try { await GAS.addChecklistItem(clId, text); }
      catch { syncErr("Błąd dodawania punktu checklisty"); }
    }
  };

  const handleAddChecklist = async (cl) => {
    setChecklists(prev => [cl, ...prev]);
    if (GAS_ON) {
      try { await GAS.createChecklist(cl); }
      catch { setChecklists(prev => prev.filter(x => x.id !== cl.id)); syncErr("Błąd dodawania checklisty"); }
    }
  };

  const handleDeleteChecklist = async (id) => {
    const snap = checklists.find(x => x.id === id);
    setChecklists(prev => prev.filter(cl => cl.id !== id));
    if (GAS_ON) {
      try { await GAS.deleteChecklist(id); }
      catch {
        if (snap) setChecklists(prev => [snap, ...prev]);
        syncErr("Błąd usuwania checklisty");
      }
    }
  };

  // ── Materials ─────────────────────────────────────────────────────────────
  const handleAddMaterial = async (m) => {
    setMaterials(prev => [m, ...prev]);
    await gasSync(() => GAS.createMaterial(m), () => {
      setMaterials(prev => prev.filter(x => x.id !== m.id));
      syncErr("Błąd dodawania materiału");
    });
  };

  const handleDeleteMaterial = async (id) => {
    const snap = materials.find(x => x.id === id);
    setMaterials(prev => prev.filter(m => m.id !== id));
    await gasSync(() => GAS.deleteMaterial(id), () => {
      if (snap) setMaterials(prev => [snap, ...prev]);
      syncErr("Błąd usuwania materiału");
    });
  };

  // ── Leads ─────────────────────────────────────────────────────────────────
  const handleUpdateLead = async (lead) => {
    const snap = leads.find(x => x.id === lead.id);
    setLeads(prev => prev.map(x => x.id === lead.id ? lead : x));
    await gasSync(() => GAS.updateLead(lead), () => {
      if (snap) setLeads(prev => prev.map(x => x.id === lead.id ? snap : x));
      syncErr("Błąd aktualizacji leada");
    });
  };

  const handleDeleteLead = async (id) => {
    const snap = leads.find(x => x.id === id);
    setLeads(prev => prev.filter(l => l.id !== id));
    await gasSync(() => GAS.deleteLead(id), () => {
      if (snap) setLeads(prev => [snap, ...prev]);
      syncErr("Błąd usuwania leada");
    });
  };

  // ── Project docs ──────────────────────────────────────────────────────────
  const handleAddProjectDoc = async (d) => {
    // Optimistic add – nie wycofuj nawet gdy GAS zawiedzie (plik jest już na Drive)
    setProjectDocs(prev => [...prev, d]);
    await gasSync(() => GAS.createProjectDoc(d), () =>
      syncErr("Plik przesłano na Drive, ale zapis do arkusza nie powiódł się")
    );
  };

  const handleDeleteProjectDoc = async (id) => {
    const snap = projectDocs.find(x => x.id === id);
    setProjectDocs(prev => prev.filter(d => d.id !== id));
    await gasSync(() => GAS.deleteProjectDoc(id), () => {
      if (snap) setProjectDocs(prev => [...prev, snap]);
      syncErr("Błąd usuwania dokumentu");
    });
  };

  const handleToggleDocClientVisible = async (id) => {
    const doc = projectDocs.find(d => d.id === id);
    const newVisible = !(doc?.clientVisible ?? false);
    setProjectDocs(prev => prev.map(d => d.id === id ? { ...d, clientVisible: newVisible } : d));
    await gasSync(() => GAS.toggleDocClientVisible(id, newVisible), () =>
      syncErr("Błąd zmiany widoczności dokumentu")
    );
  };

  // ── Odświeżanie danych z GAS ──────────────────────────────────────────────
  const handleRefresh = async () => {
    if (!GAS_ON) return;
    setSyncStatus("syncing");
    try {
      const [c, p, t, cl, m, d, l] = await Promise.all([
        GAS.getClients(),
        GAS.getProjects(),
        GAS.getTasks(),
        GAS.getChecklists(),
        GAS.getMaterials(),
        GAS.getProjectDocs(),
        GAS.getLeads(),
      ]);
      setClients(c);
      setProjects(p);
      setTasks(t);
      setChecklists(cl);
      setMaterials(m);
      setProjectDocs(d);
      setLeads(l);
      setSyncStatus("synced");
    } catch (e) {
      setSyncError("Błąd odświeżania danych: " + e.message);
      setSyncStatus("error");
    }
  };

  // ── Nawigacja ─────────────────────────────────────────────────────────────
  const openProject      = (project) => { setSelectedProject(project); setCurrentView("projekty"); };
  const navigateToClient = () => setCurrentView("klienci");
  const navigateToZakupy = (project) => {
    setZakupyInitProjectId(project?.id ?? null);
    setSelectedProject(null);
    setCurrentView("zakupy");
  };

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!isAuthenticated) return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;

  // ── Widoki ────────────────────────────────────────────────────────────────
  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            projects={projects} tasks={tasks} clients={clients}
            onUpdateTask={handleUpdateTask} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask}
            onSelectProject={(p) => { setSelectedProject(p); setCurrentView("projekty"); }}
          />
        );
      case "projekty":
        return (
          <Projekty
            projects={projects} tasks={tasks} checklists={checklists}
            clients={clients}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAddChecklist={handleAddChecklist}
            onToggleChecklistItem={handleToggleChecklistItem}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            projectDocs={projectDocs}
            onAddProjectDoc={handleAddProjectDoc}
            onDeleteProjectDoc={handleDeleteProjectDoc}
            onToggleDocClientVisible={handleToggleDocClientVisible}
            onOpenAddProject={openAddProject}
            onNavigateToZakupy={navigateToZakupy}
          />
        );
      case "klienci":
        return (
          <Klienci
            clients={clients} projects={projects}
            leads={leads}
            onAddClient={handleAddClient} onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead}
            onNavigateToProject={(p) => { setSelectedProject(p); setCurrentView("projekty"); }}
            onOpenAddProject={openAddProject}
          />
        );
      case "zadania":
        return <Zadania projects={projects} tasks={tasks} onUpdateTask={handleUpdateTask} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} />;
      case "checklisty":
        return (
          <Checklisty
            projects={projects} checklists={checklists}
            onToggleItem={handleToggleChecklistItem} onAddItem={handleAddChecklistItem}
            onAddChecklist={handleAddChecklist} onDeleteChecklist={handleDeleteChecklist}
          />
        );
      case "zakupy":
        return <ZakupyView projects={projects} initialProjectId={zakupyInitProjectId} />;
      case "baza_wiedzy":
        return <Materialy materials={materials} onAddMaterial={handleAddMaterial} onDeleteMaterial={handleDeleteMaterial} />;
      case "analityka":
        return (
          <Analityka
            projects={projects} tasks={tasks} checklists={checklists} clients={clients}
            onNavigateToProject={(p) => { setSelectedProject(p); setCurrentView("projekty"); }}
          />
        );
      case "kalkulator":
        return <Kalkulator projects={projects} kalkulatorSettings={kalkulatorSettings} />;
      case "ustawienia":
        return (
          <Ustawienia
            kalkulatorSettings={kalkulatorSettings}
            onUpdateKalkulatorSettings={setKalkulatorSettings}
          />
        );
      default:
        return <PlaceholderView title={currentView} />;
    }
  };

  return (
    <>
      {loading   && <LoadingOverlay />}
      {syncError && <SyncErrorToast message={syncError} onClose={() => setSyncError(null)} />}

      <AdminLayout
        currentView={currentView}
        setCurrentView={(view) => { setCurrentView(view); setSelectedProject(null); if (view !== "zakupy") setZakupyInitProjectId(null); }}
        onLogout={handleLogout}
        projects={projects} tasks={tasks} clients={clients}
        onAddTask={handleAddTask}
        onOpenProject={openProject}
        onNavigateToClient={navigateToClient}
        syncStatus={syncStatus}
        onRefresh={GAS_ON ? handleRefresh : undefined}
      >
        {renderView()}
      </AdminLayout>

      <AnimatePresence>
        {addProjectOpen && (
          <AddProjectModal
            clients={clients}
            projects={projects}
            initialClientId={addProjectClientId}
            onAdd={handleAddProject}
            onClose={() => { setAddProjectOpen(false); setAddProjectClientId(null); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
