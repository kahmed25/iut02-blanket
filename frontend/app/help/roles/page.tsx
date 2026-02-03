'use client';

import React from 'react';
import Link from 'next/link';

export default function RolesHelpPage() {
  return (
    <div className="prose prose-emerald max-w-none">
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Roles & Permissions</h1>
            <p className="text-gray-600">Understanding user roles and what they can do</p>
          </div>
        </div>
      </div>

      <h2>Overview</h2>
      <p>
        IUT02 Care uses a Role-Based Access Control (RBAC) system with four user roles. 
        Each role has specific permissions that determine what actions a user can perform.
      </p>

      {/* Role Cards */}
      <div className="not-prose space-y-6 my-8">
        {/* Super Admin */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-semibold">Super Admin</span>
            <span className="ml-3 text-purple-600 text-sm">Full System Access</span>
          </div>
          <p className="text-gray-700 mb-4">
            The Super Admin is the highest authority in the system. This role is automatically assigned 
            to a pre-configured email address and has complete control over all features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Can Do:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Everything Admins can do</li>
                <li>✓ Change any user&apos;s role</li>
                <li>✓ Access system settings</li>
                <li>✓ Preview app as any role</li>
                <li>✓ Toggle data source mode</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Unique Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Settings tab in Admin Panel</li>
                <li>• Role switcher in navigation</li>
                <li>• Cannot be demoted</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Admin */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-semibold">Admin</span>
            <span className="ml-3 text-blue-600 text-sm">Project & User Management</span>
          </div>
          <p className="text-gray-700 mb-4">
            Admins can manage all projects, users, and most system features. They can assign 
            Fund Admins to projects but cannot change user roles.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Can Do:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Create, edit, delete projects</li>
                <li>✓ View all users</li>
                <li>✓ Assign Fund Admins to projects</li>
                <li>✓ Import projects from Excel</li>
                <li>✓ Manage contributions (all projects)</li>
                <li>✓ Manage distributions (all projects)</li>
                <li>✓ Upload media (all projects)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Cannot Do:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✗ Change user roles</li>
                <li>✗ Access system settings</li>
                <li>✗ Preview as other roles</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Fund Admin */}
        <div id="fund-admin" className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">Fund Admin</span>
            <span className="ml-3 text-green-600 text-sm">Project-Specific Management</span>
          </div>
          <p className="text-gray-700 mb-4">
            Fund Admins are assigned to specific projects and can manage contributions, 
            distributions, and media only for their assigned projects.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Can Do (Assigned Projects):</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Add/edit contributions</li>
                <li>✓ Add/edit distributions</li>
                <li>✓ Upload proof documents</li>
                <li>✓ Upload media</li>
                <li>✓ View all project details</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Cannot Do:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✗ Create or edit projects</li>
                <li>✗ Manage users</li>
                <li>✗ Access Admin Panel</li>
                <li>✗ Manage unassigned projects</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Note:</strong> Fund Admins can be assigned to multiple projects. 
              They only see the Fund Management nav item, not the Admin Panel.
            </p>
          </div>
        </div>

        {/* User */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">User</span>
            <span className="ml-3 text-gray-600 text-sm">View-Only Access</span>
          </div>
          <p className="text-gray-700 mb-4">
            The default role for new users. Users can view all public information about 
            projects but cannot make any changes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Can Do:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ View all projects</li>
                <li>✓ View contribution history</li>
                <li>✓ View distribution records</li>
                <li>✓ View media gallery</li>
                <li>✓ View team members</li>
                <li>✓ Access Donate Now info</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Cannot Do:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✗ Add or edit any data</li>
                <li>✗ Upload files</li>
                <li>✗ Access Admin Panel</li>
                <li>✗ Access Fund Management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <h2>Permission Matrix</h2>
      <p>
        Quick reference for what each role can do:
      </p>
      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Feature</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-purple-700 border-b">Super Admin</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-blue-700 border-b">Admin</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-green-700 border-b">Fund Admin</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">User</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-700">View Projects</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="px-4 py-3 text-gray-700">Create/Edit Projects</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-700">Add Contributions</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-amber-600">Assigned Only</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="px-4 py-3 text-gray-700">Add Distributions</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-amber-600">Assigned Only</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-700">Upload Media</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-amber-600">Assigned Only</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="px-4 py-3 text-gray-700">Import Projects</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-700">Manage Users</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="px-4 py-3 text-gray-700">Change User Roles</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-gray-700">System Settings</td>
              <td className="px-4 py-3 text-center text-green-600">✓</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
              <td className="px-4 py-3 text-center text-red-500">✗</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How Roles Are Assigned</h2>
      <ul>
        <li><strong>New Users</strong> - Automatically receive the &quot;User&quot; role on first login</li>
        <li><strong>Super Admin</strong> - Automatically assigned to a pre-configured email address</li>
        <li><strong>Admin &amp; Fund Admin</strong> - Must be assigned by the Super Admin</li>
      </ul>
      <p>
        To request a role change, contact your organization&apos;s Super Admin.
      </p>

      {/* Related Topics */}
      <h2 className="mt-10">Related Topics</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/help/admin" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Admin Panel</h3>
          <p className="text-sm text-gray-500 mt-1">System administration guide</p>
        </Link>
        <Link href="/help/getting-started" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Getting Started</h3>
          <p className="text-sm text-gray-500 mt-1">Quick start guide</p>
        </Link>
      </div>
    </div>
  );
}
