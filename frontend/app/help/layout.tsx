'use client';

import React from 'react';
import { Navigation } from '@/components/Navigation';
import { HelpSidebar } from '@/components/help/HelpSidebar';
import Link from 'next/link';

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <HelpSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl">
            {/* Breadcrumb */}
            <nav className="mb-6">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link href="/" className="text-gray-500 hover:text-gray-700">
                    Home
                  </Link>
                </li>
                <li>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  <Link href="/help" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Help Center
                  </Link>
                </li>
              </ol>
            </nav>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
