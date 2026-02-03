'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { RoleProtectedRoute } from '@/auth/components/RoleProtectedRoute';
import { useRole } from '@/auth/hooks/useRole';
import {
  Project,
  ProjectStats,
  UserWithRole,
  AppSettings,
  projectsApi,
  statsApi,
  usersApi,
  settingsApi,
} from '@/services/fundApi';
import {
  ProjectCard,
  ProjectForm,
  StatsCard,
  Modal,
  DeleteConfirmDialog,
} from '@/components/fund';

type TabId = 'overview' | 'projects' | 'users' | 'settings';

// Helper function to safely parse assigned_projects
const parseAssignedProjects = (assignedProjects: any): string[] => {
  if (!assignedProjects) return [];
  if (Array.isArray(assignedProjects)) return assignedProjects;
  if (typeof assignedProjects === 'string') {
    try {
      const parsed = JSON.parse(assignedProjects);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function AdminPage() {
  return (
    <RoleProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <AdminDashboard />
    </RoleProtectedRoute>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const { isSuperAdmin, canCreateProjects, canDeleteProjects, getRoleDisplayName, getRoleBadgeColor } = useRole();
  
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [summary, setSummary] = useState<{ total_projects: number; total_contributions: number; total_amount: number } | null>(null);

  // Modal states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // User management states
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [userFormLoading, setUserFormLoading] = useState(false);
  
  // Settings state for pending changes
  const [pendingSettings, setPendingSettings] = useState<Partial<AppSettings>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsData, usersData, settingsData] = await Promise.all([
        projectsApi.getAll(),
        usersApi.getAll(),
        settingsApi.get(),
      ]);

      setProjects(projectsData);
      setUsers(usersData);
      setSettings(settingsData);

      // Calculate summary from projects
      let totalContributions = 0;
      let totalAmount = 0;
      const statsMap: Record<string, ProjectStats> = {};
      
      for (const project of projectsData) {
        try {
          const stats = await statsApi.getProjectStats(project.project_id);
          statsMap[project.project_id] = stats;
          totalContributions += stats.total_contributions || 0;
          totalAmount += stats.total_raised || 0;
        } catch (e) {
          // Project may have no stats yet
        }
      }
      
      setProjectStats(statsMap);
      setSummary({
        total_projects: projectsData.length,
        total_contributions: totalContributions,
        total_amount: totalAmount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Project handlers
  const handleCreateProject = async (data: any) => {
    try {
      setFormLoading(true);
      await projectsApi.create(data);
      setShowProjectForm(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProject = async (data: any) => {
    if (!editingProject) return;
    try {
      setFormLoading(true);
      await projectsApi.update(editingProject.project_id, data);
      setEditingProject(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProject) return;
    try {
      setFormLoading(true);
      await projectsApi.delete(deleteProject.project_id);
      setDeleteProject(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setFormLoading(false);
    }
  };

  // User role handler
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      setUserFormLoading(true);
      await usersApi.updateRole(userId, newRole);
      await loadData();
      // Update editingUser if this is the user being edited
      if (editingUser && editingUser.user_id === userId) {
        setEditingUser({ ...editingUser, role: newRole as any });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUserFormLoading(false);
    }
  };

  // Assign project to user
  const handleAssignProject = async (userId: string, projectId: string) => {
    try {
      setUserFormLoading(true);
      await usersApi.assignProject(userId, projectId);
      await loadData();
      // Update editing user with new data
      const updatedUser = users.find(u => u.user_id === userId);
      if (updatedUser) setEditingUser(updatedUser);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign project');
    } finally {
      setUserFormLoading(false);
    }
  };

  // Unassign project from user
  const handleUnassignProject = async (userId: string, projectId: string) => {
    try {
      setUserFormLoading(true);
      await usersApi.unassignProject(userId, projectId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unassign project');
    } finally {
      setUserFormLoading(false);
    }
  };

  // Settings handlers
  const handleSettingChange = (key: string, value: string) => {
    setPendingSettings((prev) => ({ ...prev, [key]: value }));
    setSettingsChanged(true);
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsSaving(true);
      await settingsApi.update(pendingSettings);
      setPendingSettings({});
      setSettingsChanged(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Get current setting value (pending or saved)
  const getSettingValue = (key: keyof AppSettings): string => {
    if (key in pendingSettings) {
      return pendingSettings[key] as string;
    }
    return settings?.[key] || '';
  };

  // Settings tab only visible to super_admin
  const allTabs: { id: TabId; label: string; icon: string; superAdminOnly?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️', superAdminOnly: true },
  ];
  
  const tabs = allTabs.filter(tab => !tab.superAdminOnly || isSuperAdmin());

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-gray-500">Manage projects, users, and settings</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Projects"
                  value={summary?.total_projects || 0}
                  color="blue"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  }
                />
                <StatsCard
                  title="Total Contributions"
                  value={summary?.total_contributions || 0}
                  color="green"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
                <StatsCard
                  title="Total Amount"
                  value={summary?.total_amount?.toLocaleString() || 0}
                  subtitle="BDT"
                  color="purple"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <StatsCard
                  title="Total Users"
                  value={users.length}
                  color="orange"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                />
              </div>

              {/* Recent Projects */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.slice(0, 3).map((project) => (
                    <ProjectCard
                      key={project.project_id}
                      project={project}
                      stats={projectStats[project.project_id]}
                      onViewDetails={() => router.push(`/fund-admin?project=${project.project_id}`)}
                      canEdit={canCreateProjects()}
                      canDelete={canDeleteProjects()}
                      onEdit={() => setEditingProject(project)}
                      onDelete={() => setDeleteProject(project)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* Header with Add Button */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">All Projects</h2>
                {canCreateProjects() && (
                  <button
                    onClick={() => setShowProjectForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Project
                  </button>
                )}
              </div>

              {/* Projects Grid - Grouped by Status */}
              {projects.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first project.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {(() => {
                    // Define status order and styling
                    const statusOrder = ['active', 'paused', 'completed', 'cancelled', 'archived'];
                    const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; label: string }> = {
                      active: { color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', label: 'Active' },
                      paused: { color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', label: 'Paused' },
                      completed: { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', label: 'Completed' },
                      cancelled: { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', label: 'Cancelled' },
                      archived: { color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', label: 'Archived' },
                    };

                    // Group projects by status
                    const groupedProjects = statusOrder.reduce((acc, status) => {
                      const projectsInStatus = projects.filter(p => p.status === status);
                      if (projectsInStatus.length > 0) {
                        acc[status] = projectsInStatus;
                      }
                      return acc;
                    }, {} as Record<string, typeof projects>);

                    return Object.entries(groupedProjects).map(([status, statusProjects]) => (
                      <div key={status}>
                        {/* Status Group Header */}
                        <div className={`flex items-center gap-3 mb-4 px-4 py-2 rounded-lg ${statusConfig[status]?.bgColor || 'bg-gray-50'} border ${statusConfig[status]?.borderColor || 'border-gray-200'}`}>
                          <span className={`w-3 h-3 rounded-full ${
                            status === 'active' ? 'bg-emerald-500' :
                            status === 'paused' ? 'bg-yellow-500' :
                            status === 'completed' ? 'bg-blue-500' :
                            status === 'cancelled' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                          <h3 className={`text-sm font-semibold uppercase tracking-wider ${statusConfig[status]?.color || 'text-gray-600'}`}>
                            {statusConfig[status]?.label || status} ({statusProjects.length})
                          </h3>
                        </div>
                        {/* Projects Grid for this status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {statusProjects.map((project) => (
                            <ProjectCard
                              key={project.project_id}
                              project={project}
                              stats={projectStats[project.project_id]}
                              onViewDetails={() => router.push(`/fund-admin?project=${project.project_id}`)}
                              canEdit={canCreateProjects()}
                              canDelete={canDeleteProjects()}
                              onEdit={() => setEditingProject(project)}
                              onDelete={() => setDeleteProject(project)}
                            />
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Projects</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-medium">
                                {(user.username || user.email || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.username || 'No name'}</div>
                              <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 capitalize">{user.provider}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.user_id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={user.role === 'super_admin' || userFormLoading}
                          >
                            <option value="user">User</option>
                            <option value="fund_admin">Fund Admin</option>
                            <option value="admin">Admin</option>
                            {isSuperAdmin() && <option value="super_admin">Super Admin</option>}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'super_admin' || user.role === 'admin' ? (
                            <span className="text-xs text-gray-500 italic">All projects</span>
                          ) : user.role === 'fund_admin' ? (
                            <div className="flex flex-wrap gap-1">
                              {parseAssignedProjects(user.assigned_projects).length > 0 ? (
                                parseAssignedProjects(user.assigned_projects).map((projectId) => {
                                  const project = projects.find(p => p.project_id === projectId);
                                  return (
                                    <span
                                      key={projectId}
                                      className="inline-flex items-center px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full"
                                    >
                                      {project?.name || projectId.slice(0, 8)}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-gray-400">None assigned</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {user.role !== 'super_admin' && (
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                              Manage
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">App Settings</h2>
                {settingsChanged && (
                  <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center"
                  >
                    {settingsSaving && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    Save Changes
                  </button>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                {/* Data Source Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Source Mode</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="data_source_mode"
                        value="excel"
                        checked={getSettingValue('data_source_mode') === 'excel'}
                        onChange={() => handleSettingChange('data_source_mode', 'excel')}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Excel (Static)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="data_source_mode"
                        value="dynamic"
                        checked={getSettingValue('data_source_mode') === 'dynamic'}
                        onChange={() => handleSettingChange('data_source_mode', 'dynamic')}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Dynamic (Database)</span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Excel mode shows data from the uploaded Excel file. Dynamic mode shows data from the database.
                  </p>
                </div>

                {/* Default Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                  <select
                    value={getSettingValue('default_currency')}
                    onChange={(e) => handleSettingChange('default_currency', e.target.value)}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="BDT">BDT</option>
                    <option value="USD">USD</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                {/* Email Notifications */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={getSettingValue('email_notifications_enabled') === 'true'}
                      onChange={(e) => handleSettingChange('email_notifications_enabled', e.target.checked ? 'true' : 'false')}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Email Notifications</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 ml-6">
                    Send email notifications for new contributions (requires email configuration)
                  </p>
                </div>

                {/* Save button at bottom too for convenience */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving || !settingsChanged}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {settingsSaving && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={showProjectForm}
        onClose={() => setShowProjectForm(false)}
        title="Create New Project"
        size="lg"
      >
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowProjectForm(false)}
          isLoading={formLoading}
        />
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title="Edit Project"
        size="lg"
      >
        <ProjectForm
          project={editingProject}
          onSubmit={handleUpdateProject}
          onCancel={() => setEditingProject(null)}
          isLoading={formLoading}
        />
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteProject}
        onClose={() => setDeleteProject(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteProject?.name}"? This action cannot be undone.`}
        isLoading={formLoading}
      />

      {/* User Management Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Manage User: ${editingUser?.username || editingUser?.email || ''}`}
        size="lg"
      >
        {editingUser && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-lg">
                  {(editingUser.username || editingUser.email || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{editingUser.username || 'No name'}</p>
                <p className="text-sm text-gray-500">{editingUser.email || 'No email'}</p>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
              <select
                value={editingUser.role}
                onChange={(e) => handleUpdateUserRole(editingUser.user_id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={userFormLoading}
              >
                <option value="user">User</option>
                <option value="fund_admin">Fund Admin</option>
                <option value="admin">Admin</option>
                {isSuperAdmin() && <option value="super_admin">Super Admin</option>}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Super Admin and Admin have access to all projects. Fund Admin requires project assignments.
              </p>
            </div>

            {/* Project Assignments - Only for fund_admin */}
            {editingUser.role === 'fund_admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Projects</label>
                
                {/* Current Assignments */}
                <div className="mb-4">
                  {parseAssignedProjects(editingUser.assigned_projects).length > 0 ? (
                    <div className="space-y-2">
                      {parseAssignedProjects(editingUser.assigned_projects).map((projectId) => {
                        const project = projects.find(p => p.project_id === projectId);
                        return (
                          <div
                            key={projectId}
                            className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <span className="text-sm font-medium text-green-800">
                              {project?.name || projectId}
                            </span>
                            <button
                              onClick={() => handleUnassignProject(editingUser.user_id, projectId)}
                              disabled={userFormLoading}
                              className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No projects assigned yet.</p>
                  )}
                </div>

                {/* Add Project */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Assign New Project</label>
                  <div className="flex space-x-2">
                    <select
                      id="assign-project-select"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      disabled={userFormLoading}
                      defaultValue=""
                    >
                      <option value="" disabled>Select a project...</option>
                      {projects
                        .filter(p => !parseAssignedProjects(editingUser.assigned_projects).includes(p.project_id))
                        .map((project) => (
                          <option key={project.project_id} value={project.project_id}>
                            {project.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        const select = document.getElementById('assign-project-select') as HTMLSelectElement;
                        if (select.value) {
                          handleAssignProject(editingUser.user_id, select.value);
                          select.value = '';
                        }
                      }}
                      disabled={userFormLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
