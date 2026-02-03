'use client';

import { useAuth } from './useAuth';
import { User } from '../services/authService';

export type UserRole = 'super_admin' | 'admin' | 'fund_admin' | 'user';

// Role hierarchy (higher index = higher privilege)
const ROLE_HIERARCHY: UserRole[] = ['user', 'fund_admin', 'admin', 'super_admin'];

// Preview role state (persisted in localStorage)
const PREVIEW_ROLE_KEY = 'iut02_preview_role';

function getStoredPreviewRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(PREVIEW_ROLE_KEY);
  if (stored && ['super_admin', 'admin', 'fund_admin', 'user'].includes(stored)) {
    return stored as UserRole;
  }
  return null;
}

export function setPreviewRole(role: UserRole | null) {
  if (typeof window === 'undefined') return;
  if (role) {
    localStorage.setItem(PREVIEW_ROLE_KEY, role);
  } else {
    localStorage.removeItem(PREVIEW_ROLE_KEY);
  }
}

export function getPreviewRole(): UserRole | null {
  return getStoredPreviewRole();
}

export function clearPreviewRole() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PREVIEW_ROLE_KEY);
}

/**
 * Hook for role-based access control
 */
export function useRole() {
  const { user, isAuthenticated, loading } = useAuth();

  // Get actual role and preview role
  const actualRole = user?.role || 'user';
  const isActuallySuperAdmin = actualRole === 'super_admin';
  
  // Use preview role if set and user is super admin
  const previewRole = getStoredPreviewRole();
  const role = (isActuallySuperAdmin && previewRole) ? previewRole : actualRole;
  const isPreviewMode = isActuallySuperAdmin && previewRole !== null;
  
  const assignedProjects = user?.assigned_projects || [];

  /**
   * Check if user has at least the specified role
   */
  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    const userRoleIndex = ROLE_HIERARCHY.indexOf(role);
    const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);
    return userRoleIndex >= requiredRoleIndex;
  };

  /**
   * Check if user has exactly the specified role
   */
  const isRole = (checkRole: UserRole): boolean => {
    return role === checkRole;
  };

  /**
   * Check if user is Super Admin
   */
  const isSuperAdmin = (): boolean => role === 'super_admin';

  /**
   * Check if user is Admin or higher
   */
  const isAdmin = (): boolean => hasRole('admin');

  /**
   * Check if user is Fund Admin or higher
   */
  const isFundAdmin = (): boolean => hasRole('fund_admin');

  /**
   * Check if user has access to a specific project
   * Super Admin and Admin have access to all projects
   * Fund Admin only has access to assigned projects
   */
  const hasProjectAccess = (projectId: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin() || isRole('admin')) return true;
    if (isRole('fund_admin')) {
      return assignedProjects.includes(projectId);
    }
    return false;
  };

  /**
   * Check if user can manage users (Super Admin or Admin only)
   */
  const canManageUsers = (): boolean => hasRole('admin');

  /**
   * Check if user can manage settings (Super Admin or Admin only)
   */
  const canManageSettings = (): boolean => hasRole('admin');

  /**
   * Check if user can create projects (Admin or higher)
   */
  const canCreateProjects = (): boolean => hasRole('admin');

  /**
   * Check if user can delete projects (Admin or higher)
   */
  const canDeleteProjects = (): boolean => hasRole('admin');

  /**
   * Check if user can manage contributions for a project
   */
  const canManageContributions = (projectId: string): boolean => {
    return hasProjectAccess(projectId);
  };

  /**
   * Get role display name
   */
  const getRoleDisplayName = (r?: UserRole): string => {
    const roleToDisplay = r || role;
    const displayNames: Record<UserRole, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      fund_admin: 'Fund Admin',
      user: 'User',
    };
    return displayNames[roleToDisplay];
  };

  /**
   * Get role badge color
   */
  const getRoleBadgeColor = (r?: UserRole): string => {
    const roleToColor = r || role;
    const colors: Record<UserRole, string> = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      fund_admin: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return colors[roleToColor];
  };

  return {
    // User info
    user,
    role,
    actualRole,
    assignedProjects,
    isAuthenticated,
    loading,
    
    // Preview mode
    isPreviewMode,
    isActuallySuperAdmin,
    setPreviewRole: (r: UserRole | null) => setPreviewRole(r),
    clearPreviewRole,

    // Role checks
    hasRole,
    isRole,
    isSuperAdmin,
    isAdmin,
    isFundAdmin,

    // Permission checks
    hasProjectAccess,
    canManageUsers,
    canManageSettings,
    canCreateProjects,
    canDeleteProjects,
    canManageContributions,

    // Display helpers
    getRoleDisplayName,
    getRoleBadgeColor,
  };
}

/**
 * Get role hierarchy index (for comparisons)
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Compare two roles
 * Returns positive if role1 > role2, negative if role1 < role2, 0 if equal
 */
export function compareRoles(role1: UserRole, role2: UserRole): number {
  return getRoleLevel(role1) - getRoleLevel(role2);
}

export default useRole;
