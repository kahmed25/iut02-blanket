'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRole, UserRole } from '../hooks/useRole';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  projectId?: string; // For project-specific access checks
  fallbackUrl?: string;
}

/**
 * Component that protects routes based on user role
 * Redirects to fallback URL if user doesn't have required role
 */
export function RoleProtectedRoute({
  children,
  allowedRoles,
  projectId,
  fallbackUrl = '/',
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const {
    user,
    role,
    loading,
    isAuthenticated,
    hasRole,
    hasProjectAccess,
    getRoleDisplayName,
  } = useRole();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-md mx-auto p-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access this page</p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.some((r) => hasRole(r));

  // For project-specific pages, also check project access
  const hasProjectPermission = projectId ? hasProjectAccess(projectId) : true;

  if (!hasRequiredRole || !hasProjectPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="text-center max-w-md mx-auto p-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-2">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your role: <span className="font-medium">{getRoleDisplayName()}</span>
            <br />
            Required: <span className="font-medium">{allowedRoles.map((r) => getRoleDisplayName(r)).join(' or ')}</span>
          </p>
          <button
            onClick={() => router.push(fallbackUrl)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default RoleProtectedRoute;
