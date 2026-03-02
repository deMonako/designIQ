import React, { useState } from "react";
import AdminLogin from "../admin/AdminLogin";
import AdminLayout from "../admin/AdminLayout";
import Dashboard from "../admin/views/Dashboard";
import Projekty from "../admin/views/Projekty";
import Zadania from "../admin/views/Zadania";
import Checklisty from "../admin/views/Checklisty";
import Analityka from "../admin/views/Analityka";
import { mockProjects, mockTasks, mockChecklists } from "../admin/mockData";

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

  // State – będzie zastąpione przez GAS
  const [projects, setProjects]     = useState(mockProjects);
  const [tasks, setTasks]           = useState(mockTasks);
  const [checklists, setChecklists] = useState(mockChecklists);

  const handleLogout = () => {
    localStorage.removeItem("designiq_admin_auth");
    setIsAuthenticated(false);
  };

  // ----------- data handlers -----------
  const handleUpdateProject = (updated) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleUpdateTask = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleAddTask = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

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

  // ------------------------------------------
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
            checklists={checklists}
            setCurrentView={setCurrentView}
            setSelectedProject={setSelectedProject}
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
      case "analityka":
        return (
          <Analityka
            projects={projects}
            tasks={tasks}
            checklists={checklists}
          />
        );
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
