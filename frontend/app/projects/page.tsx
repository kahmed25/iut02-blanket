'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { projectsApi, statsApi, Project, ProjectStats } from '@/services/fundApi';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/auth/hooks/useAuth';
import { formatExact } from '@/utils/formatNumber';

// Pagination component
function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }: {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;
  
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always show first page
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 rounded-lg text-sm font-medium ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        Previous
      </button>
      
      {pageNumbers.map((page, index) => (
        typeof page === 'number' ? (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              currentPage === page
                ? 'bg-slate-800 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {page}
          </button>
        ) : (
          <span key={index} className="px-2 text-gray-400">...</span>
        )
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-lg text-sm font-medium ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        Next
      </button>
    </div>
  );
}

export default function ProjectsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused' | 'cancelled' | 'archived'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 projects per page (4 rows of 3 on desktop)

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const projectsData = await projectsApi.getAll();
      setProjects(projectsData);

      // Load stats for each project
      const statsMap: Record<string, ProjectStats> = {};
      for (const project of projectsData) {
        try {
          const response = await statsApi.getProjectStats(project.project_id);
          statsMap[project.project_id] = response;
        } catch (err) {
          console.error(`Error loading stats for project ${project.project_id}:`, err);
        }
      }
      setProjectStats(statsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter);

  const totalRaised = Object.values(projectStats).reduce((sum, stats) => sum + (stats?.total_raised || 0), 0);
  const totalContributors = Object.values(projectStats).reduce((sum, stats) => sum + (stats?.unique_contributors || 0), 0);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">All Projects</h1>
                <p className="mt-2 text-slate-300">
                  Browse and explore all charity projects
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-4">
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-emerald-400">৳{formatExact(totalRaised)}</p>
                  <p className="text-xs text-slate-400 uppercase">Total Raised</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">{projects.length}</p>
                  <p className="text-xs text-slate-400 uppercase">Projects</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-amber-400">{totalContributors}</p>
                  <p className="text-xs text-slate-400 uppercase">Contributors</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'all', label: 'All Projects', count: projects.length },
              { id: 'active', label: 'Active', count: projects.filter(p => p.status === 'active').length },
              { id: 'paused', label: 'Paused', count: projects.filter(p => p.status === 'paused').length },
              { id: 'completed', label: 'Completed', count: projects.filter(p => p.status === 'completed').length },
              { id: 'cancelled', label: 'Cancelled', count: projects.filter(p => p.status === 'cancelled').length },
              { id: 'archived', label: 'Archived', count: projects.filter(p => p.status === 'archived').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  filter === tab.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">No Projects Found</h2>
              <p className="mt-2 text-gray-500">
                {filter === 'all' ? 'No projects have been created yet.' : `No ${filter} projects at the moment.`}
              </p>
            </div>
          ) : filter === 'all' ? (
            <div className="space-y-10">
              {(() => {
                // Define status order and styling
                const statusOrder = ['active', 'paused', 'completed', 'cancelled', 'archived'];
                const statusConfig: Record<string, { dotColor: string; bgColor: string; borderColor: string; textColor: string; label: string }> = {
                  active: { dotColor: 'bg-teal-400', bgColor: 'bg-teal-50/80', borderColor: 'border-teal-300', textColor: 'text-teal-700', label: 'Active Projects' },
                  paused: { dotColor: 'bg-amber-400', bgColor: 'bg-amber-50/80', borderColor: 'border-amber-300', textColor: 'text-amber-700', label: 'Paused Projects' },
                  completed: { dotColor: 'bg-indigo-400', bgColor: 'bg-indigo-50/80', borderColor: 'border-indigo-300', textColor: 'text-indigo-700', label: 'Completed Projects' },
                  cancelled: { dotColor: 'bg-rose-400', bgColor: 'bg-rose-50/80', borderColor: 'border-rose-300', textColor: 'text-rose-700', label: 'Cancelled Projects' },
                  archived: { dotColor: 'bg-slate-400', bgColor: 'bg-slate-50/80', borderColor: 'border-slate-300', textColor: 'text-slate-700', label: 'Archived Projects' },
                };

                // Group projects by status
                const groupedProjects = statusOrder.reduce((acc, status) => {
                  const projectsInStatus = filteredProjects.filter(p => p.status === status);
                  if (projectsInStatus.length > 0) {
                    acc[status] = projectsInStatus;
                  }
                  return acc;
                }, {} as Record<string, typeof filteredProjects>);

                // Paginate all projects together
                const allProjectsFlat = statusOrder.flatMap(status => groupedProjects[status] || []);
                const totalPages = Math.ceil(allProjectsFlat.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedProjects = allProjectsFlat.slice(startIndex, endIndex);

                // Re-group paginated projects by status
                const paginatedGrouped = statusOrder.reduce((acc, status) => {
                  const projectsInStatus = paginatedProjects.filter(p => p.status === status);
                  if (projectsInStatus.length > 0) {
                    acc[status] = projectsInStatus;
                  }
                  return acc;
                }, {} as Record<string, typeof filteredProjects>);

                return (
                  <>
                    {Object.entries(paginatedGrouped).map(([status, statusProjects]) => (
                  <div key={status}>
                    {/* Status Group Header */}
                    <div className={`relative flex items-center gap-4 mb-6 px-6 py-4 rounded-xl shadow-sm ${statusConfig[status]?.bgColor || 'bg-slate-100'} border-l-4 ${statusConfig[status]?.borderColor || 'border-slate-300'} backdrop-blur-sm`}>
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full ${statusConfig[status]?.bgColor || 'bg-slate-100'} flex items-center justify-center`}>
                          <span className={`w-4 h-4 rounded-full ${statusConfig[status]?.dotColor || 'bg-slate-500'} shadow-lg`} />
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold ${statusConfig[status]?.textColor || 'text-slate-600'}`}>
                            {statusConfig[status]?.label || status}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">{statusProjects.length} {statusProjects.length === 1 ? 'project' : 'projects'}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg ${statusConfig[status]?.bgColor || 'bg-slate-100'} border ${statusConfig[status]?.borderColor || 'border-slate-300'}`}>
                        <span className={`text-2xl font-bold ${statusConfig[status]?.textColor || 'text-slate-600'}`}>{statusProjects.length}</span>
                      </div>
                    </div>
                    {/* Projects Grid for this status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {statusProjects.map((project) => {
                        const stats = projectStats[project.project_id];
                        const progress = project.target_amount > 0 
                          ? Math.min(100, ((stats?.total_raised || 0) / project.target_amount) * 100)
                          : 0;
                        return (
                          <div
                            key={project.project_id}
                            onClick={() => router.push(`/projects/detail?id=${project.project_id}`)}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 group"
                          >
                            {/* Project Header with gradient */}
                            <div className={`h-2 bg-gradient-to-r ${
                              status === 'active' ? 'from-emerald-500 to-emerald-400' :
                              status === 'paused' ? 'from-yellow-500 to-yellow-400' :
                              status === 'completed' ? 'from-blue-500 to-blue-400' :
                              status === 'cancelled' ? 'from-red-500 to-red-400' :
                              'from-slate-500 to-slate-400'
                            }`}></div>
                            
                            <div className="p-6">
                              {/* Project Title & Status */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                    {project.name}
                                  </h3>
                                  {project.description && (
                                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{project.description}</p>
                                  )}
                                </div>
                                <span className={`ml-3 px-3 py-1 text-xs font-semibold rounded-full ${
                                  project.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                  project.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                  project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                  project.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="font-medium text-gray-700">{progress.toFixed(0)}% funded</span>
                                  <span className="text-gray-500">{stats?.total_contributions || 0} donations</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Raised</p>
                                  <p className="text-xl font-bold text-emerald-600">৳{formatExact(stats?.total_raised || 0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Goal</p>
                                  <p className="text-xl font-bold text-gray-900">৳{formatExact(project.target_amount)}</p>
                                </div>
                              </div>

                              {/* CTA */}
                              <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {stats?.unique_contributors || 0} contributors
                                </div>
                                <div className="flex items-center text-emerald-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                  View Details
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <Pagination
                    totalItems={allProjectsFlat.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </>
                );
              })()}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
                return paginatedProjects.map((project) => {
                const stats = projectStats[project.project_id];
                const progress = project.target_amount > 0 
                  ? Math.min(100, ((stats?.total_raised || 0) / project.target_amount) * 100)
                  : 0;
                return (
                  <div
                    key={project.project_id}
                    onClick={() => router.push(`/projects/detail?id=${project.project_id}`)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {/* Project Header with gradient */}
                    <div className={`h-2 bg-gradient-to-r ${
                      project.status === 'active' ? 'from-emerald-500 to-emerald-400' :
                      project.status === 'paused' ? 'from-yellow-500 to-yellow-400' :
                      project.status === 'completed' ? 'from-blue-500 to-blue-400' :
                      project.status === 'cancelled' ? 'from-red-500 to-red-400' :
                      'from-slate-500 to-slate-400'
                    }`}></div>
                    
                    <div className="p-6">
                      {/* Project Title & Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {project.name}
                          </h3>
                          {project.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{project.description}</p>
                          )}
                        </div>
                        <span className={`ml-3 px-3 py-1 text-xs font-semibold rounded-full ${
                          project.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          project.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          project.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-gray-700">{progress.toFixed(0)}% funded</span>
                          <span className="text-gray-500">{stats?.total_contributions || 0} donations</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Raised</p>
                          <p className="text-xl font-bold text-emerald-600">৳{formatExact(stats?.total_raised || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Goal</p>
                          <p className="text-xl font-bold text-gray-900">৳{formatExact(project.target_amount)}</p>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {stats?.unique_contributors || 0} contributors
                        </div>
                        <div className="flex items-center text-emerald-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                          View Details
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                });
              })()}
              </div>
              <Pagination
                totalItems={filteredProjects.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
