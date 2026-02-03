'use client';

import React from 'react';
import Link from 'next/link';

export default function ImportHelpPage() {
  return (
    <div className="prose prose-emerald max-w-none">
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Import Projects</h1>
            <p className="text-gray-600">Bulk import projects and contributions from Excel</p>
          </div>
        </div>
      </div>

      <div className="not-prose bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Admin Feature</h3>
            <p className="text-blue-700 text-sm">
              Only Super Admins and Admins can import projects. The import feature is available in the navigation menu.
            </p>
          </div>
        </div>
      </div>

      <h2>Overview</h2>
      <p>
        The Import feature allows you to create a new project with all its contributions in bulk 
        by uploading an Excel file. This is useful when migrating data from spreadsheets or 
        when you have a large number of contributions to enter at once.
      </p>

      <h2>Step 1: Download the Template</h2>
      <p>
        Start by downloading the Excel template from the Import Project page:
      </p>
      <ul>
        <li><strong>Empty Template</strong> - A blank template with headers only</li>
        <li><strong>Template with Example</strong> - A template with sample data to guide you</li>
      </ul>
      <p>
        We recommend downloading the &quot;Template with Example&quot; first to understand the format.
      </p>

      <h2>Step 2: Prepare Your Data</h2>
      <p>
        The Excel file has three sheets:
      </p>

      <h3>Sheet 1: Project Info</h3>
      <div className="not-prose bg-gray-50 border border-gray-200 rounded-xl p-6 my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2 font-semibold text-gray-700">Column</th>
              <th className="text-left py-2 font-semibold text-gray-700">Required</th>
              <th className="text-left py-2 font-semibold text-gray-700">Description</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b border-gray-200">
              <td className="py-2">name</td>
              <td className="py-2"><span className="text-red-600">Yes</span></td>
              <td className="py-2">Project name</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">description</td>
              <td className="py-2">No</td>
              <td className="py-2">Project description</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">target_amount</td>
              <td className="py-2">No</td>
              <td className="py-2">Fundraising goal (e.g., 500000)</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">currency</td>
              <td className="py-2">No</td>
              <td className="py-2">BDT, USD, etc. (default: BDT)</td>
            </tr>
            <tr>
              <td className="py-2">status</td>
              <td className="py-2">No</td>
              <td className="py-2">active, completed, paused (default: active)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Sheet 2: Contributions</h3>
      <div className="not-prose bg-gray-50 border border-gray-200 rounded-xl p-6 my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2 font-semibold text-gray-700">Column</th>
              <th className="text-left py-2 font-semibold text-gray-700">Required</th>
              <th className="text-left py-2 font-semibold text-gray-700">Description</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b border-gray-200">
              <td className="py-2">contributor_name</td>
              <td className="py-2"><span className="text-red-600">Yes</span></td>
              <td className="py-2">Donor&apos;s name</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">amount</td>
              <td className="py-2"><span className="text-red-600">Yes</span></td>
              <td className="py-2">Donation amount (number only)</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">payment_mode</td>
              <td className="py-2"><span className="text-red-600">Yes</span></td>
              <td className="py-2">Bkash, Nagad, Bank Transfer, Cash, Card, Other</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">payment_status</td>
              <td className="py-2">No</td>
              <td className="py-2">completed, pending, failed (default: completed)</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">contribution_date</td>
              <td className="py-2">No</td>
              <td className="py-2">Date in YYYY-MM-DD format (default: today)</td>
            </tr>
            <tr>
              <td className="py-2">notes</td>
              <td className="py-2">No</td>
              <td className="py-2">Additional notes</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Sheet 3: Instructions</h3>
      <p>
        The third sheet contains detailed instructions and examples. Read this if you need guidance.
      </p>

      <h2>Step 3: Upload and Preview</h2>
      <ol>
        <li>Go to <strong>Import Project</strong> in the navigation</li>
        <li>Drag &amp; drop your Excel file or click to browse</li>
        <li>The system will validate your file and show a preview:
          <ul>
            <li><strong>Project details</strong> - Name, target amount, etc.</li>
            <li><strong>Contributions table</strong> - All contributions from the file</li>
            <li><strong>Validation errors</strong> - Any rows with issues (shown in red)</li>
          </ul>
        </li>
      </ol>

      <h2>Step 4: Import</h2>
      <p>
        Once you&apos;ve reviewed the preview:
      </p>
      <ul>
        <li>Check that all data looks correct</li>
        <li>Note any validation errors - invalid rows will be skipped</li>
        <li>Click <strong>&quot;Import Project&quot;</strong> to create the project and contributions</li>
        <li>You&apos;ll be redirected to the new project page after successful import</li>
      </ul>

      <h2>Handling Errors</h2>
      <div className="not-prose bg-red-50 border border-red-200 rounded-xl p-6 my-6">
        <h3 className="font-semibold text-red-800 mb-3">Common Validation Errors</h3>
        <ul className="space-y-2 text-red-700 text-sm">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span><strong>Missing contributor name</strong> - Every row must have a name</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span><strong>Invalid amount</strong> - Amount must be a positive number</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span><strong>Invalid payment mode</strong> - Must be one of: Bkash, Nagad, Bank Transfer, Cash, Card, Other</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span><strong>Wrong file format</strong> - File must be .xlsx (Excel format)</span>
          </li>
        </ul>
        <p className="text-red-600 text-sm mt-4">
          <strong>Note:</strong> Invalid rows are skipped during import. Valid rows will still be imported.
        </p>
      </div>

      <h2>Tips for Successful Import</h2>
      <div className="not-prose bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
        <h3 className="font-semibold text-amber-800 mb-3">Best Practices</h3>
        <ul className="space-y-2 text-amber-700 text-sm">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Always use the provided template to ensure correct column headers</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Don&apos;t modify sheet names or column headers</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Use consistent spelling for payment modes (case doesn&apos;t matter)</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Review the preview carefully before clicking Import</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>For large imports, test with a small sample first</span>
          </li>
        </ul>
      </div>

      {/* Related Topics */}
      <h2 className="mt-10">Related Topics</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/help/projects" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Projects</h3>
          <p className="text-sm text-gray-500 mt-1">Managing charity projects</p>
        </Link>
        <Link href="/help/contributions" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Contributions</h3>
          <p className="text-sm text-gray-500 mt-1">Track and manage donations</p>
        </Link>
      </div>
    </div>
  );
}
