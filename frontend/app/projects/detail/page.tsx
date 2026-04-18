'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { projectsApi, statsApi, contributionsApi, usersApi, mediaApi, distributionsApi, fundApi, Project, ProjectStats, Contribution, UserWithRole, Media, MediaCounts, Distribution, DistributionStats, DistributionCreate } from '@/services/fundApi';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/auth/hooks/useAuth';
import MediaGallery from '@/components/media/MediaGallery';
import MediaUploader from '@/components/media/MediaUploader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { formatNumber, formatExact } from '@/utils/formatNumber';

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

function ProjectDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const projectId = searchParams.get('id') || '';
  const role = user?.role;

  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [fundAdmins, setFundAdmins] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'about' | 'contributions' | 'distribution' | 'media' | 'team'>('overview');
  
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
  
  // Analytics state
  const [contributionsByDate, setContributionsByDate] = useState<{date: string; count: number; total: number}[]>([]);
  const [contributionsByMode, setContributionsByMode] = useState<{payment_mode: string; count: number; total: number}[]>([]);

  // Delete state
  const [deletingContribution, setDeletingContribution] = useState<string | null>(null);
  const [deletingDistribution, setDeletingDistribution] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      loadProjectData();
      loadDistributions();
      loadAnalyticsData();
      loadInstitutionTypes();
    }
  }, [isAuthenticated, projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load project, stats, contributions, and users in parallel
      const [projectData, statsData, contributionsData, usersData] = await Promise.all([
        projectsApi.getById(projectId),
        statsApi.getProjectStats(projectId),
        contributionsApi.getAll(projectId),
        usersApi.getAll().catch(() => [] as UserWithRole[]), // Gracefully handle if user can't fetch users
      ]);

      // Handle the response format - project might be wrapped
      const projectResult = (projectData as any).project || projectData;
      setProject(projectResult);
      setStats(statsData);
      setContributions(contributionsData);
      
      // Filter to get only fund_admins assigned to this project
      const projectFundAdmins = usersData.filter(
        (u: UserWithRole) => u.role === 'fund_admin' && u.assigned_projects?.includes(projectId)
      );
      setFundAdmins(projectFundAdmins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDistributions = async () => {
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

  const loadAnalyticsData = async () => {
    try {
      const [byDateData, byModeData] = await Promise.all([
        statsApi.getContributionsByDate(projectId),
        statsApi.getContributionsByMode(projectId),
      ]);
      setContributionsByDate(byDateData);
      setContributionsByMode(byModeData);
    } catch (err) {
      console.error('Error loading analytics:', err);
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
    if (!distributionForm.institution_type || !distributionForm.institution_name || !distributionForm.distributed_amount) {
      return;
    }
    
    setSubmittingDistribution(true);
    try {
      await distributionsApi.create({
        project_id: projectId,
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
      loadDistributions();
    } catch (err) {
      console.error('Error creating distribution:', err);
    } finally {
      setSubmittingDistribution(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center max-w-md mx-auto p-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The project you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  const progress = project.target_amount > 0
    ? Math.min(100, ((stats?.total_raised || 0) / project.target_amount) * 100)
    : 0;

  const isAssignedFundAdmin = role === 'fund_admin' && user?.assigned_projects?.includes(projectId);
  const canManageMedia = role === 'super_admin' || role === 'admin' || isAssignedFundAdmin;
  const canManageDistributions = role === 'super_admin' || role === 'admin' || isAssignedFundAdmin;
  const canManageContributions = role === 'super_admin' || role === 'admin' || isAssignedFundAdmin;

  const handleDeleteContribution = async (contributionId: string) => {
    if (!confirm('Are you sure you want to delete this contribution? This action cannot be undone.')) return;

    setDeletingContribution(contributionId);
    try {
      await contributionsApi.delete(contributionId);
      setContributions(prev => prev.filter(c => c.contribution_id !== contributionId));
      loadProjectData(); // Refresh stats
    } catch (err) {
      console.error('Error deleting contribution:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete contribution');
    } finally {
      setDeletingContribution(null);
    }
  };

  const handleDeleteDistribution = async (distributionId: string) => {
    if (!confirm('Are you sure you want to delete this distribution? This action cannot be undone.')) return;

    setDeletingDistribution(distributionId);
    try {
      await distributionsApi.delete(distributionId);
      setDistributions(prev => prev.filter(d => d.distribution_id !== distributionId));
      loadDistributions(); // Refresh stats
    } catch (err) {
      console.error('Error deleting distribution:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete distribution');
    } finally {
      setDeletingDistribution(null);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </button>

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Project Header - Dark Theme */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                  {project.description && (
                    <p className="text-slate-300 mt-1 text-sm max-w-2xl">
                      {project.description.length > 100
                        ? `${project.description.substring(0, 100)}...`
                        : project.description}
                      {project.description.length > 100 && (
                        <button
                          onClick={() => setActiveTab('about')}
                          className="ml-2 text-emerald-400 hover:text-emerald-300 underline"
                        >
                          Read more
                        </button>
                      )}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  project.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  project.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  project.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">{progress.toFixed(0)}%</p>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mt-1">Progress</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">৳{formatExact(stats?.total_raised || 0)}</p>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mt-1">Collected</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">৳{formatExact(project.target_amount)}</p>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mt-1">Target</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{stats?.total_contributions || 0}</p>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mt-1">Donations</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex -mb-px min-w-max">
                {[
                  { id: 'overview', label: 'Overview', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )},
                  { id: 'about', label: 'About', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )},
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
                  { id: 'media', label: 'Media', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )},
                  { id: 'team', label: 'Team', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )},
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-emerald-600 text-emerald-600'
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
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Project Analytics</h2>
                    <p className="text-sm text-gray-500">Data insights from contributions and distributions</p>
                  </div>

                  {/* Summary Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                      <p className="text-2xl md:text-3xl font-bold text-emerald-600">৳{formatExact(stats?.total_raised || 0)}</p>
                      <p className="text-sm text-emerald-700 mt-1">Total Collected</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats?.total_contributions || 0}</p>
                      <p className="text-sm text-blue-700 mt-1">Donations</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats?.unique_contributors || 0}</p>
                      <p className="text-sm text-purple-700 mt-1">Contributors</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                      <p className="text-2xl md:text-3xl font-bold text-amber-600">৳{formatExact(distributionStats?.total_distributed || 0)}</p>
                      <p className="text-sm text-amber-700 mt-1">Distributed</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200">
                      <p className="text-2xl md:text-3xl font-bold text-rose-600">{distributionStats?.total_distributions || 0}</p>
                      <p className="text-sm text-rose-700 mt-1">Distributions</p>
                    </div>
                  </div>

                  {/* Fund Flow Summary */}
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-4">Fund Flow Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-emerald-400">৳{formatExact(stats?.total_raised || 0)}</p>
                        <p className="text-slate-400 text-sm mt-1">Collected</p>
                      </div>
                      <div className="text-center border-x border-slate-700">
                        <p className="text-3xl font-bold text-amber-400">৳{formatExact(distributionStats?.total_distributed || 0)}</p>
                        <p className="text-slate-400 text-sm mt-1">Distributed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-cyan-400">৳{formatExact((stats?.total_raised || 0) - (distributionStats?.total_distributed || 0))}</p>
                        <p className="text-slate-400 text-sm mt-1">Available</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex h-4 rounded-full overflow-hidden bg-slate-700">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-amber-400" 
                          style={{ width: `${stats?.total_raised ? ((distributionStats?.total_distributed || 0) / stats.total_raised) * 100 : 0}%` }}
                        />
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-cyan-400" 
                          style={{ width: `${stats?.total_raised ? (((stats?.total_raised || 0) - (distributionStats?.total_distributed || 0)) / stats.total_raised) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>Distributed: {stats?.total_raised ? (((distributionStats?.total_distributed || 0) / stats.total_raised) * 100).toFixed(1) : 0}%</span>
                        <span>Available: {stats?.total_raised ? ((((stats?.total_raised || 0) - (distributionStats?.total_distributed || 0)) / stats.total_raised) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row 1: Payment Mode Pie Chart & Top Contributors Bar Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Mode Pie Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Mode Distribution</h3>
                      <p className="text-sm text-gray-500 mb-4">Breakdown of donations by payment method</p>
                      {contributionsByMode.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={contributionsByMode.map(item => ({ name: item.payment_mode, value: item.total }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {contributionsByMode.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `৳${formatExact(value)}`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                          No payment data available
                        </div>
                      )}
                    </div>

                    {/* Top Contributors Bar Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Contributors</h3>
                      <p className="text-sm text-gray-500 mb-4">Leading donors by contribution amount</p>
                      {contributions.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart 
                            data={(() => {
                              // Aggregate by contributor name
                              const aggregated = contributions.reduce((acc: Record<string, number>, c) => {
                                acc[c.contributor_name] = (acc[c.contributor_name] || 0) + c.amount;
                                return acc;
                              }, {});
                              return Object.entries(aggregated)
                                .map(([name, amount]) => ({ name: name.substring(0, 12), amount }))
                                .sort((a, b) => b.amount - a.amount)
                                .slice(0, 8);
                            })()}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="name" width={80} />
                            <Tooltip formatter={(value: number) => `৳${formatExact(value)}`} />
                            <Bar dataKey="amount" fill="#3b82f6" name="Amount (BDT)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                          No contribution data available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Charts Row 2: Contribution Timeline & Payment Mode Bar */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Contribution Timeline Area Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Contribution Timeline</h3>
                      <p className="text-sm text-gray-500 mb-4">Daily donation amounts over time</p>
                      {contributionsByDate.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={contributionsByDate.slice(-15)}>
                            <defs>
                              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
                            <Tooltip 
                              formatter={(value: number) => `৳${formatExact(value)}`}
                              labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" name="Amount" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                          No timeline data available
                        </div>
                      )}
                    </div>

                    {/* Payment Mode Bar Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Amount by Payment Mode</h3>
                      <p className="text-sm text-gray-500 mb-4">Total collected per payment method</p>
                      {contributionsByMode.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={contributionsByMode.map(item => ({ name: item.payment_mode, amount: item.total, count: item.count }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => `৳${formatExact(value)}`} />
                            <Legend />
                            <Bar dataKey="amount" fill="#8b5cf6" name="Total Amount" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                          No payment data available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Distribution by Institution Type */}
                  {distributions.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Distribution by Institution Type</h3>
                      <p className="text-sm text-gray-500 mb-4">How funds have been distributed across different institution types</p>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart 
                          data={(() => {
                            const byType = distributions.reduce((acc: Record<string, { amount: number; count: number }>, d) => {
                              if (!acc[d.institution_type]) acc[d.institution_type] = { amount: 0, count: 0 };
                              acc[d.institution_type].amount += d.distributed_amount;
                              acc[d.institution_type].count += 1;
                              return acc;
                            }, {});
                            return Object.entries(byType)
                              .map(([type, data]) => ({ type, ...data }))
                              .sort((a, b) => b.amount - a.amount);
                          })()}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" angle={-20} textAnchor="end" height={80} />
                          <YAxis tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value: number) => `৳${formatExact(value)}`} />
                          <Legend />
                          <Bar dataKey="amount" fill="#f59e0b" name="Distributed Amount" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Recent Distributions */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Distributions</h3>
                    {distributions.length > 0 ? (
                      <div className="space-y-3">
                        {distributions.slice(0, 5).map((d, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-semibold text-sm">
                                {d.institution_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{d.institution_name.substring(0, 20)}</p>
                                <p className="text-xs text-gray-500">{d.institution_type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-amber-600">৳{formatExact(d.distributed_amount)}</p>
                              <p className="text-xs text-gray-400">{new Date(d.distribution_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-8">No distributions yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  {/* Main Description Card */}
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        About This Campaign
                      </h2>
                    </div>
                    <div className="p-6">
                      {project.description ? (
                        <div className="prose prose-slate max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                            {project.description}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No description provided for this project.</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Project Status */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          project.status === 'active' ? 'bg-emerald-100' :
                          project.status === 'completed' ? 'bg-blue-100' :
                          project.status === 'paused' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          <svg className={`w-5 h-5 ${
                            project.status === 'active' ? 'text-emerald-600' :
                            project.status === 'completed' ? 'text-blue-600' :
                            project.status === 'paused' ? 'text-yellow-600' : 'text-gray-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {project.status === 'active' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            ) : project.status === 'completed' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Campaign Status</p>
                          <p className={`font-semibold ${
                            project.status === 'active' ? 'text-emerald-600' :
                            project.status === 'completed' ? 'text-blue-600' :
                            project.status === 'paused' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Campaign Started</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(project.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Summary */}
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Campaign Progress
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-emerald-400">৳{formatExact(stats?.total_raised || 0)}</p>
                        <p className="text-slate-400 text-sm mt-1">Raised</p>
                      </div>
                      <div className="text-center border-x border-slate-700">
                        <p className="text-3xl font-bold text-white">৳{formatExact(project.target_amount)}</p>
                        <p className="text-slate-400 text-sm mt-1">Goal</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-cyan-400">{progress.toFixed(0)}%</p>
                        <p className="text-slate-400 text-sm mt-1">Complete</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-6 text-center">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-emerald-900 mb-2">Every Contribution Counts</h3>
                    <p className="text-emerald-700 mb-4">
                      Join {stats?.unique_contributors || 0} others who have already contributed to this cause.
                    </p>
                    <button
                      onClick={() => setActiveTab('contributions')}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      View All Contributions
                    </button>
                  </div>
                </div>
              )}

              {/* Contributions Tab */}
              {activeTab === 'contributions' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Contribution Records</h2>
                      <p className="text-sm text-gray-500">{contributions.length} total contributions</p>
                    </div>
                  </div>

                  {contributions.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-600">No contributions yet</p>
                      <p className="text-sm text-gray-500 mt-1">Be the first to contribute to this project!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Contributor</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Payment</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                            {canManageContributions && (
                              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {contributions.map((contribution) => (
                            <tr key={contribution.contribution_id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                                    {contribution.contributor_name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-gray-900">{contribution.contributor_name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-semibold text-emerald-600">৳{formatExact(contribution.amount)}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-gray-600">{contribution.payment_mode}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  contribution.payment_status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  contribution.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {contribution.payment_status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-gray-500">
                                {new Date(contribution.contribution_date).toLocaleDateString()}
                              </td>
                              {canManageContributions && (
                                <td className="py-4 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteContribution(contribution.contribution_id)}
                                    disabled={deletingContribution === contribution.contribution_id}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete contribution"
                                  >
                                    {deletingContribution === contribution.contribution_id ? (
                                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    )}
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                    {canManageDistributions && (
                      <button
                        onClick={() => setShowDistributionForm(!showDistributionForm)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center text-sm ${
                          showDistributionForm
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600'
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
                    )}
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
                  {showDistributionForm && canManageDistributions && (
                    <form onSubmit={handleDistributionSubmit} className="mb-6 bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Add New Distribution</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Institution Type *</label>
                          <select
                            value={distributionForm.institution_type || ''}
                            onChange={(e) => setDistributionForm({ ...distributionForm, institution_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={distributionForm.notes || ''}
                            onChange={(e) => setDistributionForm({ ...distributionForm, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-50"
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
                              {canManageDistributions && (
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
                              )}
                            </div>
                          </div>
                          {dist.notes && (
                            <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{dist.notes}</p>
                          )}
                          
                          {/* Proof Section */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            {dist.proof_file_key ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-emerald-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">Proof attached</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/uploads/${dist.proof_file_key}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Proof
                                  </a>
                                  {canManageDistributions && (
                                    <label className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                      </svg>
                                      Replace
                                      <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            try {
                                              await distributionsApi.uploadProof(dist.distribution_id, file);
                                              loadDistributions();
                                            } catch (err) {
                                              console.error('Error uploading proof:', err);
                                            }
                                          }
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <span>No proof uploaded</span>
                                </div>
                                {canManageDistributions && (
                                  <label className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors cursor-pointer flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Upload Proof
                                    <input
                                      type="file"
                                      accept="image/*,.pdf"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            await distributionsApi.uploadProof(dist.distribution_id, file);
                                            loadDistributions();
                                          } catch (err) {
                                            console.error('Error uploading proof:', err);
                                          }
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            )}
                          </div>
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
                    {canManageMedia && (
                      <button
                        onClick={() => setShowUploader(!showUploader)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center text-sm ${
                          showUploader
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showUploader ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          )}
                        </svg>
                        {showUploader ? 'Cancel' : 'Upload Media'}
                      </button>
                    )}
                  </div>

                  {showUploader && canManageMedia && (
                    <div className="mb-6">
                      <MediaUploader
                        projectId={projectId}
                        onUploadComplete={() => {
                          setMediaRefreshKey(prev => prev + 1);
                          setShowUploader(false);
                        }}
                      />
                    </div>
                  )}

                  <MediaGallery
                    key={mediaRefreshKey}
                    projectId={projectId}
                    canManage={canManageMedia}
                    onMediaDeleted={() => setMediaRefreshKey(prev => prev + 1)}
                  />
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Fund Admins</h2>
                    <p className="text-sm text-gray-500">Team members managing this project</p>
                  </div>

                  {fundAdmins.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No fund admins assigned to this project yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fundAdmins.map((user) => (
                        <div
                          key={user.user_id}
                          className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                            {(user.username || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.username || user.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                              Fund Admin
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Project Info Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Created: {new Date(project.created_at).toLocaleDateString()} • Currency: {project.target_currency}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ProjectDetailContent />
    </Suspense>
  );
}
