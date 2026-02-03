'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminHelpPage() {
  return (
    <div className="prose prose-emerald max-w-none">
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin Panel</h1>
            <p className="text-gray-600">System administration and user management</p>
          </div>
        </div>
      </div>

      <div className="not-prose bg-purple-50 border border-purple-200 rounded-xl p-6 my-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-purple-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <h3 className="font-semibold text-purple-800 mb-2">Admin Access Only</h3>
            <p className="text-purple-700 text-sm">
              The Admin Panel is only accessible to Super Admins and Admins. 
              Regular users and Fund Admins cannot access this area.
            </p>
          </div>
        </div>
      </div>

      <h2>Admin Panel Overview</h2>
      <p>
        The Admin Panel provides centralized control over the IUT02 Care platform. 
        Access it via the &quot;Admin Panel&quot; link in the navigation menu.
      </p>

      <h2>User Management</h2>
      <p>
        View and manage all users registered in the system:
      </p>
      <ul>
        <li><strong>User List</strong> - See all users with their names, emails, and roles</li>
        <li><strong>Role Assignment</strong> - Change user roles (Super Admin only)</li>
        <li><strong>Project Assignment</strong> - Assign Fund Admins to specific projects</li>
      </ul>

      <h3>Changing User Roles (Super Admin Only)</h3>
      <div className="not-prose bg-red-50 border border-red-200 rounded-xl p-6 my-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-semibold text-red-800 mb-2">Super Admin Only</h3>
            <p className="text-red-700 text-sm">
              Only the Super Admin can change user roles. Admins can manage projects and users but cannot modify roles.
            </p>
          </div>
        </div>
      </div>

      <p>To change a user&apos;s role:</p>
      <ol>
        <li>Go to the Admin Panel</li>
        <li>Find the user in the Users list</li>
        <li>Click on the role dropdown next to their name</li>
        <li>Select the new role: Admin, Fund Admin, or User</li>
        <li>Confirm the change</li>
      </ol>

      <h3>Assigning Fund Admins to Projects</h3>
      <p>
        Fund Admins need to be assigned to specific projects to manage them:
      </p>
      <ol>
        <li>First, ensure the user has the &quot;Fund Admin&quot; role</li>
        <li>Click &quot;Manage Assignments&quot; or similar button</li>
        <li>Select the project(s) to assign</li>
        <li>Save the assignment</li>
      </ol>
      <p>
        Fund Admins can be assigned to multiple projects. They can only manage 
        contributions, distributions, and media for their assigned projects.
      </p>

      <h2>Project Management</h2>
      <p>
        Admins can create, edit, and manage all charity projects:
      </p>

      <h3>Creating a Project</h3>
      <ol>
        <li>Go to the Projects page</li>
        <li>Click &quot;Create Project&quot;</li>
        <li>Fill in the project details:
          <ul>
            <li>Name (required)</li>
            <li>Description</li>
            <li>Target Amount</li>
            <li>Currency</li>
            <li>Status</li>
          </ul>
        </li>
        <li>Click &quot;Create&quot; to save</li>
      </ol>

      <h3>Editing a Project</h3>
      <ol>
        <li>Navigate to the project&apos;s detail page</li>
        <li>Click the &quot;Edit&quot; button</li>
        <li>Modify the details as needed</li>
        <li>Save your changes</li>
      </ol>

      <h3>Project Status Management</h3>
      <p>
        Projects can have three statuses:
      </p>
      <ul>
        <li><strong>Active</strong> - Currently accepting donations</li>
        <li><strong>Paused</strong> - Temporarily not accepting donations</li>
        <li><strong>Completed</strong> - Project goal reached or ended</li>
      </ul>

      <h2>Settings (Super Admin Only)</h2>
      <div className="not-prose bg-gray-50 border border-gray-200 rounded-xl p-6 my-6">
        <h3 className="font-semibold text-gray-800 mb-3">System Settings</h3>
        <p className="text-gray-600 text-sm mb-3">
          The Settings tab is only visible to Super Admins and allows configuration of:
        </p>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Data source mode (Excel vs Database)</span>
          </li>
          <li className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Default currency settings</span>
          </li>
          <li className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>System-wide configurations</span>
          </li>
        </ul>
      </div>

      <h2>Preview Mode (Super Admin Only)</h2>
      <p>
        Super Admins can preview the application as any other role to see exactly 
        what other users experience:
      </p>
      <ol>
        <li>Click the &quot;Switch View&quot; button in the navigation bar</li>
        <li>Select a role to preview: Admin, Fund Admin, or User</li>
        <li>The app will display with that role&apos;s permissions</li>
        <li>Click &quot;Exit Preview&quot; to return to Super Admin view</li>
      </ol>
      <p>
        This is useful for testing and troubleshooting permission issues.
      </p>

      <h2>Best Practices for Admins</h2>
      <div className="not-prose bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
        <h3 className="font-semibold text-amber-800 mb-3">Administration Tips</h3>
        <ul className="space-y-2 text-amber-700 text-sm">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Assign Fund Admins promptly when new projects are created</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Regularly review user roles and remove unnecessary elevated permissions</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Update project statuses when projects complete or need to be paused</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Use Preview Mode to verify permissions work as expected</span>
          </li>
        </ul>
      </div>

      {/* Related Topics */}
      <h2 className="mt-10">Related Topics</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/help/roles" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Roles & Permissions</h3>
          <p className="text-sm text-gray-500 mt-1">Understand user roles</p>
        </Link>
        <Link href="/help/import" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Import Projects</h3>
          <p className="text-sm text-gray-500 mt-1">Bulk import from Excel</p>
        </Link>
      </div>
    </div>
  );
}
