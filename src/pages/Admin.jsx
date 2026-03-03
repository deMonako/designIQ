import React, { useState } from "react";
import AdminLogin from "../admin/AdminLogin";
import AdminLayout from "../admin/AdminLayout";
import Dashboard from "../admin/views/Dashboard";
import Projekty from "../admin/views/Projekty";
import Zadania from "../admin/views/Zadania";
import Checklisty from "../admin/views/Checklisty";
import Analityka from "../admin/views/Analityka";
import Materialy from "../admin/views/Materialy";
import Kalkulator from "../admin/views/Kalkulator";
import { mockProjects, mockTasks, mockChecklists, mockMaterials, mockProjectDocs } from "../admin/mockData";

function PlaceholderView({ title }) {
  return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-center text-slate-400">
        <div className="text-4xl mb-3">🚧</div>
        <div className="font-semibold text-slate-600">{title}</div>
        <div className="text-sm mt-1">Sekcja w przygotowaniu – backend GAS w kolejnej iteracji</div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem("designiq_admin_auth") === "1"
  );
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState(null);

  // ── State (mock – zastąpione przez GAS) ──
  const [projects,     setProjects]     = useState(mockProjects);
  const [tasks,        setTasks]        = useState(mockTasks);
  const [checklists,   setChecklists]   = useState(mockChecklists);
  const [materials,    setMaterials]    = useState(mockMaterials);
  const [projectDocs,  setProjectDocs]  = useState(mockProjectDocs);

  const handleLogout = () => {
    localStorage.removeItem("designiq_admin_auth");
    setIsAuthenticated(false);
  };

  // ── Projects ──
  const handleUpdateProject = (updated) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  // ── Tasks ──
  const handleUpdateTask = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };
  const handleAddTask = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

  // ── Checklists ──
  const handleToggleChecklistItem = (checklistId, itemId) => {
    setChecklists(prev => prev.map(cl => {
      if (cl.id !== checklistId) return cl;
      return { ...cl, items: cl.items.map(item => item.id === itemId ? { ...item, done: !item.done } : item) };
    }));
  };
  const handleAddChecklistItem = (checklistId, text) => {
    setChecklists(prev => prev.map(cl => {
      if (cl.id !== checklistId) return cl;
      return { ...cl, items: [...cl.items, { id: `chi-${Date.now()}`, text, done: false }] };
    }));
  };
  const handleAddChecklist = (newChecklist) => {
    setChecklists(prev => [newChecklist, ...prev]);
  };
  const handleDeleteChecklist = (id) => {
    setChecklists(prev => prev.filter(cl => cl.id !== id));
  };

  // ── Materials ──
  const handleAddMaterial = (newMaterial) => {
    setMaterials(prev => [newMaterial, ...prev]);
  };
  const handleDeleteMaterial = (id) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  // ── Project docs ──
  const handleAddProjectDoc = (newDoc) => {
    setProjectDocs(prev => [...prev, newDoc]);
  };
  const handleDeleteProjectDoc = (id) => {
    setProjectDocs(prev => prev.filter(d => d.id !== id));
  };
  const handleToggleDocClientVisible = (id) => {
    setProjectDocs(prev => prev.map(d => d.id === id ? { ...d, clientVisible: !d.clientVisible } : d));
  };

  // ──────────────────────────────────────────
  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            projects={projects}
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
          />
        );
      case "projekty":
        return (
          <Projekty
            projects={projects}
            tasks={tasks}
            checklists={checklists}
            onUpdateProject={handleUpdateProject}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            projectDocs={projectDocs}
            onAddProjectDoc={handleAddProjectDoc}
            onDeleteProjectDoc={handleDeleteProjectDoc}
            onToggleDocClientVisible={handleToggleDocClientVisible}
          />
        );
      case "zadania":
        return (
          <Zadania
            projects={projects}
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onAddTask={handleAddTask}
          />
        );
      case "checklisty":
        return (
          <Checklisty
            projects={projects}
            checklists={checklists}
            onToggleItem={handleToggleChecklistItem}
            onAddItem={handleAddChecklistItem}
            onAddChecklist={handleAddChecklist}
            onDeleteChecklist={handleDeleteChecklist}
          />
        );
      case "materialy":
        return (
          <Materialy
            materials={materials}
            onAddMaterial={handleAddMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        );
      case "analityka":
        return (
          <Analityka
            projects={projects}
            tasks={tasks}
            checklists={checklists}
          />
        );
      case "kalkulator":
        return <Kalkulator />;
      case "ustawienia":
        return <PlaceholderView title="Ustawienia" />;
      default:
        return <PlaceholderView title={currentView} />;
    }
  };

  return (
    <AdminLayout
      currentView={currentView}
      setCurrentView={(view) => {
        setCurrentView(view);
        setSelectedProject(null);
      }}
      onLogout={handleLogout}
      projects={projects}
      tasks={tasks}
    >
      {renderView()}
    </AdminLayout>
  );
}
