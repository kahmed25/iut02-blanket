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

  // Sort projects: active first, then by date
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const statusOrder: Record<string, number> = { active: 0, paused: 1, completed: 2, cancelled: 3, archived: 4 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Paginate
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProjects = sortedProjects.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="hero-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">All Projects</h1>
                <p className="mt-2 text-indigo-200">
                  Browse and explore all charity projects
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-4">
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-teal-300">৳{formatExact(totalRaised)}</p>
                  <p className="text-xs text-indigo-300 uppercase">Total Raised</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">{projects.length}</p>
                  <p className="text-xs text-indigo-300 uppercase">Projects</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">{totalContributors}</p>
                  <p className="text-xs text-indigo-300 uppercase">Contributors</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'all', label: 'All', count: projects.length },
              { id: 'active', label: 'Active', count: projects.filter(p => p.status === 'active').length },
              { id: 'completed', label: 'Completed', count: projects.filter(p => p.status === 'completed').length },
              { id: 'paused', label: 'Paused', count: projects.filter(p => p.status === 'paused').length },
            ].filter(tab => tab.count > 0 || tab.id === 'all').map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                    filter === tab.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Projects Grid - Simple clean layout */}
          {paginatedProjects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">No Projects Found</h2>
              <p className="mt-2 text-gray-500">
                {filter === 'all' ? 'No projects have been created yet.' : `No ${filter} projects.`}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProjects.map((project) => {
                  const stats = projectStats[project.project_id];
                  const progress = project.target_amount > 0
                    ? Math.min(100, ((stats?.total_raised || 0) / project.target_amount) * 100)
                    : 0;

                  return (
                    <div
                      key={project.project_id}
                      onClick={() => router.push(`/projects/detail?id=${project.project_id}`)}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer group hover:shadow-md hover:border-gray-300 transition-all"
                    >
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 flex-1">
                            {project.name}
                          </h3>
                          <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                            project.status === 'active' ? 'bg-teal-50 text-teal-700' :
                            project.status === 'paused' ? 'bg-amber-50 text-amber-700' :
                            project.status === 'completed' ? 'bg-sky-50 text-sky-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {project.status}
                          </span>
                        </div>

                        {project.description && (
                          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
                        )}

                        {/* Progress */}
                        <div className="mb-4">
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                            <div
                              className={`h-1.5 rounded-full ${
                                project.status === 'active' ? 'bg-teal-500' :
                                project.status === 'completed' ? 'bg-sky-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{progress.toFixed(0)}% funded</span>
                            <span>{stats?.total_contributions || 0} donations</span>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div>
                            <span className="text-lg font-bold text-teal-600">৳{formatExact(stats?.total_raised || 0)}</span>
                            <span className="text-gray-400 text-sm"> / ৳{formatExact(project.target_amount)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {stats?.unique_contributors || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                totalItems={sortedProjects.length}
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
