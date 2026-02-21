'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Map routes to their help pages
const routeToHelpMap: Record<string, { href: string; label: string }> = {
  '/': { href: '/help/getting-started', label: 'Dashboard Help' },
  '/projects': { href: '/help/projects', label: 'Projects Help' },
  '/admin': { href: '/help/admin', label: 'Admin Panel Help' },
  '/fund-admin': { href: '/help/contributions', label: 'Fund Management Help' },
  '/projects/import': { href: '/help/import', label: 'Import Help' },
  '/profile': { href: '/help/roles', label: 'Profile & Roles Help' },
};

// For dynamic routes
function getHelpForRoute(pathname: string): { href: string; label: string } {
  // Check exact matches first
  if (routeToHelpMap[pathname]) {
    return routeToHelpMap[pathname];
  }
  
  // Check for project detail pages
  if (pathname.startsWith('/projects/') && pathname !== '/projects/import') {
    return { href: '/help/projects#project-details', label: 'Project Details Help' };
  }
  
  // Default to help center
  return { href: '/help', label: 'Help Center' };
}

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const contextualHelp = getHelpForRoute(pathname);

  // Don't show on help pages, login page, or any authenticated pages (hide completely after login)
  // Only show on login and help pages
  if (pathname.startsWith('/help') || pathname.startsWith('/login')) {
    return null;
  }

  // Hide on all other pages (authenticated pages)
  return null;

  return (
    <div className="fixed top-20 right-6 z-50">
      {/* Quick Menu */}
      {isOpen && (
        <div className="absolute top-16 right-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden mt-2">
          <div className="p-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
            <h3 className="font-semibold">Need Help?</h3>
            <p className="text-sm text-emerald-100 mt-1">Find answers to your questions</p>
          </div>
          <div className="p-2">
            <Link
              href={contextualHelp.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center p-3 rounded-lg hover:bg-emerald-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900 text-sm">{contextualHelp.label}</p>
                <p className="text-xs text-gray-500">Help for this page</p>
              </div>
            </Link>
            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900 text-sm">Help Center</p>
                <p className="text-xs text-gray-500">Browse all topics</p>
              </div>
            </Link>
            <Link
              href="/help/getting-started"
              onClick={() => setIsOpen(false)}
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 group-hover:bg-amber-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900 text-sm">Getting Started</p>
                <p className="text-xs text-gray-500">Quick start guide</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800 rotate-45'
            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default HelpButton;
