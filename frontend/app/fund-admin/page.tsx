'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { RoleProtectedRoute } from '@/auth/components/RoleProtectedRoute';
import { useRole } from '@/auth/hooks/useRole';
import {
  Project,
  Contribution,
  ProjectStats,
  UserWithRole,
  Distribution,
  DistributionStats,
  DistributionCreate,
  projectsApi,
  contributionsApi,
  statsApi,
  usersApi,
  distributionsApi,
  fundApi,
} from '@/services/fundApi';
import {
  ProjectCard,
  ContributionForm,
  ContributionTable,
  StatsCard,
  Modal,
  DeleteConfirmDialog,
} from '@/components/fund';
import MediaGallery from '@/components/media/MediaGallery';
import MediaUploader from '@/components/media/MediaUploader';
import { formatExact } from '@/utils/formatNumber';

function FundAdminPageContent() {
  return (
    <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'fund_admin']}>
      <FundAdminDashboard />
    </RoleProtectedRoute>
  );
}

export default function FundAdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <FundAdminPageContent />
    </Suspense>
  );
}

function FundAdminDashboard() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project');
  const { isAdmin, isSuperAdmin, hasProjectAccess, assignedProjects, isActuallySuperAdmin, actualRole, role } = useRole();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);

  // Modal states
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [deleteContribution, setDeleteContribution] = useState<Contribution | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fund Admins state
  const [allUsers, setAllUsers] = useState<UserWithRole[]>([]);
  const [showAddFundAdmin, setShowAddFundAdmin] = useState(false);

  // Media state
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0);

  // Distribution state
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [distributionStats, setDistributionStats] = useState<DistributionStats | null>(null);
  const [showDistributionForm, setShowDistributionForm] = useState(false);
  const [institutionTypes, setInstitutionTypes] = useState<string[]>([]);
  const [distributionForm, setDistributionForm] = useState<Partial<DistributionCreate>>({
    institution_type: '',
    institution_name: '',
    distributed_amount: 0,
    currency: 'BDT',
    distribution_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submittingDistribution, setSubmittingDistribution] = useState(false);
  const [deletingDistribution, setDeletingDistribution] = useState<string | null>(null);

  // Tab state for main content
  const [activeTab, setActiveTab] = useState<'contributions' | 'distribution' | 'media' | 'team'>('contributions');

  // Check if user can manage fund admins
  const canManageFundAdmins = role === 'super_admin' || role === 'admin';

  // Load projects and users on mount
  useEffect(() => {
    loadProjects();
    loadUsers(); // Load users for all roles to show fund admin list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load contributions and distributions when project changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject.project_id);
      loadDistributions(selectedProject.project_id);
      loadInstitutionTypes();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const allProjects = await projectsApi.getAll();
      
      // Filter projects based on actual role (not preview role)
      // Super admins and admins always see all projects, even when previewing as fund_admin
      const accessibleProjects = actualRole === 'super_admin' || actualRole === 'admin'
        ? allProjects
        : allProjects.filter((p) => assignedProjects.includes(p.project_id));

      setProjects(accessibleProjects);

      // Select initial project
      if (initialProjectId) {
        const project = accessibleProjects.find((p) => p.project_id === initialProjectId);
        if (project) {
          setSelectedProject(project);
        } else if (accessibleProjects.length > 0) {
          setSelectedProject(accessibleProjects[0]);
        }
      } else if (accessibleProjects.length > 0) {
        setSelectedProject(accessibleProjects[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async (projectId: string) => {
    try {
      const [contributionsData, stats] = await Promise.all([
        contributionsApi.getAll(projectId),
        statsApi.getProjectStats(projectId),
      ]);

      setContributions(contributionsData);
      setProjectStats(stats);
    } catch (err) {
      console.error('Failed to load project data:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const users = await usersApi.getAll();
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadDistributions = async (projectId: string) => {
    try {
      const [distData, distStats] = await Promise.all([
        distributionsApi.getAll(projectId),
        distributionsApi.getStats(projectId),
      ]);
      setDistributions(distData);
      setDistributionStats(distStats);
    } catch (err) {
      console.error('Error loading distributions:', err);
    }
  };

  const loadInstitutionTypes = async () => {
    try {
      const types = await fundApi.config.getInstitutionTypes();
      setInstitutionTypes(types);
    } catch (err) {
      console.error('Error loading institution types:', err);
      setInstitutionTypes(['School', 'Orphanage', 'Hospital', 'Community Center', 'Religious Institution', 'NGO', 'Government Agency', 'Individual/Family', 'Other']);
    }
  };

  const handleDistributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !distributionForm.institution_type || !distributionForm.institution_name || !distributionForm.distributed_amount) {
      return;
    }

    setSubmittingDistribution(true);
    try {
      await distributionsApi.create({
        project_id: selectedProject.project_id,
        institution_type: distributionForm.institution_type,
        institution_name: distributionForm.institution_name,
        distributed_amount: distributionForm.distributed_amount,
        currency: distributionForm.currency || 'BDT',
        distribution_date: distributionForm.distribution_date || new Date().toISOString().split('T')[0],
        notes: distributionForm.notes,
      });
      setShowDistributionForm(false);
      setDistributionForm({
        institution_type: '',
        institution_name: '',
        distributed_amount: 0,
        currency: 'BDT',
        distribution_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      loadDistributions(selectedProject.project_id);
    } catch (err) {
      console.error('Error creating distribution:', err);
      alert(err instanceof Error ? err.message : 'Failed to create distribution');
    } finally {
      setSubmittingDistribution(false);
    }
  };

  const handleDeleteDistribution = async (distributionId: string) => {
    if (!confirm('Are you sure you want to delete this distribution? This action cannot be undone.')) return;
    if (!selectedProject) return;

    setDeletingDistribution(distributionId);
    try {
      await distributionsApi.delete(distributionId);
      setDistributions(prev => prev.filter(d => d.distribution_id !== distributionId));
      loadDistributions(selectedProject.project_id);
    } catch (err) {
      console.error('Error deleting distribution:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete distribution');
    } finally {
      setDeletingDistribution(null);
    }
  };

  // Get fund admins for the selected project
  // Excludes super_admin and admin since they are fund admins of all projects by default
  const getFundAdminsForProject = () => {
    if (!selectedProject) return [];
    return allUsers.filter(
      (u) => u.role === 'fund_admin' && u.assigned_projects.includes(selectedProject.project_id)
    );
  };

  // Get users who can be added as fund admins
  const getAvailableUsersForFundAdmin = () => {
    if (!selectedProject) return [];
    return allUsers.filter(
      (u) => u.role === 'user' || (u.role === 'fund_admin' && !u.assigned_projects.includes(selectedProject.project_id))
    );
  };

  // Handle adding a fund admin to a project
  const handleAddFundAdmin = async (userId: string) => {
    if (!selectedProject) return;
    try {
      setFormLoading(true);
      // First, make sure user is fund_admin role
      const user = allUsers.find((u) => u.user_id === userId);
      if (user && user.role === 'user') {
        await usersApi.updateRole(userId, 'fund_admin');
      }
      // Then assign the project
      await usersApi.assignProject(userId, selectedProject.project_id);
      await loadUsers();
      setShowAddFundAdmin(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add fund admin');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle removing a fund admin from a project
  const handleRemoveFundAdmin = async (userId: string) => {
    if (!selectedProject) return;
    if (!confirm('Remove this user as fund admin for this project?')) return;
    try {
      await usersApi.unassignProject(userId, selectedProject.project_id);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove fund admin');
    }
  };

  // Contribution handlers
  const handleCreateContribution = async (data: any) => {
    try {
      setFormLoading(true);
      await contributionsApi.create(data);
      setShowContributionForm(false);
      if (selectedProject) {
        await loadProjectData(selectedProject.project_id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add contribution');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateContribution = async (data: any) => {
    if (!editingContribution) return;
    try {
      setFormLoading(true);
      await contributionsApi.update(editingContribution.contribution_id, data);
      setEditingContribution(null);
      if (selectedProject) {
        await loadProjectData(selectedProject.project_id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update contribution');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteContribution = async () => {
    if (!deleteContribution) return;
    try {
      setFormLoading(true);
      await contributionsApi.delete(deleteContribution.contribution_id);
      setDeleteContribution(null);
      if (selectedProject) {
        await loadProjectData(selectedProject.project_id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete contribution');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading fund management...</p>
          </div>
        </div>
      </>
    );
  }

  if (projects.length === 0) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">No Projects Available</h2>
              <p className="mt-2 text-gray-500">
                {isAdmin() || isSuperAdmin()
                  ? 'Create a new project from the Admin Panel.'
                  : 'You have not been assigned to any projects yet. Contact an admin to get access.'}
              </p>
            </div>
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Project List */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden sticky top-4">
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-700">
                  <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Projects</h2>
                </div>
                <div className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {(() => {
                    // Define status order and colors
                    const statusOrder = ['active', 'paused', 'completed', 'cancelled', 'archived'];
                    const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
                      active: { color: 'bg-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Active' },
                      paused: { color: 'bg-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Paused' },
                      completed: { color: 'bg-blue-400', bgColor: 'bg-blue-400/10', label: 'Completed' },
                      cancelled: { color: 'bg-red-500', bgColor: 'bg-red-500/10', label: 'Cancelled' },
                      archived: { color: 'bg-slate-500', bgColor: 'bg-slate-500/10', label: 'Archived' },
                    };

                    // Group projects by status
                    const groupedProjects = statusOrder.reduce((acc, status) => {
                      const projectsInStatus = projects.filter(p => p.status === status);
                      if (projectsInStatus.length > 0) {
                        acc[status] = projectsInStatus;
                      }
                      return acc;
                    }, {} as Record<string, Project[]>);

                    return Object.entries(groupedProjects).map(([status, statusProjects], groupIndex) => (
                      <div key={status} className={groupIndex > 0 ? 'mt-4 pt-4 border-t border-slate-700' : ''}>
                        {/* Status Group Header */}
                        <div className={`px-3 py-1.5 mb-2 rounded-md ${statusConfig[status]?.bgColor || 'bg-slate-700/50'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${statusConfig[status]?.color || 'bg-slate-500'}`} />
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                              {statusConfig[status]?.label || status} ({statusProjects.length})
                            </span>
                          </div>
                        </div>
                        {/* Projects in this status */}
                        {statusProjects.map((project) => (
                          <button
                            key={project.project_id}
                            onClick={() => {
                              setSelectedProject(project);
                              setActiveTab('contributions');
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-all mb-1 ${
                              selectedProject?.project_id === project.project_id
                                ? 'bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-500'
                                : 'hover:bg-slate-700 text-slate-300 border-l-4 border-transparent'
                            }`}
                          >
                            <div className="font-medium truncate text-sm">{project.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-2 h-2 rounded-full ${statusConfig[project.status]?.color || 'bg-slate-500'}`} />
                              <span className="text-xs text-slate-400 capitalize">{project.status}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {selectedProject && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Project Header */}
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-white">{selectedProject.name}</h1>
                        {selectedProject.description && (
                          <p className="text-slate-300 mt-1 text-sm">{selectedProject.description}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedProject.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        selectedProject.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        selectedProject.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        selectedProject.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                      </span>
                    </div>

                    {/* Stats Row */}
                    {projectStats && (
                      <div className="grid grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-white">{projectStats.progress_percentage?.toFixed(0) || 0}%</p>
                          <p className="text-slate-400 text-xs uppercase tracking-wide mt-1">Progress</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-emerald-400">৳{formatExact(projectStats.total_raised || 0)}</p>
                          <p className="text-slate-400 text-xs uppercase tracking-wide mt-1">Collected</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-white">৳{formatExact(projectStats.target_amount || 0)}</p>
                          <p className="text-slate-400 text-xs uppercase tracking-wide mt-1">Target</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-amber-400">{projectStats.total_contributions || 0}</p>
                          <p className="text-slate-400 text-xs uppercase tracking-wide mt-1">Donations</p>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {projectStats && (
                      <div className="mt-4">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, projectStats.progress_percentage || 0)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                      {[
                        { id: 'contributions', label: 'Contributions', icon: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )},
                        { id: 'distribution', label: 'Distribution', icon: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        )},
                        { id: 'media', label: 'Media Gallery', icon: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )},
                        { id: 'team', label: 'Fund Admins', icon: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )},
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as typeof activeTab)}
                          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {/* Contributions Tab */}
                    {activeTab === 'contributions' && (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">Contribution Records</h2>
                            <p className="text-sm text-gray-500">{contributions.length} total contributions</p>
                          </div>
                          <button
                            onClick={() => setShowContributionForm(true)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md flex items-center text-sm"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Contribution
                          </button>
                        </div>
                        <ContributionTable
                          contributions={contributions}
                          canEdit={true}
                          canDelete={isAdmin() || isSuperAdmin()}
                          onEdit={(c) => setEditingContribution(c)}
                          onDelete={(c) => setDeleteContribution(c)}
                        />
                      </div>
                    )}

                    {/* Distribution Tab */}
                    {activeTab === 'distribution' && (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">Fund Distribution</h2>
                            <p className="text-sm text-gray-500">Track how funds have been distributed</p>
                          </div>
                          <button
                            onClick={() => setShowDistributionForm(!showDistributionForm)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center text-sm ${
                              showDistributionForm
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
                            }`}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {showDistributionForm ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              )}
                            </svg>
                            {showDistributionForm ? 'Cancel' : 'Add Distribution'}
                          </button>
                        </div>

                        {/* Distribution Stats */}
                        {distributionStats && (
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                              <p className="text-2xl font-bold text-amber-600">৳{formatExact(distributionStats.total_distributed)}</p>
                              <p className="text-sm text-amber-700 mt-1">Total Distributed</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                              <p className="text-2xl font-bold text-blue-600">{distributionStats.total_distributions}</p>
                              <p className="text-sm text-blue-700 mt-1">Distributions</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                              <p className="text-2xl font-bold text-purple-600">{distributionStats.unique_institutions}</p>
                              <p className="text-sm text-purple-700 mt-1">Institutions</p>
                            </div>
                          </div>
                        )}

                        {/* Add Distribution Form */}
                        {showDistributionForm && (
                          <form onSubmit={handleDistributionSubmit} className="mb-6 bg-gray-50 rounded-xl p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Add New Distribution</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Type *</label>
                                <select
                                  value={distributionForm.institution_type || ''}
                                  onChange={(e) => setDistributionForm({ ...distributionForm, institution_type: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                  required
                                >
                                  <option value="">Select type...</option>
                                  {institutionTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name *</label>
                                <input
                                  type="text"
                                  value={distributionForm.institution_name || ''}
                                  onChange={(e) => setDistributionForm({ ...distributionForm, institution_name: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                  placeholder="Enter institution name"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                <input
                                  type="number"
                                  value={distributionForm.distributed_amount || ''}
                                  onChange={(e) => setDistributionForm({ ...distributionForm, distributed_amount: parseFloat(e.target.value) })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Date *</label>
                                <input
                                  type="date"
                                  value={distributionForm.distribution_date || ''}
                                  onChange={(e) => setDistributionForm({ ...distributionForm, distribution_date: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                  required
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                  value={distributionForm.notes || ''}
                                  onChange={(e) => setDistributionForm({ ...distributionForm, notes: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                  placeholder="Add any notes or comments..."
                                  rows={2}
                                />
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setShowDistributionForm(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={submittingDistribution}
                                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50"
                              >
                                {submittingDistribution ? 'Saving...' : 'Save Distribution'}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Distribution List */}
                        {distributions.length === 0 ? (
                          <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <p className="text-lg font-medium text-gray-600">No distributions recorded yet</p>
                            <p className="text-sm text-gray-500 mt-1">Add distribution records to track fund usage</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {distributions.map((dist) => (
                              <div key={dist.distribution_id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white">
                                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">{dist.institution_name}</p>
                                      <p className="text-sm text-gray-500">{dist.institution_type}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-4">
                                    <div className="text-right">
                                      <p className="text-xl font-bold text-amber-600">৳{formatExact(dist.distributed_amount)}</p>
                                      <p className="text-sm text-gray-500">{new Date(dist.distribution_date).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteDistribution(dist.distribution_id)}
                                      disabled={deletingDistribution === dist.distribution_id}
                                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                      title="Delete distribution"
                                    >
                                      {deletingDistribution === dist.distribution_id ? (
                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                </div>
                                {dist.notes && (
                                  <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{dist.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">Media Gallery</h2>
                            <p className="text-sm text-gray-500">Photos, videos, and audio for this project</p>
                          </div>
                          <button
                            onClick={() => setShowMediaUploader(!showMediaUploader)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center text-sm ${
                              showMediaUploader
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                            }`}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {showMediaUploader ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              )}
                            </svg>
                            {showMediaUploader ? 'Cancel' : 'Upload Media'}
                          </button>
                        </div>

                        {showMediaUploader && (
                          <div className="mb-6">
                            <MediaUploader
                              projectId={selectedProject.project_id}
                              onUploadComplete={() => {
                                setMediaRefreshKey(prev => prev + 1);
                                setShowMediaUploader(false);
                              }}
                            />
                          </div>
                        )}

                        <MediaGallery
                          key={mediaRefreshKey}
                          projectId={selectedProject.project_id}
                          canManage={true}
                          onMediaDeleted={() => setMediaRefreshKey(prev => prev + 1)}
                        />
                      </div>
                    )}

                    {/* Team Tab */}
                    {activeTab === 'team' && (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">Fund Admins</h2>
                            <p className="text-sm text-gray-500">Team members managing this project</p>
                          </div>
                          {canManageFundAdmins && (
                            <button
                              onClick={() => setShowAddFundAdmin(true)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md flex items-center text-sm"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              Add Fund Admin
                            </button>
                          )}
                        </div>

                        {getFundAdminsForProject().length === 0 ? (
                          <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">No fund admins assigned to this project yet.</p>
                            {canManageFundAdmins && (
                              <button
                                onClick={() => setShowAddFundAdmin(true)}
                                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                              >
                                + Add the first fund admin
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {getFundAdminsForProject().map((user) => (
                              <div
                                key={user.user_id}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {(user.username || user.email || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{user.username || user.email}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                      Fund Admin
                                    </span>
                                  </div>
                                </div>
                                {canManageFundAdmins && (
                                  <button
                                    onClick={() => handleRemoveFundAdmin(user.user_id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove Fund Admin"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Contribution Modal */}
      <Modal
        isOpen={showContributionForm}
        onClose={() => setShowContributionForm(false)}
        title="Add Contribution"
        size="lg"
      >
        <ContributionForm
          projects={projects}
          selectedProjectId={selectedProject?.project_id}
          onSubmit={handleCreateContribution}
          onCancel={() => setShowContributionForm(false)}
          isLoading={formLoading}
        />
      </Modal>

      {/* Edit Contribution Modal */}
      <Modal
        isOpen={!!editingContribution}
        onClose={() => setEditingContribution(null)}
        title="Edit Contribution"
        size="lg"
      >
        <ContributionForm
          contribution={editingContribution}
          projects={projects}
          onSubmit={handleUpdateContribution}
          onCancel={() => setEditingContribution(null)}
          isLoading={formLoading}
        />
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteContribution}
        onClose={() => setDeleteContribution(null)}
        onConfirm={handleDeleteContribution}
        title="Delete Contribution"
        message={`Are you sure you want to delete the contribution from "${deleteContribution?.contributor_name}"? This action cannot be undone.`}
        isLoading={formLoading}
      />

      {/* Add Fund Admin Modal */}
      <Modal
        isOpen={showAddFundAdmin}
        onClose={() => setShowAddFundAdmin(false)}
        title={`Add Fund Admin for ${selectedProject?.name || 'Project'}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a user to assign as a fund admin for this project. Users with &quot;User&quot; role will be promoted to &quot;Fund Admin&quot;.
          </p>
          {getAvailableUsersForFundAdmin().length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No available users to add.</p>
              <p className="text-xs text-gray-400">All users are either already fund admins for this project or have higher roles.</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {getAvailableUsersForFundAdmin().map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => handleAddFundAdmin(user.user_id)}
                  disabled={formLoading}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.username || user.email}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      user.role === 'fund_admin' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role === 'fund_admin' ? 'Fund Admin' : 'User'}
                    </span>
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowAddFundAdmin(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
