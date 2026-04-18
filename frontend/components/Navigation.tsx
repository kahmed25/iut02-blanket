'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRole, UserRole } from '@/auth/hooks/useRole';
import { useAuth } from '@/auth/hooks/useAuth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: ('super_admin' | 'admin' | 'fund_admin' | 'user')[];
}

const PREVIEW_ROLES: { role: UserRole; label: string; color: string }[] = [
  { role: 'super_admin', label: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { role: 'admin', label: 'Admin', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { role: 'fund_admin', label: 'Fund Admin', color: 'bg-green-100 text-green-700 border-green-300' },
  { role: 'user', label: 'User', color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: 'Admin Panel',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['super_admin', 'admin'],
  },
  {
    label: 'Fund Management',
    href: '/fund-admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    roles: ['super_admin', 'admin', 'fund_admin'],
  },
  {
    label: 'Import Project',
    href: '/projects/import',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    roles: ['super_admin', 'admin'],
  },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { 
    role, 
    actualRole,
    getRoleDisplayName, 
    getRoleBadgeColor, 
    isAuthenticated,
    isActuallySuperAdmin,
    isPreviewMode,
    setPreviewRole,
    clearPreviewRole 
  } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    // Check if user has at least one of the required roles (using hierarchy)
    return item.roles.some((r) => {
      // Super admin and admin always have fund_admin access
      if (r === 'fund_admin' && (role === 'super_admin' || role === 'admin')) {
        return true;
      }
      return role === r;
    });
  });

  const handleRoleSwitch = (newRole: UserRole) => {
    if (newRole === actualRole) {
      clearPreviewRole();
    } else {
      setPreviewRole(newRole);
    }
    setShowRoleSwitcher(false);
    // Navigate to home to apply role changes
    router.push('/');
    // Force a full page refresh to ensure all components re-render with new role
    setTimeout(() => window.location.reload(), 100);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium">
          <span className="mr-2">👁️ Preview Mode:</span>
          Viewing as <strong>{getRoleDisplayName()}</strong>
          <button
            onClick={() => {
              clearPreviewRole();
              window.location.reload();
            }}
            className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
          >
            Exit Preview
          </button>
        </div>
      )}
      
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
          {/* Logo and Desktop Nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                IUT02 Care
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {filteredNavItems.map((item) => {
                // Check if active - also highlight Projects for project detail pages
                const isActive = pathname === item.href || 
                  (item.href === '/projects' && pathname.startsWith('/projects/'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`mr-2 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {/* Help Link - Prominent */}
            <Link
              href="/help"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                pathname === '/help' || pathname.startsWith('/help/')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className={`w-5 h-5 mr-1.5 ${pathname === '/help' || pathname.startsWith('/help/') ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </Link>

            {/* Role Switcher for Super Admin */}
            {isActuallySuperAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    isPreviewMode 
                      ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' 
                      : 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                  }`}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {isPreviewMode ? `Viewing as ${getRoleDisplayName()}` : 'Switch View'}
                  <svg className={`w-4 h-4 ml-1.5 transition-transform ${showRoleSwitcher ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown */}
                {showRoleSwitcher && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview as Role</p>
                    </div>
                    {PREVIEW_ROLES.map(({ role: r, label, color }) => (
                      <button
                        key={r}
                        onClick={() => handleRoleSwitch(r)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          role === r ? 'bg-gray-50' : ''
                        }`}
                      >
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                          {label}
                        </span>
                        {role === r && (
                          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {r === actualRole && role !== r && (
                          <span className="text-xs text-gray-400">(Your role)</span>
                        )}
                      </button>
                    ))}
                    {isPreviewMode && (
                      <>
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={() => {
                              clearPreviewRole();
                              setShowRoleSwitcher(false);
                              window.location.reload();
                            }}
                            className="w-full flex items-center px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Exit Preview Mode
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Role Badge (for non-super-admins) */}
            {!isActuallySuperAdmin && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor()}`}>
                {getRoleDisplayName()}
              </span>
            )}
            
            {/* User Menu with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">{user?.username || user?.email?.split('@')[0]}</p>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.username || user?.email}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help Center
                  </Link>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100">
            {/* Mobile Role Switcher for Super Admin */}
            {isActuallySuperAdmin && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Preview as Role</p>
                <div className="flex flex-wrap gap-2">
                  {PREVIEW_ROLES.map(({ role: r, label, color }) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        role === r ? `${color} ring-2 ring-offset-1 ring-indigo-500` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-2 pb-3 space-y-1 px-4">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-base font-medium rounded-lg ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
              {/* Help Link in Mobile */}
              <Link
                href="/help"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 text-base font-medium rounded-lg ${
                  pathname === '/help' || pathname.startsWith('/help/')
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={`mr-3 ${pathname === '/help' || pathname.startsWith('/help/') ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Help
              </Link>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 px-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                    {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user?.username || user?.email}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor()}`}>
                  {getRoleDisplayName()}
                </span>
                <div className="flex space-x-2">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navigation;
