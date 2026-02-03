'use client';

import React from 'react';
import Link from 'next/link';

export default function GettingStartedPage() {
  return (
    <div className="prose prose-emerald max-w-none">
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Getting Started</h1>
            <p className="text-gray-600">A quick 5-minute guide to get you up and running</p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8 not-prose">
        <h2 className="text-lg font-semibold text-emerald-800 mb-2">What is IUT02 Care?</h2>
        <p className="text-emerald-700">
          IUT02 Care is a charity fund management platform that helps organizations track donations, 
          manage charity projects, and record fund distributions to beneficiary institutions. 
          It provides transparency and accountability for charitable activities.
        </p>
      </div>

      {/* Steps */}
      <h2>Quick Start Steps</h2>
      
      <div className="not-prose space-y-6">
        {/* Step 1 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              1
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900 text-lg">Sign In with Social Login</h3>
              <p className="text-gray-600 mt-1">
                IUT02 Care uses OAuth authentication. Sign in using your Google, Facebook, or Amazon account. 
                Your account is created automatically on first login.
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">
                  <strong>Note:</strong> Your initial role will be &quot;User&quot; (view-only). 
                  Contact an administrator to get elevated permissions if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              2
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900 text-lg">Explore the Dashboard</h3>
              <p className="text-gray-600 mt-1">
                After signing in, you&apos;ll land on the Dashboard. Here you can see an overview of all 
                charity projects, including their progress, total funds raised, and status.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">Active Projects</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Completed Projects</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Paused Projects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              3
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900 text-lg">View Project Details</h3>
              <p className="text-gray-600 mt-1">
                Click on any project to see its full details. The project page has multiple tabs:
              </p>
              <ul className="mt-3 space-y-2 text-gray-600">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <strong>Overview</strong> - Statistics and charts
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <strong>Donate Now</strong> - Donation information
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <strong>Contributions</strong> - Donation records
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <strong>Distribution</strong> - Fund distribution records
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <strong>Media</strong> - Photos, videos, audio
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <strong>Team</strong> - Fund administrators
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              4
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900 text-lg">Make a Donation</h3>
              <p className="text-gray-600 mt-1">
                To donate, go to a project&apos;s &quot;Donate Now&quot; tab. Contact the fund administrators 
                using the payment methods provided (Bkash, Nagad, Bank Transfer, Cash, etc.). 
                Your contribution will be recorded by the fund admin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role-based Features */}
      <h2 className="mt-10">Features by Role</h2>
      <p>
        What you can do in IUT02 Care depends on your assigned role. Here&apos;s a quick overview:
      </p>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div className="flex items-center mb-3">
            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">User</span>
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>✓ View all projects</li>
            <li>✓ View contributions & distributions</li>
            <li>✓ View media gallery</li>
            <li>✓ View team members</li>
          </ul>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
          <div className="flex items-center mb-3">
            <span className="px-2 py-1 bg-green-200 text-green-700 rounded-full text-xs font-medium">Fund Admin</span>
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>✓ All User permissions</li>
            <li>✓ Add contributions (assigned projects)</li>
            <li>✓ Add distributions (assigned projects)</li>
            <li>✓ Upload media (assigned projects)</li>
          </ul>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center mb-3">
            <span className="px-2 py-1 bg-blue-200 text-blue-700 rounded-full text-xs font-medium">Admin</span>
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>✓ All Fund Admin permissions</li>
            <li>✓ Create & edit projects</li>
            <li>✓ Assign fund admins</li>
            <li>✓ Import projects from Excel</li>
          </ul>
        </div>
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
          <div className="flex items-center mb-3">
            <span className="px-2 py-1 bg-purple-200 text-purple-700 rounded-full text-xs font-medium">Super Admin</span>
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>✓ All Admin permissions</li>
            <li>✓ Change user roles</li>
            <li>✓ System settings</li>
            <li>✓ Preview as any role</li>
          </ul>
        </div>
      </div>

      {/* Next Steps */}
      <h2 className="mt-10">Next Steps</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/help/projects" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Projects Guide</h3>
          <p className="text-sm text-gray-500 mt-1">Learn about project management</p>
        </Link>
        <Link href="/help/contributions" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Contributions Guide</h3>
          <p className="text-sm text-gray-500 mt-1">Understanding donations</p>
        </Link>
        <Link href="/help/roles" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Roles & Permissions</h3>
          <p className="text-sm text-gray-500 mt-1">Detailed role information</p>
        </Link>
      </div>
    </div>
  );
}
