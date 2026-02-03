'use client';

import React from 'react';
import Link from 'next/link';

export default function ProjectsHelpPage() {
  return (
    <div className="prose prose-emerald max-w-none">
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Projects</h1>
            <p className="text-gray-600">Managing charity fund projects</p>
          </div>
        </div>
      </div>

      <h2>Projects List</h2>
      <p>
        The Projects page displays all charity fund projects. Each project card shows:
      </p>
      <ul>
        <li><strong>Project Name</strong> - The title of the charity project</li>
        <li><strong>Progress Bar</strong> - Visual indicator of funds raised vs target</li>
        <li><strong>Amount Raised</strong> - Total contributions received</li>
        <li><strong>Target Amount</strong> - Fundraising goal</li>
        <li><strong>Status Badge</strong> - Active, Completed, or Paused</li>
      </ul>

      <h3>Project Statuses</h3>
      <div className="not-prose flex flex-wrap gap-3 my-4">
        <div className="flex items-center px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></span>
          <span className="font-medium text-emerald-700">Active</span>
          <span className="text-emerald-600 text-sm ml-2">- Currently accepting donations</span>
        </div>
        <div className="flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
          <span className="font-medium text-blue-700">Completed</span>
          <span className="text-blue-600 text-sm ml-2">- Target reached or project finished</span>
        </div>
        <div className="flex items-center px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
          <span className="font-medium text-yellow-700">Paused</span>
          <span className="text-yellow-600 text-sm ml-2">- Temporarily not accepting donations</span>
        </div>
      </div>

      <h2 id="project-details">Project Detail Page</h2>
      <p>
        Click on any project to view its detail page. The page is organized into tabs:
      </p>

      <h3 id="overview">Overview Tab</h3>
      <p>
        The Overview tab provides a summary of the project&apos;s performance with:
      </p>
      <ul>
        <li><strong>Statistics Cards</strong> - Progress percentage, total raised, target amount, donation count</li>
        <li><strong>Payment Mode Pie Chart</strong> - Distribution of donations by payment method</li>
        <li><strong>Top Contributors Bar Chart</strong> - Highest contributors by total amount</li>
        <li><strong>Contribution Timeline</strong> - Donations over time (area chart)</li>
        <li><strong>Amount by Payment Mode</strong> - Total amount per payment method (bar chart)</li>
      </ul>

      <h3>Donate Now Tab</h3>
      <p>
        This tab provides information on how to make a donation. It includes:
      </p>
      <ul>
        <li>Available payment methods (Bkash, Nagad, Bank Transfer, Cash, etc.)</li>
        <li>Contact information for fund administrators</li>
        <li>Instructions for making offline donations</li>
      </ul>

      <h3>Contributions Tab</h3>
      <p>
        View all recorded donations for the project. See the <Link href="/help/contributions">Contributions Guide</Link> for details.
      </p>

      <h3>Distribution Tab</h3>
      <p>
        Track how funds have been distributed to beneficiary institutions. See the <Link href="/help/distributions">Distributions Guide</Link> for details.
      </p>

      <h3>Media Tab</h3>
      <p>
        View and manage project photos, videos, and audio files. See the <Link href="/help/media">Media Guide</Link> for details.
      </p>

      <h3>Team Tab</h3>
      <p>
        View the fund administrators assigned to manage this project. Fund admins are responsible for:
      </p>
      <ul>
        <li>Recording contribution entries</li>
        <li>Managing fund distributions</li>
        <li>Uploading media content</li>
      </ul>

      <h2>Creating Projects (Admin Only)</h2>
      <div className="not-prose bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Admin Feature</h3>
            <p className="text-blue-700 text-sm">
              Only Super Admins and Admins can create new projects. If you need to create a project, 
              contact your administrator.
            </p>
          </div>
        </div>
      </div>

      <p>To create a new project:</p>
      <ol>
        <li>Navigate to the <strong>Projects</strong> page</li>
        <li>Click the <strong>&quot;Create Project&quot;</strong> button</li>
        <li>Fill in the project details:
          <ul>
            <li>Name (required)</li>
            <li>Description</li>
            <li>Target amount</li>
            <li>Currency (BDT, USD, etc.)</li>
            <li>Status (Active, Paused)</li>
          </ul>
        </li>
        <li>Click <strong>&quot;Create&quot;</strong> to save</li>
      </ol>

      <h2>Importing Projects</h2>
      <p>
        Admins can also bulk import projects with contributions from Excel files. 
        See the <Link href="/help/import">Import Projects Guide</Link> for detailed instructions.
      </p>

      {/* Related Topics */}
      <h2 className="mt-10">Related Topics</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/help/contributions" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Contributions</h3>
          <p className="text-sm text-gray-500 mt-1">Track and manage donations</p>
        </Link>
        <Link href="/help/distributions" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Distributions</h3>
          <p className="text-sm text-gray-500 mt-1">Fund distribution tracking</p>
        </Link>
      </div>
    </div>
  );
}
