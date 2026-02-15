'use client';

import React, { useEffect, useState } from 'react';
import { fetchExcelData, fetchImages, ExcelData, ImageList } from '@/services/api';
import { settingsApi, projectsApi, statsApi, contributionsApi, Project, ProjectStats, Contribution } from '@/services/fundApi';
import DataTable from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import ImageGallery from '@/components/ImageGallery';
import DonationChart from '@/components/DonationChart';
import Tabs from '@/components/Tabs';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [images, setImages] = useState<ImageList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [dataSourceMode, setDataSourceMode] = useState<'excel' | 'dynamic'>('excel');
  
  // Dynamic mode data
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [recentContributions, setRecentContributions] = useState<Contribution[]>([]);

  // Check data source mode and load appropriate data
  useEffect(() => {
    if (isAuthenticated) {
      checkDataSourceAndLoad();
    }
  }, [isAuthenticated]);

  const checkDataSourceAndLoad = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check what data source mode is configured
      const settings = await settingsApi.get();
      const mode = settings.data_source_mode || 'excel';
      setDataSourceMode(mode as 'excel' | 'dynamic');
      
      if (mode === 'dynamic') {
        // Load fund management data
        await loadDynamicModeData();
        setLoading(false);
        return;
      }
      
      // Excel mode - load Excel data
      const [data, imageList] = await Promise.all([
        fetchExcelData(),
        fetchImages(),
      ]);
      
      setExcelData(data);
      setImages(imageList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDynamicModeData = async () => {
    try {
      // Load all projects
      const projectsData = await projectsApi.getAll();
      setProjects(projectsData);
      
      // Load stats for each project
      const statsMap: Record<string, ProjectStats> = {};
      const allContributions: Contribution[] = [];
      
      for (const project of projectsData) {
        try {
          const response = await statsApi.getProjectStats(project.project_id);
          statsMap[project.project_id] = response;
          
          // Get contributions for this project
          const contributions = await contributionsApi.getAll(project.project_id);
          allContributions.push(...contributions);
        } catch (err) {
          console.error(`Error loading stats for project ${project.project_id}:`, err);
        }
      }
      
      setProjectStats(statsMap);
      
      // Sort contributions by date (most recent first) and take top 5
      const sortedContributions = allContributions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentContributions(sortedContributions);
    } catch (err) {
      console.error('Error loading dynamic mode data:', err);
    }
  };

  // Show loading while checking authentication
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

  // Auto-redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while redirecting
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-xl font-semibold text-gray-700 mb-2">Loading data...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
          <div className="text-center max-w-md mx-auto p-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={checkDataSourceAndLoad}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  // Calculate totals for hero section
  const totalRaised = Object.values(projectStats).reduce((sum, stats) => sum + (stats?.total_raised || 0), 0);
  const totalContributors = Object.values(projectStats).reduce((sum, stats) => sum + (stats?.unique_contributors || 0), 0);
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;

  // Dynamic mode - show projects listing
  if (dataSourceMode === 'dynamic') {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          
          {/* Hero Section */}
          <div className="relative bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-30 overflow-hidden">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-500/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32 sm:pt-20 sm:pb-36 md:pt-24 md:pb-40">
              <div className="text-center">
                {/* Logo/Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 backdrop-blur-sm rounded-2xl mb-4 sm:mb-6 border border-emerald-500/30">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-4">
                  IUT02 Care
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
                  Empowering communities through collective giving. Together, we make a difference.
                </p>
                
                {/* Stats Row */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-12">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 min-w-[120px] sm:min-w-[140px]">
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-400">৳{totalRaised.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs sm:text-sm uppercase tracking-wide mt-1">Total Raised</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 min-w-[120px] sm:min-w-[140px]">
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{totalContributors}</p>
                    <p className="text-slate-400 text-xs sm:text-sm uppercase tracking-wide mt-1">Contributors</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 min-w-[120px] sm:min-w-[140px]">
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-400">{activeProjectsCount}</p>
                    <p className="text-slate-400 text-xs sm:text-sm uppercase tracking-wide mt-1">Active Projects</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Wave Divider - positioned properly to avoid overlap */}
            <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 overflow-hidden">
              <svg 
                className="absolute bottom-0 w-full h-full" 
                viewBox="0 0 1440 120" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" className="fill-slate-50"/>
              </svg>
            </div>
          </div>

          {/* About Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <span className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                  About Us
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Making a Real Impact in Our Community
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  IUT02 Care is a community-driven charity platform managed by the alumni and members of IUT Batch 02. 
                  We believe in the power of collective giving to transform lives and uplift those in need.
                </p>
                <p className="text-gray-600 text-lg leading-relaxed">
                  From providing blankets during harsh winters to supporting flood victims and funding education, 
                  every contribution—no matter how small—creates ripples of positive change.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Transparent</h3>
                  <p className="text-sm text-slate-400">Every taka is tracked and reported</p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Community</h3>
                  <p className="text-sm text-slate-400">Built by alumni, for everyone</p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Efficient</h3>
                  <p className="text-sm text-slate-400">Quick response to urgent needs</p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
                  <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Impactful</h3>
                  <p className="text-sm text-slate-400">Real change, real stories</p>
                </div>
              </div>
            </div>

            {/* Projects Section Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Our Projects</h2>
                <p className="mt-1 text-gray-500">Click on a project to see details and contribute</p>
              </div>
              {projects.length > 0 && (
                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
                </span>
              )}
            </div>

            {/* Projects Grid - Grouped by Status */}
            {projects.length === 0 ? (
              <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-12 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">No Projects Yet</h2>
                <p className="text-slate-400 mb-6">Get started by creating your first charity project</p>
                <button
                  onClick={() => router.push('/admin')}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {(() => {
                  // Define status order and styling
                  const statusOrder = ['active', 'paused', 'completed', 'cancelled', 'archived'];
                  const statusConfig: Record<string, { dotColor: string; bgColor: string; borderColor: string; textColor: string; label: string }> = {
                    active: { dotColor: 'bg-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', textColor: 'text-emerald-400', label: 'Active Projects' },
                    paused: { dotColor: 'bg-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', textColor: 'text-yellow-400', label: 'Paused Projects' },
                    completed: { dotColor: 'bg-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', textColor: 'text-blue-400', label: 'Completed Projects' },
                    cancelled: { dotColor: 'bg-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', textColor: 'text-red-400', label: 'Cancelled Projects' },
                    archived: { dotColor: 'bg-slate-500', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30', textColor: 'text-slate-400', label: 'Archived Projects' },
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
                      <div className={`flex items-center gap-3 mb-6 px-4 py-3 rounded-xl ${statusConfig[status]?.bgColor || 'bg-slate-700/50'} border ${statusConfig[status]?.borderColor || 'border-slate-600'}`}>
                        <span className={`w-3 h-3 rounded-full ${statusConfig[status]?.dotColor || 'bg-slate-500'}`} />
                        <h3 className={`text-lg font-semibold ${statusConfig[status]?.textColor || 'text-slate-400'}`}>
                          {statusConfig[status]?.label || status} ({statusProjects.length})
                        </h3>
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
                              className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden cursor-pointer hover:shadow-xl hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300 group"
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
                                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                      {project.name}
                                    </h3>
                                    {project.description && (
                                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">{project.description}</p>
                                    )}
                                  </div>
                                  <span className={`ml-3 px-3 py-1 text-xs font-semibold rounded-full ${
                                    project.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    project.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                    project.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    project.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    'bg-slate-600/50 text-slate-400 border border-slate-500/30'
                                  }`}>
                                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                  </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-300">{progress.toFixed(0)}% funded</span>
                                    <span className="text-slate-500">{stats?.total_contributions || 0} donations</span>
                                  </div>
                                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                                  <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Raised</p>
                                    <p className="text-2xl font-bold text-emerald-400">৳{(stats?.total_raised || 0).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Goal</p>
                                    <p className="text-2xl font-bold text-white">৳{project.target_amount.toLocaleString()}</p>
                                  </div>
                                </div>

                                {/* Contributors & CTA */}
                                <div className="mt-6 flex items-center justify-between">
                                  <div className="flex items-center text-sm text-slate-400">
                                    <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    {stats?.unique_contributors || 0} contributors
                                  </div>
                                  <div className="flex items-center text-emerald-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
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
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="bg-slate-900 text-white py-12 mt-16 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 text-emerald-400">IUT02 Care</h3>
                  <p className="text-slate-400 text-sm">
                    A community-driven charity initiative by IUT Batch 02 alumni, 
                    dedicated to making a positive impact in our society.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Quick Links</h4>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li><a href="/" className="hover:text-emerald-400 transition-colors">Home</a></li>
                    <li><a href="/profile" className="hover:text-emerald-400 transition-colors">Profile</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Contact</h4>
                  <p className="text-slate-400 text-sm">
                    For inquiries and support, reach out to the IUT02 community administrators.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
                © {new Date().getFullYear()} IUT02 Care. Built with ❤️ by IUT Batch 02.
              </div>
            </div>
          </footer>
        </div>
      </>
    );
  }

  // Get all sheets dynamically
  const sheets = excelData?.data?.sheets || {};
  const sheetNames = Object.keys(sheets);
  
  // Get first sheet (for charts and default table view)
  const firstSheet = sheetNames.length > 0 ? sheets[sheetNames[0]] : null;
  // Get second sheet (for summary/statistics)
  const secondSheet = sheetNames.length > 1 ? sheets[sheetNames[1]] : null;

  // Define tabs dynamically based on actual sheet names
  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'charts', label: '📈 Charts', icon: '📈' },
    ...sheetNames.map((name, idx) => ({ 
      id: name.toLowerCase().replace(/\s+/g, '-'), 
      label: `📋 ${name}`, 
      icon: '📋' 
    })),
    ...(images && images.images && images.images.length > 0 
      ? [{ id: 'gallery', label: '🖼️ Gallery', icon: '🖼️' }] 
      : [])
  ];

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Summary Statistics - from second sheet if it's a summary type */}
            {secondSheet && secondSheet.type === 'summary' && secondSheet.data && Object.keys(secondSheet.data).length > 0 && (
              <section>
                <h2 className="text-3xl font-bold mb-6 text-gray-800">Summary Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(secondSheet.data).map(([key, value], idx) => {
                    const colors: Array<'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'indigo'> = 
                      ['blue', 'green', 'purple', 'orange', 'pink', 'indigo'];
                    return (
                      <SummaryCard
                        key={idx}
                        title={key}
                        value={typeof value === 'number' ? value.toLocaleString() : String(value)}
                        color={colors[idx % colors.length]}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Quick Stats - from first sheet if it's a table */}
            {firstSheet && firstSheet.type === 'table' && (
              <section>
                <div className="mb-8">
                  <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Quick Statistics
                  </h2>
                  <p className="text-gray-500">Data insights at a glance</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SummaryCard
                    title="Total Records"
                    value={firstSheet.data?.length || 0}
                    color="blue"
                  />
                  <SummaryCard
                    title="Total Amount"
                    value={firstSheet.data?.reduce((sum: number, row: any) => {
                      const amount = parseFloat(row['Amount (BDT)']) || 0;
                      return sum + amount;
                    }, 0).toLocaleString() || '0'}
                    color="green"
                    subtitle="BDT"
                  />
                  <SummaryCard
                    title="Payment Methods"
                    value={new Set(firstSheet.data?.map((row: any) => row['Payment Mode']).filter(Boolean)).size || 0}
                    color="purple"
                  />
                </div>
              </section>
            )}
          </div>
        );

      case 'charts':
        return (
          <div>
            {(() => {
              // Find the first sheet with table data
              const tableSheet = sheetNames
                .map(name => ({ name, data: sheets[name] }))
                .find(({ data }) => data?.type === 'table' && data?.data && data.data.length > 0);
              
              if (tableSheet && tableSheet.data.data) {
                return <DonationChart data={tableSheet.data.data} />;
              }
              
              return (
                <div className="text-center py-12 text-gray-500">
                  <p>No chart data available</p>
                  <p className="text-sm mt-2">Make sure you have a sheet with table data containing &apos;Name&apos; and &apos;Amount (BDT)&apos; columns</p>
                </div>
              );
            })()}
          </div>
        );

      case 'gallery':
        return (
          <div>
            {images && images.images && images.images.length > 0 ? (
              <ImageGallery images={images.images} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                No images available
              </div>
            )}
          </div>
        );

      default:
        // Handle all sheets dynamically by matching tab ID to sheet name
        const sheetName = sheetNames.find(
          name => name.toLowerCase().replace(/\s+/g, '-') === activeTab
        );
        if (sheetName) {
          const sheetData = sheets[sheetName];
          return (
            <div>
              <div className="mb-8">
                <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {sheetName}
                </h2>
                <p className="text-gray-500">Detailed data view</p>
              </div>
              {sheetData?.type === 'table' && (
                <DataTable
                  columns={sheetData.columns || []}
                  data={sheetData.data || []}
                  title=""
                />
              )}
              {sheetData?.type === 'summary' && sheetData.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {Object.entries(sheetData.data).map(([key, value], idx) => {
                    const colors: Array<'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'indigo'> = 
                      ['blue', 'green', 'purple', 'orange', 'pink', 'indigo'];
                    return (
                      <SummaryCard
                        key={idx}
                        title={key}
                        value={typeof value === 'number' ? value.toLocaleString() : String(value)}
                        color={colors[idx % colors.length]}
                      />
                    );
                  })}
                </div>
              )}
              {sheetData?.raw_data && sheetData.raw_data.length > 0 && (
                <DataTable
                  columns={sheetData.raw_data.length > 0 ? Object.keys(sheetData.raw_data[0]) : []}
                  data={sheetData.raw_data}
                  title=""
                />
              )}
            </div>
          );
        }
        return <div className="text-center py-12 text-gray-500">Content not found</div>;
    }
  };

  return (
    <>
    <Navigation />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-2xl">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-100">
                {excelData?.data?.metadata?.file_name?.replace('.xlsx', '') || 'Excel Data Visualization'}
              </h1>
              <p className="text-blue-200 text-lg font-medium">
                Interactive data presentation & analytics
              </p>
              {isAuthenticated && user && (
                <p className="text-blue-300 text-sm mt-2">
                  ✓ Logged in as {user.email}
                </p>
              )}
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <p className="text-xs text-blue-200 uppercase tracking-wider">Sheets</p>
                <p className="text-2xl font-bold">{excelData?.data?.metadata?.sheet_count || 0}</p>
              </div>
              {isAuthenticated && user && (
                <div className="relative group">
                  {/* User Avatar Button */}
                  <button
                    className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full pl-1 pr-4 py-1 border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{user?.username || 'User'}</p>
                      <p className="text-xs text-blue-200 truncate max-w-[120px]">{user?.email || ''}</p>
                    </div>
                    <svg className="w-4 h-4 text-blue-200 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-slate-800 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden">
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-white/10">
                        <p className="text-sm font-semibold text-white">{user?.username || 'User'}</p>
                        <p className="text-xs text-blue-200 truncate">{user?.email}</p>
                      </div>
                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => router.push('/profile')}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                        >
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => router.push('/profile')}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                        >
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Settings</span>
                        </button>
                      </div>
                      {/* Logout */}
                      <div className="border-t border-white/10">
                        <button
                          onClick={logout}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/20 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Tabs Navigation */}
        {tabs.length > 0 && (
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Tab Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-100 p-8 md:p-10 min-h-[500px]">
          {renderTabContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-8 mt-16 border-t border-slate-700">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-slate-300 text-sm">
                <span className="font-semibold">Data Source:</span> Excel file
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse"></div>
              <p className="text-slate-400 text-xs">Live Data</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}

