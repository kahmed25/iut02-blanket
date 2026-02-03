'use client';

import React from 'react';
import { Project, ProjectStats } from '@/services/fundApi';

interface ProjectCardProps {
  project: Project;
  stats?: ProjectStats;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onViewDetails?: (project: Project) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function ProjectCard({
  project,
  stats,
  onEdit,
  onDelete,
  onViewDetails,
  canEdit = false,
  canDelete = false,
}: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const progressPercentage = stats?.progress_percentage || 0;
  const progressColor = progressPercentage >= 100 ? 'bg-green-500' : progressPercentage >= 50 ? 'bg-blue-500' : 'bg-indigo-500';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description || 'No description'}</p>
          </div>
          <span className={`ml-3 px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>

        {/* Stats */}
        {stats && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-900">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Amount Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Collected</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.total_raised?.toLocaleString() || 0}
                  <span className="text-sm text-gray-500 ml-1">{stats.target_currency}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Target</p>
                <p className="text-lg font-semibold text-gray-900">
                  {project.target_amount.toLocaleString()}
                  <span className="text-sm text-gray-500 ml-1">{project.target_currency}</span>
                </p>
              </div>
            </div>

            {/* Contribution Count */}
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {stats.total_contributions} contributions
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => onViewDetails?.(project)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View Details →
          </button>
          <div className="flex items-center space-x-2">
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(project)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(project)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
